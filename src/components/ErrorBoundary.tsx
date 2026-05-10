import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  children: ReactNode;
  /** Componente custom de fallback. Default: tela com botao "Recarregar". */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Captura erros de render em qualquer descendente e mostra fallback amigavel.
 * Sem isso, um throw em qualquer componente quebra a app inteira (tela branca).
 *
 * Class component porque error boundaries so funcionam em class components no React.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary capturou erro:', error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  reload = (): void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.reset();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }

    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>😬</Text>
        <Text style={styles.title}>Ops, algo deu errado</Text>
        <Text style={styles.subtitle}>
          Encontramos um erro inesperado. Tente recarregar o app ou volte mais tarde.
        </Text>
        {this.state.error?.message ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTxt}>{this.state.error.message}</Text>
          </View>
        ) : null}
        <Pressable style={styles.btn} onPress={this.reload}>
          <Text style={styles.btnTxt}>Recarregar</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F7FAF8',
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1B2B20', marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: '#5C6D63',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    maxWidth: 480,
  },
  errorTxt: { fontSize: 12, color: '#991B1B', fontFamily: 'monospace' },
  btn: {
    backgroundColor: colors.primary || '#0F9D58',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  btnTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
