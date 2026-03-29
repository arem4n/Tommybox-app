import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { Heart, MessageCircle, Share2, MoreHorizontal, Camera, Video, Smile } from 'lucide-react';

const CommunitySection = ({ user }: { user: any }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setNewPostImage(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
        authorPhotoUrl: user.photoUrl || null,
        content: newPostContent,
        imageUrl: newPostImage,
        likes: [],
        comments: [],
        createdAt: serverTimestamp()
      });
      setNewPostContent('');
      setNewPostImage(null);
    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
      try {
        await deleteDoc(doc(db, 'community', postId));
      } catch (error) {
        console.error("Error deleting post: ", error);
      }
    }
  };

  const handleLike = async (postId: string, currentLikes: any[]) => {
    if (!user?.id) return;
    const postRef = doc(db, 'community', postId);

    // Support legacy strings or objects
    const likeObj = currentLikes.find(l => (typeof l === 'string' ? l === user.id : l.id === user.id));
    const hasLiked = !!likeObj;

    try {
      if (hasLiked) {
        // If it's a string, we remove the string. If object, remove the object.
        await updateDoc(postRef, {
          likes: typeof likeObj === 'string' ? arrayRemove(user.id) : arrayRemove(likeObj)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion({ id: user.id, name: user.displayName || 'Anónimo' })
        });
      }
    } catch (error) {
      console.error("Error toggling like: ", error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!newComment.trim() || !user?.id) return;
    try {
      const postRef = doc(db, 'community', postId);
      await updateDoc(postRef, {
        comments: arrayUnion({
          id: Date.now().toString(),
          userId: user.id,
          userName: user.displayName || 'Anónimo',
          userPhoto: user.photoUrl || null,
          text: newComment.trim(),
          createdAt: new Date().toISOString()
        })
      });
      setNewComment('');
      setCommentingOn(null);
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
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
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
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
            <div className="flex gap-2">
              <button type="button" disabled title="Próximamente" className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors cursor-not-allowed">
                <Camera size={20} />
              </button>
              <button type="button" disabled title="Próximamente" className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors cursor-not-allowed">
                <Video size={20} />
              </button>
              <button type="button" disabled title="Próximamente" className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors cursor-not-allowed">
                <Smile size={20} />
              </button>
            </div>
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
          const isOwner = post.authorId === user?.id;
          const likes = post.likes || [];
          const comments = post.comments || [];
          const hasLiked = likes.some((l: any) => typeof l === 'string' ? l === user?.id : l.id === user?.id);
          const likesCount = likes.length;

          // Format likers for tooltip
          const likersText = likesCount > 0
              ? likes.map((l: any) => typeof l === 'string' ? 'Alguien' : l.name).join(', ')
              : '';

          return (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {post.displayName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{post.displayName}</p>
                    <p className="text-xs text-gray-500">
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Justo ahora'}
                    </p>
                  </div>
                </div>
                {user?.id === post.authorId && (
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
              {likes.length > 0 && (
                <div className="px-5 pb-3">
                  <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                    <Heart size={14} className="fill-red-500 text-red-500" /> {likes.length} me gusta
                  </p>
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
                  disabled
                  title="Próximamente"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-bold text-gray-400 cursor-not-allowed"
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

              {commentingOn === post.id && (
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 flex justify-center items-center text-xs font-bold text-blue-600">
                      {user?.photoUrl ? <img src={user.photoUrl} alt="Me" className="w-full h-full object-cover" /> : user?.displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario..."
                        className="flex-1 bg-white border border-gray-200 rounded-full px-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>

                  {comments.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {comments.map((c: any) => (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex justify-center items-center text-xs font-bold text-gray-600">
                            {c.userPhoto ? <img src={c.userPhoto} alt={c.userName} className="w-full h-full object-cover" /> : c.userName?.charAt(0) || 'U'}
                          </div>
                          <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex-1">
                            <p className="font-bold text-sm text-gray-900">{c.userName}</p>
                            <p className="text-gray-700 text-sm mt-0.5">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
