import React from 'react';
import { Modal, Text, Pressable, StyleSheet, Image, Dimensions } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { useThemedColors } from '../store';

interface Props {
  visible: boolean;
  url: string;
  onClose: () => void;
  caption?: string;
}

/**
 * Modal de visualização de foto em tela cheia (lightbox).
 * Toque em qualquer lugar fecha. Mantém aspect ratio.
 */
export const PhotoLightbox: React.FC<Props> = ({ visible, url, onClose, caption }) => {
  useThemedColors();
  const { width, height } = Dimensions.get('window');

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.92)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtn: {
      position: 'absolute',
      top: spacing.lg,
      right: spacing.lg,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeTxt: { color: colors.white, fontSize: 22, fontWeight: '900' },
    image: {
      width: width * 0.95,
      height: height * 0.85,
    },
    caption: {
      position: 'absolute',
      bottom: spacing.xl,
      left: spacing.lg,
      right: spacing.lg,
      color: colors.white,
      fontSize: 14,
      textAlign: 'center',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeTxt}>×</Text>
        </Pressable>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </Pressable>
    </Modal>
  );
};
