const fs = require('fs');
let content = fs.readFileSync('components/views/AgendaSection.tsx', 'utf8');

// Add the state
if (!content.includes('const [feelingSessionDate, setFeelingSessionDate] = useState<string>(')) {
  content = content.replace(
    "const [feelingText, setFeelingText] = useState('');",
    "const [feelingText, setFeelingText] = useState('');\n  const [feelingSessionDate, setFeelingSessionDate] = useState<string>('');"
  );
}

// Update the trigger button
const oldButtonSearch = `<button onClick={() => setFeelingModal(true)} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">`;

const newButtonReplace = `<button
  onClick={() => {
    setFeelingSessionDate(new Date().toISOString().split('T')[0]);
    setFeelingModal(true);
  }}
  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
>`;

content = content.replace(oldButtonSearch, newButtonReplace);

// The old feelingModal UI was added previously in my manual patch. I need to remove it and put the new one.
const oldModalStart = `{/* Feeling Modal */}`;
const oldModalEnd = `       )}`; // Actually let's just find the whole block.

// Let's find the existing feelingModal block and remove it.
const fIdx = content.indexOf('{/* Feeling Modal */}');
if (fIdx !== -1) {
  let endIdx = content.indexOf(')}', fIdx);
  // It might have nested `)}`, let's search for the end of the `if (feelingModal)` block.
  // We can just use a regex or string replacement for the exact block we added before.
  const oldModalExact = `{/* Feeling Modal */}
       {feelingModal && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
               <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
                   <button
                        onClick={() => setFeelingModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                   >
                       <X size={20} />
                   </button>

                   <div className="text-center">
                       <h3 className="text-xl font-bold text-gray-900 mb-6">¿Cómo te sentiste hoy?</h3>

                       <div className="flex justify-between mb-6">
                           {FEELING_OPTIONS.map(opt => (
                               <button
                                   key={opt.value}
                                   onClick={() => setFeelingSelected(opt.value)}
                                   className={\`text-3xl transition-transform hover:scale-110 \${feelingSelected === opt.value ? 'scale-125 opacity-100 drop-shadow-md' : 'opacity-50 grayscale hover:grayscale-0'}\`}
                                   title={opt.label}
                               >
                                   {opt.emoji}
                               </button>
                           ))}
                       </div>

                       <textarea
                           value={feelingText}
                           onChange={e => setFeelingText(e.target.value)}
                           placeholder="¿Algún comentario sobre tu entrenamiento? (Opcional)"
                           className="w-full bg-gray-50 rounded-xl p-4 text-sm resize-none mb-6 outline-none focus:ring-2 focus:ring-blue-500"
                           rows={3}
                       />

                       <button
                           onClick={handleSaveFeeling}
                           disabled={feelingSelected === null || savingFeeling}
                           className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                       >
                           {savingFeeling ? 'Guardando...' : 'Guardar Sensación'}
                       </button>
                   </div>
               </div>
           </div>
       )}`;
  content = content.replace(oldModalExact, "");
}

// Now insert the NEW feeling modal at the end, just before `</section>`
// Wait, the agenda section doesn't end with `</section>`. It ends with `</div>\n  );\n};`.
// Let's insert it before the last `</div>`.

const newModal = `
{feelingModal && (
  <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[1] px-4">
    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up">
      <h3 className="text-lg font-black text-gray-900 text-center mb-1">
        ¿Cómo te sentiste?
      </h3>
      <p className="text-xs text-gray-400 text-center mb-5">
        Sesión del {feelingSessionDate}
      </p>
      <div className="flex justify-between gap-2 mb-4">
        {FEELING_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={async () => {
              if (!user?.id) return;
              try {
                await addDoc(collection(db, \`users/\${user.id}/feelings\`), {
                  date: feelingSessionDate,
                  value: opt.value,
                  emoji: opt.emoji,
                  text: feelingText || null,
                  timestamp: Timestamp.now(),
                });
              } catch(e) { console.error(e); }
              setFeelingModal(false);
              setFeelingText('');
            }}
            className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all">
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-[10px] text-gray-500">{opt.label}</span>
          </button>
        ))}
      </div>
      <textarea
        value={feelingText}
        onChange={e => setFeelingText(e.target.value)}
        placeholder="Comentario opcional..."
        rows={2}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"
      />
      <button
        onClick={() => { setFeelingModal(false); setFeelingText(''); }}
        className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 font-bold">
        Saltar
      </button>
    </div>
  </div>
)}
`;

const endSearch = `   </div>
  );
};`;
content = content.replace(endSearch, newModal + "\n" + endSearch);

fs.writeFileSync('components/views/AgendaSection.tsx', content);
