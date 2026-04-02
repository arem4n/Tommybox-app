import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Pencil, Check, X, Plus, Trash2, DollarSign } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

const DEFAULT_PLANS = [
  { id: 'plan_1', name: 'Esencial', price: 70000, description: 'Perfecto para establecer una base sólida.', icon: 'Dumbbell', featured: false, sessionsPerWeek: 1, features: ['1 sesión/semana', 'Programa personalizado', 'Seguimiento de progreso'] },
  { id: 'plan_2', name: 'Avanzado', price: 80000, description: 'Ideal para un progreso constante.', icon: 'Zap', featured: true, sessionsPerWeek: 2, features: ['2 sesiones/semana', 'Programa personalizado', 'Seguimiento de progreso', 'Chat con entrenador'] },
  { id: 'plan_3', name: 'Elite', price: 90000, description: 'Para un compromiso total.', icon: 'Award', featured: false, sessionsPerWeek: 3, features: ['3 sesiones/semana', 'Programa personalizado', 'Seguimiento de progreso', 'Chat con entrenador', 'Acceso prioritario'] },
];

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  featured: boolean;
  sessionsPerWeek: number;
  features: string[];
}

const PlanEditor = ({ plan, onSave, onCancel }: { plan: Plan; onSave: (p: Plan) => void; onCancel: () => void }) => {
  const [draft, setDraft] = useState<Plan>({ ...plan });
  const [newFeature, setNewFeature] = useState('');

  const updateField = (field: keyof Plan, value: any) =>
    setDraft(prev => ({ ...prev, [field]: value }));

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setDraft(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
    setNewFeature('');
  };

  const removeFeature = (idx: number) =>
    setDraft(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));

  return (
    <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-xl shadow-blue-500/10 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-gray-900 text-lg">Editando: {plan.name}</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X size={18} />
          </button>
          <button onClick={() => onSave(draft)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            <Check size={16} /> Guardar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nombre del plan</label>
          <input
            value={draft.name}
            onChange={e => updateField('name', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Precio (CLP)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
            <input
              type="number"
              value={draft.price}
              onChange={e => updateField('price', Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 pl-7 py-2.5 text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Sesiones / semana</label>
          <input
            type="number"
            min={1}
            max={7}
            value={draft.sessionsPerWeek}
            onChange={e => updateField('sessionsPerWeek', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 cursor-pointer w-full p-3 bg-gray-50 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={e => updateField('featured', e.target.checked)}
              className="w-5 h-5 rounded text-blue-600"
            />
            <div>
              <p className="text-sm font-bold text-gray-800">Destacado</p>
              <p className="text-xs text-gray-400">Aparece como "Más Popular"</p>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Descripción</label>
        <textarea
          value={draft.description}
          onChange={e => updateField('description', e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Beneficios incluidos</label>
        <div className="space-y-2 mb-3">
          {draft.features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <span className="flex-1 text-sm text-gray-700">{feat}</span>
              <button onClick={() => removeFeature(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addFeature()}
            placeholder="Agregar beneficio..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button onClick={addFeature} className="px-3 py-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors">
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const TrainerPlansManager = ({ user }: { user: any }) => {
  const { showAlert } = useModal();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'plans'), (snapshot) => {
      if (snapshot.empty) {
        setPlans(DEFAULT_PLANS as Plan[]);
      } else {
        setPlans(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Plan)));
      }
    });
    return () => unsubscribe();
  }, []);

  const savePlan = async (updated: Plan) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'plans', updated.id), updated, { merge: true });
      setEditingId(null);
      showAlert(`Plan "${updated.name}" guardado correctamente.`);
    } catch (e) {
      console.error(e);
      showAlert('Error al guardar el plan. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const planIcons: Record<string, string> = {
    Dumbbell: '/custom-icons/plan_esencial.png',
    Zap: '/custom-icons/plan_avanzado.png',
    Award: '/custom-icons/plan_elite.png',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <DollarSign size={22} className="text-blue-600" /> Gestión de Planes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Los cambios se reflejan en tiempo real para todos los clientes.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {plans.map(plan => (
          <div key={plan.id}>
            {editingId === plan.id ? (
              <PlanEditor
                plan={plan}
                onSave={savePlan}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5 hover:border-blue-200 transition-colors">
                <img
                  src={planIcons[plan.icon] || '/custom-icons/plan_esencial.png'}
                  alt={plan.name}
                  className="w-16 h-16 object-contain bg-slate-900 rounded-xl p-2 mix-blend-multiply"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-gray-900 text-lg">{plan.name}</h3>
                    {plan.featured && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Más popular</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{plan.description}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-blue-600 font-black text-xl">
                      ${(plan.price / 1000).toFixed(0)}.000
                      <span className="text-gray-400 font-normal text-sm ml-1">/mes</span>
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">
                      {plan.sessionsPerWeek || 1}x / semana
                    </span>
                    <span className="text-xs text-gray-400">{plan.features?.length || 0} beneficios</span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingId(plan.id)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm shrink-0"
                >
                  <Pencil size={16} /> Editar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainerPlansManager;
