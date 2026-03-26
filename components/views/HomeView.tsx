
import React, { useState, useEffect } from 'react';
import { Dumbbell, BarChart, Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { View } from '../../types';

interface HomeViewProps {
  setCurrentView: (view: View) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ setCurrentView }) => {
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
          <p className="mt-6 text-lg text-gray-600 md:text-xl leading-relaxed">
            Buscas un entrenamiento que entienda tu cuerpo, tus limitaciones y tu estilo de vida. Un método que se adapte a ti, con progresión dinámica y enfoque personalizado, para que cada sesión te acerque a tus objetivos con seguridad y efectividad, sin planes rígidos ni fórmulas genéricas.
          </p>
          <button onClick={() => setCurrentView('plans')} className="mt-8 transform rounded-full bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-blue-700">
            Descubre tu plan ideal
          </button>
        </div>

        {/* METHODOLOGY SECTION */}
        <div className="mt-20">
          <h2 className="text-center text-3xl font-bold text-blue-800 md:text-4xl">Nuestra Metodología</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            
            {/* Card 1: Process */}
            <div className="rounded-2xl bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 duration-300">
                <h3 className="flex items-center space-x-3 text-2xl font-semibold text-blue-700">
                    <div className="p-2 bg-blue-100 rounded-lg"><Dumbbell size={28} className="text-blue-600" /></div>
                    <span>Entrenamiento Inteligente</span>
                </h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                    Una planificación estructurada que prioriza la técnica y la progresión segura. Adaptamos cada ejercicio a tu nivel y necesidades específicas.
                </p>
            </div>

            {/* Card 2: Tracking */}
            <div className="rounded-2xl bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 duration-300">
                <h3 className="flex items-center space-x-3 text-2xl font-semibold text-blue-700">
                    <div className="p-2 bg-blue-100 rounded-lg"><BarChart size={28} className="text-blue-600" /></div>
                    <span>Resultados Medibles</span>
                </h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                    Monitoreamos tu progreso constantemente. Desde mejoras en fuerza hasta movilidad, verás datos reales de tu evolución.
                </p>
            </div>

          </div>
        </div>

        {/* TESTIMONIALS CAROUSEL */}
        <div className="mt-24">
            <h2 className="text-center text-3xl font-bold text-blue-800 md:text-4xl mb-12">Lo que dicen nuestros atletas</h2>
            <div 
                className="relative max-w-6xl mx-auto"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="overflow-hidden px-4">
                    <div 
                        className="flex transition-transform duration-500 ease-in-out" 
                        style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
                    >
                        {testimonials.map((testimonial, idx) => (
                            <div key={idx} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4">
                                <div className="bg-white rounded-2xl p-8 shadow-lg h-full flex flex-col relative border border-gray-100">
                                    <Quote className="absolute top-6 right-6 text-blue-100 fill-current" size={40} />
                                    <div className="flex text-yellow-400 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} fill={i < testimonial.rating ? "currentColor" : "none"} className={i < testimonial.rating ? "" : "text-gray-300"} />
                                        ))}
                                    </div>
                                    <p className="text-gray-600 italic mb-6 flex-grow leading-relaxed">"{testimonial.text}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                            {testimonial.author.charAt(0)}
                                        </div>
                                        <span className="font-bold text-gray-900">{testimonial.author}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={prevSlide}
                    className="absolute top-1/2 -left-2 md:-left-6 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg text-blue-600 hover:bg-blue-50 transition-colors border border-blue-100"
                    aria-label="Anterior"
                >
                    <ChevronLeft size={24} />
                </button>

                <button 
                    onClick={nextSlide}
                    className="absolute top-1/2 -right-2 md:-right-6 -translate-y-1/2 bg-white p-3 rounded-full shadow-lg text-blue-600 hover:bg-blue-50 transition-colors border border-blue-100"
                    aria-label="Siguiente"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>

        {/* CTA SECTION */}
        <div className="mt-32 text-center bg-blue-900 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center"></div>
            <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6">¿Listo para transformar tu vida?</h2>
                <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">Únete a la comunidad de Tommybox y empieza a entrenar de forma inteligente hoy mismo.</p>
                <button 
                    onClick={() => setCurrentView('plans')}
                    className="bg-white text-blue-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-transform hover:scale-105 shadow-xl"
                >
                    Ver Planes Disponibles
                </button>
            </div>
        </div>

      </div>
    </section>
  );
};

export default HomeView;
