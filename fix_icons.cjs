const fs = require('fs');

let tCode = fs.readFileSync('components/views/TrainerDashboard.tsx', 'utf8');

// Increase icon sizes for primaryTabs
tCode = tCode.replace(
  /<img src=\{tab\.imgSrc\} alt=\{tab\.label\} className="w-5 h-5 opacity-90" \/>/g,
  `<img src={tab.imgSrc} alt={tab.label} className="w-6 h-6 md:w-7 md:h-7 opacity-90" />`
);

// Increase icon sizes for secondaryTabs
tCode = tCode.replace(
  /<img src=\{tab\.imgSrc\} alt=\{tab\.label\} className="w-5 h-5 opacity-70" \/>/g,
  `<img src={tab.imgSrc} alt={tab.label} className="w-5 h-5 md:w-6 md:h-6 opacity-70" />`
);

// Drawer primaryTabs
tCode = tCode.replace(
  /<img src=\{tab\.imgSrc\} alt=\{tab\.label\} className="w-6 h-6 opacity-90" \/>/g,
  `<img src={tab.imgSrc} alt={tab.label} className="w-7 h-7 opacity-90" />`
);

// Drawer secondaryTabs
tCode = tCode.replace(
  /<img src=\{tab\.imgSrc\} alt=\{tab\.label\} className="w-5 h-5 opacity-70" \/>/g,
  `<img src={tab.imgSrc} alt={tab.label} className="w-6 h-6 opacity-70" />`
);

fs.writeFileSync('components/views/TrainerDashboard.tsx', tCode);


let cCode = fs.readFileSync('components/views/DashboardLayout.tsx', 'utf8');
cCode = cCode.replace(
  /<img src=\{tab\.imgSrc\} alt=\{tab\.label\} className="w-6 h-6 mb-1 sm:mb-0 opacity-90" \/>/g,
  `<img src={tab.imgSrc} alt={tab.label} className="w-7 h-7 md:w-8 md:h-8 mb-1 sm:mb-0 opacity-90 drop-shadow-md" />`
);

fs.writeFileSync('components/views/DashboardLayout.tsx', cCode);
