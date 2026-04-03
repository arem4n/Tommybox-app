const fs = require('fs');

let code = fs.readFileSync('components/views/TrainerDashboard.tsx', 'utf8');

const hookInsert = `
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);
`;

code = code.replace(
  /const activeClients = clients\.filter\(c => c\.status !== 'archived'\);/,
  `${hookInsert}\n  const activeClients = clients.filter(c => c.status !== 'archived');`
);

fs.writeFileSync('components/views/TrainerDashboard.tsx', code);
