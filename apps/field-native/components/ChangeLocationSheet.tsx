import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { T } from '@clearwire/brand';

import { geocodeAddress, type GeocodeResult } from '../lib/geocode';
import { MapPicker } from './MapPicker';

export type LocationChoice = {
  lat: number;
  lng: number;
  accuracy: number | null;
  source: 'gps' | 'exif' | 'address' | 'map';
  label?: string;
};

type Props = {
  visible: boolean;
  currentLocation: { lat: number; lng: number } | null;
  hasExifOption: boolean;
  onCancel: () => void;
  onPick: (choice: LocationChoice) => void;
  onRequestExif: () => void;
};

export function ChangeLocationSheet({
  visible,
  currentLocation,
  hasExifOption,
  onCancel,
  onPick,
  onRequestExif,
}: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    setResults([]);
    try {
      const r = await geocodeAddress(q);
      if (r.length === 0) setError('No matches.');
      setResults(r);
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleUseGps() {
    setGpsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onPick({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        source: 'gps',
      });
    } catch (e: any) {
      setError(e?.message ?? 'Could not get current location');
    } finally {
      setGpsLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onCancel} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Change location</Text>

            <View style={styles.quickActions}>
              <Pressable
                onPress={handleUseGps}
                disabled={gpsLoading}
                style={[styles.quickBtn, gpsLoading && styles.disabled]}
              >
                {gpsLoading ? (
                  <ActivityIndicator color={T.text} />
                ) : (
                  <Text style={styles.quickBtnText}>📍 Use current GPS</Text>
                )}
              </Pressable>

              {hasExifOption && (
                <Pressable
                  onPress={() => {
                    onRequestExif();
                  }}
                  style={styles.quickBtn}
                >
                  <Text style={styles.quickBtnText}>🖼️ Use photo's location</Text>
                </Pressable>
              )}

              {currentLocation && (
                <Pressable
                  onPress={() => setMapPickerVisible(true)}
                  style={styles.quickBtn}
                >
                  <Text style={styles.quickBtnText}>🗺️ Pick on map</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Search by address</Text>
            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="e.g. 123 Main St, Cleveland OH"
                placeholderTextColor={T.textDim}
                style={styles.input}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="words"
              />
              <Pressable
                onPress={handleSearch}
                disabled={!query.trim() || searching}
                style={[
                  styles.searchBtn,
                  (!query.trim() || searching) && styles.disabled,
                ]}
              >
                {searching ? (
                  <ActivityIndicator color={T.bg} />
                ) : (
                  <Text style={styles.searchBtnText}>Search</Text>
                )}
              </Pressable>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {results.map((r, i) => (
              <Pressable
                key={`${r.lat}-${r.lng}-${i}`}
                onPress={() =>
                  onPick({
                    lat: r.lat,
                    lng: r.lng,
                    accuracy: null,
                    source: 'address',
                    label: r.displayName,
                  })
                }
                style={styles.resultRow}
              >
                <Text style={styles.resultText} numberOfLines={2}>
                  {r.displayName}
                </Text>
                <Text style={styles.resultCoords}>
                  {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>

      {currentLocation && (
        <MapPicker
          visible={mapPickerVisible}
          initial={currentLocation}
          onCancel={() => setMapPickerVisible(false)}
          onConfirm={(coords) => {
            setMapPickerVisible(false);
            onPick({
              lat: coords.lat,
              lng: coords.lng,
              accuracy: null,
              source: 'map',
            });
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: T.surface,
    borderTopLeftRadius: T.radius.xl,
    borderTopRightRadius: T.radius.xl,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: T.border,
    marginTop: T.space.sm,
  },
  content: { padding: T.space.lg, gap: T.space.md, paddingBottom: T.space.xxl },
  title: { color: T.text, fontSize: T.font.xl, fontWeight: '700' },
  quickActions: { gap: T.space.sm },
  quickBtn: {
    backgroundColor: T.surfaceAlt,
    padding: T.space.md,
    borderRadius: T.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  quickBtnText: { color: T.text, fontSize: T.font.md, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.border,
    marginVertical: T.space.sm,
  },
  label: { color: T.text, fontSize: T.font.md, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: T.space.sm },
  input: {
    flex: 1,
    backgroundColor: T.bg,
    borderColor: T.border,
    borderWidth: 1,
    borderRadius: T.radius.md,
    padding: T.space.md,
    color: T.text,
    fontSize: T.font.md,
  },
  searchBtn: {
    backgroundColor: T.primary,
    paddingHorizontal: T.space.lg,
    justifyContent: 'center',
    borderRadius: T.radius.md,
  },
  searchBtnText: { color: T.bg, fontSize: T.font.md, fontWeight: '700' },
  errorText: { color: T.danger, fontSize: T.font.sm },
  resultRow: {
    backgroundColor: T.bg,
    padding: T.space.md,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.border,
    gap: 2,
  },
  resultText: { color: T.text, fontSize: T.font.sm, lineHeight: 20 },
  resultCoords: { color: T.textDim, fontSize: T.font.xs },
});
