
import React, { useState, useEffect } from 'react';
import { Gift, ShoppingBag, Award, Check, AlertCircle, X, Sparkles, Zap, ChevronRight, Lock, Package, TrendingUp, Clock, CheckCircle2, Box, DollarSign, CreditCard } from 'lucide-react';
import { View, RewardItem, UserProfile } from '../../types';
import { REWARD_CATALOG, getAvailableStock } from '../../services/mockData';
import { redeemReward, subscribeToUserRedemptions, subscribeToAllRedemptions } from '../../services/gamification';

interface RewardsStoreViewProps {
  user: UserProfile & { id: string };
  setCurrentView: (view: View) => void;
}

const RewardsStoreView: React.FC<RewardsStoreViewProps> = ({ user, setCurrentView }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<{ success: boolean; message: string, redemption?: any } | null>(null);
  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  const [userRedemptions, setUserRedemptions] = useState<any[]>([]);
  const [allRedemptions, setAllRedemptions] = useState<any[]>([]);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    if (user.isTrainer) {
      const unsubscribe = subscribeToAllRedemptions(setAllRedemptions);
      return () => unsubscribe();
    } else {
      const unsubscribe = subscribeToUserRedemptions(user.id, setUserRedemptions);
      return () => unsubscribe();
    }
  }, [user.id, user.isTrainer]);

  const formatPrice = (price: number) => {
      return price > 0 
        ? `$${price.toLocaleString('es-CL')}`
        : 'Solo Puntos';
  };

  // --- TRAINER VIEW LOGIC (INVENTORY & STATS) ---
  if (user.isTrainer) {
    const inventoryStats = REWARD_CATALOG.map(product => {
        const productRedemptions = allRedemptions.filter(r => r.rewardId === product.id);
        const currentStock = getAvailableStock(product.id);
        
        return {
            ...product,
            currentStock,
            stats: {
                requested: productRedemptions.length,
                delivered: productRedemptions.filter(r => ['delivered', 'activated'].includes(r.status)).length,
                pending: productRedemptions.filter(r => ['pending', 'shipped'].includes(r.status)).length
            }
        };
    });

    const totalRedemptions = allRedemptions.length;
    const pendingDeliveries = allRedemptions.filter(r => r.status === 'pending' || r.status === 'shipped').length;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50/50">
             {/* Header */}
             <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                        <Box size={24} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900">Gestión de Inventario</h1>
                </div>
                <p className="text-gray-500">Supervisa el stock de productos y las estadísticas de canje de los atletas.</p>
             </div>

             {/* KPI Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Transacciones</p>
                        <p className="text-3xl font-black text-gray-900">{totalRedemptions}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pendientes de Entrega</p>
                        <p className="text-3xl font-black text-gray-900">{pendingDeliveries}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                        <CheckCircle2 size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Entregados / Activos</p>
                        <p className="text-3xl font-black text-gray-900">{totalRedemptions - pendingDeliveries}</p>
                    </div>
                </div>
             </div>

             {/* Inventory Grid */}
             <h2 className="text-xl font-bold text-gray-900 mb-6">Detalle por Producto</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {inventoryStats.map(item => (
                    <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        {/* Image Header */}
                        <div className="h-48 bg-gray-50 relative p-4 flex items-center justify-center">
                            <img src={item.imageUrl} alt={item.name} className="h-full object-contain mix-blend-multiply drop-shadow-lg" />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                {item.currentStock === 'unlimited' ? (
                                    <span className="text-purple-600 flex items-center gap-1"><Zap size={12}/> Ilimitado</span>
                                ) : (
                                    <span className={`${(item.currentStock as number) < 5 ? 'text-red-500' : 'text-green-600'} flex items-center gap-1`}>
                                        <Package size={12}/> Stock: {item.currentStock}
                                    </span>
                                )}
                            </div>
                            {/* Price Tag for Trainer Reference */}
                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm text-gray-600">
                                {formatPrice(item.price)}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{item.name}</h3>
                            <p className="text-xs text-gray-400 font-medium mb-6 uppercase tracking-wider">{item.category === 'merch' ? 'Producto Físico' : 'Servicio Digital'}</p>
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-xl p-3">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Solicitados</p>
                                    <p className="text-lg font-black text-gray-900">{item.stats.requested}</p>
                                </div>
                                <div className="border-l border-r border-gray-200">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Entregados</p>
                                    <p className="text-lg font-black text-gray-900">{item.stats.delivered}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pendientes</p>
                                    <p className={`text-lg font-black ${item.stats.pending > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{item.stats.pending}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
  }

  // --- CLIENT VIEW LOGIC (SHOPPING) ---
  const userPoints = currentUser?.gamification?.totalPoints || 0;

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'merch', label: 'Equipamiento' },
    { id: 'subscription', label: 'Membresía' },
    { id: 'exclusive', label: 'Exclusivo' }
  ];

  const filteredRewards = selectedCategory === 'all'
    ? REWARD_CATALOG
    : REWARD_CATALOG.filter(r => r.category === selectedCategory);

  const handleTransaction = async (type: 'points' | 'cash') => {
    if (!selectedReward) return;

    const result = await redeemReward(currentUser.id, selectedReward, type);
    setRedemptionResult(result);

    // Auto close after success
    if (result.success) {
        setTimeout(() => {
            setShowRedeemModal(false);
            setRedemptionResult(null);
            setSelectedReward(null);
        }, 3000);
    }
  };

  const openModal = (reward: RewardItem) => {
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const closeModal = () => {
    setShowRedeemModal(false);
    setRedemptionResult(null);
    setSelectedReward(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50/50">
      
      {/* Premium Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gray-900 text-white shadow-2xl mb-10 transform transition-transform hover:scale-[1.01] duration-500">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-20"></div>
        
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2 opacity-80">
                    <Sparkles size={16} className="text-yellow-400" />
                    <span className="text-sm font-bold tracking-widest uppercase">TommyBox Rewards</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">Tienda Oficial</h1>
                <p className="text-gray-400 max-w-sm">Tus esfuerzos tienen recompensa. Canjea tus puntos o adquiere equipamiento exclusivo.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex items-center gap-6 shadow-inner min-w-[280px]">
                <div className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-orange-500/30">
                    <Award size={32} className="text-white" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Balance Actual</p>
                    <p className="text-4xl font-black text-white leading-none">{userPoints.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">puntos disponibles</p>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-10">
          <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 inline-flex">
              <button 
                onClick={() => setActiveTab('catalog')} 
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'catalog' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
              >
                  Catálogo
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'history' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
              >
                  <ShoppingBag size={16} />
                  Mis Canjes
              </button>
          </div>
      </div>

      {activeTab === 'catalog' && (
        <div className="animate-fade-in">
             {/* Category Filters */}
            <div className="flex flex-wrap gap-3 mb-8 justify-center md:justify-start">
                {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 border ${selectedCategory === cat.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                    {cat.label}
                </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredRewards.map(reward => {
                const stock = getAvailableStock(reward.id);
                const isAvailable = stock === 'unlimited' || stock > 0;
                // Note: We don't block interaction based on points anymore, since they can buy with cash

                return (
                    <div key={reward.id} className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col relative overflow-hidden">
                        
                        {/* Cost Badges */}
                        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-1.5">
                                <Zap size={14} className="text-yellow-500 fill-current" />
                                <span className="text-sm font-black text-gray-900">{reward.pointsCost}</span>
                            </div>
                            {reward.price > 0 && (
                                <div className="bg-green-50/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-green-100 flex items-center gap-1.5">
                                    <span className="text-sm font-black text-green-700">{formatPrice(reward.price)}</span>
                                </div>
                            )}
                        </div>

                        {/* Image Area */}
                        <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden group-hover:bg-blue-50 transition-colors">
                            <img 
                                src={reward.imageUrl} 
                                alt={reward.name} 
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                            />
                            {!isAvailable && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                                    <div className="bg-white px-4 py-2 rounded-full shadow-md">
                                        <span className="text-sm font-bold text-gray-500 uppercase">Agotado</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col flex-grow px-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{reward.name}</h3>
                            <p className="text-sm text-gray-500 font-medium mb-4 line-clamp-2 flex-grow">{reward.description}</p>
                            
                            <button
                                onClick={() => openModal(reward)}
                                disabled={!isAvailable}
                                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                    isAvailable 
                                    ? 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {!isAvailable ? 'Agotado' : 'Ver Opciones'}
                                {isAvailable && <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                );
                })}
            </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
          <div className="animate-fade-in max-w-3xl mx-auto">
              {userRedemptions.length > 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900">Historial de Transacciones</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {userRedemptions.map(redemption => (
                        <div key={redemption.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Gift size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{redemption.rewardName}</p>
                                    <p className="text-sm text-gray-500 font-medium">{redemption.redeemedAt.toDate().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {redemption.type === 'purchase' ? (
                                    <p className="font-bold text-green-600 mb-1">Compra {formatPrice(redemption.pricePaid || 0)}</p>
                                ) : (
                                    <p className="font-bold text-red-500 mb-1">-{redemption.pointsSpent} pts</p>
                                )}
                                <StatusBadge status={redemption.status} />
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
              ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                          <ShoppingBag size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Aún no tienes canjes</h3>
                      <p className="text-gray-500">¡Explora el catálogo y date un gusto!</p>
                      <button onClick={() => setActiveTab('catalog')} className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                          Ir al Catálogo
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Action Modal (Buy or Redeem) */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={closeModal}>
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><X size={20}/></button>
            
            {!redemptionResult ? (
              <div className="flex flex-col md:flex-row gap-8">
                  {/* Left: Product Info */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-48 h-48 bg-gray-50 rounded-2xl mb-6 overflow-hidden shadow-lg border border-gray-100 flex items-center justify-center">
                            <img src={selectedReward.imageUrl} alt={selectedReward.name} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">{selectedReward.name}</h3>
                        <p className="text-sm text-gray-500">{selectedReward.description}</p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex-1 flex flex-col justify-center gap-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Selecciona un método</p>
                      
                      {/* Option 1: Redeem Points */}
                      <button 
                        onClick={() => handleTransaction('points')}
                        disabled={userPoints < selectedReward.pointsCost}
                        className={`group relative p-4 rounded-2xl border-2 text-left transition-all ${
                            userPoints >= selectedReward.pointsCost 
                            ? 'border-gray-200 hover:border-blue-500 bg-white hover:bg-blue-50 cursor-pointer' 
                            : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                          <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-gray-900 flex items-center gap-2"><Zap size={18} className="text-yellow-500 fill-current"/> Canjear Puntos</span>
                              {userPoints < selectedReward.pointsCost && <Lock size={16} className="text-gray-400"/>}
                          </div>
                          <p className="text-3xl font-black text-blue-600 mb-1">{selectedReward.pointsCost} <span className="text-sm font-medium text-gray-500">pts</span></p>
                          <p className={`text-xs ${userPoints >= selectedReward.pointsCost ? 'text-green-600' : 'text-red-500'}`}>
                              Tu saldo: {userPoints} pts
                          </p>
                      </button>

                      {/* Option 2: Buy Cash */}
                      {selectedReward.price > 0 && (
                          <button 
                             onClick={() => handleTransaction('cash')}
                             className="group relative p-4 rounded-2xl border-2 border-gray-200 hover:border-green-500 bg-white hover:bg-green-50 cursor-pointer text-left transition-all"
                          >
                              <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-gray-900 flex items-center gap-2"><CreditCard size={18} className="text-green-600"/> Comprar</span>
                              </div>
                              <p className="text-3xl font-black text-green-700 mb-1">{formatPrice(selectedReward.price)}</p>
                              <p className="text-xs text-gray-400">Pago seguro vía WebPay / Transferencia</p>
                          </button>
                      )}
                  </div>
              </div>
            ) : (
              <div className="text-center py-8">
                {redemptionResult.success ? (
                  <>
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-up">
                        <Check className="text-green-600" size={48} strokeWidth={4} />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-2">¡Todo Listo!</h3>
                    <p className="text-lg text-gray-600 mb-8">{redemptionResult.message}</p>
                    {redemptionResult.redemption?.type === 'purchase' && (
                        <div className="p-4 bg-gray-50 rounded-xl mb-4 max-w-sm mx-auto">
                            <p className="text-xs text-gray-500">Te hemos enviado el comprobante de pago a tu correo.</p>
                        </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="text-red-600" size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Ups, hubo un problema</h3>
                    <p className="text-gray-600 mb-6">{redemptionResult.message}</p>
                    <button onClick={closeModal} className="w-full py-3 bg-gray-100 text-gray-800 rounded-xl font-bold hover:bg-gray-200">Entendido</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    shipped: 'bg-blue-100 text-blue-700 border-blue-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    activated: 'bg-purple-100 text-purple-700 border-purple-200'
  };
  const labels: { [key: string]: string } = {
    pending: 'Pendiente',
    shipped: 'En Camino',
    delivered: 'Entregado',
    activated: 'Activo'
  };
  return <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-bold border ${styles[status]}`}>{labels[status]}</span>;
}

export default RewardsStoreView;
