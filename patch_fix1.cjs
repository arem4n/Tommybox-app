const fs = require('fs');
let content = fs.readFileSync('components/views/TrainerDashboard.tsx', 'utf8');

if (!content.includes('import { getPlanName }')) {
  content = content.replace(
    "import { LogOut, Calendar, Users, Activity, ChevronRight, Search, FileText } from 'lucide-react';",
    "import { LogOut, Calendar, Users, Activity, ChevronRight, Search, FileText } from 'lucide-react';\nimport { getPlanName } from '../../utils/plans';"
  );
  fs.writeFileSync('components/views/TrainerDashboard.tsx', content);
}
