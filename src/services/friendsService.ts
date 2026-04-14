import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { FriendRequest, Friendship, User } from '../types';
import { getUserById, getUsersByIds } from './userService';

const friendshipId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);

export const sendFriendRequest = async (fromUser: User, toUserId: string): Promise<string> => {
  if (fromUser.id === toUserId) throw new Error('Você não pode adicionar a si mesmo');

  const existingFriendship = await getDoc(doc(db, 'friendships', friendshipId(fromUser.id, toUserId)));
  if (existingFriendship.exists()) throw new Error('Vocês já são amigos');

  const existingReq = await getDocs(
    query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', fromUser.id),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    )
  );
  if (!existingReq.empty) throw new Error('Convite já enviado');

  const ref = await addDoc(collection(db, 'friendRequests'), {
    fromUserId: fromUser.id,
    toUserId,
    fromUserName: fromUser.name,
    fromUserPhoto: fromUser.photoURL ?? null,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const listIncomingRequests = async (userId: string): Promise<FriendRequest[]> => {
  const snap = await getDocs(
    query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
};

export const listOutgoingRequests = async (userId: string): Promise<FriendRequest[]> => {
  const snap = await getDocs(
    query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', userId),
      where('status', '==', 'pending')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
};

export const acceptFriendRequest = async (request: FriendRequest) => {
  const fid = friendshipId(request.fromUserId, request.toUserId);
  await setDoc(doc(db, 'friendships', fid), {
    members: [request.fromUserId, request.toUserId].sort(),
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'friendRequests', request.id), { status: 'accepted' });
};

export const declineFriendRequest = async (requestId: string) => {
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
};

export const removeFriend = async (userId: string, friendId: string) => {
  await deleteDoc(doc(db, 'friendships', friendshipId(userId, friendId)));
};

export const listFriendships = async (userId: string): Promise<Friendship[]> => {
  const snap = await getDocs(
    query(collection(db, 'friendships'), where('members', 'array-contains', userId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Friendship));
};

export const listFriends = async (userId: string): Promise<User[]> => {
  const friendships = await listFriendships(userId);
  const friendIds = friendships
    .map((f) => f.members.find((m) => m !== userId))
    .filter((x): x is string => !!x);
  if (!friendIds.length) return [];
  return getUsersByIds(friendIds);
};

export const areFriends = async (a: string, b: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, 'friendships', friendshipId(a, b)));
  return snap.exists();
};

export { friendshipId };
export { getUserById };
