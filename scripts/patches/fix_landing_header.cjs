const fs = require('fs');

let code = fs.readFileSync('components/views/HomeView.tsx', 'utf8');

// The logo in the header
code = code.replace(
  /<img src="\/logo-header\.png" alt="TommyBox" className="h-10 object-contain" \/>/,
  `<img src="/logo-header.png" alt="TommyBox" className="h-7 object-contain" />`
);

// We can also adjust the button padding slightly to give it a more "airy" feel next to the smaller logo
code = code.replace(
  /className="px-5 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600\/20 text-sm"/,
  `className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm"`
);

fs.writeFileSync('components/views/HomeView.tsx', code);
