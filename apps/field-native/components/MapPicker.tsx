import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { T, palette } from '@clearwire/brand';

type Coords = { lat: number; lng: number };

type Props = {
  visible: boolean;
  initial: Coords;
  onCancel: () => void;
  onConfirm: (coords: Coords) => void;
};

export function MapPicker({ visible, initial, onCancel, onConfirm }: Props) {
  const [current, setCurrent] = useState<Coords>(initial);

  // Re-bake HTML when `initial` changes so reopening the modal recentres
  // the map rather than showing the last-picked position.
  const html = useMemo(() => buildPickerHtml(initial), [initial.lat, initial.lng]);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as {
        type: string;
        lat?: number;
        lng?: number;
      };
      if (msg.type === 'moved' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
        setCurrent({ lat: msg.lat, lng: msg.lng });
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.btn} hitSlop={12}>
            <Text style={styles.btnText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Pick a location</Text>
          <Pressable
            onPress={() => onConfirm(current)}
            style={styles.btn}
            hitSlop={12}
          >
            <Text style={[styles.btnText, styles.btnConfirm]}>Use</Text>
          </Pressable>
        </View>

        <View style={styles.coordsRow}>
          <Text style={styles.coordsText}>
            {current.lat.toFixed(5)}, {current.lng.toFixed(5)}
          </Text>
        </View>

        <WebView
          originWhitelist={['*']}
          source={{ html }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          style={styles.webview}
          containerStyle={{ backgroundColor: palette.navy900 }}
        />
      </SafeAreaView>
    </Modal>
  );
}

function buildPickerHtml(initial: Coords): string {
  const centerJson = JSON.stringify([initial.lat, initial.lng]);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${palette.navy900}; }
    .cw-pick {
      width: 24px; height: 24px; border-radius: 50%;
      background: ${palette.blue600};
      border: 4px solid ${palette.white};
      box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.6);
    }
    .leaflet-container { background: ${palette.navy900}; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function(){
      var post = function(obj){
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(obj));
        }
      };
      var center = ${centerJson};
      var map = L.map('map', { zoomControl: true, attributionControl: false })
        .setView(center, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      L.control.attribution({ prefix: false })
        .addAttribution('© OpenStreetMap')
        .addTo(map);

      var marker = L.marker(center, {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: '<div class="cw-pick"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);

      // Drag-end and map-click both set the pin.
      marker.on('dragend', function(){
        var p = marker.getLatLng();
        post({ type: 'moved', lat: p.lat, lng: p.lng });
      });
      map.on('click', function(e){
        marker.setLatLng(e.latlng);
        post({ type: 'moved', lat: e.latlng.lat, lng: e.latlng.lng });
      });
    })();
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.space.lg,
    paddingVertical: T.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.border,
  },
  btn: { paddingVertical: T.space.xs, minWidth: 60 },
  btnText: { color: T.primary, fontSize: T.font.md, fontWeight: '600' },
  btnConfirm: { textAlign: 'right' },
  title: { color: T.text, fontSize: T.font.md, fontWeight: '700' },
  coordsRow: {
    paddingHorizontal: T.space.lg,
    paddingVertical: T.space.sm,
    backgroundColor: T.surfaceAlt,
  },
  coordsText: { color: T.text, fontSize: T.font.sm, fontFamily: 'monospace' },
  webview: { flex: 1 },
});
