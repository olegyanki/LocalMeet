import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAP_CONFIG } from '@shared/constants/map';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  interactive?: boolean;
  style?: any;
}

export default function MapPreview({ 
  latitude, 
  longitude, 
  interactive = false,
  style 
}: MapPreviewProps) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          dragging: ${interactive},
          scrollWheelZoom: ${interactive},
          doubleClickZoom: ${interactive},
          boxZoom: ${interactive},
          keyboard: ${interactive},
          tap: ${interactive}
        }).setView([${latitude}, ${longitude}], ${MAP_CONFIG.DEFAULT_ZOOM});
        
        L.tileLayer('${MAP_CONFIG.MAPBOX_STYLE_URL}${MAP_CONFIG.MAPBOX_ACCESS_TOKEN}').addTo(map);
        
        const locationIcon = L.divIcon({
          className: 'location-marker',
          html: '<div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;"><svg width="32" height="32" viewBox="0 0 20 20" fill="none"><path d="M10 2C7.24 2 5 4.24 5 7C5 10.88 10 18 10 18C10 18 15 10.88 15 7C15 4.24 12.76 2 10 2ZM10 9C8.9 9 8 8.1 8 7C8 5.9 8.9 5 10 5C11.1 5 12 5.9 12 7C12 8.1 11.1 9 10 9Z" fill="#FF9500"/></svg></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        
        L.marker([${latitude}, ${longitude}], {icon: locationIcon}).addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        pointerEvents={interactive ? 'auto' : 'none'}
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
  },
});