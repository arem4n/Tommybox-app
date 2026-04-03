const fs = require('fs');

let code = fs.readFileSync('components/views/TrainerDashboard.tsx', 'utf8');

// The replacement logic:
// 1. Move 'community' from secondaryTabs to primaryTabs
code = code.replace(
  /const primaryTabs = \[\n\s*{ id: 'clients',    label: 'Clientes',   imgSrc: '\/custom-icons\/nav_clients.png' },\n\s*{ id: 'agenda',     label: 'Agenda',      imgSrc: '\/custom-icons\/nav_calendar.png' },\n\s*{ id: 'asistencia', label: 'Asistencia',  imgSrc: '\/custom-icons\/nav_achievements.png' },\n\s*\];/,
  `const primaryTabs = [
    { id: 'clients',    label: 'Clientes',   imgSrc: '/custom-icons/nav_clients.png' },
    { id: 'agenda',     label: 'Agenda',      imgSrc: '/custom-icons/nav_calendar.png' },
    { id: 'asistencia', label: 'Asistencia',  imgSrc: '/custom-icons/nav_achievements.png' },
    { id: 'community',  label: 'Comunidad',   imgSrc: '/custom-icons/nav_community.png' },
  ];`
);

code = code.replace(
  /const secondaryTabs = \[\n\s*{ id: 'planes',     label: 'Planes',      imgSrc: '\/custom-icons\/nav_plan.png' },\n\s*{ id: 'payments',   label: 'Pagos',       imgSrc: '\/custom-icons\/nav_payments.png', badge: pendingPayments.length },\n\s*{ id: 'biblioteca', label: 'Biblioteca',  imgSrc: '\/custom-icons\/nav_library.png' },\n\s*{ id: 'community',  label: 'Comunidad',   imgSrc: '\/custom-icons\/nav_community.png' },\n\s*{ id: 'analytics',  label: 'Analytics',   imgSrc: '\/custom-icons\/nav_achievements.png' },\n\s*{ id: 'perfil',     label: 'Mi Perfil',   imgSrc: '\/custom-icons\/nav_clients.png' },\n\s*\];/,
  `const secondaryTabs = [
    { id: 'planes',     label: 'Planes',      imgSrc: '/custom-icons/nav_plan.png' },
    { id: 'payments',   label: 'Pagos',       imgSrc: '/custom-icons/nav_payments.png', badge: pendingPayments.length },
    { id: 'biblioteca', label: 'Biblioteca',  imgSrc: '/custom-icons/nav_library.png' },
    { id: 'analytics',  label: 'Analytics',   imgSrc: '/custom-icons/nav_achievements.png' },
    { id: 'perfil',     label: 'Mi Perfil',   imgSrc: '/custom-icons/nav_profile.png' },
  ];`
);

fs.writeFileSync('components/views/TrainerDashboard.tsx', code);
