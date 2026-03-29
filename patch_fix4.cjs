const fs = require('fs');
let content = fs.readFileSync('components/views/ClientStatsView.tsx', 'utf8');

// The instructions require changing it specifically to editContactEmail, and to add a specific `<p>` tag.
content = content.replace(
  "  const [editEmail, setEditEmail]     = useState(user?.contactEmail || user?.email || '');",
  "  const [editContactEmail, setEditContactEmail] = useState(user?.contactEmail || '');"
);

content = content.replace(
  "contactEmail: editEmail.trim() || null,",
  "contactEmail: editContactEmail.trim() || null,"
);

const oldUISearch = `            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email de Contacto</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
            </div>`;

const newUIReplace = `<div>
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    Email de contacto
  </label>
  <input
    type="email"
    value={editContactEmail}
    onChange={e => setEditContactEmail(e.target.value)}
    placeholder="tucorreo@ejemplo.com"
    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
  />
  <p className="text-xs text-gray-400 mt-1">Opcional. Puede diferir del correo de acceso.</p>
</div>`;

content = content.replace(oldUISearch, newUIReplace);

fs.writeFileSync('components/views/ClientStatsView.tsx', content);
