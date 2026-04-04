const fs = require('fs');
let code = fs.readFileSync('components/views/CommunitySection.tsx', 'utf8');

const targetStr = `                        <button
                            onClick={() => { handleDelete(post.id); setActiveMenu(null); }}
                            className="w-full text-left px-4 py-3 text-red-400 font-medium hover:bg-red-900/20 transition-colors rounded-xl"
                          >
                        </div>`;

const replacementStr = `                        <button
                            onClick={() => { handleDelete(post.id); setActiveMenu(null); }}
                            className="w-full text-left px-4 py-3 text-red-400 font-medium hover:bg-red-900/20 transition-colors rounded-xl"
                          >
                            Eliminar publicación
                        </button>
                        </div>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('components/views/CommunitySection.tsx', code);
