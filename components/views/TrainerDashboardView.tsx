
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    Users, Search, ChevronRight, ChevronLeft,
    PlusCircle, Save, CheckCircle, XCircle, 
    ClipboardList, Activity,
    Download, MessageCircle, Bell, Trophy, X, LogOut, ArrowLeft,
    Gauge
} from 'lucide-react';
import { UserProfile } from '../../types';
import ClientHistory from '../ClientHistory';
import { 
    subscribeToUsers,
    addMetric, 
    addObservation
} from '../../services/db';
import {
    subscribeToPendingAchievements,
    approvePendingAchievement, 
    rejectPendingAchievement
} from '../../services/gamification';

// Types and Props
interface TrainerDashboardViewProps {
  setChatCompanionId: (id: string) => void;
  setShowChat: (show: boolean) => void;
  setSelectedClientForChat: (id: string | null) => void;
  handleLogout: () => void;
}

const TrainerDashboardView: React.FC<TrainerDashboardViewProps> = ({ setChatCompanionId, setShowChat, setSelectedClientForChat, handleLogout }) => {
    // State
    const [clients, setClients] = useState<(UserProfile & {id: string})[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    
    // UI State
    const [sidebarTab, setSidebarTab] = useState<'clients' | 'inbox'>('clients');
    const [detailTab, setDetailTab] = useState<'log' | 'history'>('log');
    const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list'); // Master-Detail controller
    
    const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Data State
    const [pendingAchievements, setPendingAchievements] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [formData, setFormData] = useState({ exercise: '', load: '', reps: '', rpe: '', observation: '' });

    useEffect(() => {
        return () => {
            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        };
    }, []);

    useEffect(() => {
        const unsubscribeUsers = subscribeToUsers((usersData) => {
            setClients(usersData.filter(user => !user.isTrainer));
        });
        
        const unsubscribeAchievements = subscribeToPendingAchievements((achievements) => {
            setPendingAchievements(achievements);
        });
        
        // TODO: Fetch notifications from Firestore if needed
        setNotifications([]);

        return () => {
            unsubscribeUsers();
            unsubscribeAchievements();
        };
    }, []);

    useEffect(() => {
        setSelectedClientForChat(selectedClientId);
    }, [selectedClientId, setSelectedClientForChat]);

    const filteredClients = useMemo(() => {
        return clients.filter(c => 
            (c.displayName || c.username || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    const selectedClient = useMemo(() => 
        clients.find(c => c.id === selectedClientId), 
    [clients, selectedClientId]);

    // Actions
    const handleSelectClient = (id: string) => {
        setSelectedClientId(id);
        setViewMode('detail'); // Force switch to detail on mobile
        // On desktop this state is ignored by CSS media queries or we can use it to highlight
    };

    const handleBackToList = () => {
        setViewMode('list');
        // Optional: clear selection? 
        // setSelectedClientId(null); 
    };

    const showFeedback = (type: 'success' | 'error', text: string) => {
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setFeedbackMsg({ type, text });
        feedbackTimerRef.current = setTimeout(() => setFeedbackMsg(null), 3000);
    };

    const handleSave = async () => {
        if (!selectedClientId) return;
        const { exercise, load, reps, rpe, observation } = formData;
        
        if (!exercise && !observation) {
            showFeedback('error', 'Ingresa una métrica o una observación.');
            return;
        }

        try {
            if (exercise) {
                 await addMetric(selectedClientId, {
                    exercise,
                    load: Number(load),
                    reps: Number(reps),
                    rpe: rpe ? Number(rpe) : undefined,
                    date: new Date().toISOString().split('T')[0],
                });
            }

            if (observation) {
                 await addObservation(selectedClientId, {
                    comment: observation,
                    date: new Date().toISOString().split('T')[0],
                });
            }

            showFeedback('success', 'Datos guardados correctamente.');
            setFormData({ exercise: '', load: '', reps: '', rpe: '', observation: '' });
            setDetailTab('history'); 
        } catch (error) {
            showFeedback('error', 'Error al guardar los datos.');
        }
    };

    const handleAchievementAction = async (action: 'approve' | 'reject', id: string) => {
        try {
            if (action === 'approve') {
                await approvePendingAchievement(id);
                showFeedback('success', 'Logro aprobado.');
            } else {
                await rejectPendingAchievement(id);
                showFeedback('success', 'Logro rechazado.');
            }
        } catch (error) {
            showFeedback('error', 'Error al procesar el logro.');
        }
    };

    const handleExport = () => {
        // TODO: Implement export from Firestore
        showFeedback('error', 'Exportación no disponible en esta versión.');
    };

    const performLogout = () => {
        // KILL SWITCH: No confirmation, just logout immediately.
        handleLogout();
    };

    // Determine visibility classes based on viewMode
    // Mobile: 'list' -> show Sidebar, hide Detail. 'detail' -> hide Sidebar, show Detail
    // Desktop: Always show both (flex layout)
    
    const sidebarClass = `
        w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-gray-200 flex-col h-full max-h-full transition-transform duration-300
        ${viewMode === 'list' ? 'flex' : 'hidden lg:flex'}
    `;

    const detailClass = `
        flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex-col h-full max-h-full overflow-hidden relative transition-all duration-300
        ${viewMode === 'detail' ? 'flex' : 'hidden lg:flex'}
    `;

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] bg-gray-50 pt-2 px-2 sm:px-4 gap-4 pb-2">
            
            {/* Feedback Toast */}
            {feedbackMsg && (
                <div className={`fixed top-24 right-4 z-[60] px-6 py-4 rounded-xl shadow-2xl text-white font-bold animate-slide-in flex items-center gap-3 ${feedbackMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {feedbackMsg.type === 'success' ? <CheckCircle size={24}/> : <XCircle size={24}/>}
                    {feedbackMsg.text}
                </div>
            )}

            {/* Header / Toolbar */}
            <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-wrap justify-between items-center gap-4 shrink-0 z-20 relative">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white shadow-lg shadow-blue-200">
                        <Users size={22} />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">Coach Dashboard</h1>
                        <p className="text-xs font-medium text-gray-500">Gestión de Atletas</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <button 
                        onClick={handleExport} 
                        className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Download size={18} />
                        <span>Exportar</span>
                    </button>
                    <button 
                        onClick={performLogout} 
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition-all active:scale-95 cursor-pointer relative z-50"
                        title="Cerrar Sesión"
                        type="button"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline">Cerrar Sesión</span>
                    </button>
                </div>
            </header>

            {/* Master-Detail Layout */}
            <div className="flex flex-1 min-h-0 gap-4 overflow-hidden relative">
                
                {/* SIDEBAR (Master) */}
                <aside className={sidebarClass}>
                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-gray-100 shrink-0 p-1 bg-gray-50/50 m-2 rounded-xl">
                        <button 
                            onClick={() => setSidebarTab('clients')} 
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${sidebarTab === 'clients' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Atletas
                        </button>
                        <button 
                            onClick={() => setSidebarTab('inbox')} 
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${sidebarTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Buzón
                            {(pendingAchievements.length + notifications.length) > 0 && (
                                <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                    {pendingAchievements.length + notifications.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                        {sidebarTab === 'clients' ? (
                            <>
                                <div className="px-3 pb-2 sticky top-0 bg-white z-10">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar atleta..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div className="px-2 pb-2 space-y-1">
                                    {filteredClients.map(client => (
                                        <button
                                            key={client.id}
                                            onClick={() => handleSelectClient(client.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 border border-transparent ${selectedClientId === client.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selectedClientId === client.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                                                {(client.displayName || client.username).substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${selectedClientId === client.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                                    {client.displayName || client.username}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {client.plan || 'Sin plan'}
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className={`text-gray-300 ${selectedClientId === client.id ? 'text-blue-500' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="p-3 space-y-4">
                                {/* Pending Achievements */}
                                {pendingAchievements.map(item => (
                                    <div key={item.id} className="p-4 bg-white border border-yellow-200 rounded-xl shadow-sm relative group">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600"><Trophy size={16}/></div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">"{item.text}"</p>
                                                <p className="text-xs text-gray-500 mb-2">{item.userEmail?.split('@')[0]}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleAchievementAction('approve', item.id)} className="flex-1 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Aprobar</button>
                                            <button onClick={() => handleAchievementAction('reject', item.id)} className="flex-1 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg">Rechazar</button>
                                        </div>
                                    </div>
                                ))}
                                {notifications.map((item, i) => (
                                    <div key={i} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-bold text-gray-800">{item.title}</p>
                                            <span className="text-[10px] text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">{item.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* DETAIL VIEW (Main) */}
                <main className={detailClass}>
                    {!selectedClient ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/30">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <Users size={40} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 mb-1">Ningún atleta seleccionado</h2>
                            <p className="text-sm text-gray-500">Selecciona uno de la lista para gestionar.</p>
                        </div>
                    ) : (
                        <>
                            {/* Detail Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleBackToList}
                                        className="lg:hidden p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>

                                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-md">
                                        {(selectedClient.displayName || selectedClient.username).substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedClient.displayName || selectedClient.username}</h2>
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                                            {selectedClient.plan || 'Sin Plan'}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setChatCompanionId(selectedClient.id); setShowChat(true); }} 
                                    className="p-3 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                >
                                    <MessageCircle size={20} />
                                </button>
                            </div>

                            {/* Detail Tabs */}
                            <div className="flex border-b border-gray-100 shrink-0 bg-white">
                                <button 
                                    onClick={() => setDetailTab('log')} 
                                    className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${detailTab === 'log' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    <PlusCircle size={16} />
                                    Registrar
                                </button>
                                <button 
                                    onClick={() => setDetailTab('history')} 
                                    className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${detailTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Activity size={16} />
                                    Historial
                                </button>
                            </div>

                            {/* Detail Content */}
                            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 lg:p-6 pb-24 lg:pb-6">
                                {detailTab === 'log' ? (
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <ClipboardList className="text-blue-500" size={18}/>
                                                Métrica Técnica
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="md:col-span-3">
                                                    <input 
                                                        type="text" 
                                                        value={formData.exercise}
                                                        onChange={e => setFormData({...formData, exercise: e.target.value})}
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                                                        placeholder="Nombre del Ejercicio (ej. Deadlift)"
                                                    />
                                                </div>
                                                <div>
                                                    <input 
                                                        type="number" 
                                                        value={formData.load}
                                                        onChange={e => setFormData({...formData, load: e.target.value})}
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold"
                                                        placeholder="Kg"
                                                    />
                                                </div>
                                                <div>
                                                    <input 
                                                        type="number" 
                                                        value={formData.reps}
                                                        onChange={e => setFormData({...formData, reps: e.target.value})}
                                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold"
                                                        placeholder="Reps"
                                                    />
                                                </div>
                                                {/* NEW RPE INPUT */}
                                                <div className="md:col-span-1 relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                        <Gauge size={18} />
                                                    </div>
                                                    <input 
                                                        type="number" 
                                                        value={formData.rpe}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value);
                                                            if (!val || (val >= 1 && val <= 10)) {
                                                                setFormData({...formData, rpe: e.target.value});
                                                            }
                                                        }}
                                                        min="1"
                                                        max="10"
                                                        className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-center font-bold placeholder-gray-400"
                                                        placeholder="RPE (1-10)"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <MessageCircle className="text-purple-500" size={18}/>
                                                Feedback Técnico
                                            </h3>
                                            <textarea 
                                                value={formData.observation}
                                                onChange={e => setFormData({...formData, observation: e.target.value})}
                                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all min-h-[100px] text-gray-700"
                                                placeholder="Correcciones de postura, ritmo, etc..."
                                            />
                                        </div>

                                        <button 
                                            onClick={handleSave}
                                            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transform transition-transform active:scale-[0.98] flex items-center justify-center gap-3"
                                        >
                                            <Save size={20} />
                                            Guardar Todo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-full">
                                        <ClientHistory selectedClient={selectedClient.id} updateTrigger={new Date().toISOString()} />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TrainerDashboardView;
