import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { AppUser } from '../types';

export interface CommunityPost {
  id: string;
  authorId: string;
  displayName: string;
  photoURL?: string | null;
  content: string;
  likes: string[];
  comments: CommunityComment[];
  createdAt?: any;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  displayName: string;
  photoURL?: string | null;
  text: string;
  createdAt: number;
}

export interface PostResult {
  ok: boolean;
  error?: string;
}

/**
 * Custom hook that manages all community posts Firestore state and mutations.
 * Extracts every db call from CommunitySection, leaving it as a pure UI component.
 */
export const useCommunity = (user: AppUser | null) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  // ── Real-time subscription to community posts ──
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'community'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityPost)));
    });
    return () => unsubscribe();
  }, []);

  // ── Mutations ──

  const submitPost = async (content: string): Promise<PostResult> => {
    if (!content.trim() || !user?.id || !db) return { ok: false, error: 'Contenido vacío' };
    try {
      await addDoc(collection(db, 'community'), {
        authorId: user.id,
        displayName: user.displayName || 'Anónimo',
        photoURL: user.photoURL ?? null,
        content: content.trim(),
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
      });
      return { ok: true };
    } catch (e) {
      console.error('submitPost failed:', e);
      return { ok: false, error: 'Error al publicar' };
    }
  };

  const toggleLike = async (postId: string, currentLikes: string[]): Promise<void> => {
    if (!user?.id || !db) return;
    const postRef = doc(db, 'community', postId);
    if (currentLikes.includes(user.id)) {
      await updateDoc(postRef, { likes: arrayRemove(user.id) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.id) });
    }
  };

  const deletePost = async (postId: string): Promise<PostResult> => {
    if (!db) return { ok: false, error: 'Sin conexión' };
    try {
      await deleteDoc(doc(db, 'community', postId));
      return { ok: true };
    } catch (e) {
      console.error('deletePost failed:', e);
      return { ok: false, error: 'Error al eliminar' };
    }
  };

  const addComment = async (postId: string, text: string): Promise<PostResult> => {
    if (!text.trim() || !user?.id || !db) return { ok: false, error: 'Comentario vacío' };
    const postRef = doc(db, 'community', postId);
    const newComment: CommunityComment = {
      id: Date.now().toString(),
      authorId: user.id,
      displayName: user.displayName || 'Anónimo',
      photoURL: user.photoURL ?? null,
      text: text.trim(),
      createdAt: Date.now(),
    };
    try {
      await updateDoc(postRef, { comments: arrayUnion(newComment) });
      return { ok: true };
    } catch (e) {
      console.error('addComment failed:', e);
      return { ok: false, error: 'Error al comentar' };
    }
  };

  const deleteComment = async (
    postId: string,
    commentId: string,
    currentComments: CommunityComment[]
  ): Promise<PostResult> => {
    if (!db) return { ok: false, error: 'Sin conexión' };
    const updatedComments = currentComments.filter((c) => c.id !== commentId);
    try {
      await updateDoc(doc(db, 'community', postId), { comments: updatedComments });
      return { ok: true };
    } catch (e) {
      console.error('deleteComment failed:', e);
      return { ok: false, error: 'Error al eliminar comentario' };
    }
  };

  const editPost = async (postId: string, newText: string): Promise<PostResult> => {
    if (!user?.id || !db) return { ok: false, error: 'Sin conexión' };
    if (!newText.trim()) return { ok: false, error: 'Texto vacío' };
    try {
      await updateDoc(doc(db, 'community', postId), {
        text: newText.trim(),
        edited: true,
      });
      return { ok: true };
    } catch (e) {
      console.error('editPost failed:', e);
      return { ok: false, error: 'Error al editar' };
    }
  };

  return {
    posts,
    submitPost,
    toggleLike,
    deletePost,
    addComment,
    deleteComment,
  };
};
