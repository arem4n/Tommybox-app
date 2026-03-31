const fs = require('fs');
let appCode = fs.readFileSync('App.tsx', 'utf-8');

// Change D
appCode = appCode.replace("alert(`¡Bienvenido a TommyBox, ${additionalData.displayName}! 🎉`);\n      navigate('/dashboard');", "alert(`¡Bienvenido a TommyBox, ${additionalData.displayName}! 🎉`);");

// Change E
appCode = appCode.replace("}, [navigate]);", "}, []);");

fs.writeFileSync('App.tsx', appCode);
