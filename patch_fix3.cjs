const fs = require('fs');
let content = fs.readFileSync('components/views/ClientStatsView.tsx', 'utf8');

// Replace handlePhotoUpload
const oldUploadFunctionSearch = `// ── Photo upload ────────────────────────────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {`;

const oldUploadFunctionEnd = `  // ── Save profile ────────────────────────────────────────────────────────────`;

const fIdx = content.indexOf(oldUploadFunctionSearch);
const pIdx = content.indexOf(oldUploadFunctionEnd);

if (fIdx !== -1 && pIdx !== -1) {
  const newUploadFunction = `// ── Photo upload ────────────────────────────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(20);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 400;
        let w = img.width, h = img.height;
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        setUploadProgress(80);
        try {
          await updateDoc(doc(db, 'users', user.id), { photoURL: base64 });
          setPhotoURL(base64);
          if (typeof onUserUpdate === 'function') {
            onUserUpdate({ ...user, photoURL: base64 });
          }
          setUploadProgress(100);
          setTimeout(() => { setUploading(false); setUploadProgress(0); }, 600);
        } catch (err) {
          console.error('Photo save error:', err);
          setUploading(false);
          setUploadProgress(0);
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  `;
  content = content.substring(0, fIdx) + newUploadFunction + content.substring(pIdx);
}

// Remove Firebase storage imports
content = content.replace("import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';", "");
content = content.replace(/import { db, storage } from '\.\.\/\.\.\/services\/firebase';/, "import { db } from '../../services/firebase';");


// Check if `onUserUpdate` exists in props of ClientStatsView
if (content.includes("const ClientStatsView = ({ user }: { user: any }) => {")) {
  content = content.replace(
    "const ClientStatsView = ({ user }: { user: any }) => {",
    "const ClientStatsView = ({ user, onUserUpdate }: { user: any, onUserUpdate?: any }) => {"
  );
}

fs.writeFileSync('components/views/ClientStatsView.tsx', content);
