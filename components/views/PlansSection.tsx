import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';

const PlansSection = ({ user }: { user: any }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>(user?.plan || 'free');

  useEffect(() => {
    const fetchPlans = async () => {
      const q = query(collection(db, 'plans'));
      const querySnapshot = await getDocs(q);
      const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlans(plansData);
    };

    fetchPlans();
  }, []);

  useEffect(() => {
      if (!user?.uid) return;
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
              setCurrentPlan(docSnap.data().plan || 'free');
          }
      });
      return () => unsubscribe();
  }, [user?.uid]);

  const selectPlan = async (planId: string, planName: string) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        plan: planId
      });
    } catch (error) {
      console.error("Error updating plan: ", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-black text-center mb-12">Select Your Plan</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map(plan => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-8 shadow-lg flex flex-col justify-between border-2 ${
                isCurrent ? 'border-blue-600 scale-105 transform transition-transform' : 'border-transparent'
              }`}
            >
              <div>
                {isCurrent && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                    Current Plan
                  </span>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-gray-500 ml-2">/ month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features?.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => selectPlan(plan.id, plan.name)}
                disabled={isCurrent}
                className={`w-full py-4 rounded-xl font-bold transition-colors ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                }`}
              >
                {isCurrent ? 'Current' : 'Select Plan'}
              </button>
            </div>
          );
        })}
        {plans.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
                No plans found in Firestore yet.
            </div>
        )}
      </div>
    </div>
  );
};

export default PlansSection;
