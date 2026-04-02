import React, { useState, useEffect } from 'react';
import { Dumbbell, BarChart, Star, ChevronLeft, ChevronRight, Quote, X } from 'lucide-react';
import { View } from '../../types';

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

  const testimonials = [
    { text: 'Desde que empecé con Tommybox, mis dolores de espalda han desaparecido. La atención personalizada y el enfoque en la técnica han marcado una diferencia real.', author: 'María G.', rating: 5 },
    { text: 'Logré mis objetivos de fuerza en menos tiempo de lo que esperaba. El programa es desafiante, pero siempre seguro. ¡Muy recomendado!', author: 'Juan P.', rating: 5 },
    { text: 'El enfoque en la movilidad y la prevención de lesiones es excelente. Me siento más ágil y con más energía para mi día a día.', author: 'Ana F.', rating: 5 },
    { text: 'La plataforma digital es muy fácil de usar y me ayuda a mantener la constancia. Mi entrenador siempre está disponible para responder mis dudas.', author: 'Carlos S.', rating: 4 },
    { text: 'He mejorado mi rendimiento en mi deporte y he evitado lesiones. El enfoque funcional de Tommybox es exactamente lo que necesitaba.', author: 'Sofía R.', rating: 5 },
    { text: 'Un servicio de primera. Totalmente recomendado para quien busque resultados serios y sostenibles.', author: 'Luisa M.', rating: 5 },
    { text: 'La comunidad es increíble, me motiva a seguir entrenando incluso en los días difíciles.', author: 'Pedro D.', rating: 5 },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setItemsPerPage(3);
      else if (window.innerWidth >= 768) setItemsPerPage(2);
      else setItemsPerPage(1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => nextSlide(), 5000);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, itemsPerPage]);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + itemsPerPage >= testimonials.length ? 0 : prev + 1));
  };
  const prevSlide = () => {
    setCurrentIndex(prev => (prev === 0 ? testimonials.length - itemsPerPage : prev - 1));
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img src="/logo-header.png" alt="TommyBox" className="h-10 object-contain" />
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-5 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm"
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

        {/* ── Testimonials ── */}
        <div className="bg-slate-900 border-t border-slate-800 py-20 w-full">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Lo que dicen nuestros <span className="text-blue-400">atletas</span>
              </h2>
              <div className="mt-4 w-24 h-1 bg-blue-600 mx-auto rounded-full" />
            </div>

            <div
              className="relative max-w-6xl mx-auto"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="overflow-hidden px-4">
                <div
                  className="flex transition-transform duration-500 ease-in-out gap-6"
                  style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
                >
                  {testimonials.map((t, idx) => (
                    <div
                      key={idx}
                      className="w-full shrink-0"
                      style={{ width: `calc(${100 / itemsPerPage}% - ${((itemsPerPage - 1) * 24) / itemsPerPage}px)` }}
                    >
                      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-xl h-full flex flex-col justify-between hover:border-blue-800/50 transition-all duration-300 relative">
                        <Quote className="absolute top-6 left-6 text-slate-800 w-10 h-10 z-0" />
                        <p className="text-slate-300 italic text-lg leading-relaxed relative z-10 font-medium mb-6">
                          "{t.text}"
                        </p>
                        <div className="flex items-center justify-between border-t border-slate-800 pt-5 mt-auto">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                              {t.author.charAt(0)}
                            </div>
                            <p className="font-bold text-white">{t.author}</p>
                          </div>
                          <div className="flex">
                            {[...Array(t.rating)].map((_, i) => (
                              <Star key={i} className="text-yellow-400 fill-yellow-400" size={16} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nav buttons */}
              <button
                onClick={prevSlide}
                className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 p-3 rounded-full shadow-xl text-blue-400 hover:bg-slate-700 transition-colors z-20"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 p-3 rounded-full shadow-xl text-blue-400 hover:bg-slate-700 transition-colors z-20"
              >
                <ChevronRight size={22} />
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: testimonials.length - itemsPerPage + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${currentIndex === idx ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-500'}`}
                  />
                ))}
              </div>
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
