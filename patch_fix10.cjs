const fs = require('fs');
let content = fs.readFileSync('components/views/ClientProfileView.tsx', 'utf8');

if (!content.includes('import { getPlanName }')) {
  content = content.replace(
    "import { ChevronLeft, Download, Upload, Activity, FileText, Heart, Calendar, Phone } from 'lucide-react';",
    "import { ChevronLeft, Download, Upload, Activity, FileText, Heart, Calendar, Phone } from 'lucide-react';\nimport { getPlanName } from '../../utils/plans';"
  );
}

// Update the planName in the view
// It might just say client.plan currently, or maybe we need to find it.
const planSearch = `{client.plan || 'Sin plan'}`;
const planReplace = `{getPlanName(client.plan || 'free')}`;

content = content.replace(planSearch, planReplace);
content = content.replace(planSearch, planReplace);

// The instructions also mention adding birthDate if missing. I already added it in Fix 15:
// {(client.birthDate) && <div className="flex items-center gap-1"><Calendar size={14}/> {client.birthDate}</div>}
// So we just need to verify it's there.

fs.writeFileSync('components/views/ClientProfileView.tsx', content);
