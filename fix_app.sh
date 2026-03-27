sed -i 's/updatedData.plan = { name: selectedPlan, startDate: new Date().toISOString() };/updatedData.plan = selectedPlan;/g' App.tsx
sed -i 's/plan: { name: planName, startDate: new Date().toISOString() }/plan: planName/g' App.tsx
sed -i 's/setUserProfile({ ...userProfile, plan: { name: planName, startDate: new Date().toISOString() } })/setUserProfile({ ...userProfile, plan: planName } as any)/g' App.tsx
