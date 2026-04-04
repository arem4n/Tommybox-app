const fs = require('fs');

let code = fs.readFileSync('components/views/GamificationView.tsx', 'utf8');

// The first time I tried to remove this, the block match wasn't precise enough because I assumed there were comments that didn't match.
// Let's remove the remaining check-in block entirely.
const dailyCheckInStart = code.indexOf('{/* Daily Check-in */}');
const historyStart = code.indexOf('{/* ── Historial ── */}'); // looking for the next major block

if(dailyCheckInStart !== -1 && historyStart !== -1) {
    const blockToRemove = code.substring(dailyCheckInStart, historyStart);
    code = code.replace(blockToRemove, '');
}

// Remove canRegisterFeeling from hook destructuring
code = code.replace(
  /canRegisterFeeling,/,
  ''
);

fs.writeFileSync('components/views/GamificationView.tsx', code);
