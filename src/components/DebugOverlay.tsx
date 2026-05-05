import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

/**
 * Overlay de debug visível que captura console.warn/error +
 * window.onerror + unhandledrejection e exibe na tela.
 *
 * Útil pra debugar crashes em mobile-web onde DevTools não é
 * acessível ou onde Chrome morre antes de a gente conseguir ler logs.
 *
 * Como ativar: importar e renderizar em App.tsx.
 * Como desativar: descomentar/comentar a render no App.tsx.
 */

interface LogEntry {
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

const MAX_LOGS = 30;
const STORAGE_KEY = '@timeco/debug-logs';

const state = {
  logs: [] as LogEntry[],
  subscribers: new Set<() => void>(),
  captured: false,
};

const notify = () => {
  state.subscribers.forEach((cb) => cb());
};

/** Persiste logs no localStorage pra sobreviver crashes do Chrome. */
const persist = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.logs));
  } catch {
    // ignore — quota cheia
  }
};

/** Carrega logs persistidos da última sessão (antes do crash). */
const loadPersisted = (): LogEntry[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LogEntry[];
  } catch {
    return [];
  }
};

const push = (type: LogEntry['type'], message: string) => {
  state.logs.push({ type, message, timestamp: Date.now() });
  if (state.logs.length > MAX_LOGS) state.logs.shift();
  notify();
  persist();
};

const safeStringify = (v: unknown): string => {
  if (v == null) return String(v);
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Error) return `${v.name}: ${v.message}\n${v.stack ?? ''}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const capture = () => {
  if (state.captured) return;
  state.captured = true;

  // Carrega logs do localStorage da sessão anterior (sobreviveu o crash)
  const persisted = loadPersisted();
  if (persisted.length > 0) {
    state.logs.push({
      type: 'warn',
      message: `🔥 ${persisted.length} logs da sessão anterior (pré-crash) abaixo:`,
      timestamp: Date.now(),
    });
    state.logs.push(...persisted);
    state.logs.push({
      type: 'warn',
      message: '─── fim dos logs persistidos ───',
      timestamp: Date.now(),
    });
  }

  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args: unknown[]) => {
    push('log', args.map(safeStringify).join(' '));
    origLog.apply(console, args);
  };
  console.warn = (...args: unknown[]) => {
    push('warn', args.map(safeStringify).join(' '));
    origWarn.apply(console, args);
  };
  console.error = (...args: unknown[]) => {
    push('error', args.map(safeStringify).join(' '));
    origError.apply(console, args);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e: ErrorEvent) => {
      push('error', `[window] ${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`);
    });
    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      push('error', `[unhandledRejection] ${safeStringify(e.reason)}`);
    });
  }

  push('log', `DebugOverlay armed — viewport=${typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown'} ua=${typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 60) : ''}`);
};

export const DebugOverlay: React.FC = () => {
  const [, forceRender] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    capture();
    const cb = () => forceRender((n) => n + 1);
    state.subscribers.add(cb);
    return () => {
      state.subscribers.delete(cb);
    };
  }, []);

  const errors = state.logs.filter((l) => l.type === 'error');
  const hasErrors = errors.length > 0;
  const display = expanded ? state.logs : state.logs.slice(-3);

  const styles = StyleSheet.create({
    wrap: {
      position: 'absolute',
      top: 60,
      left: 8,
      right: 8,
      maxHeight: expanded ? 400 : 100,
      backgroundColor: hasErrors ? 'rgba(220, 38, 38, 0.95)' : 'rgba(0,0,0,0.85)',
      borderRadius: 8,
      padding: 8,
      zIndex: 99999,
      elevation: 99,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    headerTxt: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '900',
    },
    toggle: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 4,
    },
    toggleTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
    line: {
      color: '#fff',
      fontSize: 10,
      fontFamily: 'monospace',
      marginVertical: 1,
    },
    error: { color: '#fee2e2', fontWeight: '700' },
    warn: { color: '#fef3c7' },
  });

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.header}>
        <Text style={styles.headerTxt}>
          🔍 DEBUG ({state.logs.length} logs · {errors.length} errors)
        </Text>
        <Pressable onPress={() => setExpanded((e) => !e)} style={styles.toggle}>
          <Text style={styles.toggleTxt}>{expanded ? 'Fechar' : 'Expandir'}</Text>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: expanded ? 360 : 70 }}>
        {display.map((l, i) => (
          <Text
            key={`${l.timestamp}-${i}`}
            style={[styles.line, l.type === 'error' && styles.error, l.type === 'warn' && styles.warn]}
          >
            [{l.type === 'error' ? '❌' : l.type === 'warn' ? '⚠️' : 'ℹ️'}] {l.message.slice(0, 200)}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};
