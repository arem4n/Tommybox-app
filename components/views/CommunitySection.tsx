import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { Heart, MessageCircle, Share2, MoreHorizontal, Camera, Video, Smile, X } from 'lucide-react';

import { useModal } from "../../contexts/ModalContext";

const CommunitySection = ({ user }: { user: any }) => {
  const { showAlert, showConfirm } = useModal();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    const q = query(collection(db, 'community'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !user?.id) return;

    try {
      await addDoc(collection(db, 'community'), {
        authorId: user.id,
        displayName: user.displayName || 'Anónimo',
        content: newPostContent,
        likes: [],
        comments: [],
        createdAt: serverTimestamp()
      });
      setNewPostContent('');
    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  const handleLike = async (postId: string, currentLikes: string[]) => {
    if (!user?.id) return;
    const postRef = doc(db, 'community', postId);
    if (currentLikes.includes(user.id)) {
      await updateDoc(postRef, { likes: arrayRemove(user.id) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.id) });
    }
  };

  const handleDelete = async (postId: string) => {
    showConfirm('¿Eliminar publicación?', 'Esta acción no se puede deshacer.', async () => {
      await deleteDoc(doc(db, 'community', postId));
    });
  };

  const handleDeleteComment = async (postId: string, commentId: string, currentComments: any[]) => {
      showConfirm('¿Eliminar comentario?', 'Se borrará permanentemente.', async () => {
          const updatedComments = currentComments.filter(c => c.id !== commentId);
          await updateDoc(doc(db, 'community', postId), { comments: updatedComments });
      });
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim() || !user?.id) return;
    const postRef = doc(db, 'community', postId);
    const newComment = {
      id: Date.now().toString(),
      authorId: user.id,
      displayName: user.displayName || 'Anónimo',
      text: commentText.trim(),
      createdAt: Date.now()
    };
    try {
      await updateDoc(postRef, { comments: arrayUnion(newComment) });
      setCommentText('');
    } catch(e) { console.error('Error adding comment', e); }
  };


  const handleShare = (content: string) => {
    if (navigator.share) {
      navigator.share({ title: 'TommyBox', text: content, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('¡Enlace copiado!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50 pointer-events-none">
          {toast}
        </div>
      )}

      {/* Post Composer */}
      <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm mb-8 border border-gray-100">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-4 lg:gap-6 lg:p-6 lg:p-8 mb-4 lg:mb-6 lg:mb-8">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl lg:text-2xl lg:text-3xl lg:text-4xl shrink-0">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="¿Qué lograste hoy? Comparte con la comunidad..."
              className="w-full pt-3 bg-transparent border-none focus:ring-0 resize-none text-gray-800 placeholder-gray-400"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
            <div></div>
            <button
              type="submit"
              disabled={!newPostContent.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 transition-colors shadow-sm"
            >
              Publicar
            </button>
          </div>
        </form>
      </div>

      {/* Post Feed */}
      <div className="space-y-6">
        {posts.map(post => {
          const likes = post.likes || [];
          const comments = post.comments || [];
          const hasLiked = user?.id ? likes.includes(user.id) : false;
          const showComments = activeCommentPost === post.id;

          return (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg lg:text-xl lg:text-2xl lg:text-3xl lg:text-4xl">
                    {post.displayName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{post.displayName}</p>
                    <p className="text-xs text-gray-500">
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Justo ahora'}
                    </p>
                  </div>
                </div>
                {(user?.id === post.authorId || user?.isTrainer) && (
                  <div className="relative group">
                    <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white shadow-lg border border-gray-100 rounded-lg overflow-hidden z-10 w-32">
                        <button
                            onClick={() => handleDelete(post.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                        >
                            Eliminar
                        </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-5 pb-4">
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Stats */}
              {(likes.length > 0 || comments.length > 0) && (
                <div className="px-5 pb-3 flex gap-4 text-sm font-medium text-gray-500">
                  {likes.length > 0 && (
                     <span className="flex items-center gap-1.5"><Heart size={14} className="fill-red-500 text-red-500" /> {likes.length} me gusta</span>
                  )}
                  {comments.length > 0 && (
                     <span className="flex items-center gap-1.5"><MessageCircle size={14} /> {comments.length} comentarios</span>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="grid grid-cols-3 border-t border-gray-100 px-2 py-1">
                <button
                  onClick={() => handleLike(post.id, likes)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-bold ${
                    hasLiked ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Heart size={20} className={hasLiked ? 'fill-current' : ''} />
                  <span>Me gusta</span>
                </button>
                <button
                  onClick={() => setActiveCommentPost(showComments ? null : post.id)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-bold ${
                    showComments ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle size={20} />
                  <span>Comentar</span>
                </button>
                <button
                  onClick={() => handleShare(post.content)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  <Share2 size={20} />
                  <span>Compartir</span>
                </button>
              </div>

              {/* Comments Section */}
              {showComments && (
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {comments.map((comment: any) => (
                       <div key={comment.id} className="flex gap-2">
                           <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                               {comment.displayName?.[0]?.toUpperCase()}
                           </div>
                           <div className="bg-white p-3 rounded-xl shadow-sm w-full border border-gray-100 relative group">
                               <p className="font-bold text-xs text-gray-900">{comment.displayName}</p>
                               <p className="text-sm text-gray-700 pr-6">{comment.text}</p>
                               
                               {(user?.id === comment.authorId || user?.isTrainer) && (
                                   <button 
                                      onClick={() => handleDeleteComment(post.id, comment.id, comments)}
                                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Eliminar comentario"
                                   >
                                      <X size={14} />
                                   </button>
                               )}
                           </div>
                       </div>
                    ))}
                    {comments.length === 0 && (
                        <p className="text-center text-sm text-gray-400">Sé el primero en comentar.</p>
                    )}
                  </div>
                  <div className="flex gap-2 relative">
                     <input 
                       type="text" 
                       value={commentText}
                       onChange={(e) => setCommentText(e.target.value)}
                       onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id) }}
                       placeholder="Escribe un comentario..." 
                       className="w-full bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-blue-500 pr-12"
                     />
                     <button 
                       onClick={() => handleAddComment(post.id)}
                       disabled={!commentText.trim()}
                       className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 font-bold text-sm px-2 disabled:opacity-50"
                     >
                       Enviar
                     </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunitySection;
