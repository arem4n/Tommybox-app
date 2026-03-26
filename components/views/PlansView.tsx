
import React from 'react';
import { Dumbbell, Zap, Award } from 'lucide-react';
import { View, Plan } from '../../types';
import TrainerPlansView from './TrainerPlansView';

interface PlansViewProps {
  setCurrentView: (view: View) => void;
  isLoggedIn: boolean;
  handlePlanSelect: (planName: string) => void;
  isTrainer: boolean;
}

const PlansView: React.FC<PlansViewProps> = ({ setCurrentView, isLoggedIn, handlePlanSelect, isTrainer }) => {
  if (isTrainer) {
    return <TrainerPlansView />;
  }

  const plans: Plan[] = [
    {
      name: '1 Sesión / Semana',
      price: '$70.000 / mes',
      description: 'Perfecto para establecer una base sólida. Incluye 4 sesiones al mes, distribuidas en una por semana, con facturación mensual.',
      icon: <Dumbbell size={26} />,
    },
    {
      name: '2 Sesiones / Semana',
      price: '$80.000 / mes',
      description: 'Ideal para un progreso constante. Incluye 8 sesiones al mes, distribuidas en dos por semana, con facturación mensual.',
      icon: <Zap size={26} />,
    },
    {
      name: '3 Sesiones / Semana',
      price: '$90.000 / mes',
      description: 'Para un compromiso total. Incluye 12 sesiones al mes, distribuidas en tres por semana, con facturación mensual.',
      icon: <Award size={26} />,
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12">Elige el plan ideal para ti</h1>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`
                bg-white shadow-lg rounded-xl flex-1 min-w-[280px] max-w-[350px] p-8 my-4 transform transition-transform duration-300 hover:scale-105 relative
                ${index === 1 ? 'z-10 ring-4 ring-blue-500' : 'bg-gray-50'}
              `}
            >
              {index === 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">Más Popular</span>
                </div>
              )}
              <div className={`mx-auto mb-4 h-16 w-16 rounded-full flex items-center justify-center ${index === 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-700'}`}>
                {plan.icon}
              </div>
              <h5 className={`uppercase font-semibold text-lg ${index === 1 ? 'text-blue-800' : 'text-gray-800'}`}>{plan.name}</h5>
              <div className={`my-6 text-5xl font-extrabold ${index === 1 ? 'text-blue-800' : 'text-gray-800'}`}>
                {plan.price}
              </div>
              <p className={`mt-4 text-sm leading-relaxed font-light h-24 ${index === 1 ? 'text-gray-700' : 'text-gray-600'}`}>
                {plan.description}
              </p>
              <button
                onClick={() => handlePlanSelect(plan.name)}
                className={`
                  rounded-full border-none text-white cursor-pointer py-3 px-6 mt-5 uppercase font-bold tracking-wide transition-all duration-300 w-full shadow-lg hover:shadow-xl
                  ${index === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-800'}
                `}
              >
                {isLoggedIn ? 'Seleccionar Plan' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansView;
