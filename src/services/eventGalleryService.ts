import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { EventPhoto } from '../types';
import { uploadEventPhoto, deletePhoto } from './photoService';

/**
 * Adiciona uma foto à galeria de um evento. Faz upload no Storage e salva
 * o doc em events/{eventId}/photos/{auto}.
 */
export const addPhotoToEvent = async (
  eventId: string,
  uploaderId: string,
  uploaderName: string,
  file: Blob | File,
  caption?: string,
): Promise<EventPhoto> => {
  const upload = await uploadEventPhoto(eventId, uploaderId, file);
  const ref = await addDoc(collection(db, 'events', eventId, 'photos'), {
    eventId,
    uploaderId,
    uploaderName,
    url: upload.url,
    storagePath: upload.path,
    caption: caption ?? '',
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    eventId,
    uploaderId,
    uploaderName,
    url: upload.url,
    storagePath: upload.path,
    caption,
    createdAt: null,
  };
};

/** Lista todas as fotos de um evento (mais recentes primeiro). */
export const listEventPhotos = async (eventId: string): Promise<EventPhoto[]> => {
  const q = query(
    collection(db, 'events', eventId, 'photos'),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventPhoto));
};

/** Remove uma foto. Também apaga o arquivo no Storage. */
export const removeEventPhoto = async (
  eventId: string,
  photoId: string,
  storagePath: string,
): Promise<void> => {
  await deletePhoto(storagePath).catch(() => {
    // Best-effort: mesmo se já não existir no storage, segue removendo o doc
  });
  await deleteDoc(doc(db, 'events', eventId, 'photos', photoId));
};

/**
 * Lista todas as fotos uploaded por um usuário em qualquer evento.
 * Usado pra galeria do perfil.
 */
export const listPhotosByUser = async (uploaderId: string): Promise<EventPhoto[]> => {
  const q = query(
    collectionGroup(db, 'photos'),
    where('uploaderId', '==', uploaderId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventPhoto));
};
