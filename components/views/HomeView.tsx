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

  // Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Responsive logic
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setItemsPerPage(3);
      else if (window.innerWidth >= 768) setItemsPerPage(2);
      else setItemsPerPage(1);
    };

    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-play logic
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, itemsPerPage]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      // Loop back to start if we reach the end
      if (prevIndex + itemsPerPage >= testimonials.length) return 0;
      return prevIndex + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex === 0) return testimonials.length - itemsPerPage;
      return prevIndex - 1;
    });
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img
            src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png"
            alt="TommyBox"
            className="h-10 object-contain"
          />
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-5 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-sm text-sm"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-white to-blue-50 py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4">

          {/* HERO SECTION */}
          <div className="max-w-4xl mx-auto text-center">
            <img
              src="https://i.postimg.cc/rpM8kSt5/20251103_141407_0000.png"
              alt="TommyBox Logo"
              className="h-24 md:h-32 mx-auto mb-8 animate-fade-in"
            />
            <h1 className="text-4xl font-extrabold text-blue-900 md:text-6xl leading-tight">
              Entrena con un programa funcional, personalizado y respaldado por ciencia para mejorar tu salud, fuerza y movilidad.
            </h1>
            <p className="mt-6 text-lg lg:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-gray-600 md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl leading-relaxed">
              Buscas un entrenamiento que entienda tu cuerpo, tus limitaciones y tu estilo de vida. Un método que se adapte a ti, con progresión dinámica y enfoque personalizado, para que cada sesión te acerque a tus objetivos con seguridad y efectividad, sin planes rígidos ni fórmulas genéricas.
            </p>
            <button onClick={() => setShowLoginModal(true)} className="mt-8 transform rounded-full bg-blue-600 px-8 py-3 text-lg lg:text-xl lg:text-2xl lg:text-3xl lg:text-4xl font-bold text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-blue-700">
              Descubre tu plan ideal
            </button>
          </div>

          {/* METHODOLOGY SECTION */}
          <div className="mt-20">
            <h2 className="text-center text-3xl lg:text-4xl font-bold text-blue-800 md:text-4xl">Nuestra Metodología</h2>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">

              {/* Card 1: Process */}
              <div className="rounded-2xl bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 duration-300">
                  <h3 className="flex items-center space-x-3 text-2xl lg:text-3xl lg:text-4xl font-semibold text-blue-700">
                      <div className="p-2 bg-blue-100 rounded-lg"><Dumbbell size={28} className="text-blue-600" /></div>
                      <span>Entrenamiento Inteligente</span>
                  </h3>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                      Una planificación estructurada que prioriza la técnica y la progresión segura. Adaptamos cada ejercicio a tu nivel y necesidades específicas.
                  </p>
              </div>

              {/* Card 2: Tracking */}
              <div className="rounded-2xl bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 duration-300">
                  <h3 className="flex items-center space-x-3 text-2xl lg:text-3xl lg:text-4xl font-semibold text-blue-700">
                      <div className="p-2 bg-blue-100 rounded-lg"><BarChart size={28} className="text-blue-600" /></div>
                      <span>Resultados Medibles</span>
                  </h3>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                      Monitoreamos tu progreso constantemente. Desde mejoras en fuerza hasta movilidad, verás datos reales de tu evolución.
                  </p>
              </div>

              {/* Added Card 3: Experience */}
               <div className="rounded-2xl bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 duration-300">
                  <h3 className="flex items-center space-x-3 text-2xl lg:text-3xl lg:text-4xl font-semibold text-blue-700">
                      <div className="p-2 bg-blue-100 rounded-lg"><Star size={28} className="text-blue-600" /></div>
                      <span>Atención Personalizada</span>
                  </h3>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                      No eres un número más. Nos preocupamos por tu historial médico, lesiones previas y objetivos personales para crear el mejor plan para ti.
                  </p>
              </div>

               {/* Added Card 4: Community */}
               <div className="rounded-2xl bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 duration-300">
                  <h3 className="flex items-center space-x-3 text-2xl lg:text-3xl lg:text-4xl font-semibold text-blue-700">
                      <div className="p-2 bg-blue-100 rounded-lg"><Quote size={28} className="text-blue-600" /></div>
                      <span>Comunidad Activa</span>
                  </h3>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                      Forma parte de un grupo de personas comprometidas con su bienestar. Comparte logros, motiva a otros y mantén el enfoque.
                  </p>
              </div>
            </div>
          </div>
        </div>

        {/* TESTIMONIALS CAROUSEL */}
        <div className="mt-32 pb-20 bg-blue-900 w-full pt-20 skew-y-3 -mb-10">
          <div className="-skew-y-3 container mx-auto px-4 relative">
             <div className="text-center mb-12 relative z-10">
                 <h2 className="text-3xl lg:text-4xl font-bold text-white md:text-4xl">Lo que dicen nuestros atletas</h2>
                 <div className="mt-4 w-24 h-1 bg-blue-400 mx-auto rounded-full"></div>
             </div>

             <div className="relative max-w-6xl mx-auto"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
             >
                <div className="overflow-hidden px-4">
                  <div
                    className="flex transition-transform duration-500 ease-in-out gap-6 lg:p-8"
                    style={{ transform: `translateX(-${(currentIndex * (100 / itemsPerPage))}%)` }}
                  >
                    {testimonials.map((testimonial, idx) => (
                      <div
                        key={idx}
                        className="w-full shrink-0 h-full"
                        style={{ width: `calc(${100 / itemsPerPage}% - ${((itemsPerPage - 1) * 24) / itemsPerPage}px)` }}
                      >
                         <div className="bg-white rounded-3xl p-8 shadow-2xl h-full flex flex-col justify-between transform transition-transform hover:scale-[1.02] duration-300 relative">
                             <Quote className="absolute top-6 lg:p-8 left-6 text-blue-100 w-12 h-12 z-0" />
                             <p className="text-gray-700 italic text-lg lg:text-xl lg:text-2xl lg:text-3xl lg:text-4xl leading-relaxed relative z-10 font-medium mb-6 lg:mb-8">"{testimonial.text}"</p>

                             <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-auto">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg lg:text-xl lg:text-2xl lg:text-3xl lg:text-4xl">
                                         {testimonial.author.charAt(0)}
                                     </div>
                                     <p className="font-bold text-blue-900">{testimonial.author}</p>
                                 </div>
                                 <div className="flex">
                                     {[...Array(testimonial.rating)].map((_, i) => (
                                         <Star key={i} className="text-yellow-400 fill-yellow-400" size={18} />
                                     ))}
                                 </div>
                             </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <button 
                  onClick={prevSlide}
                  className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-xl text-blue-600 hover:bg-blue-50 transition-colors z-20 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextSlide}
                  className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-xl text-blue-600 hover:bg-blue-50 transition-colors z-20 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mt-12">
                   {Array.from({ length: testimonials.length - itemsPerPage + 1 }).map((_, idx) => (
                       <button
                           key={idx}
                           onClick={() => setCurrentIndex(idx)}
                           className={`h-2 rounded-full transition-all duration-300 ${
                               currentIndex === idx ? 'w-8 bg-blue-400' : 'w-2 bg-blue-800 hover:bg-blue-600'
                           }`}
                       />
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:p-6 lg:p-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 lg:p-6 lg:p-8 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl lg:text-3xl lg:text-4xl font-black text-gray-900 mb-6 lg:mb-8 text-center">
              {isRegistering ? 'Crear cuenta' : 'Bienvenido de vuelta'}
            </h2>

            {authError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4 lg:mb-6 lg:mb-8 text-center border border-red-100">{authError}</p>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              await onEmailAuth(email, password, isRegistering);
            }} className="space-y-4 mb-4 lg:mb-6 lg:mb-8">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com" required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="- - - - - - - - " required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              <button type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                {isRegistering ? 'Registrarse' : 'Iniciar sesión'}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O continúa con</span></div>
            </div>

            <button onClick={handleLogin}
              className="w-full py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 flex items-center justify-center gap-3 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              <button onClick={() => setIsRegistering(!isRegistering)}
                className="ml-1 text-blue-600 font-semibold hover:underline">
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
