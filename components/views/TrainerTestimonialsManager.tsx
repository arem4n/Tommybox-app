import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Pencil, Check, X, Plus, Trash2, Quote, Star } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

export interface Testimonial {
  id: string;
  text: string;
  author: string;
  rating: number;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { id: 'test_1', text: 'Desde que empecé con Tommybox, mis dolores de espalda han desaparecido. La atención personalizada y el enfoque en la técnica han marcado una diferencia real.', author: 'María G.', rating: 5 },
  { id: 'test_2', text: 'Logré mis objetivos de fuerza en menos tiempo de lo que esperaba. El programa es desafiante, pero siempre seguro. ¡Muy recomendado!', author: 'Juan P.', rating: 5 },
  { id: 'test_3', text: 'El enfoque en la movilidad y la prevención de lesiones es excelente. Me siento más ágil y con más energía para mi día a día.', author: 'Ana F.', rating: 5 },
  { id: 'test_4', text: 'La plataforma digital es muy fácil de usar y me ayuda a mantener la constancia. Mi entrenador siempre está disponible para responder mis dudas.', author: 'Carlos S.', rating: 4 },
  { id: 'test_5', text: 'He mejorado mi rendimiento en mi deporte y he evitado lesiones. El enfoque funcional de Tommybox es exactamente lo que necesitaba.', author: 'Sofía R.', rating: 5 },
];

const TrainerTestimonialsManager = () => {
  const { showAlert, showConfirm } = useModal();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [draft, setDraft] = useState<Testimonial | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'testimonials'), async (snapshot) => {
      if (snapshot.empty && !initialized) {
        try {
          const batch = writeBatch(db);
          DEFAULT_TESTIMONIALS.forEach((t) => batch.set(doc(db, 'testimonials', t.id), t));
          await batch.commit();
          setInitialized(true);
        } catch (e) {
          console.error('Failed to seed testimonials:', e);
          setItems(DEFAULT_TESTIMONIALS);
        }
      } else if (!snapshot.empty) {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Testimonial)));
        setInitialized(true);
      } else {
        setItems([]);
        setInitialized(true);
      }
    });
    return () => unsubscribe();
  }, [initialized]);

  const startEdit = (t: Testimonial) => {
    setDraft({ ...t });
    setEditingId(t.id);
  };

  const cancelEdit = () => {
    if (draft?.id.startsWith('new_')) {
      // Remove it from items array handled below mostly by cancel, but since it's not saved it just vanishes
    }
    setDraft(null);
    setEditingId(null);
  };

  const saveItem = async () => {
    if (!draft) return;
    if (!draft.text.trim() || !draft.author.trim()) {
      showAlert('El testimonio y el autor son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'testimonials', draft.id), draft, { merge: true });
      setEditingId(null);
      setDraft(null);
      showAlert(`Testimonio guardado exitosamente.`);
    } catch (e) {
      console.error(e);
      showAlert('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const newId = `test_${Date.now()}`;
    const newTest: Testimonial = {
      id: newId,
      text: '',
      author: '',
      rating: 5,
    };
    setDraft(newTest);
    setEditingId(newId);
  };

  const deleteItem = (t: Testimonial) => {
    showConfirm(
      `¿Eliminar testimonio de ${t.author}?`,
      'Dejará de estar visible en la página principal inmediatamente.',
      async () => {
        try {
          await deleteDoc(doc(db, 'testimonials', t.id));
        } catch (e) {
          showAlert('Error al eliminar el testimonio.');
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
              <Quote size={22} className="text-blue-600" /> Testimonios (Landing Page)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Estos comentarios aparecen rotando en la franja pública de la página.
            </p>
          </div>
          <button
            onClick={addItem}
            disabled={saving || editingId !== null}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
          >
            <Plus size={18} /> Agregar Testimonio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Render New Draft first if exists */}
        {editingId && draft && draft.id.startsWith('test_') && !items.find(i => i.id === draft.id) && (
           <EditorCard draft={draft} setDraft={setDraft} saveItem={saveItem} cancelEdit={cancelEdit} saving={saving} />
        )}

        {items.map((t) => (
          <div key={t.id}>
            {editingId === t.id && draft ? (
              <EditorCard draft={draft} setDraft={setDraft} saveItem={saveItem} cancelEdit={cancelEdit} saving={saving} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative group hover:border-blue-200 transition-all h-[250px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="text-yellow-400 fill-yellow-400" size={16} />
                      ))}
                      {[...Array(5 - t.rating)].map((_, i) => (
                        <Star key={i + t.rating} className="text-gray-300" size={16} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(t)} className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => deleteItem(t)} className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
                    "{t.text}"
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {t.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.author}</p>
                    <p className="text-xs text-gray-500">Atleta TommyBox</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const EditorCard = ({ draft, setDraft, saveItem, cancelEdit, saving }: any) => {
  return (
    <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-xl shadow-blue-500/10 flex flex-col h-auto min-h-[250px]">
      <div className="flex justify-between items-center mb-3">
         <div className="flex gap-1 items-center">
            <span className="text-xs font-bold text-gray-500 mr-2">Stars:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setDraft({...draft, rating: star})} className="focus:outline-none">
                <Star className={star <= draft.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} size={18} />
              </button>
            ))}
         </div>
         <div className="flex gap-2">
            <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
              <X size={16} />
            </button>
            <button
              onClick={saveItem}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
            >
              <Check size={14} /> Guardar
            </button>
         </div>
      </div>
      
      <textarea
        value={draft.text}
        onChange={(e) => setDraft({...draft, text: e.target.value})}
        placeholder="Texto del testimonio..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none flex-1 min-h-[100px] mb-3"
      />
      
      <input
        type="text"
        value={draft.author}
        onChange={(e) => setDraft({...draft, author: e.target.value})}
        placeholder="Nombre del autor (Ej: Ana Gómez)"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
};

export default TrainerTestimonialsManager;
