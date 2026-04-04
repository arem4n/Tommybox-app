const fs = require('fs');

// 1. hooks/useGamification.ts
let hookCode = fs.readFileSync('hooks/useGamification.ts', 'utf8');
hookCode = hookCode.replace(
  /await recalculateGamification\(user\.id\);/g,
  `// await recalculateGamification(user.id); // Removed: handled by Cloud Function`
);
fs.writeFileSync('hooks/useGamification.ts', hookCode);

// 2. services/gamification.ts
let serviceCode = fs.readFileSync('services/gamification.ts', 'utf8');
serviceCode = serviceCode.replace(
  /export const recalculateGamification = async \(userId: string\) => \{/,
  `// DEPRECATED: server-side recalculation is handled exclusively
// by Cloud Functions. Do not call this from the client.
// Kept here for reference only.
export const recalculateGamification = async (userId: string) => {`
);
fs.writeFileSync('services/gamification.ts', serviceCode);

// 3. functions/src/index.ts
let functionsCode = fs.readFileSync('functions/src/index.ts', 'utf8');
const newFunction = `
export const onFeelingWritten = onDocumentWritten(
  'users/{userId}/feelings/{feelingId}',
  async (event) => {
    const { userId } = event.params;
    if (!event.data?.after?.exists) return;
    const db = getFirestore();
    try {
      await recalculateGamificationServer(db, userId);
      console.log(\`[onFeelingWritten] Gamification recalculated for user \${userId}\`);
    } catch (error) {
      console.error(\`[onFeelingWritten] Failed for user \${userId}:\`, error);
    }
  }
);
`;
functionsCode += newFunction;
fs.writeFileSync('functions/src/index.ts', functionsCode);
