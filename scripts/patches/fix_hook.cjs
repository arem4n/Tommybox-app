const fs = require('fs');

let code = fs.readFileSync('hooks/useCommunity.ts', 'utf8');

const editPostFunc = `
  const editPost = async (postId: string, newText: string): Promise<PostResult> => {
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
  };
`;

// Insert the function before the return block
code = code.replace(
  /return \{/,
  `${editPostFunc}\n  return {`
);

// Add to the exported object
code = code.replace(
  /return \{\n\s*posts,\n\s*submitPost,\n\s*toggleLike,\n\s*deletePost,\n\s*addComment,\n\s*deleteComment\n\s*\};/,
  `return {
    posts,
    submitPost,
    toggleLike,
    deletePost,
    editPost,
    addComment,
    deleteComment
  };`
);

fs.writeFileSync('hooks/useCommunity.ts', code);
