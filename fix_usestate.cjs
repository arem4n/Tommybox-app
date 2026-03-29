const fs = require('fs');
let content = fs.readFileSync('components/views/DashboardLayout.tsx', 'utf8');

content = content.replace(
  "import React, { useEffect } from 'react';",
  "import React, { useEffect, useState } from 'react';"
);

fs.writeFileSync('components/views/DashboardLayout.tsx', content);
