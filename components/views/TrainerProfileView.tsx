import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Camera, Save, CheckCircle } from 'lucide-react';
import { AppUser } from '../../types';

interface Props {
  user: AppUser;
}

const TrainerProfileView: React.FC<Props> = ({ user }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState('');
  const [photoLoading, setPhotoLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load photo from subcollection ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    getDoc(doc(db!, `users/${user.id}/photo/main`))
      .then((snap) => {
        if (!cancelled && snap.exists()) setPhotoURL(snap.data().photoURL || '');
        if (!cancelled) setPhotoLoading(false);
      })
      .catch(() => setPhotoLoading(false));
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── Image upload → canvas resize ───────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 150;
        canvas.width = MAX;
        canvas.height = img.height * (MAX / img.width);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotoURL(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!displayName.trim() || !user?.id) return;
    setSaving(true);
    try {
      // Main doc — lightweight, no photo here
      await updateDoc(doc(db!, 'users', user.id), {
        displayName: displayName.trim(),
      });

      // Photo — subcollection
      if (photoURL.trim()) {
        await setDoc(doc(db!, `users/${user.id}/photo/main`), {
          photoURL: photoURL.trim(),
          updatedAt: Timestamp.now(),
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Error saving trainer profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || user?.email || '?')[0].toUpperCase();

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Tu perfil de entrenador</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          Esta información la ven tus atletas en la plataforma.
        </p>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-28 h-28 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center mb-3 border-4 border-white shadow-lg relative group focus:outline-none"
          >
            {photoLoading ? (
              <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            ) : photoURL ? (
              <img src={photoURL} alt="foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-blue-600">{initials}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera className="text-white" size={24} />
            </div>
          </button>
          <input
            type="file"
            accept="image/*"
            capture="user"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors"
          >
            {photoURL ? 'Cambiar foto' : 'Subir foto'}
          </button>
        </div>

        {/* Name */}
        <div className="mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
            Nombre que verán tus atletas
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            placeholder="Ej: Tommy Fitness"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{displayName.length}/40</p>
        </div>

        {/* Read-only info */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2 border border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-800">{user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Rol</span>
            <span className="font-bold text-blue-600">Entrenador</span>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !displayName.trim()}
          className={`w-full py-3.5 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          {saved ? (
            <><CheckCircle size={18} /> ¡Perfil guardado!</>
          ) : saving ? (
            'Guardando...'
          ) : (
            <><Save size={18} /> Guardar perfil</>
          )}
        </button>
      </div>
    </div>
  );
};

export default TrainerProfileView;
