import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

/**
 * Botao oficial "Sign in with Apple" — segue Human Interface Guidelines
 * obrigatorias da Apple (cor, fonte, formato do logo, etc).
 *
 * SO RENDERIZA em iOS. Em Android/web retorna null silenciosamente.
 *
 * O modulo expo-apple-authentication eh importado dinamicamente
 * dentro de um useEffect pra evitar crash no bundle Android.
 */

interface Props {
  onPress: () => void;
  /** Texto do botao. Default: SIGN_IN. */
  label?: 'SIGN_IN' | 'CONTINUE' | 'SIGN_UP';
  /** Estilo visual. Default: BLACK (branco com texto preto). */
  style?: 'BLACK' | 'WHITE' | 'WHITE_OUTLINE';
  /** Largura. Default: '100%' */
  width?: number | string;
  /** Altura. Default 50. */
  height?: number;
}

export const AppleSignInButton: React.FC<Props> = ({
  onPress,
  label = 'SIGN_IN',
  style = 'BLACK',
  width = '100%',
  height = 50,
}) => {
  // Mantém o modulo carregado em state — null ate o useEffect carregar
  // dinamicamente (so em iOS).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [AppleAuth, setAppleAuth] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    (async () => {
      try {
        const mod = await import('expo-apple-authentication');
        setAppleAuth(mod);
      } catch (e) {
        console.warn('Falha ao carregar expo-apple-authentication:', e);
      }
    })();
  }, []);

  if (Platform.OS !== 'ios' || !AppleAuth) return null;

  const buttonType = {
    SIGN_IN: AppleAuth.AppleAuthenticationButtonType.SIGN_IN,
    CONTINUE: AppleAuth.AppleAuthenticationButtonType.CONTINUE,
    SIGN_UP: AppleAuth.AppleAuthenticationButtonType.SIGN_UP,
  }[label];

  const buttonStyle = {
    BLACK: AppleAuth.AppleAuthenticationButtonStyle.BLACK,
    WHITE: AppleAuth.AppleAuthenticationButtonStyle.WHITE,
    WHITE_OUTLINE: AppleAuth.AppleAuthenticationButtonStyle.WHITE_OUTLINE,
  }[style];

  return (
    <View style={styles.wrap}>
      <AppleAuth.AppleAuthenticationButton
        buttonType={buttonType}
        buttonStyle={buttonStyle}
        cornerRadius={10}
        style={{ width, height }}
        onPress={onPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
});
