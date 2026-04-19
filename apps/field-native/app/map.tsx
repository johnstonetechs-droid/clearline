import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';

import { T, APWA_COLORS, palette } from '@clearwire/brand';
import {
  type DamageType,
  type ReportStatus,
  DAMAGE_TYPE_LABELS,
} from '@clearwire/supabase';

import { supabase } from '../lib/supabase';

// Cleveland city center — fallback when GPS is denied. Matches src/App.jsx.
const FALLBACK_CENTER: [number, number] = [41.4993, -81.6944];
const DEFAULT_RADIUS_MILES = 25;
const DEFAULT_SINCE_HOURS = 72;

type Center = { lat: number; lng: number };

// Shape returned by public.nearby_reports — flat lat/lng (not GeoJSON).
type NearbyReport = {
  id: string;
  created_at: string;
  damage_type: DamageType;
  description: string | null;
  photo_urls: string[];
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  status: ReportStatus;
  verified_by_pro: boolean;
  affected_company: string | null;
};

export default function MapScreen() {
  const router = useRouter();
  const [center, setCenter] = useState<Center | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [reports, setReports] = useState<NearbyReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<NearbyReport | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setCenter({ lat: FALLBACK_CENTER[0], lng: FALLBACK_CENTER[1] });
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setCenter({ lat: FALLBACK_CENTER[0], lng: FALLBACK_CENTER[1] });
      }
    })();
  }, []);

  useEffect(() => {
    if (!center) return;
    (async () => {
      setError(null);
      setReports(null);
      const { data, error: rpcError } = await supabase.rpc('nearby_reports', {
        lat: center.lat,
        lng: center.lng,
        radius_miles: DEFAULT_RADIUS_MILES,
        since_hours: DEFAULT_SINCE_HOURS,
      });
      if (rpcError) {
        setError(rpcError.message);
        setReports([]);
        return;
      }
      setReports((data ?? []) as NearbyReport[]);
    })();
  }, [center, refreshKey]);

  const reportsById = useMemo(() => {
    const byId: Record<string, NearbyReport> = {};
    (reports ?? []).forEach((r) => {
      byId[r.id] = r;
    });
    return byId;
  }, [reports]);

  const html = useMemo(() => {
    if (!center || !reports) return null;
    return buildMapHtml(center, reports);
  }, [center, reports]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data) as { type: string; id?: string };
        if (msg.type === 'marker-tap' && msg.id) {
          const report = reportsById[msg.id];
          if (report) setSelected(report);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [reportsById]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <Text style={styles.headerBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Nearby reports</Text>
        <Pressable
          onPress={() => setRefreshKey((k) => k + 1)}
          style={styles.headerBtn}
          hitSlop={12}
        >
          <Text style={styles.headerBtnText}>Refresh</Text>
        </Pressable>
      </View>

      {locationDenied && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Location access denied — showing Cleveland area.
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerText}>Couldn't load reports: {error}</Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        {!html ? (
          <View style={styles.center}>
            <ActivityIndicator color={T.primary} />
            <Text style={styles.loadingText}>
              {!center ? 'Getting GPS fix…' : 'Loading reports…'}
            </Text>
          </View>
        ) : (
          <WebView
            key={refreshKey}
            originWhitelist={['*']}
            source={{ html }}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            style={styles.webview}
            // Dark bg shows through while tiles are loading
            containerStyle={{ backgroundColor: palette.navy900 }}
          />
        )}
      </View>

      {reports && reports.length === 0 && !error && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Text style={styles.emptyText}>
            No reports in the last {DEFAULT_SINCE_HOURS}h within {DEFAULT_RADIUS_MILES} mi
          </Text>
        </View>
      )}

      {selected && (
        <ReportSheet report={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

function ReportSheet({ report, onClose }: { report: NearbyReport; onClose: () => void }) {
  return (
    <View style={styles.sheetBackdrop}>
      <Pressable style={styles.sheetBackdropTap} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <ScrollView contentContainerStyle={styles.sheetContent}>
          {report.photo_urls[0] && (
            <Image source={{ uri: report.photo_urls[0] }} style={styles.sheetPhoto} />
          )}
          {report.photo_urls.length > 1 && (
            <Text style={styles.sheetMeta}>
              +{report.photo_urls.length - 1} more photo
              {report.photo_urls.length > 2 ? 's' : ''}
            </Text>
          )}
          <View style={styles.sheetHeader}>
            <View
              style={[
                styles.damagePill,
                { backgroundColor: APWA_COLORS[report.damage_type] },
              ]}
            >
              <Text style={styles.damagePillText}>
                {DAMAGE_TYPE_LABELS[report.damage_type]}
              </Text>
            </View>
            <Text style={styles.sheetAge}>{timeAgo(report.created_at)}</Text>
          </View>

          {report.description && (
            <Text style={styles.sheetDescription}>{report.description}</Text>
          )}

          {report.accuracy_meters != null && (
            <Text style={styles.sheetMeta}>
              GPS accuracy ±{Math.round(report.accuracy_meters)}m
            </Text>
          )}

          <Pressable style={styles.sheetCloseBtn} onPress={onClose}>
            <Text style={styles.sheetCloseText}>Close</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function buildMapHtml(center: Center, reports: NearbyReport[]): string {
  const markers = reports.map((r) => ({
    id: r.id,
    lat: r.latitude,
    lng: r.longitude,
    color: APWA_COLORS[r.damage_type] ?? palette.n400,
  }));

  // Whitelisted fields only — no photo urls or descriptions leak to WebView.
  const markersJson = JSON.stringify(markers);
  const centerJson = JSON.stringify([center.lat, center.lng]);
  const userColor = palette.blue600;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${palette.navy900}; }
    .cw-pin {
      width: 18px; height: 18px; border-radius: 50%;
      border: 3px solid ${palette.white};
      box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.5);
      cursor: pointer;
    }
    .cw-user {
      width: 14px; height: 14px; border-radius: 50%;
      background: ${userColor};
      border: 3px solid ${palette.white};
      box-shadow: 0 0 0 6px ${userColor}33;
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
      var markers = ${markersJson};
      var map = L.map('map', { zoomControl: true, attributionControl: false })
        .setView(center, 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);
      L.control.attribution({ prefix: false })
        .addAttribution('© OpenStreetMap')
        .addTo(map);

      // User location marker
      L.marker(center, {
        icon: L.divIcon({
          className: '',
          html: '<div class="cw-user"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        }),
        interactive: false
      }).addTo(map);

      // Report markers
      markers.forEach(function(m){
        var icon = L.divIcon({
          className: '',
          html: '<div class="cw-pin" style="background:' + m.color + '"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
        marker.on('click', function(){ post({ type: 'marker-tap', id: m.id }); });
      });

      // If we have markers, fit to them + center, lightly
      if (markers.length > 0) {
        var bounds = L.latLngBounds([center].concat(markers.map(function(m){ return [m.lat, m.lng]; })));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      post({ type: 'ready' });
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
  headerBtn: { paddingVertical: T.space.xs, paddingHorizontal: T.space.sm },
  headerBtnText: { color: T.primary, fontSize: T.font.md, fontWeight: '600' },
  title: { color: T.text, fontSize: T.font.md, fontWeight: '700' },
  banner: {
    backgroundColor: T.surfaceAlt,
    paddingHorizontal: T.space.lg,
    paddingVertical: T.space.sm,
  },
  bannerError: { backgroundColor: T.danger },
  bannerText: { color: T.text, fontSize: T.font.sm },
  mapContainer: { flex: 1 },
  webview: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: T.space.md },
  loadingText: { color: T.textMuted, fontSize: T.font.sm },
  emptyOverlay: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyText: {
    color: T.text,
    fontSize: T.font.sm,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.sm,
    borderRadius: T.radius.md,
  },

  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  sheetBackdropTap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: T.surface,
    borderTopLeftRadius: T.radius.xl,
    borderTopRightRadius: T.radius.xl,
    maxHeight: '75%',
    paddingBottom: T.space.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: T.border,
    marginTop: T.space.sm,
    marginBottom: T.space.sm,
  },
  sheetContent: { padding: T.space.lg, gap: T.space.md },
  sheetPhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: T.radius.lg,
    backgroundColor: T.surfaceAlt,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  damagePill: {
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.xs + 2,
    borderRadius: T.radius.pill,
  },
  damagePillText: { color: T.text, fontSize: T.font.sm, fontWeight: '700' },
  sheetAge: { color: T.textMuted, fontSize: T.font.sm },
  sheetDescription: {
    color: T.text,
    fontSize: T.font.md,
    lineHeight: 22,
  },
  sheetMeta: { color: T.textDim, fontSize: T.font.sm },
  sheetCloseBtn: {
    backgroundColor: T.surfaceAlt,
    paddingVertical: T.space.md,
    borderRadius: T.radius.md,
    alignItems: 'center',
    marginTop: T.space.sm,
  },
  sheetCloseText: { color: T.text, fontSize: T.font.md, fontWeight: '600' },
});
