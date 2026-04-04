const fs = require('fs');

function addTransitions(file) {
    let code = fs.readFileSync(file, 'utf8');

    // For TrainerDashboard
    if(file.includes('Trainer')) {
         code = code.replace(
           /<main className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-fade-in">/,
           `<main className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-fade-in" key={currentTab}>`
         );
    }

    // For DashboardLayout
    if(file.includes('DashboardLayout')) {
        code = code.replace(
           /<main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">/,
           `<main className="flex-1 container mx-auto px-4 py-8 max-w-6xl animate-fade-in" key={currentTab}>`
         );
    }

    fs.writeFileSync(file, code);
}

addTransitions('components/views/TrainerDashboard.tsx');
addTransitions('components/views/DashboardLayout.tsx');

// Also add a nice slide-up to animate-fade-in in index.css
let css = fs.readFileSync('index.css', 'utf8');
if (!css.includes('animate-fade-in')) {
    css += `\n@keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }\n`;
    fs.writeFileSync('index.css', css);
}
