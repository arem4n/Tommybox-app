const fs = require('fs');

let code = fs.readFileSync('components/views/TrainerDashboard.tsx', 'utf8');

// Ensure import for HamburgerIcon
if(!code.includes("import { HamburgerIcon } from './HamburgerIcon';")) {
    code = code.replace(
      /import \{ Users, Calendar, LogOut, ChevronDown, Info, MessageCircle, CreditCard, CheckCircle, BookOpen, ArrowRight, CheckSquare, Layers \} from 'lucide-react';/,
      `import { Users, Calendar, LogOut, ChevronDown, Info, MessageCircle, CreditCard, CheckCircle, BookOpen, ArrowRight, CheckSquare, Layers, X } from 'lucide-react';\nimport { HamburgerIcon } from './HamburgerIcon';`
    );
}


// Add state for mobile menu
if(!code.includes("const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);")) {
    code = code.replace(
      /const \[hasPlans, setHasPlans\] = useState\(false\);/,
      `const [hasPlans, setHasPlans] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);`
    );
}


// We need to completely replace the header and add the drawer.
// Let's find the entire header block.
const headerStart = code.indexOf('{/* ── Header ── */}');
const bannerStart = code.indexOf('{/* ── Onboarding Banner ── */}');

if (headerStart === -1 || bannerStart === -1) {
    console.error("Could not find header or banner start markers.");
    process.exit(1);
}

const headerBlock = code.substring(headerStart, bannerStart);

const newHeaderBlock = `{/* ── Header ── */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-20 shadow-lg shadow-black/20">

        {/* Row 1 — Logo + User */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">

          {/* Mobile Hamburger */}
          <div className="md:hidden absolute left-4 z-30">
            <HamburgerIcon isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          </div>

          <div className="flex items-center w-full justify-center md:justify-start md:pl-0">
            <img src="/logo-header.png" alt="TommyBox" className="h-9 object-contain" />
          </div>
          <div className="flex items-center gap-4 absolute right-4">
            <span className="text-sm font-medium text-slate-400 hidden sm:block">{user?.displayName}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation (>=768px) */}
        <div className="hidden md:block bg-slate-900 border-t border-slate-800">
          <div className="container mx-auto">
            {/* First Row */}
            <div className="flex justify-start px-4 overflow-hidden">
              {primaryTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as CurrentTab)}
                  className={\`flex items-center gap-2 py-3 px-5 font-bold text-sm transition-all border-b-2 whitespace-nowrap \${
                    currentTab === tab.id
                      ? 'border-blue-400 text-blue-400 bg-slate-800/50'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }\`}
                >
                  <img src={tab.imgSrc} alt={tab.label} className="w-5 h-5 opacity-90" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-full flex items-center justify-center py-1 bg-slate-900/80">
                <div className="w-1/3 h-px bg-slate-800"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 text-slate-500">Gestión</span>
                <div className="w-1/3 h-px bg-slate-800"></div>
            </div>

            {/* Second Row */}
             <div className="flex justify-start px-4 overflow-hidden">
              {secondaryTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as CurrentTab)}
                  className={\`relative flex items-center gap-2 py-3 px-5 font-bold text-sm transition-all border-b-2 whitespace-nowrap \${
                    currentTab === tab.id
                      ? 'border-slate-400 text-slate-200 bg-slate-800/50'
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
                  }\`}
                >
                  <img src={tab.imgSrc} alt={tab.label} className="w-5 h-5 opacity-70" />
                  <span>{tab.label}</span>
                  {(tab as any).badge > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {(tab as any).badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (<768px) */}
      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={\`fixed inset-y-0 left-0 w-[75%] max-w-sm bg-slate-950 z-40 md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col \${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }\`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center h-16 shrink-0 relative">
             <img src="/logo-header.png" alt="TommyBox" className="h-8 object-contain" />
             <div className="absolute right-4">
                 <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                     <X size={24} />
                 </button>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {/* Primary Tabs */}
          {primaryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setCurrentTab(tab.id as CurrentTab); setIsMobileMenuOpen(false); }}
              className={\`w-full flex items-center gap-3 px-6 py-3.5 transition-colors \${
                currentTab === tab.id
                  ? 'bg-blue-900/30 text-blue-400 border-l-4 border-blue-400'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white border-l-4 border-transparent'
              }\`}
            >
              <img src={tab.imgSrc} alt={tab.label} className="w-6 h-6 opacity-90" />
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}

          {/* Divider */}
          <div className="py-4 px-4 flex items-center justify-center">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 text-slate-500">Gestión</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          {/* Secondary Tabs */}
          {secondaryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setCurrentTab(tab.id as CurrentTab); setIsMobileMenuOpen(false); }}
              className={\`relative w-full flex items-center gap-3 px-6 py-3.5 transition-colors \${
                currentTab === tab.id
                  ? 'bg-slate-800/50 text-slate-200 border-l-4 border-slate-400'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-l-4 border-transparent'
              }\`}
            >
              <img src={tab.imgSrc} alt={tab.label} className="w-5 h-5 opacity-70" />
              <span className="font-bold text-sm">{tab.label}</span>
              {(tab as any).badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {(tab as any).badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>\n\n      `;

code = code.replace(headerBlock, newHeaderBlock);

fs.writeFileSync('components/views/TrainerDashboard.tsx', code);
