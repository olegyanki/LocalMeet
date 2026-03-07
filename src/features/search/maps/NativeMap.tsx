import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@shared/constants';
import { MAP_CONFIG } from '@shared/constants/map';
import { WebView } from 'react-native-webview';

const DEFAULT_ZOOM = MAP_CONFIG.DEFAULT_ZOOM;

interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  type: 'user' | 'event';
  isActive?: boolean;
  isOwner?: boolean;
}

interface NativeMapProps {
  latitude: number;
  longitude: number;
  paddingBottom?: number;
  mapCenter?: {latitude: number; longitude: number; paddingBottom?: number} | null;
  markers: Marker[];
  selectedMarkerId?: string | null;
  onMarkerPress?: (id: string) => void;
  onMapPress?: (lat: number, lng: number) => void;
  onMapMove?: (lat: number, lng: number) => void;
  radiusKm?: number;
  centerLat?: number;
  centerLng?: number;
  userLatitude?: number;
  userLongitude?: number;
  bounds?: {
    markers: Array<{latitude: number; longitude: number}>;
  } | null;
}

export default function NativeMap({
  latitude,
  longitude,
  paddingBottom,
  mapCenter,
  markers,
  selectedMarkerId,
  onMarkerPress,
  onMapPress,
  onMapMove,
  radiusKm,
  centerLat,
  centerLng,
  userLatitude,
  userLongitude,
  bounds,
}: NativeMapProps) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (webViewRef.current && mapCenter) {
      const script = `
        if (typeof map !== 'undefined') {
          const point = map.project([${mapCenter.latitude}, ${mapCenter.longitude}], map.getZoom());
          ${mapCenter.paddingBottom ? `point.y += ${mapCenter.paddingBottom};` : ''}
          const newCenter = map.unproject(point, map.getZoom());
          map.setView(newCenter, map.getZoom(), { animate: true, duration: 0.5 });
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [mapCenter]);

  useEffect(() => {
    if (webViewRef.current) {
      const markersJson = JSON.stringify(markers);
      const selectedId = selectedMarkerId || 'null';
      const boundsJson = bounds ? JSON.stringify(bounds.markers) : 'null';
      webViewRef.current.injectJavaScript(`
        if (typeof updateMarkers !== 'undefined') {
          updateMarkers(${markersJson}, '${selectedId}', ${boundsJson});
        }
      `);
    }
  }, [markers, selectedMarkerId, bounds]);

  const htmlContent = /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
          }
          #map {
            height: 100%;
            width: 100%;
          }
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.3;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const initialPadding = ${paddingBottom || 0};
          const DEFAULT_ZOOM = ${DEFAULT_ZOOM};
          const ACCENT_ORANGE = '${COLORS.ACCENT_ORANGE}';
          const SUCCESS_LIGHT = '${COLORS.SUCCESS_LIGHT}';
          const BLUE_LIGHT = '${COLORS.BLUE_LIGHT}';
          const MAPBOX_ACCESS_TOKEN = '${MAP_CONFIG.MAPBOX_ACCESS_TOKEN}';
          const MAPBOX_STYLE_URL = '${MAP_CONFIG.MAPBOX_STYLE_URL}';
          
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          });
          
          if (initialPadding) {
            const point = map.project([${latitude}, ${longitude}], DEFAULT_ZOOM);
            point.y += initialPadding;
            const newCenter = map.unproject(point, DEFAULT_ZOOM);
            map.setView(newCenter, DEFAULT_ZOOM);
          } else {
            map.setView([${latitude}, ${longitude}], DEFAULT_ZOOM);
          }

          const accessToken = MAPBOX_ACCESS_TOKEN;
          L.tileLayer(MAPBOX_STYLE_URL + accessToken, {
            maxZoom: 19,
            attribution: '© Mapbox © OpenStreetMap'
          }).addTo(map);

          const userIcon = L.divIcon({
            className: 'user-marker',
            html: \`
              <div class="user-location-pulse">
                <div style="position: relative; width: 20px; height: 20px;">
                  <div style="position: absolute; width: 20px; height: 20px; left: 0; top: 0; background: \${ACCENT_ORANGE}; border-radius: 50%; animation: pulse 2s ease-out infinite;"></div>
                  <div style="position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; background: \${ACCENT_ORANGE}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
                </div>
              </div>
            \`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          ${radiusKm && centerLat && centerLng ? `
          L.circle([${centerLat}, ${centerLng}], {
            color: ACCENT_ORANGE,
            fillColor: ACCENT_ORANGE,
            fillOpacity: 0,
            radius: ${radiusKm * 1000}
          }).addTo(map);
          ` : ''}

          ${onMapPress ? `
          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapClick',
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }));
          });
          ` : ''}

          ${onMapMove ? `
          map.on('moveend', function() {
            const center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapMove',
              lat: center.lat,
              lng: center.lng
            }));
          });
          ` : ''}

          let markerObjects = {};

          function updateMarkers(markers, selectedId, boundsMarkers) {
            Object.values(markerObjects).forEach(marker => map.removeLayer(marker));
            markerObjects = {};
            
            // Завжди додаємо маркер локації
            L.marker([${userLatitude || latitude}, ${userLongitude || longitude}], { icon: userIcon }).addTo(map);

            markers.forEach(marker => {
              const isSelected = selectedId === marker.id;
              const isEvent = marker.type === 'event';

              let markerHtml = '';
              let iconSize = [26, 26];
              let iconAnchor = [13, 13];

              if (isEvent) {
                const color = marker.isOwner ? ACCENT_ORANGE : (marker.isActive ? SUCCESS_LIGHT : BLUE_LIGHT);

                if (isSelected) {
                  markerHtml = \`
                    <div style="position: relative; width: 36.3px; height: 36.3px;">
                      <div style="position: absolute; width: 36.3px; height: 36.3px; left: 0; top: 0; background: \${color}; border-radius: 50%; animation: pulse 2s ease-out infinite;"></div>
                      <div style="position: absolute; width: 27.23px; height: 27.23px; left: 4.54px; top: 4.54px; background: \${color}; opacity: 0.33; border-radius: 82.5081px;"></div>
                      <div style="position: absolute; width: 21.18px; height: 21.18px; left: 7.56px; top: 7.56px; background: \${color}; opacity: 0.53; border-radius: 82.5081px;"></div>
                      <div style="position: absolute; width: 15.13px; height: 15.13px; left: 10.59px; top: 10.59px; background: \${color}; border-radius: 8.25081px;"></div>
                    </div>
                  \`;
                  iconSize = [36.3, 36.3];
                  iconAnchor = [18.15, 18.15];
                } else {
                  markerHtml = \`
                    <div style="position: relative; width: 21.18px; height: 21.18px;">
                      <div style="position: absolute; width: 21.18px; height: 21.18px; left: 0; top: 0; background: \${color}; opacity: 0.53; border-radius: 82.5081px;"></div>
                      <div style="position: absolute; width: 15.13px; height: 15.13px; left: 3.03px; top: 3.03px; background: \${color}; border-radius: 8.25081px;"></div>
                    </div>
                  \`;
                  iconSize = [21.18, 21.18];
                  iconAnchor = [10.59, 10.59];
                }
              } else {
                // User marker - orange if owner, green if active (walk started), blue if future walk
                const userColor = marker.isOwner ? ACCENT_ORANGE : (marker.isActive ? SUCCESS_LIGHT : BLUE_LIGHT);

                if (isSelected) {
                  markerHtml = \`
                    <div style="position: relative; width: 36.3px; height: 36.3px;">
                      <div style="position: absolute; width: 36.3px; height: 36.3px; left: 0; top: 0; background: \${userColor}; border-radius: 50%; animation: pulse 2s ease-out infinite;"></div>
                      <div style="position: absolute; width: 27.23px; height: 27.23px; left: 4.54px; top: 4.54px; background: \${userColor}; opacity: 0.33; border-radius: 82.5081px;"></div>
                      <div style="position: absolute; width: 21.18px; height: 21.18px; left: 7.56px; top: 7.56px; background: \${userColor}; opacity: 0.53; border-radius: 82.5081px;"></div>
                      <div style="position: absolute; width: 15.13px; height: 15.13px; left: 10.59px; top: 10.59px; background: \${userColor}; border-radius: 8.25081px;"></div>
                    </div>
                  \`;
                  iconSize = [36.3, 36.3];
                  iconAnchor = [18.15, 18.15];
                } else {
                  markerHtml = \`
                    <div style="position: relative; width: 21.18px; height: 21.18px;">
                      <div style="position: absolute; width: 21.18px; height: 21.18px; left: 0; top: 0; background: \${userColor}; opacity: 0.53; border-radius: 82.5081px;"></div>
                      <div style="position: absolute; width: 15.13px; height: 15.13px; left: 3.03px; top: 3.03px; background: \${userColor}; border-radius: 8.25081px;"></div>
                    </div>
                  \`;
                  iconSize = [21.18, 21.18];
                  iconAnchor = [10.59, 10.59];
                }
              }

              const icon = L.divIcon({
                className: 'custom-marker',
                html: markerHtml,
                iconSize: iconSize,
                iconAnchor: iconAnchor
              });

              const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon })
                .addTo(map);

              leafletMarker.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'markerPress',
                  id: marker.id
                }));
              });

              markerObjects[marker.id] = leafletMarker;
            });

            if (boundsMarkers && boundsMarkers.length > 1) {
              const bounds = L.latLngBounds(
                boundsMarkers.map(m => [m.latitude, m.longitude])
              );
              map.fitBounds(bounds, {
                padding: [50, 50],
                animate: true,
                duration: 0.5
              });
            }
          }

          updateMarkers(${JSON.stringify(markers)}, '${selectedMarkerId || 'null'}');
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerPress' && onMarkerPress) {
        onMarkerPress(data.id);
      } else if (data.type === 'mapClick' && onMapPress) {
        onMapPress(data.lat, data.lng);
      } else if (data.type === 'mapMove' && onMapMove) {
        onMapMove(data.lat, data.lng);
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
