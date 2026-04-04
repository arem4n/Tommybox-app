const fs = require('fs');

let gamificationCode = fs.readFileSync('components/views/GamificationView.tsx', 'utf8');

// 1. Remove Feeling UI from GamificationView
const feelingSectionRegex = /\{!\* ── Registro Sensación \(Feeling\) ── \*!\}\n\s*<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">[^]*?(?=<!-- ── Historial de Sensaciones ── -->|\{\/\* ── Resumen ── \*\/\}|\{\/\* ── Racha y Badges ── \*\/\}|\{\/\* ── Historial ── \*\/\}|<div className="bg-white)/;

// Let's use a simpler replace strategy for GamificationView by finding the section block.
const gamificationBlockStart = gamificationCode.indexOf('{/* ── Registro Sensación (Feeling) ── */}');
const gamificationBlockEnd = gamificationCode.indexOf('{/* ── Racha y Badges ── */}');

if (gamificationBlockStart !== -1 && gamificationBlockEnd !== -1) {
    const blockToRemove = gamificationCode.substring(gamificationBlockStart, gamificationBlockEnd);
    gamificationCode = gamificationCode.replace(blockToRemove, '');
}

// Remove imports/states for feelings in GamificationView
gamificationCode = gamificationCode.replace(/const \[selectedFeeling, setSelectedFeeling\] = useState\(''\);\n\s*const \[comment, setComment\] = useState\(''\);\n\s*const \[recoveryNotes, setRecoveryNotes\] = useState\(''\);\n\s*const \[successMessage, setSuccessMessage\] = useState\(''\);/g, '');
gamificationCode = gamificationCode.replace(/const \{\n\s*stats,\n\s*canRegisterFeeling,\n\s*registerFeeling,\n\s*pendingAchievements\n\s*\} = useGamification\(user\);/, 'const { stats, pendingAchievements } = useGamification(user);');
gamificationCode = gamificationCode.replace(/const handleRegisterFeeling = async \(\) => \{[^]*?\}\n\s*\};/g, '');


fs.writeFileSync('components/views/GamificationView.tsx', gamificationCode);

// 2. Add to AgendaSection
let agendaCode = fs.readFileSync('components/views/AgendaSection.tsx', 'utf8');

// Import useGamification
if(!agendaCode.includes('import { useGamification }')) {
  agendaCode = agendaCode.replace(
      /import \{ useModal \} from "\.\.\/\.\.\/contexts\/ModalContext";/,
      `import { useModal } from "../../contexts/ModalContext";\nimport { useGamification } from "../../hooks/useGamification";`
  );
}

// Define the hook and states inside AgendaSection
agendaCode = agendaCode.replace(
  /const AgendaSection = \(\{ user \}: \{ user: AppUser \} \)=> \{/,
  `const AgendaSection = ({ user }: { user: AppUser }) => {
  const { canRegisterFeeling, registerFeeling } = useGamification(user);
  const [selectedFeeling, setSelectedFeeling] = useState('');
  const [comment, setComment] = useState('');
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegisterFeeling = async () => {
    if (!selectedFeeling) return;
    const result = await registerFeeling(selectedFeeling, comment, recoveryNotes);
    if (result.ok) {
      setSuccessMessage(\`+\${result.xpAdded} XP!\`);
      setSelectedFeeling(''); setComment(''); setRecoveryNotes('');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const FEELINGS_OPTIONS = [
    { value: 'excelente', label: '🚀 Excelente' },
    { value: 'bien', label: '👍 Bien' },
    { value: 'normal', label: '👌 Normal' },
    { value: 'cansado', label: '🥱 Cansado' },
    { value: 'muy_duro', label: '🥵 Muy duro' },
  ];
`
);

// Append the UI to the bottom
const agendaEnd = agendaCode.lastIndexOf('</div>');
const feelingUI = `
      {/* ── ¿Cómo te sentiste hoy? ── */}
      {canRegisterFeeling && !user?.isTrainer && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Cómo te sentiste hoy?</h2>
          <p className="text-xs text-gray-400 mb-4">+5 XP por registrar</p>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {FEELINGS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedFeeling(opt.value)}
                  className={\`px-4 py-2 rounded-full border text-sm font-medium transition-colors \${
                    selectedFeeling === opt.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  }\`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
              placeholder="¿Cómo estuvo el entreno? (opcional)"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 text-sm"
            />
            <textarea
              value={recoveryNotes}
              onChange={(e) => setRecoveryNotes(e.target.value)}
              maxLength={150}
              placeholder="Notas de recuperación: sueño, dolores, energía... (opcional)"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-16 text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{comment.length}/200</span>
              <div className="flex items-center gap-4">
                {successMessage && <span className="text-green-600 font-bold animate-pulse">{successMessage}</span>}
                <button
                  onClick={handleRegisterFeeling}
                  disabled={!selectedFeeling}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

agendaCode = agendaCode.slice(0, agendaEnd) + feelingUI + agendaCode.slice(agendaEnd);
fs.writeFileSync('components/views/AgendaSection.tsx', agendaCode);
