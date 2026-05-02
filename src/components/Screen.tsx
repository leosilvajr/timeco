import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';
import { useThemedColors } from '../store';
import { useResponsive, maxContentWidth } from '../hooks/useResponsive';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  keyboardAvoiding?: boolean;
  /**
   * Largura máxima do conteúdo no desktop (px). Default `maxContentWidth` (1200).
   * Telas que precisam de leitura confortável (form, chat) podem passar menor (ex.: 720).
   * Para ocupar toda a largura, passe `Infinity`.
   */
  maxWidth?: number;
}

export const Screen: React.FC<Props> = ({
  children,
  scroll = true,
  padded = true,
  style,
  contentStyle,
  keyboardAvoiding = true,
  maxWidth,
}) => {
  useThemedColors();
  const responsive = useResponsive();
  const desktop = responsive.isDesktop;
  const effectiveMaxWidth = maxWidth ?? maxContentWidth;

  const styles = StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    padded: {
      padding: desktop ? spacing.xl : spacing.lg,
    },
    desktopCenter: {
      width: '100%',
      maxWidth: effectiveMaxWidth,
      alignSelf: 'center',
    },
  });

  const innerStyle: ViewStyle = desktop ? styles.desktopCenter : {};

  const content = (
    <View style={[{ flex: 1 }, padded && styles.padded, innerStyle, contentStyle]}>
      {children}
    </View>
  );

  const wrapped = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[padded && styles.padded, innerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      {keyboardAvoiding && Platform.OS !== 'web' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {wrapped}
        </KeyboardAvoidingView>
      ) : (
        wrapped
      )}
    </SafeAreaView>
  );
};
