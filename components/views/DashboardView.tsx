
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { View, UserProfile, Metric, Observation, Feeling } from '../../types';
import { MessageCircle, Calendar, Gift, BarChart, Cog, Check, Zap, X, ClipboardCheck, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subscribeToUserMetrics, subscribeToUserObservations, subscribeToUserFeelings, subscribeToUserSessions, getUserProfile, addFeeling } from '../../services/db';
import { canPerformAction, incrementActionCount, checkAndAwardPoints, calculateLevelInfo } from '../../services/gamification';

interface DashboardViewProps {
  trainerId: string | null;
  user: User | null;
  setChatCompanionId: (id: string) => void;
  setShowChat: (show: boolean) => void;
  setCurrentView: (view: View) => void;
  setRewardQueue: (updateFn: (queue: any[]) => any[]) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ trainerId, user, setChatCompanionId, setShowChat, setCurrentView, setRewardQueue }) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [evaluations, setEvaluations] = useState<Observation[]>([]);
  const [userProfile, setUserProfile] = useState<(UserProfile & {id: string}) | null>(null);
  const [sessionFeeling, setSessionFeeling] = useState('');
  const [message, setMessage] = useState('');
  const [canPostSensation, setCanPostSensation] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  
  useEffect(() => {
    if (!user?.uid) return;
    
    // Fetch User Profile
    const fetchProfile = async () => {
      const profileData = await getUserProfile(user.uid);
      if (profileData) setUserProfile(profileData);
    };
    fetchProfile();

    // Subscriptions
    const unsubscribeMetrics = subscribeToUserMetrics(user.uid, (data) => {
      setMetrics([...data].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    });
    
    const unsubscribeObservations = subscribeToUserObservations(user.uid, (data) => {
      setEvaluations([...data].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    
    const unsubscribeSessions = subscribeToUserSessions(user.uid, (data) => {
      setSessionCount(data.length);
    });

    // Check if can post sensation today
    const checkAction = async () => {
      const canPost = await canPerformAction(user.uid, 'POST_WORKOUT_SENSATION');
      setCanPostSensation(canPost);
    };
    checkAction();

    return () => {
      unsubscribeMetrics();
      unsubscribeObservations();
      unsubscribeSessions();
    };
  }, [user?.uid]);
  
  const handleSaveFeeling = async () => {
    if (!sessionFeeling.trim() || !user?.uid) return;
    
    const canPost = await canPerformAction(user.uid, 'POST_WORKOUT_SENSATION');
    if (!canPost) {
        setMessage('Ya registraste tu sensación hoy.');
        setTimeout(() => setMessage(''), 3000);
        return;
    }

    const isDetailed = sessionFeeling.length > 50;
    const newFeeling: Omit<Feeling, 'id' | 'timestamp'> = {
      feeling: sessionFeeling,
      date: new Date().toISOString().split('T')[0],
    };
    
    await addFeeling(user.uid, newFeeling);
    const rewards = await checkAndAwardPoints(user.uid, 'POST_WORKOUT_SENSATION', { isDetailed });
    
    if(rewards) setRewardQueue(q => [...q, rewards]);
    await incrementActionCount(user.uid, 'POST_WORKOUT_SENSATION');

    setMessage('¡Gracias por tu feedback!');
    setSessionFeeling('');
    setCanPostSensation(false);
    setTimeout(() => setMessage(''), 3000);
    
    // Refresh profile to get updated points
    const profileData = await getUserProfile(user.uid);
    if (profileData) setUserProfile(profileData);
  };

  const metricsDataForChart = metrics.length > 0 ?
    metrics.reduce((acc: any, metric) => {
        const existing = acc.find((item: any) => item.exercise === metric.exercise);
        if (existing) {
            existing.data.push({ date: metric.date, load: metric.load });
        } else {
            acc.push({ exercise: metric.exercise, data: [{ date: metric.date, load: metric.load }] });
        }
        return acc;
    }, [])
    : [];
  
  const gamificationProfile = userProfile?.gamification;
  const levelInfo = gamificationProfile ? calculateLevelInfo(gamificationProfile.totalPoints) : null;

  // Evaluation Session Logic
  const needsEvaluation = userProfile && (!userProfile.plan || userProfile.plan === 'Sin Plan') && sessionCount === 0;

  return (
    <section className="container mx-auto px-4 py-6 max-w-6xl pb-24">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
               {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Perfil" className="w-16 h-16 rounded-full object-cover shadow-md ring-4 ring-white" />
              ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl font-bold shadow-md ring-4 ring-white">
                      {(userProfile?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
              )}
              <div>
                  <h1 className="text-2xl font-black text-gray-900 leading-tight">Hola, {userProfile?.displayName?.split(' ')[0] || 'Atleta'}</h1>
                  <p className="text-gray-500 text-sm font-medium">¿Listo para romper tus límites?</p>
              </div>
          </div>
          <div className="flex gap-3">
              <button onClick={() => setCurrentView('profile')} className="p-3 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 shadow-sm transition-all hover:rotate-90 duration-500">
                  <Cog size={22} />
              </button>
          </div>
      </div>
      
      {/* EVALUATION CALL TO ACTION (For New Users) */}
      {needsEvaluation && (
          <div className="mb-8 animate-fade-in">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                  <div className="relative z-10 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                          <ClipboardCheck size={14} />
                          <span>Paso 1: Diagnóstico</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black leading-tight mb-2">Comienza con tu Evaluación</h2>
                      <p className="text-blue-100 max-w-lg">
                          Antes de iniciar tu plan, agenda una sesión de evaluación gratuita para definir tus objetivos y nivel físico.
                      </p>
                  </div>
                  <button 
                      onClick={() => setCurrentView('agenda')}
                      className="relative z-10 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95 flex items-center gap-2 whitespace-nowrap"
                  >
                      Agendar Ahora <ArrowRight size={18} />
                  </button>
              </div>
          </div>
      )}

      {message && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white rounded-full font-bold shadow-2xl animate-bounce flex items-center gap-2">
              <Check size={18} className="text-green-400"/> {message}
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Digital ID & Actions */}
          <div className="lg:col-span-4 space-y-6">
              
              {/* DIGITAL ID CARD */}
              <div className="w-full h-56 group">
                   <div className="relative w-full h-full">
                      
                      {/* FRONT */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl p-6 text-white flex flex-col justify-between border border-gray-700 overflow-hidden">
                          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                          <div className="flex justify-between items-start relative z-10">
                              <div>
                                  <p className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-1">TOMMYBOX ATHLETE</p>
                                  <h3 className="text-xl font-bold tracking-wide truncate max-w-[180px]">{userProfile?.displayName || user?.email?.split('@')[0]}</h3>
                              </div>
                              <Zap className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" size={28}/>
                          </div>
                          
                          <div className="flex items-center gap-4 relative z-10">
                              <div className="bg-white/5 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                                  <Zap size={32} className="text-white" />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-white">Atleta Activo</p>
                                  <p className="text-[10px] text-gray-400 font-medium uppercase">Acceso Rápido</p>
                              </div>
                          </div>

                          <div className="flex justify-between items-end relative z-10 border-t border-white/10 pt-3">
                              <div>
                                  <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Membresía</p>
                                  <p className="font-bold text-blue-400 text-sm shadow-black drop-shadow-sm">{userProfile?.plan || 'Básico'}</p>
                              </div>
                              <p className="text-[9px] text-gray-600 font-mono tracking-widest">{userProfile?.id?.substring(0,8).toUpperCase()}</p>
                          </div>
                      </div>
                   </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setCurrentView('achievements')} className="flex flex-col items-center justify-center gap-2 p-5 bg-gray-900 text-white rounded-3xl shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-[0.98] group">
                      <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
                          <Zap size={24}/>
                      </div>
                      <span className="font-bold text-sm">Logros</span>
                  </button>
                  
                  <button onClick={() => setCurrentView('agenda')} className="flex flex-col items-center justify-center gap-2 p-5 bg-white border border-gray-100 text-gray-700 rounded-3xl shadow-sm hover:shadow-lg transition-all active:scale-[0.98]">
                      <div className="p-3 bg-red-50 rounded-2xl text-red-500">
                           <Calendar size={24}/>
                      </div>
                      <span className="font-bold text-sm">Agendar</span>
                  </button>

                  <button onClick={() => { if(trainerId) { setChatCompanionId(trainerId); setShowChat(true); } }} className="flex flex-col items-center justify-center gap-2 p-5 bg-white border border-gray-100 text-gray-700 rounded-3xl shadow-sm hover:shadow-lg transition-all active:scale-[0.98]">
                       <div className="p-3 bg-blue-50 rounded-2xl text-blue-500">
                          <MessageCircle size={24}/>
                      </div>
                      <span className="font-bold text-sm">Chat</span>
                  </button>

                  <button onClick={() => setCurrentView('rewards-store')} className="flex flex-col items-center justify-center gap-2 p-5 bg-white border border-gray-100 text-gray-700 rounded-3xl shadow-sm hover:shadow-lg transition-all active:scale-[0.98]">
                       <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
                          <Gift size={24}/>
                      </div>
                      <span className="font-bold text-sm">Tienda</span>
                  </button>
              </div>

              {/* Level Status */}
              {gamificationProfile && levelInfo && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-60"></div>
                      <div className="flex justify-between items-center mb-4 relative z-10">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nivel Actual</p>
                              <h3 className="font-black text-2xl text-gray-900 leading-none">
                                {levelInfo.level}
                              </h3>
                          </div>
                          <span className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full font-bold shadow-lg shadow-gray-200">{gamificationProfile.totalPoints} XP</span>
                      </div>
                       <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${levelInfo.progress}%` }}>
                                <div className="absolute top-0 right-0 bottom-0 w-full bg-white/30 animate-[shimmer_2s_infinite]"></div>
                          </div>
                      </div>
                      <p className="text-xs text-gray-400 text-right font-medium">{Math.round(levelInfo.xpForNextLevel - levelInfo.currentXpInLevel)} XP para subir de nivel</p>
                  </div>
              )}
          </div>

          {/* RIGHT COLUMN: Stats & Feedback */}
          <div className="lg:col-span-8 space-y-6">
              
              {/* Progress Chart */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><BarChart size={20}/></div>
                         Mi Rendimiento
                       </h3>
                       <button onClick={() => setCurrentView('achievements')} className="text-sm bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl text-gray-600 font-bold transition-colors">
                         Ver Ranking
                       </button>
                  </div>
                  
                  {metricsDataForChart.length > 0 ? (
                      <div className="h-[250px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={metricsDataForChart[0]?.data || []}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                                  <Tooltip 
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '12px 16px'}} 
                                    itemStyle={{color: '#111827', fontWeight: 'bold', fontSize: '14px'}}
                                    cursor={{stroke: '#e5e7eb', strokeWidth: 2}}
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="load" 
                                    stroke="#2563eb" 
                                    strokeWidth={4} 
                                    dot={{fill: '#2563eb', strokeWidth: 3, r: 5, stroke: '#fff'}} 
                                    activeDot={{ r: 8, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 3 }} 
                                  />
                              </LineChart>
                          </ResponsiveContainer>
                          <p className="text-center text-xs text-gray-400 mt-6 font-medium bg-gray-50 py-1.5 rounded-full inline-block px-4 mx-auto border border-gray-100">
                             Mostrando: <span className="text-gray-900 font-bold">{metricsDataForChart[0]?.exercise}</span>
                          </p>
                      </div>
                  ) : (
                      <div className="h-[250px] flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                          <BarChart className="text-gray-300 mb-4" size={40} />
                          <p className="text-gray-500 font-medium">No hay datos suficientes aún.</p>
                          <p className="text-xs text-gray-400 mt-1">Completa tu primer entrenamiento para ver estadísticas.</p>
                      </div>
                  )}
              </div>

              {/* Two Columns: Feedback Form & Last Comments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
                   {/* Feedback Input */}
                   <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col h-full">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">¿Cómo entrenaste hoy?</h3>
                      {canPostSensation ? (
                          <form onSubmit={(e) => { e.preventDefault(); handleSaveFeeling(); }} className="flex-1 flex flex-col">
                              <textarea 
                                  value={sessionFeeling} 
                                  onChange={(e) => setSessionFeeling(e.target.value)} 
                                  placeholder="Cuéntanos sobre tu energía, dolor o logros..." 
                                  className="w-full flex-1 border-2 border-gray-100 bg-gray-50/50 rounded-2xl p-4 mb-4 focus:bg-white focus:border-blue-400 outline-none resize-none text-sm transition-all text-gray-700 font-medium placeholder-gray-400" 
                                  required 
                              />
                              <div className="flex items-center justify-between mt-auto">
                                  <div className="flex items-center gap-1.5 text-xs text-yellow-600 font-bold bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                                    <Zap size={14} className="fill-current"/> +5 XP
                                  </div>
                                  <button type="submit" disabled={!sessionFeeling.trim()} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200 active:scale-95">
                                      Enviar Feedback
                                  </button>
                              </div>
                          </form>
                      ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 bg-green-50/30 rounded-2xl border border-green-100/50">
                              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-green-500 border border-green-50">
                                <Check size={32} strokeWidth={4} />
                              </div>
                              <p className="font-bold text-green-800 text-lg">¡Registrado!</p>
                              <p className="text-sm text-green-600 max-w-[200px] mx-auto mt-1">Has ganado puntos por tu constancia hoy.</p>
                          </div>
                      )}
                  </div>

                  {/* Recent Feedback */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col h-full">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Notas del Coach</h3>
                      <div className="flex-1 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar space-y-3">
                           {evaluations.length > 0 ? evaluations.slice(0,3).map((obs, i) => (
                               <div key={i} className="p-4 bg-gray-50 rounded-2xl border-l-4 border-blue-500 relative hover:bg-white hover:shadow-md transition-all border-gray-100">
                                   <p className="text-sm text-gray-700 italic leading-relaxed">"{obs.comment}"</p>
                                   <p className="text-[10px] text-gray-400 mt-2 font-bold text-right uppercase tracking-wider">{new Date(obs.date).toLocaleDateString()}</p>
                               </div>
                           )) : (
                               <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 italic">
                                   <MessageCircle size={32} className="mb-2 opacity-20"/>
                                   <p className="text-sm">No hay observaciones recientes.</p>
                               </div>
                           )}
                      </div>
                  </div>
              </div>
          </div>
      </div>
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
};

export default DashboardView;
