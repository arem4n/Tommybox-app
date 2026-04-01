import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import {
  collection, query, onSnapshot, addDoc, deleteDoc,
  doc, Timestamp, orderBy
} from 'firebase/firestore';
import { BookOpen, FileText, Image, Plus, Trash2, ExternalLink, Loader2, Link2 } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'infographic' | 'book';
  fileUrl: string;
  thumbnailUrl?: string;
  createdAt: any;
}

const TYPE_OPTIONS = [
  { value: 'pdf', label: 'PDF', icon: FileText, color: 'text-red-400', bg: 'bg-red-400/10' },
  { value: 'book', label: 'Libro', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { value: 'infographic', label: 'Infografía', icon: Image, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

const EMPTY_FORM = { title: '', description: '', type: 'pdf' as const, fileUrl: '', thumbnailUrl: '' };

const TrainerLibraryManager = ({ user }: { user: any }) => {
  const { showAlert, showConfirm } = useModal();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const q = query(collection(db, 'library'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as LibraryItem)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.fileUrl.trim()) {
      showAlert('El título y la URL son obligatorios.');
      return;
    }
    // Basic URL validation
    try { new URL(form.fileUrl); } catch {
      showAlert('La URL no es válida. Debe comenzar con https://');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'library'), {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        fileUrl: form.fileUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        createdAt: Timestamp.now(),
        publishedBy: user?.id,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      showAlert('Error al publicar. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: LibraryItem) => {
    showConfirm(
      `¿Eliminar "${item.title}"?`,
      'Esta acción no se puede deshacer.',
      async () => {
        try {
          await deleteDoc(doc(db, 'library', item.id));
        } catch (e) { console.error(e); }
      }
    );
  };

  const getTypeCfg = (type: string) =>
    TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Biblioteca Didáctica</h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona los recursos educativos de tus atletas</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            showForm
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30'
          }`}
        >
          <Plus size={16} className={showForm ? 'rotate-45 transition-transform' : 'transition-transform'} />
          {showForm ? 'Cancelar' : 'Nuevo material'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm"
        >
          <h3 className="font-black text-gray-900 text-lg mb-5">Publicar nuevo material</h3>

          <div className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de material</label>
              <div className="flex gap-3">
                {TYPE_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const selected = form.type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: opt.value as any }))}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-sm font-bold ${
                        selected
                          ? `border-blue-600 ${opt.bg} ${opt.color}`
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={20} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Guía de nutrición para deportistas"
                maxLength={80}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Breve descripción del contenido..."
                rows={2}
                maxLength={200}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
              />
            </div>

            {/* File URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                URL del archivo * <span className="text-gray-400 font-normal">(Google Drive, Dropbox, etc.)</span>
              </label>
              <div className="relative">
                <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={form.fileUrl}
                  onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                💡 En Google Drive: clic derecho → "Obtener enlace" → "Cualquiera con el enlace"
              </p>
            </div>

            {/* Thumbnail URL (optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                URL de imagen de portada <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Publicando...</> : 'Publicar material'}
          </button>
        </form>
      )}

      {/* Stats bar */}
      {!loading && (
        <div className="flex gap-4 mb-6">
          {['pdf', 'book', 'infographic'].map(t => {
            const cfg = getTypeCfg(t);
            const Icon = cfg.icon;
            const count = items.filter(i => i.type === t).length;
            return (
              <div key={t} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${cfg.bg} border border-transparent`}>
                <Icon size={14} className={cfg.color} />
                <span className={`text-sm font-bold ${cfg.color}`}>{count}</span>
                <span className="text-xs text-gray-500">{cfg.label}{count !== 1 ? 's' : ''}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !showForm && (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold text-gray-500">No hay materiales aún</p>
          <p className="text-sm">Haz clic en "Nuevo material" para publicar el primero.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map(item => {
            const cfg = getTypeCfg(item.type);
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon size={20} className={cfg.color} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                    {item.createdAt?.toDate && (
                      <span className="text-xs text-gray-400">
                        {item.createdAt.toDate().toLocaleDateString('es-CL')}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Abrir enlace"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrainerLibraryManager;
