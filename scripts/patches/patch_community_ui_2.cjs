const fs = require('fs');

let code = fs.readFileSync('components/views/CommunitySection.tsx', 'utf8');

// Replace post content with inline editor when active
const targetContent = `<p className="text-slate-200 whitespace-pre-wrap">{post.content}</p>`;

const newContent = `{editingState?.id === post.id ? (
                  <div className="mt-1">
                    <textarea
                      value={editingState.text}
                      onChange={(e) => setEditingState({ ...editingState, text: e.target.value })}
                      rows={3}
                      className="w-full bg-transparent border border-white/20 rounded p-2 text-sm resize-none focus:outline-none focus:border-white/40 text-slate-200"
                    />
                    <div className="flex gap-2 mt-1 justify-end">
                      <button
                        onClick={() => setEditingState(null)}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          const result = await editPost(post.id, editingState.text);
                          if (result.ok) setEditingState(null);
                        }}
                        className="text-xs text-white font-medium bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-500 transition-colors"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-200 whitespace-pre-wrap">{post.content || post.text}</p>
                )}`;

code = code.replace(targetContent, newContent);

// Add edited badge
const targetTimestamp = `<p className="text-xs text-slate-400">
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Justo ahora'}
                    </p>`;

const newTimestamp = `<p className="text-xs text-slate-400">
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Justo ahora'}
                      {post.edited && editingState?.id !== post.id && <span className="text-[10px] text-white/30 ml-1">(editado)</span>}
                    </p>`;

code = code.replace(targetTimestamp, newTimestamp);

// We must also update the "setEditingState" to use post.content or post.text depending on what's available
code = code.replace(
    /setEditingState\(\{ id: post.id, text: post.text \}\)/g,
    `setEditingState({ id: post.id, text: post.content || post.text })`
)


fs.writeFileSync('components/views/CommunitySection.tsx', code);
