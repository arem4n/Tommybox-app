import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, X } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { useCommunity } from '../../hooks/useCommunity';
import { AppUser } from '../../types';

const CommunitySection = ({ user }: { user: AppUser }) => {
  const { showConfirm } = useModal();
  const { posts, submitPost, toggleLike, deletePost, editPost, addComment, deleteComment } = useCommunity(user);

  const [newPostContent, setNewPostContent] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<{ id: string; text: string } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitPost(newPostContent);
    if (result.ok) setNewPostContent('');
  };

  const handleLike = (postId: string, currentLikes: string[]) => toggleLike(postId, currentLikes);

  const handleDelete = (postId: string) => {
    showConfirm('¿Eliminar publicación?', 'Esta acción no se puede deshacer.', async () => {
      await deletePost(postId);
    });
  };

  const handleDeleteComment = (postId: string, commentId: string, currentComments: any[]) => {
    showConfirm('¿Eliminar comentario?', 'Se borrará permanentemente.', async () => {
      await deleteComment(postId, commentId, currentComments);
    });
  };

  const handleAddComment = async (postId: string) => {
    const result = await addComment(postId, commentText);
    if (result.ok) setCommentText('');
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
      <div className="bg-slate-900 p-6 rounded-2xl shadow-sm mb-8 border border-slate-800">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="¿Qué lograste hoy? Comparte con la comunidad..."
              className="w-full p-4 bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 resize-none text-white placeholder-slate-400"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
            <div></div>
            <button
              type="submit"
              disabled={!newPostContent.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500 transition-colors shadow-sm"
            >
              Publicar
            </button>
          </div>
        </form>
      </div>

      {/* Post Feed */}
      <div className="space-y-6">
        {posts.map((post) => {
          const likes = post.likes || [];
          const comments = post.comments || [];
          const hasLiked = user?.id ? likes.includes(user.id) : false;
          const showComments = activeCommentPost === post.id;

          return (
            <div key={post.id} className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
              {/* Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {post.photoURL ? (
                      <img src={post.photoURL} alt={post.displayName} className="w-full h-full object-cover" />
                    ) : (
                      post.displayName?.[0]?.toUpperCase() || 'A'
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white">{post.displayName}</p>
                    <p className="text-xs text-slate-400">
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Justo ahora'}
                    </p>
                  </div>
                </div>
                {(user?.id === post.authorId || user?.isTrainer) && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
                      className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {activeMenu === post.id && (
                      <>
                        <div className="fixed inset-0 z-[5]" onClick={() => setActiveMenu(null)} />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-lg border border-slate-700 z-10">
                          <button
                            onClick={() => { handleDelete(post.id); setActiveMenu(null); }}
                            className="w-full text-left px-4 py-3 text-red-400 font-medium hover:bg-red-900/20 transition-colors rounded-xl"
                          >
                            Eliminar publicación
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-5 pb-4">
                <p className="text-slate-200 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Stats */}
              {(likes.length > 0 || comments.length > 0) && (
                <div className="px-5 pb-3 flex gap-4 text-sm font-medium text-slate-500">
                  {likes.length > 0 && (
                    <span className="flex items-center gap-1.5"><Heart size={14} className="fill-red-500 text-red-500" /> {likes.length} me gusta</span>
                  )}
                  {comments.length > 0 && (
                    <span className="flex items-center gap-1.5"><MessageCircle size={14} /> {comments.length} comentarios</span>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="grid grid-cols-3 border-t border-slate-800 px-2 py-1">
                <button
                  onClick={() => handleLike(post.id, likes)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-bold ${hasLiked ? 'text-red-500 hover:bg-red-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <Heart size={20} className={hasLiked ? 'fill-current' : ''} />
                  <span>Me gusta</span>
                </button>
                <button
                  onClick={() => setActiveCommentPost(showComments ? null : post.id)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-bold ${showComments ? 'text-blue-400 bg-blue-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <MessageCircle size={20} />
                  <span>Comentar</span>
                </button>
                <button
                  onClick={() => handleShare(post.content)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-sm font-bold text-slate-400 hover:bg-slate-800"
                >
                  <Share2 size={20} />
                  <span>Compartir</span>
                </button>
              </div>

              {/* Comments Section */}
              {showComments && (
                <div className="bg-slate-800/50 p-4 border-t border-slate-800">
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {comment.photoURL ? (
                            <img src={comment.photoURL} alt={comment.displayName} className="w-full h-full object-cover" />
                          ) : (
                            comment.displayName?.[0]?.toUpperCase() || 'A'
                          )}
                        </div>
                        <div className="bg-slate-800 p-3 rounded-xl shadow-sm w-full border border-slate-700 relative">
                          <p className="font-bold text-xs text-white">{comment.displayName}</p>
                          <p className="text-sm text-slate-300 pr-6">{comment.text}</p>
                          {(user?.id === comment.authorId || user?.isTrainer) && (
                            <div className="absolute top-2 right-2">
                              <button
                                onClick={() => setActiveMenu(activeMenu === `comment_${comment.id}` ? null : `comment_${comment.id}`)}
                                className="text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-full p-1 transition-colors"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                              {activeMenu === `comment_${comment.id}` && (
                                <>
                                  <div className="fixed inset-0 z-[5]" onClick={() => setActiveMenu(null)} />
                                  <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 rounded-xl shadow-lg border border-slate-700 z-10">
                                    <button
                                      onClick={() => { handleDeleteComment(post.id, comment.id, comments); setActiveMenu(null); }}
                                      className="w-full text-left px-3 py-2 text-xs text-red-400 font-medium hover:bg-red-900/20 transition-colors rounded-xl"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-center text-sm text-slate-500">Sé el primero en comentar.</p>
                    )}
                  </div>
                  <div className="flex gap-2 relative">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                      placeholder="Escribe un comentario..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-sm focus:outline-blue-500 text-white pr-12 placeholder-slate-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentText.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 font-bold text-sm px-2 disabled:opacity-50"
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
