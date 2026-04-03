const fs = require('fs');
let code = fs.readFileSync('hooks/useCommunity.ts', 'utf8');

// Fix syntax error where the function was inserted in the middle of submitPost
code = code.replace(
  /if \(!content\.trim\(\) \|\| !user\?\.id \|\| !db\) \n\s*const editPost = async \([^]*?return \{ ok: false, error: 'Contenido vacío' \};/m,
  `if (!content.trim() || !user?.id || !db) return { ok: false, error: 'Contenido vacío' };`
);

// Properly insert editPost before the return object at the bottom of the hook
code = code.replace(
  /return \{\n\s*posts,/m,
  `const editPost = async (postId: string, newText: string): Promise<PostResult> => {
    if (!user?.id || !db) return { ok: false, error: 'Sin conexión' };
    if (!newText.trim()) return { ok: false, error: 'Texto vacío' };
    try {
      await updateDoc(doc(db, 'community', postId), {
        text: newText.trim(),
        edited: true,
      });
      return { ok: true };
    } catch (e) {
      console.error('editPost failed:', e);
      return { ok: false, error: 'Error al editar' };
    }
  };\n\n  return {\n    posts,`
);

fs.writeFileSync('hooks/useCommunity.ts', code);
