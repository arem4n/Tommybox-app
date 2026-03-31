const fs = require('fs');
let appCode = fs.readFileSync('App.tsx', 'utf-8');

// Change A
appCode = appCode.replace("import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';", "import { Routes, Route, Navigate } from 'react-router-dom';");

// Change B
appCode = appCode.replace("const navigate = useNavigate();", "");

fs.writeFileSync('App.tsx', appCode);
