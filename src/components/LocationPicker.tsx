import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../constants/theme';
import { useThemedColors } from '../store';
import {
  searchLocations,
  LocationResult,
  getCurrentPosition,
  reverseGeocode,
} from '../services/locationService';

export interface SelectedLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  label?: string;
  value: SelectedLocation | null;
  onChange: (loc: SelectedLocation | null) => void;
  placeholder?: string;
  hint?: string;
}

/**
 * Campo de seleção de local com autocomplete via OpenStreetMap.
 * Mostra dropdown de sugestões enquanto digita; ao selecionar, salva
 * nome + endereço + coordenadas.
 */
export const LocationPicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder = 'Digite o nome do local (ex: Arena Brasília)',
  hint,
}) => {
  useThemedColors();
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza query com valor externo quando muda fora do componente
  useEffect(() => {
    if (value && value.name !== query) {
      setQuery(value.name);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChangeQuery = (text: string) => {
    setQuery(text);
    setError(null);
    // Se usuário apaga ou edita, descarta seleção atual
    if (value && text !== value.name) {
      onChange(null);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (text.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const found = await searchLocations(text, ctrl.signal);
        setResults(found);
        setOpen(true);
      } catch (e: unknown) {
        if ((e as Error).name !== 'AbortError') {
          setError('Não foi possível buscar locais agora. Você pode digitar manualmente.');
        }
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const onSelect = (r: LocationResult) => {
    onChange({ name: r.name, address: r.address, lat: r.lat, lng: r.lng });
    setQuery(r.name);
    setOpen(false);
  };

  const onUseManual = () => {
    onChange({ name: query.trim(), address: query.trim(), lat: 0, lng: 0 });
    setOpen(false);
  };

  const onUseCurrentLocation = async () => {
    setError(null);
    setGpsBusy(true);
    setGpsAccuracy(null);
    try {
      const pos = await getCurrentPosition();
      setGpsAccuracy(Math.round(pos.accuracy));
      const result = await reverseGeocode(pos.lat, pos.lng);
      onChange({
        name: result.name,
        address: result.address,
        lat: result.lat,
        lng: result.lng,
      });
      setQuery(result.name);
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Não foi possível obter sua localização');
    } finally {
      setGpsBusy(false);
    }
  };

  const styles = StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
      alignSelf: 'stretch',
      zIndex: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    input: {
      minHeight: 50,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      fontSize: 16,
      color: colors.text,
    },
    inputFocused: { borderColor: colors.primary },
    hint: { marginTop: 4, fontSize: 12, color: colors.textMuted },
    error: { marginTop: 4, fontSize: 12, color: colors.danger },
    selectedBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 6,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceVariant,
      borderRadius: radius.md,
    },
    selectedAddr: { fontSize: 12, color: colors.textSecondary, flex: 1, lineHeight: 16 },
    selectedPin: { fontSize: 16 },
    dropdown: {
      marginTop: 4,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    item: {
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemLast: { borderBottomWidth: 0 },
    itemName: { fontSize: 14, fontWeight: '700', color: colors.text },
    itemAddr: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    manualBtn: {
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceVariant,
    },
    manualTxt: { fontSize: 12, fontWeight: '700', color: colors.primary },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    loadingTxt: { fontSize: 12, color: colors.textSecondary },
    gpsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.primary + '15',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      alignSelf: 'flex-start',
      marginTop: 6,
    },
    gpsBtnTxt: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    gpsAccuracy: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={query}
        onChangeText={onChangeQuery}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      <Pressable style={styles.gpsBtn} onPress={onUseCurrentLocation} disabled={gpsBusy}>
        {gpsBusy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={{ fontSize: 14 }}>📍</Text>
        )}
        <Text style={styles.gpsBtnTxt}>
          {gpsBusy ? 'Buscando localização...' : 'Usar minha localização atual'}
        </Text>
      </Pressable>
      {gpsAccuracy !== null && !gpsBusy ? (
        <Text style={styles.gpsAccuracy}>
          Precisão de aproximadamente {gpsAccuracy}m
        </Text>
      ) : null}
      {value && value.lat !== 0 ? (
        <View style={styles.selectedBox}>
          <Text style={styles.selectedPin}>📍</Text>
          <Text style={styles.selectedAddr} numberOfLines={2}>
            {value.address}
          </Text>
        </View>
      ) : null}
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingTxt}>Buscando locais...</Text>
        </View>
      ) : null}
      {open && results.length > 0 ? (
        <View style={styles.dropdown}>
          {results.map((r, i) => (
            <Pressable
              key={r.osmId}
              style={[styles.item, i === results.length - 1 && styles.itemLast]}
              onPress={() => onSelect(r)}
            >
              <Text style={styles.itemName} numberOfLines={1}>
                📍 {r.name}
              </Text>
              <Text style={styles.itemAddr} numberOfLines={2}>
                {r.address}
              </Text>
            </Pressable>
          ))}
          {query.trim().length > 0 ? (
            <Pressable style={styles.manualBtn} onPress={onUseManual}>
              <Text style={styles.manualTxt}>+ Usar &quot;{query.trim()}&quot; como texto livre</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};
