import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { BookOpen, FileText, Image, Download, ExternalLink, Inbox } from 'lucide-react';

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'infographic' | 'book';
  fileUrl: string;
  thumbnailUrl?: string;
  createdAt: any;
}

const TYPE_CONFIG = {
  pdf: {
    label: 'PDF',
    icon: FileText,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
  },
  book: {
    label: 'Libro',
    icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  infographic: {
    label: 'Infografía',
    icon: Image,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
};

const LibrarySection = ({ user }: { user: any }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pdf' | 'book' | 'infographic'>('all');

  useEffect(() => {
    const q = query(collection(db, 'library'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LibraryItem)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  const handleOpen = (item: LibraryItem) => {
    window.open(item.fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white mb-1">Biblioteca</h2>
        <p className="text-slate-400">Material didáctico seleccionado por tu entrenador</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {(['all', 'book', 'pdf', 'infographic'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              filter === f
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {f === 'all' ? 'Todo' : f === 'book' ? 'Libros' : f === 'pdf' ? 'PDFs' : 'Infografías'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-slate-800 mb-4" />
              <div className="h-5 bg-slate-800 rounded mb-2 w-3/4" />
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded mt-1 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-6">
            <Inbox size={36} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {filter === 'all' ? 'Aún no hay material publicado' : `No hay ${filter === 'book' ? 'libros' : filter === 'pdf' ? 'PDFs' : 'infografías'} aún`}
          </h3>
          <p className="text-slate-500 max-w-sm">
            Tu entrenador irá publicando recursos aquí. ¡Vuelve pronto!
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.pdf;
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail or placeholder */}
                {item.thumbnailUrl ? (
                  <div className="h-44 overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className={`h-44 flex items-center justify-center ${cfg.bg}`}>
                    <Icon size={56} className={`${cfg.color} opacity-60`} />
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      <Icon size={11} />
                      {cfg.label}
                    </span>
                    {item.createdAt?.toDate && (
                      <span className="text-xs text-slate-500">
                        {item.createdAt.toDate().toLocaleDateString('es-CL')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                      {item.description}
                    </p>
                  )}

                  {/* Action button */}
                  <button
                    onClick={() => handleOpen(item)}
                    className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white font-bold text-sm transition-all"
                  >
                    {item.type === 'infographic' ? (
                      <><ExternalLink size={15} /> Ver infografía</>
                    ) : (
                      <><Download size={15} /> Descargar</>
                    )}
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

export default LibrarySection;
