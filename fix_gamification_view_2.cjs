const fs = require('fs');

let code = fs.readFileSync('components/views/GamificationView.tsx', 'utf8');

// If the regex above failed because the next block comment was slightly different
const checkinStart = code.indexOf('{/* Daily Check-in */}');
const rewardsStart = code.indexOf('{/* ── Recompensas y Badges ── */}');
const summaryStart = code.indexOf('{/* ── Resumen ── */}');

// Let's just find the exact block and slice it out if we know what follows it.
// The structure in the file currently has:
//      {/* Daily Check-in */}
//      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
// ... and ends with the close div before the next section
const regex = /\{\/\* Daily Check-in \*\/\}[\s\S]*?(?=\{\/\* ──|\{\/\* Historial|\{\/\* Recompensas|<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">[\s\S]*?<h2 className="text-xl font-bold text-gray-900 mb-6">Badges)/;

const match = code.match(regex);
if (match) {
    code = code.replace(match[0], '');
} else {
    // manual fallback
    const start = code.indexOf('{/* Daily Check-in */}');
    // find the next closing div for this block.
    // Actually, earlier the script removed the top level but the block is still there.
    // Let's just remove everything from Daily Check-in to the next major section that we know exists
    const endStr1 = '{/* ── Badges';
    const endStr2 = '<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">\n        <h2 className="text-xl font-bold text-gray-900 mb-6">Badges';
    const endStr3 = '<h2 className="text-xl font-bold text-gray-900 mb-6">Badges';

    const possibleEnds = [
        code.indexOf(endStr1, start),
        code.indexOf(endStr2, start),
        code.indexOf(endStr3, start)
    ].filter(i => i !== -1);

    if (possibleEnds.length > 0) {
        let end = Math.min(...possibleEnds);
        // adjust if needed based on what we match
        if (code.substring(end, end + endStr2.length) === endStr2) {
             // keep the div start
             code = code.substring(0, start) + code.substring(end);
        } else {
             // fallback
             const block = code.substring(start, end);
             // we need to make sure we don't delete too much.
             // let's do a more precise regex.
        }
    }
}
fs.writeFileSync('components/views/GamificationView.tsx', code);
