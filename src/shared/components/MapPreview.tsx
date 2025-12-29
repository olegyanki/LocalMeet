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
        
        const customIcon = L.divIcon({
          html: '<div style="background: #FF9500; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
          className: 'custom-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        L.marker([${latitude}, ${longitude}], {icon: customIcon}).addTo(map);
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