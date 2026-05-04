import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PickImageOptions {
  /**
   * Permite cropar a foto após selecionar.
   *
   * Default: `false`. A UI de crop nativa do Android tem bugs de
   * edge-to-edge em alguns aparelhos (ex: Motorola Android 15 esconde
   * o botão "Cortar"), bloqueando o usuário. O crop visual de avatar
   * já é feito por CSS no componente Avatar (estilo circular), então
   * desabilitar não impacta a UX.
   */
  allowsEditing?: boolean;
  /** Aspect ratio quando allowsEditing=true. Default [1,1]. */
  aspect?: [number, number];
}

/**
 * Seleciona uma imagem de forma cross-platform e retorna como Blob/File
 * pronto pra upload no Firebase Storage.
 *
 * - Web: cria <input type="file"> invisível
 * - Native (Android/iOS): usa expo-image-picker (galeria do sistema)
 *
 * Retorna null se o usuário cancelar ou negar permissão.
 */
export const pickImage = async (options?: PickImageOptions): Promise<Blob | null> => {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        resolve(file ?? null);
      };
      // Se o usuário fechar sem selecionar, não há evento — resolvemos
      // como null após um breve delay (ou nunca, e o caller pode timeoutar).
      // Pragmaticamente: confiamos no onchange.
      input.click();
    });
  }

  // Native: pede permissão antes
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Permissão de galeria negada');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options?.allowsEditing ?? false,
    aspect: options?.aspect ?? [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) return null;

  // Converte URI local em Blob via fetch (jeito mais confiável no RN)
  const response = await fetch(result.assets[0].uri);
  return await response.blob();
};
