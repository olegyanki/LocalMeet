import React, { useEffect, useRef } from 'react';

interface WebMapProps {
  latitude: number;
  longitude: number;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    type: 'user' | 'event';
    isActive?: boolean;
    isOwner?: boolean;
    avatarUrl?: string | null;
  }>;
  selectedMarkerId?: string | null;
  onMarkerPress?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  radiusKm?: number;
  centerLat?: number;
  centerLng?: number;
  bounds?: {
    markers: Array<{latitude: number; longitude: number}>;
  } | null;
}

export default function WebMap({
  latitude,
  longitude,
  markers,
  selectedMarkerId,
  onMarkerPress,
  onMapClick,
  radiusKm,
  centerLat,
  centerLng,
  bounds,
}: WebMapProps) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const L = require('leaflet');
    require('leaflet/dist/leaflet.css');

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map('map-container', {
      zoomControl: false,
    }).setView([latitude, longitude], 14);
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CartoDB',
      maxZoom: 19,
    }).addTo(map);

    const userIcon = L.divIcon({
      className: 'custom-marker user-location-marker',
      html: `
        <div class="user-location-pulse">
          <div style="position: relative; width: 20px; height: 20px;">
            <div style="position: absolute; width: 20px; height: 20px; left: 0; top: 0; background: #FF9500; opacity: 0.3; border-radius: 50%; animation: pulse 2s infinite;"></div>
            <div style="position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; background: #FF9500; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
          </div>
        </div>
        <style>
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.4);
              opacity: 0;
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }
        </style>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([latitude, longitude], { icon: userIcon }).addTo(map);

    if (radiusKm && centerLat && centerLng) {
      L.circle([centerLat, centerLng], {
        color: '#FF9500',
        fillColor: '#FF9500',
        fillOpacity: 0.1,
        radius: radiusKm * 1000,
      }).addTo(map);
    }

    if (onMapClick) {
      map.on('click', (e: any) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, [latitude, longitude, radiusKm, centerLat, centerLng, onMapClick]);

  useEffect(() => {
    if (!mapRef.current || !markers) return;

    const L = require('leaflet');

    markersRef.current.forEach((m) => mapRef.current.removeLayer(m));
    markersRef.current = [];

    markers.forEach((marker) => {
      const isSelected = selectedMarkerId === marker.id;
      const isEvent = marker.type === 'event';

      let markerHtml = '';
      let iconSize = [26, 26];
      let iconAnchor = [13, 13];

      if (isEvent && marker.isOwner && marker.avatarUrl) {
        // Мій івент - показати аватар
        const size = isSelected ? 36.3 : 21.18;
        markerHtml = `
          <div style="position: relative; width: ${size}px; height: ${size}px;">
            <img src="${marker.avatarUrl}" style="width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);" />
          </div>
        `;
        iconSize = [size, size];
        iconAnchor = [size / 2, size / 2];
      } else if (isEvent) {
        // Івент - визначити колір по активності
        const color = marker.isActive ? '#8FD89C' : '#12B7DB';

        if (isSelected) {
          markerHtml = `
            <div style="position: relative; width: 36.3px; height: 36.3px;">
              <div style="position: absolute; width: 36.3px; height: 36.3px; left: 0; top: 0; background: ${color}; opacity: 0.18; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 33.28px; height: 33.28px; left: 1.51px; top: 1.51px; background: ${color}; opacity: 0.23; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 27.23px; height: 27.23px; left: 4.54px; top: 4.54px; background: ${color}; opacity: 0.33; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 21.18px; height: 21.18px; left: 7.56px; top: 7.56px; background: ${color}; opacity: 0.53; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 15.13px; height: 15.13px; left: 10.59px; top: 10.59px; background: ${color}; border-radius: 8.25081px;"></div>
            </div>
          `;
          iconSize = [36.3, 36.3];
          iconAnchor = [18.15, 18.15];
        } else {
          markerHtml = `
            <div style="position: relative; width: 21.18px; height: 21.18px;">
              <div style="position: absolute; width: 21.18px; height: 21.18px; left: 0; top: 0; background: ${color}; opacity: 0.53; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 15.13px; height: 15.13px; left: 3.03px; top: 3.03px; background: ${color}; border-radius: 8.25081px;"></div>
            </div>
          `;
          iconSize = [21.18, 21.18];
          iconAnchor = [10.59, 10.59];
        }
      } else {
        // User marker - green if active (walk started), blue if future walk
        const color = marker.isActive ? '#8FD89C' : '#12B7DB';

        if (isSelected) {
          markerHtml = `
            <div style="position: relative; width: 36.3px; height: 36.3px;">
              <div style="position: absolute; width: 36.3px; height: 36.3px; left: 0; top: 0; background: ${color}; opacity: 0.18; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 33.28px; height: 33.28px; left: 1.51px; top: 1.51px; background: ${color}; opacity: 0.23; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 27.23px; height: 27.23px; left: 4.54px; top: 4.54px; background: ${color}; opacity: 0.33; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 21.18px; height: 21.18px; left: 7.56px; top: 7.56px; background: ${color}; opacity: 0.53; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 15.13px; height: 15.13px; left: 10.59px; top: 10.59px; background: ${color}; border-radius: 8.25081px;"></div>
            </div>
          `;
          iconSize = [36.3, 36.3];
          iconAnchor = [18.15, 18.15];
        } else {
          markerHtml = `
            <div style="position: relative; width: 21.18px; height: 21.18px;">
              <div style="position: absolute; width: 21.18px; height: 21.18px; left: 0; top: 0; background: ${color}; opacity: 0.53; border-radius: 82.5081px;"></div>
              <div style="position: absolute; width: 15.13px; height: 15.13px; left: 3.03px; top: 3.03px; background: ${color}; border-radius: 8.25081px;"></div>
            </div>
          `;
          iconSize = [21.18, 21.18];
          iconAnchor = [10.59, 10.59];
        }
      }

      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: markerHtml,
        iconSize: iconSize,
        iconAnchor: iconAnchor,
      });

      const m = L.marker([marker.latitude, marker.longitude], { icon: markerIcon }).addTo(mapRef.current);

      if (onMarkerPress) {
        m.on('click', () => onMarkerPress(marker.id));
      }

      markersRef.current.push(m);
    });
  }, [markers, selectedMarkerId, onMarkerPress]);

  useEffect(() => {
    if (!mapRef.current) return;

    const L = require('leaflet');

    if (bounds && bounds.markers.length > 1) {
      const leafletBounds = L.latLngBounds(
        bounds.markers.map(m => [m.latitude, m.longitude])
      );
      mapRef.current.fitBounds(leafletBounds, {
        padding: [50, 50],
        animate: true,
        duration: 0.5,
      });
    } else if (selectedMarkerId && markers) {
      const selectedMarker = markers.find((m) => m.id === selectedMarkerId);
      if (selectedMarker) {
        mapRef.current.setView([selectedMarker.latitude, selectedMarker.longitude], 15, {
          animate: true,
          duration: 0.5,
        });
      }
    }
  }, [selectedMarkerId, markers, bounds]);

  return <div id="map-container" style={{ width: '100%', height: '100%' }} />;
}
