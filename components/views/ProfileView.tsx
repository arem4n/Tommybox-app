import React, { useState, useRef, useEffect } from 'react';
import { View, UserProfile } from '../../types';
import { Camera, User, X, Save } from 'lucide-react';

interface ProfileViewProps {
  user: UserProfile & { id: string };
  onUpdateProfile: (data: Partial<Pick<UserProfile, 'displayName' | 'birthDate' | 'photoURL'>>) => void;
  setCurrentView: (view: View) => void;
}

const CameraCaptureModal: React.FC<{ onClose: () => void; onCapture: (dataUrl: string) => void; }> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let mediaStream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("No se pudo acceder a la cámara. Asegúrate de haber otorgado los permisos necesarios.");
                onClose();
            }
        };

        startCamera();

        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onClose]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onCapture(dataUrl);
                onClose();
            }
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                <h3 className="text-xl font-bold mb-4">Capturar Foto</h3>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-md bg-gray-200"></video>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                <button onClick={handleCapture} className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700">
                    <Camera size={20} />
                    Tomar Foto
                </button>
            </div>
        </div>
    );
};


const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateProfile, setCurrentView }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [birthDate, setBirthDate] = useState(user.birthDate || '');
    const [photoURL, setPhotoURL] = useState(user.photoURL || '');
    const [showCamera, setShowCamera] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile({
            displayName,
            birthDate,
            photoURL
        });
    };

    return (
        <section className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto rounded-2xl bg-white p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-blue-800 md:text-4xl text-center mb-8">Editar Perfil</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            {photoURL ? (
                                <img src={photoURL} alt="Foto de perfil" className="w-32 h-32 rounded-full object-cover shadow-lg" />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-5xl font-bold shadow-lg">
                                    {displayName.charAt(0).toUpperCase() || <User size={60} />}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowCamera(true)}
                                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md text-blue-600 hover:bg-gray-100"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Visualización</label>
                        <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm"
                            required
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                        <input
                            type="date"
                            id="birthDate"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm"
                            required
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setCurrentView('dashboard')}
                            className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                           <Save size={20} />
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
            {showCamera && (
                <CameraCaptureModal
                    onClose={() => setShowCamera(false)}
                    onCapture={(dataUrl) => setPhotoURL(dataUrl)}
                />
            )}
        </section>
    );
};

export default ProfileView;