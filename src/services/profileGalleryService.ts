import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProfilePhoto } from '../types';
import { uploadProfilePhoto, deletePhoto } from './photoService';
import { enqueueUpload } from './photoUploadQueueService';

/** Limite de fotos pessoais por usuário (storage + UX). */
export const PROFILE_PHOTOS_LIMIT = 10;

const photosCol = (userId: string) => collection(db, 'users', userId, 'profilePhotos');

/**
 * Adiciona uma foto à galeria pessoal do user. Faz upload e salva o doc.
 * Levanta erro se o limite (PROFILE_PHOTOS_LIMIT) já foi atingido.
 */
export const addProfilePhoto = async (
  userId: string,
  file: Blob | File,
  caption?: string,
): Promise<ProfilePhoto> => {
  const existing = await listProfilePhotos(userId);
  if (existing.length >= PROFILE_PHOTOS_LIMIT) {
    throw new Error(
      `Limite de ${PROFILE_PHOTOS_LIMIT} fotos atingido. Apague alguma antes de adicionar.`,
    );
  }
  // Usa fila de upload: se offline, entra na fila e resolve quando voltar.
  const upload = await enqueueUpload('Foto do perfil', () =>
    uploadProfilePhoto(userId, file),
  );
  const ref = await addDoc(photosCol(userId), {
    ownerId: userId,
    url: upload.url,
    storagePath: upload.path,
    caption: caption ?? '',
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    ownerId: userId,
    url: upload.url,
    storagePath: upload.path,
    caption,
    createdAt: null,
  };
};

/** Lista fotos pessoais (mais recentes primeiro). */
export const listProfilePhotos = async (userId: string): Promise<ProfilePhoto[]> => {
  const q = query(photosCol(userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProfilePhoto));
};

/** Remove uma foto pessoal — apaga doc + arquivo no Storage. */
export const removeProfilePhoto = async (
  userId: string,
  photoId: string,
  storagePath: string,
): Promise<void> => {
  await deletePhoto(storagePath).catch(() => {
    // Best-effort: se já não existe no storage, segue
  });
  await deleteDoc(doc(db, 'users', userId, 'profilePhotos', photoId));
};
