const fs = require('fs');

let code = fs.readFileSync('components/views/HomeView.tsx', 'utf8');

const testimonialsBlockStart = code.indexOf('{/* ── Testimonials ── */}');
const footerStart = code.indexOf('{/* ── Footer ── */}');

if (testimonialsBlockStart !== -1 && footerStart !== -1) {
    const testimonialsBlock = code.substring(testimonialsBlockStart, footerStart);

    // Modern swipeable strip using CSS scroll-snap
    const newTestimonials = `{/* ── Testimonials ── */}
        <div className="bg-slate-900 border-t border-slate-800 py-20 w-full overflow-hidden">
          <div className="container mx-auto px-4 mb-12 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Lo que dicen nuestros <span className="text-blue-400">atletas</span>
            </h2>
            <div className="mt-4 w-24 h-1 bg-blue-600 mx-auto md:mx-0 rounded-full" />
          </div>

          {/* Swipeable Container */}
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-10 pl-4 md:pl-[calc((100vw-1152px)/2+1rem)] gap-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="snap-center shrink-0 w-[85vw] sm:w-[350px] md:w-[400px]"
              >
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl h-full flex flex-col justify-between hover:border-blue-800/50 transition-all duration-300 relative group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Quote className="w-20 h-20 text-blue-500" />
                  </div>
                  <div className="flex mb-6">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={18} />
                    ))}
                  </div>
                  <p className="text-slate-300 text-lg leading-relaxed relative z-10 font-medium mb-8">
                    "{t.text}"
                  </p>
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
            {/* Right padding element so the last card can be centered/viewed properly */}
            <div className="shrink-0 w-4 md:w-[calc((100vw-1152px)/2)]" aria-hidden="true"></div>
          </div>
        </div>

        `;

    code = code.replace(testimonialsBlock, newTestimonials);
}

// Ensure global CSS for hide-scrollbar exists (add to index.css if needed, but doing inline styles for scrollbar-width)
// Note: We'll add standard hide-scrollbar to index.css

fs.writeFileSync('components/views/HomeView.tsx', code);
