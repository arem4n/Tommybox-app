const fs = require('fs');
let content = fs.readFileSync('components/views/ClientStatsView.tsx', 'utf8');

// 1. Remove manual date input and update default states/functions
// First, find the `feelingDate` state and replace it
content = content.replace(
  "  const [feelingDate, setFeelingDate]         = useState(new Date().toISOString().split('T')[0]);",
  ""
);

// Replace feelingDate in handleSaveFeeling with the inline value
content = content.replace(
  "    if (feelingSelected === null || !feelingDate) return;",
  "    if (feelingSelected === null) return;"
);
content = content.replace(
  "        date: feelingDate,",
  "        date: new Date().toISOString().split('T')[0],"
);
content = content.replace(
  "      setFeelingDate(new Date().toISOString().split('T')[0]);",
  ""
);

// Remove the date input from the UI
content = content.replace(
  "              <input type=\"date\" value={feelingDate} onChange={e => setFeelingDate(e.target.value)} \n                className=\"w-full mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium\" />",
  ""
);
content = content.replace(
  `              <input type="date" value={feelingDate} onChange={e => setFeelingDate(e.target.value)}`,
  `              {/* Date removed */}`
);
content = content.replace(
  `                className="w-full mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />`,
  ``
);

// We need to move the feelings section inside the stats tab.
// I will extract the feelings block and inject it into the stats tab.
const feelingsStart = "{/* ── FEELINGS MOVED TO STATS ── */}";
const profileStart = "{/* ── PROFILE ── */}";

const fIdx = content.indexOf(feelingsStart);
const pIdx = content.indexOf(profileStart);

if (fIdx !== -1 && pIdx !== -1) {
    const feelingsBlock = content.substring(fIdx, pIdx);
    // remove it from current location
    content = content.substring(0, fIdx) + content.substring(pIdx);

    // The feelingsBlock has a wrapper like `      {/* Sensaciones extraídas */}\n      <>` that we might want to clean up if it's there.
    let cleanedFeelings = feelingsBlock.replace("{/* ── FEELINGS MOVED TO STATS ── */}", "");
    cleanedFeelings = cleanedFeelings.replace("{/* ── FEELINGS ── */}", "");
    cleanedFeelings = cleanedFeelings.replace("{/* Sensaciones extraídas */}", "");

    // remove the <> and </> wrapper if it exists from a previous patch
    if (cleanedFeelings.includes("<>") && cleanedFeelings.includes("</>")) {
        cleanedFeelings = cleanedFeelings.replace("<>", "");
        const lastParen = cleanedFeelings.lastIndexOf("</>");
        if (lastParen !== -1) {
            cleanedFeelings = cleanedFeelings.substring(0, lastParen) + cleanedFeelings.substring(lastParen + 3);
        }
    }

    // Now insert it into the stats tab
    // The stats tab ends with `</div>` right before `{/* ── PROGRESS ── */}`
    const progressStart = "{/* ── PROGRESS ── */}";
    const pIdx2 = content.indexOf(progressStart);

    // We need to find the closing tag of the activeTab === 'stats' block.
    // It's the `</>` right before `      {/* ── PROGRESS ── */}`
    const statsEndSearch = `          </div>
        </>
      )}

      {/* ── PROGRESS ── */}`;

    if (content.includes(statsEndSearch)) {
        content = content.replace(statsEndSearch, `          </div>\n\n          {/* ── FEELINGS (ONLY here, inside stats tab) ── */}\n          <div className="grid lg:grid-cols-2 gap-8 mt-6">\n${cleanedFeelings}\n          </div>\n        </>\n      )}\n\n      {/* ── PROGRESS ── */}`);
    } else {
        // Fallback replacement
        console.log("Could not find the exact end of stats block, trying fallback...");
    }
}

fs.writeFileSync('components/views/ClientStatsView.tsx', content);
