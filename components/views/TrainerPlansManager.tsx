import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Pencil, Check, X, Plus, Trash2, DollarSign, Image, Upload } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

const DEFAULT_PLANS = [
  { id: 'plan_1', name: 'Esencial', price: 70000, description: 'Perfecto para establecer una base sólida.', icon: 'Dumbbell', imageUrl: '', featured: false, sessionsPerWeek: 1, features: ['1 sesión/semana', 'Programa personalizado', 'Seguimiento de progreso'] },
  { id: 'plan_2', name: 'Avanzado', price: 80000, description: 'Ideal para un progreso constante.', icon: 'Zap', imageUrl: '', featured: true, sessionsPerWeek: 2, features: ['2 sesiones/semana', 'Programa personalizado', 'Seguimiento de progreso', 'Chat con entrenador'] },
  { id: 'plan_3', name: 'Elite', price: 90000, description: 'Para un compromiso total.', icon: 'Award', imageUrl: '', featured: false, sessionsPerWeek: 3, features: ['3 sesiones/semana', 'Programa personalizado', 'Seguimiento de progreso', 'Chat con entrenador', 'Acceso prioritario'] },
];

const ICON_IMAGES: Record<string, string> = {
  Dumbbell: '/custom-icons/plan_esencial.png',
  Zap: '/custom-icons/plan_avanzado.png',
  Award: '/custom-icons/plan_elite.png',
};

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
  imageUrl?: string;
  featured: boolean;
  sessionsPerWeek: number;
  features: string[];
}

// ── Plan Editor ───────────────────────────────────────────────────────────────

const PlanEditor = ({
  plan,
  onSave,
  onCancel,
}: {
  plan: Plan;
  onSave: (p: Plan) => void;
  onCancel: () => void;
}) => {
  const [draft, setDraft] = useState<Plan>({ ...plan });
  const [newFeature, setNewFeature] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof Plan, value: any) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setDraft((prev) => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
    setNewFeature('');
  };

  const removeFeature = (idx: number) =>
    setDraft((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));

  // Image upload → canvas resize → Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400;
        const ratio = Math.min(MAX / img.width, MAX / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        updateField('imageUrl', canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const previewSrc = draft.imageUrl || ICON_IMAGES[draft.icon] || ICON_IMAGES['Dumbbell'];

  return (
    <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-xl shadow-blue-500/10 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-gray-900 text-lg">Editando: {draft.name}</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X size={18} />
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Check size={16} /> Guardar
          </button>
        </div>
      </div>

      {/* ── Photo upload ── */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
          Imagen del plan
        </label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-700">
            <img src={previewSrc} alt="preview" className="w-full h-full object-contain mix-blend-screen" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
            >
              <Upload size={15} /> Subir imagen
            </button>
            {draft.imageUrl && (
              <button
                onClick={() => updateField('imageUrl', '')}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-colors"
              >
                <X size={14} /> Usar ícono por defecto
              </button>
            )}
            <p className="text-xs text-gray-400">PNG/JPG recomendado. Se redimensiona automáticamente.</p>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* ── Name + Price ── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nombre del plan</label>
          <input
            value={draft.name}
            onChange={(e) => updateField('name', e.target.value)}
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
              onChange={(e) => updateField('price', Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 pl-7 py-2.5 text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Sessions + Featured ── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Sesiones / semana</label>
          <input
            type="number" min={1} max={7}
            value={draft.sessionsPerWeek}
            onChange={(e) => updateField('sessionsPerWeek', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 cursor-pointer w-full p-3 bg-gray-50 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => updateField('featured', e.target.checked)}
              className="w-5 h-5 rounded text-blue-600"
            />
            <div>
              <p className="text-sm font-bold text-gray-800">Destacado</p>
              <p className="text-xs text-gray-400">Aparece como "Más Popular"</p>
            </div>
          </label>
        </div>
      </div>

      {/* ── Description ── */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Descripción</label>
        <textarea
          value={draft.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
      </div>

      {/* ── Features ── */}
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
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFeature()}
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

// ── Main component ─────────────────────────────────────────────────────────────

const TrainerPlansManager = ({ user }: { user: any }) => {
  const { showAlert, showConfirm } = useModal();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const editingRef = useRef<HTMLDivElement>(null);

  // Scroll to editor when a plan is opened for editing
  useEffect(() => {
    if (!editingId) return;
    const t = setTimeout(() => {
      editingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => clearTimeout(t);
  }, [editingId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'plans'), async (snapshot) => {
      if (snapshot.empty && !initialized) {
        // First time: seed Firestore with DEFAULT_PLANS so edits don't wipe others
        try {
          const batch = writeBatch(db);
          DEFAULT_PLANS.forEach((p) => batch.set(doc(db, 'plans', p.id), p));
          await batch.commit();
          setInitialized(true);
          // onSnapshot will fire again with the seeded data — no need to setPlans here
        } catch (e) {
          console.error('Failed to seed plans:', e);
          setPlans(DEFAULT_PLANS as Plan[]);
        }
      } else if (!snapshot.empty) {
        setPlans(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Plan)));
        setInitialized(true);
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

  const addPlan = async () => {
    const newId = `plan_${Date.now()}`;
    const newPlan: Plan = {
      id: newId,
      name: 'Nuevo Plan',
      price: 70000,
      description: 'Descripción del nuevo plan.',
      icon: 'Dumbbell',
      imageUrl: '',
      featured: false,
      sessionsPerWeek: 2,
      features: ['Programa personalizado'],
    };
    try {
      await setDoc(doc(db, 'plans', newId), newPlan);
      setEditingId(newId);
    } catch (e) {
      console.error(e);
      showAlert('Error al crear el plan.');
    }
  };

  const deletePlan = (plan: Plan) => {
    showConfirm(
      `¿Eliminar el plan "${plan.name}"?`,
      'Esta acción no se puede deshacer. Los clientes con este plan no perderán su acceso, pero el plan dejará de mostrarse.',
      async () => {
        try {
          await deleteDoc(doc(db, 'plans', plan.id));
        } catch (e) {
          showAlert('Error al eliminar el plan.');
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <img src="/custom-icons/gestion_de_planes.png" className="w-7 h-7 object-contain" alt="Gestión de planes" /> Gestión de Planes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Los cambios se reflejan en tiempo real para todos los clientes.
            </p>
          </div>
          <button
            onClick={addPlan}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
          >
            <Plus size={18} /> Agregar plan
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} ref={editingId === plan.id ? editingRef : null}>
            {editingId === plan.id ? (
              <PlanEditor plan={plan} onSave={savePlan} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5 hover:border-blue-200 transition-colors">
                <img
                  src={plan.imageUrl || ICON_IMAGES[plan.icon] || ICON_IMAGES['Dumbbell']}
                  alt={plan.name}
                  className="w-16 h-16 object-contain bg-slate-900 rounded-xl p-2 flex-shrink-0"
                  style={{ mixBlendMode: plan.imageUrl ? 'normal' : 'screen' }}
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingId(plan.id)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm"
                  >
                    <Pencil size={16} /> Editar
                  </button>
                  <button
                    onClick={() => deletePlan(plan)}
                    disabled={saving}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Eliminar plan"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {plans.length === 0 && (
          <div className="text-center py-16 text-gray-400 font-medium">
            No hay planes configurados. Haz click en "Agregar plan" para empezar.
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerPlansManager;
