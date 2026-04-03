const fs = require('fs');

let code = fs.readFileSync('components/views/CommunitySection.tsx', 'utf8');

// 1. Add hook editPost to destructuring
code = code.replace(
  /const \{ posts, submitPost, toggleLike, deletePost, addComment, deleteComment \} = useCommunity\(user\);/,
  `const { posts, submitPost, toggleLike, deletePost, editPost, addComment, deleteComment } = useCommunity(user);`
);

// 2. Add local state for editingState
code = code.replace(
  /const \[activeMenu, setActiveMenu\] = useState<string \| null>\(null\);/,
  `const [activeMenu, setActiveMenu] = useState<string | null>(null);\n  const [editingState, setEditingState] = useState<{ id: string; text: string } | null>(null);`
);


// 3. Add "Editar" button alongside the delete button logic.
// Find the post menu rendering block:
// {(user?.isTrainer || post.authorId === user?.id) && (
//   <div className="relative" ...
//      <button onClick={() => { handleDelete(post.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 flex items-center gap-2">
//         <Trash size={14} /> Eliminar
//      </button>

code = code.replace(
  /<button\s+onClick=\{\(\) => \{ handleDelete\(post.id\); setActiveMenu\(null\); \}\}\s+className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 flex items-center gap-2"\s*>\s*<Trash size=\{14\} \/> Eliminar\s*<\/button>/,
  `{post.authorId === user?.id && editingState?.id !== post.id && (
                                <button
                                  onClick={() => { setEditingState({ id: post.id, text: post.text }); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Edit2 size={14} /> Editar
                                </button>
                              )}
                              <button
                                onClick={() => { handleDelete(post.id); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 flex items-center gap-2"
                              >
                                <Trash size={14} /> Eliminar
                              </button>`
);

// Note: Ensure Edit2 is imported from lucide-react. Let's add it if not present.
if(!code.includes('Edit2')) {
   code = code.replace(
     /import \{ Heart, MessageCircle, Send, MoreVertical, Trash, Image as ImageIcon, X \} from 'lucide-react';/,
     `import { Heart, MessageCircle, Send, MoreVertical, Trash, Image as ImageIcon, X, Edit2 } from 'lucide-react';`
   );
   // Fallback regex if previous exact match fails
   code = code.replace(
     /Trash,/,
     `Trash, Edit2,`
   );
}


// 4. Implement inline editor and edited badge
// Find the post text rendering `<p className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">{post.text}</p>`
// And the timestamp rendering `<p className="text-xs text-slate-500">{post.createdAt ...}</p>`

code = code.replace(
  /<p className="text-xs text-slate-500">\{post\.createdAt\?\.toDate\?\(\)\.toLocaleString\('es-CL', \{ day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' \}\) \|\| 'Reciente'\}<\/p>/,
  `<p className="text-xs text-slate-500">
                      {post.createdAt?.toDate?.().toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) || 'Reciente'}
                      {post.edited && editingState?.id !== post.id && <span className="text-[10px] text-white/30 ml-1">(editado)</span>}
                    </p>`
);

code = code.replace(
  /<p className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">\{post\.text\}<\/p>/,
  `{editingState?.id === post.id ? (
                  <div className="mt-3">
                    <textarea
                      value={editingState.text}
                      onChange={(e) => setEditingState({ ...editingState, text: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm resize-none focus:outline-none focus:border-blue-500 text-slate-200"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => setEditingState(null)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors bg-slate-800 rounded-md"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          const result = await editPost(post.id, editingState.text);
                          if (result.ok) setEditingState(null);
                        }}
                        className="px-3 py-1 text-xs text-white font-medium bg-blue-600 hover:bg-blue-500 transition-colors rounded-md shadow-md"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">{post.text}</p>
                )}`
);


fs.writeFileSync('components/views/CommunitySection.tsx', code);
