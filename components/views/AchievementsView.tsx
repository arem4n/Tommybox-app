
import React, { useState, useEffect, useRef } from 'react';
import { Achievement } from '../../types';
import { mockPublicAchievements } from '../../services/mockData';
import { Heart, MessageCircle, Share2, Trophy, Medal, User, Clock, Flame, MoreHorizontal, Check, Facebook, Twitter, Send, Copy, Link } from 'lucide-react';

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 10) + 1);
    
    // Interaction States
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showComments, setShowComments] = useState(false);
    
    // Comment Data
    const [comments, setComments] = useState<{user: string, text: string, time: string}[]>([
        { user: 'Entrenador', text: '¡Excelente trabajo! Sigue así 💪', time: 'Hace 2h' }
    ]);
    const [newComment, setNewComment] = useState('');

    // Refs for click outside
    const shareMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setShowShareMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
    };

    const generateShareLinks = () => {
        // In a real app, this would be the specific post URL
        const url = window.location.href; 
        const text = `¡Mira el logro de ${achievement.userEmail.split('@')[0]} en TommyBox! "${achievement.text}"`;
        
        return {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`
        };
    };

    const handleCopyLink = () => {
        const text = `¡Mira el logro de ${achievement.userEmail.split('@')[0]} en TommyBox! "${achievement.text}"`;
        navigator.clipboard.writeText(text).then(() => {
            alert("Enlace copiado al portapapeles");
            setShowShareMenu(false);
        });
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        
        setComments([...comments, {
            user: 'Yo',
            text: newComment,
            time: 'Ahora'
        }]);
        setNewComment('');
    };

    const handleMore = () => {
        alert("Opciones: Reportar publicación, Dejar de seguir");
    };

    const isBadgeUnlock = achievement.text.includes('Insignia') || achievement.text.includes('nivel');
    const shareLinks = generateShareLinks();

    // Safe date formatting
    const formatDate = () => {
        if (achievement.timestamp && typeof achievement.timestamp.toDate === 'function') {
            return achievement.timestamp.toDate().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        return 'Reciente';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible mb-6 transition-transform hover:scale-[1.01] duration-300 relative group">
            
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-50">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${isBadgeUnlock ? 'bg-gradient-to-tr from-yellow-400 to-orange-500' : 'bg-gradient-to-tr from-blue-500 to-purple-600'}`}>
                    {(achievement.userEmail || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{achievement.userEmail.split('@')[0]}</p>
                    <div className="flex items-center text-xs text-gray-500 gap-1">
                        <Clock size={10} />
                        <span>{formatDate()}</span>
                    </div>
                </div>
                <button onClick={handleMore} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full">
                    <MoreHorizontal size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="p-5">
                {isBadgeUnlock && (
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center shadow-inner animate-pulse">
                            <Trophy size={32} className="text-yellow-500" />
                        </div>
                    </div>
                )}
                <p className={`text-gray-800 leading-relaxed ${isBadgeUnlock ? 'text-center font-bold text-lg' : 'text-base font-medium'}`}>
                    "{achievement.text}"
                </p>
            </div>

            {/* Interactions Bar */}
            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between relative">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={handleLike}
                        className={`flex items-center gap-2 text-sm font-bold transition-colors group ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                        <Heart size={20} className={`transition-transform group-active:scale-125 ${liked ? 'fill-current' : ''}`} />
                        <span>{likesCount}</span>
                    </button>
                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-2 text-sm font-bold transition-colors rounded-lg px-2 py-1 ${showComments ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                        <MessageCircle size={20} />
                        <span>{comments.length}</span>
                    </button>
                </div>
                
                <div className="relative" ref={shareMenuRef}>
                    <button 
                        onClick={() => setShowShareMenu(!showShareMenu)} 
                        className={`text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full ${showShareMenu ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50'}`}
                    >
                        <Share2 size={20} />
                    </button>

                    {/* Share Menu Dropdown */}
                    {showShareMenu && (
                        <div className="absolute right-0 bottom-full mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 min-w-[160px] z-20 animate-fade-in">
                            <p className="text-[10px] text-gray-400 font-bold px-2 py-1 uppercase">Compartir en</p>
                            <a 
                                href={shareLinks.facebook} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-sm font-medium text-gray-700 rounded-lg transition-colors"
                                onClick={() => setShowShareMenu(false)}
                            >
                                <Facebook size={16} className="text-blue-600" /> Facebook
                            </a>
                            <a 
                                href={shareLinks.twitter} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-sm font-medium text-gray-700 rounded-lg transition-colors"
                                onClick={() => setShowShareMenu(false)}
                            >
                                <Twitter size={16} className="text-sky-500" /> X (Twitter)
                            </a>
                            <a 
                                href={shareLinks.whatsapp} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-3 px-3 py-2 hover:bg-green-50 text-sm font-medium text-gray-700 rounded-lg transition-colors"
                                onClick={() => setShowShareMenu(false)}
                            >
                                <MessageCircle size={16} className="text-green-500" /> WhatsApp
                            </a>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button 
                                onClick={handleCopyLink}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700 rounded-lg transition-colors w-full text-left"
                            >
                                <Link size={16} className="text-gray-400" /> Copiar Enlace
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-gray-50 p-4 border-t border-gray-100 animate-fade-in">
                    <div className="space-y-4 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                        {comments.map((comment, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                                    {comment.user.charAt(0)}
                                </div>
                                <div className="bg-white p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm border border-gray-100 flex-1">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-xs font-bold text-gray-900">{comment.user}</span>
                                        <span className="text-[10px] text-gray-400">{comment.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <form onSubmit={handleAddComment} className="relative flex items-center">
                        <input 
                            type="text" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..." 
                            className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                        />
                        <button 
                            type="submit"
                            disabled={!newComment.trim()}
                            className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-sm"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

const AchievementsView: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    setAchievements(mockPublicAchievements);
  }, []);

  return (
    <section className="container mx-auto px-4 py-8 bg-gray-100 min-h-screen">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
            <div className="inline-block p-3 bg-white rounded-full shadow-sm mb-3">
                <Flame size={28} className="text-orange-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Muro de Victorias</h2>
            <p className="text-gray-500 font-medium">Inspírate con el progreso de la comunidad.</p>
        </div>

        <div className="space-y-6 pb-20">
          {achievements.length > 0 ? (
            achievements.map((item) => (
                <AchievementCard key={item.id} achievement={item} />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Medal size={40} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Está muy tranquilo por aquí...</h3>
              <p className="text-gray-500">¡Sé el primero en compartir un logro!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AchievementsView;
