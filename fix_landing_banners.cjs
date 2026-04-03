const fs = require('fs');

let code = fs.readFileSync('components/views/HomeView.tsx', 'utf8');

// I will insert a full width banner section after the Methodology cards and before the Testimonials.
const testimonialsStart = code.indexOf('{/* ── Testimonials ── */}');
if(testimonialsStart !== -1) {
    const newBanner = `
        {/* ── Banner Section ── */}
        <div className="w-full h-64 md:h-96 bg-slate-900 relative mt-20 md:mt-32">
           <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
              alt="Gym Equipment"
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase opacity-90 drop-shadow-2xl">Supera tus límites</h2>
           </div>
        </div>

        `;

    code = code.slice(0, testimonialsStart) + newBanner + code.slice(testimonialsStart);
}

fs.writeFileSync('components/views/HomeView.tsx', code);
