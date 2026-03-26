import React from 'react';
import { UserProfile } from '../../types';
import { mockUsers } from '../../services/mockData';
import { Users, User, XCircle, Dumbbell, Zap, Award } from 'lucide-react';

const TrainerPlansView: React.FC = () => {
    const clients = mockUsers.filter(u => !u.isTrainer);
    const planNames = ['1 Sesión / Semana', '2 Sesiones / Semana', '3 Sesiones / Semana'];

    const clientsByPlan = planNames.reduce((acc, plan) => {
        acc[plan] = clients.filter(c => c.plan === plan);
        return acc;
    }, {} as Record<string, (UserProfile & {id:string})[]>);

    const clientsWithoutPlan = clients.filter(c => !c.plan || !planNames.includes(c.plan));

    const planDetails: { [key: string]: { color: string, textColor: string, borderColor: string, icon: React.ReactNode } } = {
        '1 Sesión / Semana': { color: 'bg-teal-100', textColor: 'text-teal-800', borderColor: 'border-teal-500', icon: <Dumbbell/> },
        '2 Sesiones / Semana': { color: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-500', icon: <Zap/> },
        '3 Sesiones / Semana': { color: 'bg-purple-100', textColor: 'text-purple-800', borderColor: 'border-purple-500', icon: <Award/> },
        'Sin Plan': { color: 'bg-gray-100', textColor: 'text-gray-800', borderColor: 'border-gray-500', icon: <XCircle/> }
    };

    const allPlanGroups = [
        ...planNames.map(planName => ({
            name: planName,
            clients: clientsByPlan[planName],
            details: planDetails[planName]
        })),
        {
            name: 'Sin Plan',
            clients: clientsWithoutPlan,
            details: planDetails['Sin Plan']
        }
    ];

    return (
        <section className="bg-gray-50 py-16 min-h-screen">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Gestión de Planes y Clientes</h1>
                    <p className="text-gray-600 mb-12">Visualiza la distribución de tus clientes en cada plan.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {allPlanGroups.map(group => (
                        <div key={group.name} className={`rounded-2xl bg-white p-6 shadow-xl border-t-4 ${group.details.borderColor}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-xl font-bold ${group.details.textColor}`}>{group.name}</h3>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${group.details.color} ${group.details.textColor}`}>
                                    <Users size={16} />
                                    <span>{group.clients.length}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {group.clients.length > 0 ? (
                                    group.clients.map(client => (
                                        <div key={client.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{client.username}</p>
                                                <p className="text-xs text-gray-500">{client.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic text-center py-4">No hay clientes en este plan.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrainerPlansView;