const fs = require('fs');

let code = fs.readFileSync('components/views/CommunitySection.tsx', 'utf8');

// 1. Add "Editar" button logic
// Wait, looking at the grep result, the structure is slightly different. Let's find the Eliminar botón
const targetDeleteButton = `<button
                            onClick={() => { handleDelete(post.id); setActiveMenu(null); }}
                            className="w-full text-left px-4 py-3 text-red-400 font-medium hover:bg-red-900/20 transition-colors rounded-xl"
                          >
                            Eliminar publicación
                          </button>`;

const newEditButton = `{post.authorId === user?.id && editingState?.id !== post.id && (
                          <button
                            onClick={() => { setEditingState({ id: post.id, text: post.text }); setActiveMenu(null); }}
                            className="w-full text-left px-4 py-3 text-slate-300 font-medium hover:bg-slate-800 transition-colors rounded-xl border-b border-slate-700/50"
                          >
                            Editar publicación
                          </button>
                        )}
                        <button
                            onClick={() => { handleDelete(post.id); setActiveMenu(null); }}
                            className="w-full text-left px-4 py-3 text-red-400 font-medium hover:bg-red-900/20 transition-colors rounded-xl"
                          >`;

code = code.replace(targetDeleteButton, newEditButton);


// 2. Add inline editor logic
// Let's find the post text and replace it with textarea if editing.
// We need to look at how it's rendered first.
fs.writeFileSync('components/views/CommunitySection.tsx', code);
