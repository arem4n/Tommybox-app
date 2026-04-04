const fs = require('fs');
let code = fs.readFileSync('components/views/GamificationView.tsx', 'utf8');

// The block starts at "{/* Daily Check-in */}"
const start = code.indexOf('{/* Daily Check-in */}');

// The block ends right before "{/* Badges */}" or whatever is right after it. Let's see what is after line 132
// We'll use a very precise regex to strip out exactly what contains "canRegisterFeeling" up to its closing tag.

const replaceRegex = /\{\/\* Daily Check-in \*\/\}[\s\S]*?(?=<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">\s*<h2 className="text-xl font-bold text-gray-900 mb-6">Badges)/;

code = code.replace(replaceRegex, '');

fs.writeFileSync('components/views/GamificationView.tsx', code);
