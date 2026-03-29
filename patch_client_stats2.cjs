const fs = require('fs');
let content = fs.readFileSync('components/views/ClientStatsView.tsx', 'utf8');

const badSearch = `            <div className="flex gap-3 items-center">
              {/* Date removed */}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              <button onClick={handleSaveFeeling} disabled={feelingSelected === null || savingFeeling}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20">`;

const badReplace = `            <div className="flex gap-3 items-center justify-end">
              {/* Date removed */}
              <button onClick={handleSaveFeeling} disabled={feelingSelected === null || savingFeeling}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/20">`;

content = content.replace(badSearch, badReplace);
fs.writeFileSync('components/views/ClientStatsView.tsx', content);
