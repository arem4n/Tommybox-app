const fs = require('fs');

// 1. services/firebase.ts
let firebaseCode = fs.readFileSync('services/firebase.ts', 'utf8');

// Add import
firebaseCode = firebaseCode.replace(
  /import \{ getFirestore \} from 'firebase\/firestore';/,
  `import { getFirestore } from 'firebase/firestore';\nimport { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';`
);

// Add initialization right after initializeApp
const initAppMatch = `const app = initializeApp(firebaseConfig);`;
const appCheckInit = `
const app = initializeApp(firebaseConfig);

if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}
`;
firebaseCode = firebaseCode.replace(initAppMatch, appCheckInit);
fs.writeFileSync('services/firebase.ts', firebaseCode);

// 2. .env.example
let envCode = fs.readFileSync('.env.example', 'utf8');
envCode = envCode.replace(
  /#\s*VITE_RECAPTCHA_SITE_KEY=.*/,
  `VITE_RECAPTCHA_SITE_KEY=your-recaptcha-v3-site-key`
);
fs.writeFileSync('.env.example', envCode);
