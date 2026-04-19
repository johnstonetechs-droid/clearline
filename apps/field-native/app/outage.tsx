import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

import { T } from '@clearwire/brand';
import {
  type ServiceType,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_ICONS,
} from '@clearwire/supabase';
import { submitOutage } from '@clearwire/logic';

import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import { DamageIcon } from '../components/DamageIcon';
import {
  ChangeLocationSheet,
  type LocationChoice,
} from '../components/ChangeLocationSheet';

type Stage = 'form' | 'submitting' | 'done';
type LocationSource = 'gps' | 'address' | 'map';

type ResolvedLocation = {
  lat: number;
  lng: number;
  label?: string;
};

export default function Outage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('form');
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  const [externalTicket, setExternalTicket] = useState('');
  const [gpsLocation, setGpsLocation] = useState<ResolvedLocation | null>(null);
  const [customLocation, setCustomLocation] = useState<ResolvedLocation | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>('gps');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Pick an address or point on a map instead.');
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch (e: any) {
        setLocationError(e?.message ?? 'Could not get location');
      }
    })();
  }, []);

  const effectiveLocation =
    (locationSource === 'address' || locationSource === 'map')
      ? customLocation
      : gpsLocation;

  const canSubmit =
    !!serviceType &&
    provider.trim().length > 0 &&
    !!effectiveLocation &&
    stage !== 'submitting';

  async function handleSubmit() {
    if (!serviceType || !effectiveLocation) return;
    setStage('submitting');
    try {
      const deviceId = await getDeviceId();
      const res = await submitOutage({
        supabase,
        serviceType,
        providerCompany: provider.trim(),
        description: description.trim() || undefined,
        latitude: effectiveLocation.lat,
        longitude: effectiveLocation.lng,
        deviceId,
        externalTicket: externalTicket.trim() || undefined,
      });
      if (!res.ok) {
        setStage('form');
        Alert.alert('Submit failed', res.error);
        return;
      }
      setStage('done');
    } catch (e: any) {
      setStage('form');
      Alert.alert('Unexpected error', e?.message ?? String(e));
    }
  }

  if (stage === 'done') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Outage reported</Text>
        <Text style={styles.bodyText}>
          Thanks — if others report the same provider in this area, crews get
          a clearer picture of scale.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace('/')}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Report an outage</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>What service is out?</Text>
        <View style={styles.chipGrid}>
          {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((type) => {
            const active = serviceType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setServiceType(type)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <DamageIcon
                  name={SERVICE_TYPE_ICONS[type]}
                  size={16}
                  color={active ? T.bg : T.text}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {SERVICE_TYPE_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Provider / company</Text>
        <TextInput
          value={provider}
          onChangeText={setProvider}
          placeholder="e.g. Spectrum, AT&T, FirstEnergy"
          placeholderTextColor={T.textDim}
          autoCapitalize="words"
          style={styles.input}
        />

        <Text style={styles.sectionLabel}>Description (optional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Internet has been out since 2pm"
          placeholderTextColor={T.textDim}
          multiline
          maxLength={280}
          style={[styles.input, styles.inputMulti]}
        />

        <Text style={styles.sectionLabel}>Provider ticket # (optional)</Text>
        <TextInput
          value={externalTicket}
          onChangeText={setExternalTicket}
          placeholder="If you've already called it in"
          placeholderTextColor={T.textDim}
          autoCapitalize="characters"
          style={styles.input}
        />

        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>{labelForSource(locationSource)}</Text>
          <Text style={styles.locationText}>
            {effectiveLocation
              ? `${effectiveLocation.lat.toFixed(5)}, ${effectiveLocation.lng.toFixed(5)}`
              : locationError ?? 'Getting location…'}
          </Text>
          {customLocation?.label && locationSource === 'address' && (
            <Text style={styles.locationSubtext} numberOfLines={2}>
              {customLocation.label}
            </Text>
          )}
          <Pressable
            onPress={() => setSheetOpen(true)}
            style={styles.locationChangeBtn}
          >
            <Text style={styles.locationChangeText}>Change location…</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
        >
          {stage === 'submitting' ? (
            <ActivityIndicator color={T.bg} />
          ) : (
            <Text style={styles.primaryBtnText}>Submit outage</Text>
          )}
        </Pressable>
      </ScrollView>

      <ChangeLocationSheet
        visible={sheetOpen}
        currentLocation={effectiveLocation}
        hasExifOption={false}
        onCancel={() => setSheetOpen(false)}
        onPick={(choice: LocationChoice) => {
          setSheetOpen(false);
          if (choice.source === 'gps') {
            setGpsLocation({ lat: choice.lat, lng: choice.lng });
            setLocationSource('gps');
            setCustomLocation(null);
          } else if (choice.source === 'address' || choice.source === 'map') {
            setCustomLocation({
              lat: choice.lat,
              lng: choice.lng,
              label: choice.label,
            });
            setLocationSource(choice.source);
          }
        }}
        onRequestExif={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

function labelForSource(source: LocationSource): string {
  switch (source) {
    case 'address':
      return '📍 From address';
    case 'map':
      return '📍 Picked on map';
    case 'gps':
    default:
      return '📍 Current location';
  }
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
  backBtn: { paddingVertical: T.space.xs, minWidth: 60 },
  backBtnText: { color: T.primary, fontSize: T.font.md, fontWeight: '600' },
  title: { color: T.text, fontSize: T.font.md, fontWeight: '700' },
  content: { padding: T.space.lg, gap: T.space.md, paddingBottom: T.space.xxl },
  sectionLabel: {
    color: T.text,
    fontSize: T.font.md,
    fontWeight: '600',
    marginTop: T.space.sm,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: T.space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.xs + 2,
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.sm + 2,
    borderRadius: T.radius.pill,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
  },
  chipActive: { backgroundColor: T.primary, borderColor: T.primary },
  chipText: { color: T.text, fontSize: T.font.sm, fontWeight: '500' },
  chipTextActive: { color: T.bg, fontWeight: '700' },
  input: {
    backgroundColor: T.surface,
    borderColor: T.border,
    borderWidth: 1,
    borderRadius: T.radius.md,
    padding: T.space.md,
    color: T.text,
    fontSize: T.font.md,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  locationRow: {
    backgroundColor: T.surfaceAlt,
    padding: T.space.md,
    borderRadius: T.radius.md,
    gap: 2,
  },
  locationLabel: { color: T.text, fontSize: T.font.sm, fontWeight: '600' },
  locationText: { color: T.textMuted, fontSize: T.font.sm },
  locationSubtext: { color: T.textDim, fontSize: T.font.xs, marginTop: 2 },
  locationChangeBtn: { marginTop: T.space.sm },
  locationChangeText: {
    color: T.primary,
    fontSize: T.font.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    backgroundColor: T.primary,
    paddingVertical: T.space.lg,
    borderRadius: T.radius.lg,
    alignItems: 'center',
    marginTop: T.space.md,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: T.bg, fontSize: T.font.lg, fontWeight: '700' },
  center: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: T.space.xl,
    gap: T.space.lg,
  },
  bodyText: { color: T.text, fontSize: T.font.md, textAlign: 'center' },
  successIcon: { fontSize: 64, color: T.success },
  successTitle: { color: T.text, fontSize: T.font.xxl, fontWeight: '700' },
});
