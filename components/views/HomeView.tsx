import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, BarChart, Star, ChevronLeft, ChevronRight, Quote, X } from 'lucide-react';
import { View } from '../../types';
import { db } from '../../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface HomeViewProps {
  setCurrentView: (view: View) => void;
  handleLogin: () => Promise<void>;
  onEmailAuth: (email: string, password: string, isRegistering: boolean) => Promise<void>;
  authError: string;
}

const HomeView: React.FC<HomeViewProps> = ({ setCurrentView, handleLogin, onEmailAuth, authError }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [testimonials, setTestimonials] = useState<any[]>([
    { text: 'Desde que empecé con Tommybox, mis dolores de espalda han desaparecido. La atención personalizada y el enfoque en la técnica han marcado una diferencia real.', author: 'María G.', rating: 5 },
    { text: 'Un servicio de primera. Totalmente recomendado para quien busque resultados serios y sostenibles.', author: 'Luisa M.', rating: 5 },
    { text: 'La comunidad es increíble, me motiva a seguir entrenando incluso en los días difíciles.', author: 'Pedro D.', rating: 5 }
  ]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'testimonials'), (snap) => {
      if (!snap.empty) {
        setTestimonials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });
    return () => unsub();
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered || testimonials.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [testimonials.length, isHovered]);

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img src="/logo-header.png" alt="TommyBox" className="h-7 object-contain" />
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-slate-950 min-h-screen flex flex-col overflow-hidden">

        {/* Hero Content */}
        <div className="flex-1 container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <img
              src="/logo-hero.png"
              alt="TommyBox Logo"
              className="h-40 md:h-56 mx-auto mb-10 animate-fade-in drop-shadow-2xl"
            />
            <h1 className="text-4xl font-extrabold text-white md:text-5xl leading-tight">
              Entrena con un programa{' '}
              <span className="text-blue-400">funcional, personalizado</span>{' '}
              y respaldado por ciencia para mejorar tu salud, fuerza y movilidad.
            </h1>
            <p className="mt-6 text-lg text-slate-400 md:text-xl leading-relaxed max-w-2xl mx-auto">
              Buscas un entrenamiento que entienda tu cuerpo, tus limitaciones y tu estilo de vida.
              Un método que se adapte a ti, con progresión dinámica y enfoque personalizado, para
              que cada sesión te acerque a tus objetivos con seguridad y efectividad.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="mt-10 inline-block rounded-full bg-blue-600 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-blue-600/30 transition-all duration-300 hover:scale-105 hover:bg-blue-500 hover:shadow-blue-500/40"
            >
              Descubre tu plan ideal
            </button>
          </div>

          {/* ── Methodology cards ── */}
          <div className="mt-28">
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
              Nuestra <span className="text-blue-400">Metodología</span>
            </h2>
            <p className="text-center text-slate-500 mt-3 max-w-xl mx-auto">
              Un sistema de entrenamiento basado en evidencia, diseñado para resultados reales y duraderos.
            </p>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              {[
                {
                  icon: <Dumbbell size={26} className="text-blue-400" />,
                  title: 'Entrenamiento Inteligente',
                  text: 'Una planificación estructurada que prioriza la técnica y la progresión segura. Adaptamos cada ejercicio a tu nivel y necesidades específicas.',
                },
                {
                  icon: <BarChart size={26} className="text-blue-400" />,
                  title: 'Resultados Medibles',
                  text: 'Monitoreamos tu progreso constantemente. Desde mejoras en fuerza hasta movilidad, verás datos reales de tu evolución.',
                },
                {
                  icon: <Star size={26} className="text-blue-400" />,
                  title: 'Atención Personalizada',
                  text: 'No eres un número más. Nos preocupamos por tu historial médico, lesiones previas y objetivos personales para crear el mejor plan para ti.',
                },
                {
                  icon: <Quote size={26} className="text-blue-400" />,
                  title: 'Comunidad Activa',
                  text: 'Forma parte de un grupo de personas comprometidas con su bienestar. Comparte logros, motiva a otros y mantén el enfoque.',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-xl transition-all hover:-translate-y-1 hover:border-blue-800/50 hover:shadow-blue-900/20 duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-900/40 rounded-xl">{card.icon}</div>
                    <h3 className="text-xl font-bold text-white">{card.title}</h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ── Banner Section ── */}
        <div className="w-full h-64 md:h-96 bg-slate-900 relative mt-20 md:mt-32">
           <img
              src="/surpass_limits.jpg"
              alt="Gym Equipment"
              className="w-full h-full object-cover opacity-60 mix-blend-overlay"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase opacity-90 drop-shadow-2xl">Supera tus límites</h2>
           </div>
        </div>

        {/* ── Testimonials ── */}
        <div className="bg-slate-900 border-t border-slate-800 py-20 w-full overflow-hidden">
          <div className="container mx-auto px-4 mb-12 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Lo que dicen nuestros <span className="text-blue-400">atletas</span>
            </h2>
            <div className="mt-4 w-24 h-1 bg-blue-600 mx-auto md:mx-0 rounded-full" />
          </div>

          <div className="relative w-full max-w-[1400px] mx-auto overflow-hidden md:overflow-visible">
            {/* Mobile Swipe Container (Normal) */}
            <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-10 pl-4 pr-4 gap-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {testimonials.map((t, idx) => (
                <div key={idx} className="snap-center shrink-0 w-[85vw] sm:w-[350px]">
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl h-full flex flex-col justify-between hover:border-blue-800/50 transition-all duration-300 relative group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Quote className="w-20 h-20 text-blue-500" />
                    </div>
                    <div className="flex mb-6">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={18} />
                      ))}
                    </div>
                    <p className="text-slate-300 text-lg leading-relaxed relative z-10 font-medium mb-8">"{t.text}"</p>
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {t.author.charAt(0)}
                      </div>
                      <div>
                          <p className="font-bold text-white">{t.author}</p>
                          <p className="text-xs text-slate-500">Atleta TommyBox</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="shrink-0 w-4" aria-hidden="true"></div>
            </div>

            {/* Desktop 3D Focused Carousel */}
            <div 
              className="hidden md:flex relative h-[450px] w-full max-w-[1200px] mx-auto justify-center items-center"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <button
                onClick={() => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="absolute left-0 lg:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-800/80 hover:bg-blue-600 text-white rounded-full flex items-center justify-center z-50 transition-all shadow-lg border border-slate-700/50 backdrop-blur-sm"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button
                onClick={() => setActiveIndex((prev) => (prev + 1) % testimonials.length)}
                className="absolute right-0 lg:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-800/80 hover:bg-blue-600 text-white rounded-full flex items-center justify-center z-50 transition-all shadow-lg border border-slate-700/50 backdrop-blur-sm"
              >
                <ChevronRight size={24} />
              </button>
              {testimonials.map((t, idx) => {
                let state = 'hidden';
                let className = 'opacity-0 scale-50 translate-x-0 z-0 pointer-events-none blur-sm';

                if (idx === activeIndex) {
                  state = 'center';
                  className = 'opacity-100 scale-100 translate-x-0 z-30 blur-none';
                } else if (idx === (activeIndex - 1 + testimonials.length) % testimonials.length) {
                  state = 'left';
                  className = 'opacity-50 scale-[0.85] -translate-x-[105%] blur-[2px] hover:opacity-70 hover:blur-[1px] cursor-pointer z-20';
                } else if (idx === (activeIndex + 1) % testimonials.length) {
                  state = 'right';
                  className = 'opacity-50 scale-[0.85] translate-x-[105%] blur-[2px] hover:opacity-70 hover:blur-[1px] cursor-pointer z-20';
                } else {
                  const distance = (idx - activeIndex + testimonials.length) % testimonials.length;
                  if (distance === 2) {
                     className = 'opacity-0 scale-50 translate-x-[200%] z-10 pointer-events-none blur-sm';
                  } else {
                     className = 'opacity-0 scale-50 -translate-x-[200%] z-10 pointer-events-none blur-sm';
                  }
                }

                return (
                  <div
                    key={idx}
                    onClick={() => {
                       if (state === 'left') setActiveIndex((activeIndex - 1 + testimonials.length) % testimonials.length);
                       if (state === 'right') setActiveIndex((activeIndex + 1) % testimonials.length);
                    }}
                    className={`absolute top-4 w-[400px] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${className}`}
                  >
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-[0_0_40px_-10px_rgba(37,99,235,0.15)] h-[380px] flex flex-col justify-between">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                         <Quote className="w-20 h-20 text-blue-500" />
                      </div>
                      <div className="flex mb-6">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={18} />
                        ))}
                      </div>
                      <p className="text-slate-300 text-lg leading-relaxed relative z-10 font-medium mb-8">"{t.text}"</p>
                      <div className="flex items-center gap-4 mt-auto">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {t.author.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-white">{t.author}</p>
                            <p className="text-xs text-slate-500">Atleta TommyBox</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="bg-slate-950 border-t border-slate-800 py-8 text-center">
          <p className="text-slate-600 text-sm">© {new Date().getFullYear()} Tommybox Fitness. Todos los derechos reservados.</p>
        </footer>
      </section>

      {/* ── Login Modal ── */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-black text-white mb-2 text-center">
              {isRegistering ? 'Crear cuenta' : 'Bienvenido de vuelta'}
            </h2>
            <p className="text-slate-500 text-sm text-center mb-6">
              {isRegistering ? 'Regístrate para comenzar.' : 'Ingresa a tu espacio Tommybox.'}
            </p>

            {authError && (
              <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 p-3 rounded-xl mb-4 text-center">
                {authError}
              </p>
            )}

            <form
              onSubmit={async (e) => { e.preventDefault(); await onEmailAuth(email, password, isRegistering); }}
              className="space-y-3 mb-4"
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
              >
                {isRegistering ? 'Registrarse' : 'Iniciar sesión'}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-slate-900 text-slate-500">O continúa con</span>
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-3 border border-slate-700 text-slate-200 font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            <p className="text-center text-sm text-slate-500 mt-4">
              {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="ml-1 text-blue-400 font-semibold hover:text-blue-300 hover:underline"
              >
                {isRegistering ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeView;
