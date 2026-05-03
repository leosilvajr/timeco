import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string;
  path: string;
}

const validateFile = (file: Blob | File, maxBytes: number): void => {
  if (file.size > maxBytes) {
    throw new Error(`Arquivo grande demais. Máximo ${Math.round(maxBytes / 1024 / 1024)}MB.`);
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Apenas imagens são aceitas.');
  }
};

/** Upload de foto de avatar (perfil). Sobrescreve a foto anterior. */
export const uploadAvatar = async (userId: string, file: Blob | File): Promise<UploadResult> => {
  validateFile(file, MAX_AVATAR_BYTES);
  const path = `avatars/${userId}/avatar.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
  const url = await getDownloadURL(storageRef);
  return { url, path };
};

/** Upload de foto pra galeria de um evento. Cada foto fica num path único. */
export const uploadEventPhoto = async (
  eventId: string,
  uploaderId: string,
  file: Blob | File,
): Promise<UploadResult> => {
  validateFile(file, MAX_PHOTO_BYTES);
  const ext = (file.type.split('/')[1] || 'jpg').split('+')[0];
  const fileName = `${uploaderId}_${Date.now()}.${ext}`;
  const path = `events/${eventId}/${fileName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
  const url = await getDownloadURL(storageRef);
  return { url, path };
};

/** Upload de foto pessoal do perfil (galeria fora de eventos). */
export const uploadProfilePhoto = async (
  userId: string,
  file: Blob | File,
): Promise<UploadResult> => {
  validateFile(file, MAX_PROFILE_PHOTO_BYTES);
  const ext = (file.type.split('/')[1] || 'jpg').split('+')[0];
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `userPhotos/${userId}/${fileName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
  const url = await getDownloadURL(storageRef);
  return { url, path };
};

/** Apaga uma foto (admin/dono apenas — service não verifica permissão). */
export const deletePhoto = async (path: string): Promise<void> => {
  await deleteObject(ref(storage, path));
};
