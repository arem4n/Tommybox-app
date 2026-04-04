const fs = require('fs');
let code = fs.readFileSync('components/views/GamificationView.tsx', 'utf8');

// The block ends at Monthly Challenge
const start = code.indexOf('{/* Daily Check-in */}');
const end = code.indexOf('{/* Monthly Challenge */}');

if (start !== -1 && end !== -1) {
   const blockToRemove = code.substring(start, end);
   code = code.replace(blockToRemove, '');
}

fs.writeFileSync('components/views/GamificationView.tsx', code);
