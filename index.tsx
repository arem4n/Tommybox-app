import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { 
  LayoutDashboard, Activity, Trophy, Calendar, Users, LogOut, 
  Plus, ChevronRight, Bell, User, CheckCircle, Clock, X, 
  Dumbbell, MessageSquare, Menu, TrendingUp, Search, Check, FileText, XCircle, Briefcase, ThumbsUp,
  Loader2
} from 'lucide-react';

/**
 * =========================================================================================
 * 🏗️ NEXT.JS ARCHITECTURE MIGRATION GUIDE
 * =========================================================================================
 * 
 * Si copias este código a tu proyecto local Next.js, sigue esta estructura:
 * 
 * 1. /prisma/schema.prisma     -> Usa los Tipos definidos abajo para crear tus modelos.
 * 2. /components/ui/*          -> Mueve los componentes Button, Card, Badge, Input, Select.
 * 3. /components/layout/*      -> Mueve Sidebar, Header y DashboardLayout.
 * 4. /app/(auth)/login/page.tsx-> Mueve LoginPage.
 * 5. /app/(dashboard)/*        -> Mueve cada componente "Page" a su propia ruta.
 * 6. /lib/api.ts               -> Aquí reemplazarás los MOCK_DATA por llamadas a tu API/Prisma.
 */

// --- 1. TYPES & PRISMA MODELS MAPPING ---

type UserRole = 'client' | 'trainer';

// model Metric { ... }
interface Metric {
  id: string;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sensation: 'Excelente' | 'Bien' | 'Regular' | 'Cansado' | 'Agotado';
}

// model Achievement { ... }
interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'approved' | 'pending';
  date: string;
  author: string;
  category: string;
}

// model Session { ... }
interface Session {
  id: string;
  date: string; 
  trainer: string;
  client?: string;
  status: 'confirmed' | 'pending';
  duration: number;
}

// model User { ... }
interface Client {
  id: string;
  name: string;
  plan: string;
  lastSession: string;
  status: 'active' | 'inactive';
  avatarColor: string;
}

// --- 2. SERVER ACTIONS / DATA LAYER (MOCK) ---
// En Next.js, esto serían llamadas a `prisma.findMany()` dentro de Server Components o API Routes.

const DB = {
  metrics: [
    { id: '1', date: '2024-12-01', exercise: 'Sentadilla', weight: 60, reps: 10, sensation: 'Bien' },
    { id: '2', date: '2024-12-08', exercise: 'Sentadilla', weight: 65, reps: 10, sensation: 'Excelente' },
    { id: '3', date: '2024-12-15', exercise: 'Sentadilla', weight: 70, reps: 8, sensation: 'Bien' },
    { id: '4', date: '2024-12-22', exercise: 'Sentadilla', weight: 72.5, reps: 8, sensation: 'Regular' },
    { id: '5', date: '2025-01-05', exercise: 'Sentadilla', weight: 75, reps: 6, sensation: 'Excelente' },
    { id: '6', date: '2025-01-12', exercise: 'Sentadilla', weight: 80, reps: 5, sensation: 'Bien' },
  ] as Metric[],
  
  achievements: [
    { id: '1', title: 'Primera Sentadilla 80kg', description: 'Logré romper mi barrera de los 80kg por primera vez.', points: 50, status: 'approved', date: '2025-01-12', author: 'Juan Pérez', category: 'Fuerza' },
    { id: '2', title: 'Constancia de Acero', description: 'Asistí a todas las sesiones del mes de Diciembre.', points: 100, status: 'approved', date: '2025-01-01', author: 'Juan Pérez', category: 'Constancia' },
    { id: '3', title: '10k Running', description: 'Corrí 10km el fin de semana en menos de 55 mins.', points: 30, status: 'pending', date: '2025-01-20', author: 'Juan Pérez', category: 'Resistencia' },
    { id: '4', title: '50 Burpees seguidos', description: 'Sin descanso, en menos de 5 minutos.', points: 40, status: 'pending', date: '2025-01-25', author: 'María González', category: 'Resistencia' },
    { id: '101', title: 'Maratón Finalizada', description: 'Completé mi primera maratón en Santiago!', points: 200, status: 'approved', date: '2025-01-26', author: 'María González', category: 'Resistencia' },
    { id: '102', title: 'Muscle Up', description: 'Por fin salió el primer Muscle Up limpio.', points: 80, status: 'approved', date: '2025-01-26', author: 'Carlos Ruiz', category: 'Calistenia' },
  ] as Achievement[],

  sessions: [
    { id: '1', date: '2025-01-27T10:00:00', trainer: 'Tommy Coach', client: 'Juan Pérez', status: 'confirmed', duration: 60 },
    { id: '2', date: '2025-01-27T11:30:00', trainer: 'Tommy Coach', client: 'María González', status: 'confirmed', duration: 60 },
    { id: '3', date: '2025-01-30T10:00:00', trainer: 'Tommy Coach', client: 'Juan Pérez', status: 'pending', duration: 60 },
  ] as Session[],

  clients: [
    { id: '1', name: 'Juan Pérez', plan: 'Estándar', lastSession: '2025-01-27', status: 'active', avatarColor: 'bg-blue-100 text-blue-600' },
    { id: '2', name: 'María González', plan: 'Intensivo', lastSession: '2025-01-25', status: 'active', avatarColor: 'bg-purple-100 text-purple-600' },
    { id: '3', name: 'Carlos Ruiz', plan: 'Básico', lastSession: '2025-01-10', status: 'inactive', avatarColor: 'bg-gray-100 text-gray-600' },
  ] as Client[]
};

// --- 3. UI COMPONENTS (SHARED) ---

const Button = ({ children, variant = 'primary', className = '', isLoading, ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-primary hover:bg-primary-dark text-white shadow-sm focus:ring-primary",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-200",
    outline: "border border-primary text-primary hover:bg-blue-50 focus:ring-primary",
    ghost: "hover:bg-gray-100 text-gray-700",
    danger: "bg-danger text-white hover:bg-red-600 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  };
  
  return (
    <button className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-orange-100 text-orange-800",
    primary: "bg-blue-100 text-blue-800",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </span>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input 
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
      {...props}
    />
  </div>
);

const Select = ({ label, children, ...props }: any) => (
  <div className="space-y-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <select 
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white"
      {...props}
    >
      {children}
    </select>
  </div>
);

// --- 4. LAYOUT COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-lg mb-1 transition-colors ${
      active 
        ? 'bg-blue-50 text-primary font-medium' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-500'}`} />
    {!collapsed && <span className="ml-3">{label}</span>}
  </button>
);

const UserProfileDropdown = ({ role }: { role: UserRole }) => (
  <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
    <div className="text-right hidden sm:block">
      <p className="text-sm font-medium text-gray-900">{role === 'client' ? 'Juan Pérez' : 'Tommy Coach'}</p>
      <p className="text-xs text-gray-500 capitalize">{role}</p>
    </div>
    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-primary/20">
      {role === 'client' ? 'JP' : 'TC'}
    </div>
  </div>
);

// --- 5. PAGE COMPONENTS (Ready for app/*) ---

const LoginPage = ({ onLogin }: { onLogin: (role: UserRole) => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (role: UserRole) => {
    setIsLoading(true);
    // Simulating API latency
    setTimeout(() => {
      onLogin(role);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TommyBox</h1>
          <p className="text-gray-500">Gestión de Entrenamiento Inteligente</p>
        </div>
        
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit('client'); }}>
          <Input label="Email" type="email" placeholder="usuario@tommybox.com" defaultValue="juan@demo.com" />
          <Input label="Contraseña" type="password" defaultValue="password" />
          <Button type="submit" className="w-full text-lg h-12" isLoading={isLoading}>Iniciar Sesión (Cliente)</Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">O</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => handleSubmit('trainer')} disabled={isLoading}>
          Acceder como Entrenador (Demo)
        </Button>
      </Card>
    </div>
  );
};

const DashboardPage = ({ setView }: { setView: (v: string) => void }) => {
  // En Next.js, aquí usarías `await prisma.metric.findMany()`
  const metrics = DB.metrics;
  const achievements = DB.achievements;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1 md:col-span-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-blue-100 font-medium mb-1">Bienvenido de nuevo</p>
              <h2 className="text-3xl font-bold mb-4">Juan Pérez</h2>
              <div className="flex gap-3">
                <Badge variant="default" className="bg-white/20 text-white border-none backdrop-blur-sm">Plan Estándar</Badge>
                <Badge variant="default" className="bg-white/20 text-white border-none backdrop-blur-sm">Nivel 5</Badge>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
          </div>
          <div className="relative z-10 mt-8 grid grid-cols-3 gap-4">
            <div>
              <p className="text-blue-100 text-sm">Puntos</p>
              <p className="text-2xl font-bold">1,250</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Racha</p>
              <p className="text-2xl font-bold">12 días</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Sesiones</p>
              <p className="text-2xl font-bold">4/8</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Próxima Sesión</h3>
              <Badge variant="success">Confirmada</Badge>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                 <p className="text-lg font-bold text-gray-900">Lun, 27 Ene</p>
                 <p className="text-sm text-gray-500">Mañana</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-500 mb-6 pl-12">
              <Clock className="w-4 h-4" />
              <p className="text-sm">10:00 AM • 60 min</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setView('schedule')}>
            Ver Agenda
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Progreso de Fuerza
              </h3>
              <p className="text-sm text-gray-500">Evolución de carga en kg</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#E5E7EB" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={['auto', 'auto']} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Bienestar Semanal</h3>
          <p className="text-sm text-gray-500 mb-6">Sensación post-entreno</p>
          <div className="flex-grow h-[200px]">
             {/* Chart simplified for migration example */}
             <div className="flex items-end justify-between h-full px-2 gap-2">
                {['Excelente', 'Bien', 'Regular', 'Cansado'].map((label, i) => (
                  <div key={label} className="flex flex-col items-center w-full group">
                    <div style={{height: `${Math.random() * 80 + 20}%`}} className="w-full bg-blue-100 rounded-t-md group-hover:bg-primary transition-colors"></div>
                    <span className="text-[10px] text-gray-500 mt-2 truncate w-full text-center">{label}</span>
                  </div>
                ))}
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const MetricsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const metrics = DB.metrics;
  
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Métricas</h2>
          <p className="text-gray-500">Registro detallado de tu progreso</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Métrica
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-100 animate-in fade-in slide-in-from-top-4">
           {/* Form content would go here */}
           <div className="text-center py-4">Formulario de registro (Conectar a Server Action en Next.js)</div>
           <Button variant="ghost" className="w-full" onClick={() => setShowForm(false)}>Cerrar</Button>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Ejercicio</th>
                <th className="px-6 py-3">Peso</th>
                <th className="px-6 py-3">Sensación</th>
              </tr>
            </thead>
            <tbody>
              {metrics.slice().reverse().map((metric) => (
                <tr key={metric.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {new Date(metric.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4">{metric.exercise}</td>
                  <td className="px-6 py-4 font-semibold">{metric.weight} kg</td>
                  <td className="px-6 py-4"><Badge variant="primary">{metric.sensation}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const AchievementsPage = () => {
  const [activeTab, setActiveTab] = useState<'mine' | 'new'>('mine');
  const achievements = DB.achievements;
  const myAchievements = achievements.filter(a => a.author === 'Juan Pérez'); // In a real app this uses auth session

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Logros</h2>
          <p className="text-gray-500">Supera tus límites y gana puntos</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('mine')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Mis Logros ({myAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'new' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Proponer Nuevo Logro
          </button>
        </nav>
      </div>

      {activeTab === 'mine' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myAchievements.map(ach => (
            <Card key={ach.id} className="p-5 flex gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${ach.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                <Trophy className="w-8 h-8" />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900">{ach.title}</h3>
                  <Badge variant={ach.status === 'approved' ? 'success' : 'warning'}>{ach.status === 'approved' ? 'Aprobado' : 'Revisión'}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{ach.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">+{ach.points} pts</span>
                  <span>{new Date(ach.date).toLocaleDateString()}</span>
                  <span>• {ach.category}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="max-w-2xl p-6 mx-auto">
           <form className="space-y-4">
             <div className="space-y-2">
                <h3 className="text-lg font-medium">Nuevo Logro Personal</h3>
                <p className="text-sm text-gray-500">Describe qué has conseguido.</p>
             </div>
             <Input label="Título del Logro" placeholder="Ej: Primera dominada estricta" />
             <Input label="Puntos Sugeridos" type="number" defaultValue="50" />
             <div className="pt-4 flex justify-end">
               <Button>Enviar para Aprobación</Button>
             </div>
           </form>
        </Card>
      )}
    </div>
  )
}

const CommunityPage = () => {
  // In Next.js this would be await prisma.achievement.findMany({ where: { status: 'approved' }, include: { user: true } })
  const feed = DB.achievements.filter(a => a.status === 'approved');

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Comunidad TommyBox</h2>
        <p className="text-gray-500">Celebra las victorias del equipo</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {feed.map((post) => (
          <Card key={post.id} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {post.author.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{post.author}</p>
                <p className="text-xs text-gray-500">{new Date(post.date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="pl-13 ml-13">
              <div className="flex items-start gap-4 mb-4 bg-gray-50 p-4 rounded-xl">
                 <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-2xl">
                    🏆
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900">{post.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{post.description}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="primary" className="text-[10px]">+{post.points} pts</Badge>
                      <Badge variant="default" className="text-[10px]">{post.category}</Badge>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>12</span>
                </button>
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span>Comentar</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

const SchedulePage = () => {
  const sessions = DB.sessions;
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Agenda</h2>
          <p className="text-gray-500">Próximas sesiones</p>
        </div>
        <Button><Calendar className="w-4 h-4 mr-2" /> Agendar</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600 font-bold text-center">
                  <span className="block text-2xl">{new Date(session.date).getDate()}</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{session.trainer}</h4>
                  <p className="text-sm text-gray-500">{new Date(session.date).toLocaleTimeString()} - {session.duration} min</p>
                </div>
              </div>
              <Badge variant={session.status === 'confirmed' ? 'success' : 'warning'}>{session.status}</Badge>
            </Card>
          ))}
      </div>
    </div>
  )
}

const TrainerDashboardPage = ({ setView }: { setView: (v: string) => void }) => {
  const pendingAchievements = DB.achievements.filter(a => a.status === 'pending');
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Panel de Entrenador</h2>
           <p className="text-gray-500">Vista general</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500">Sesiones Hoy</p>
          <p className="text-2xl font-bold">5</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-orange-500">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold">{pendingAchievements.length}</p>
        </Card>
      </div>
      {/* List of pending approvals */}
      <div className="space-y-4">
          <h3 className="font-bold text-gray-900">Aprobaciones Pendientes</h3>
          {pendingAchievements.map(ach => (
            <Card key={ach.id} className="p-4 flex justify-between items-center">
               <div>
                 <p className="font-bold">{ach.author}</p>
                 <p className="text-sm text-gray-500">{ach.title}</p>
               </div>
               <div className="flex gap-2">
                 <Button variant="success" className="h-8 text-xs">Aprobar</Button>
                 <Button variant="outline" className="h-8 text-xs text-red-500">Rechazar</Button>
               </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

const TrainerClientsPage = () => {
  const clients = DB.clients;
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mis Clientes</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => (
          <Card key={client.id} className="p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 ${client.avatarColor}`}>
              {client.name.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
            <div className="flex items-center gap-2 mt-1 mb-4">
              <Badge variant={client.status === 'active' ? 'success' : 'default'}>{client.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>
              <Badge variant="primary">{client.plan}</Badge>
            </div>
            <Button variant="ghost" className="w-full mt-auto border-t border-gray-100 pt-4">Ver Perfil</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

// --- 6. ROUTER / LAYOUT WRAPPER (Mimics app/layout.tsx + app/page.tsx) ---

const DashboardLayout = ({ children, currentView, setView, role, onLogout }: any) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Router logic simulation
  const clientLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'metrics', label: 'Mis Métricas', icon: Activity },
    { id: 'achievements', label: 'Logros', icon: Trophy },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'community', label: 'Comunidad', icon: Users },
  ];

  const trainerLinks = [
    { id: 'trainer-dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'trainer-clients', label: 'Mis Clientes', icon: Users },
    { id: 'community', label: 'Comunidad', icon: Users },
  ];

  const links = role === 'client' ? clientLinks : trainerLinks;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar - Componente 'Server' en Next.js */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} fixed h-full z-20`}>
        <div className="p-4 flex items-center justify-between h-16 border-b border-gray-100">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <TrendingUp className="w-6 h-6" />
              <span>TommyBox</span>
            </div>
          )}
          {sidebarCollapsed && <TrendingUp className="w-8 h-8 mx-auto text-primary" />}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hidden lg:block">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          {links.map(link => (
            <SidebarItem
              key={link.id}
              icon={link.icon}
              label={link.label}
              active={currentView === link.id}
              onClick={() => setView(link.id)}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <SidebarItem icon={LogOut} label="Cerrar Sesión" onClick={onLogout} collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
          <div className="flex items-center md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2 text-gray-600"><Menu className="w-6 h-6" /></button>
            <span className="font-bold text-lg ml-2 text-primary">TommyBox</span>
          </div>
          <div className="hidden md:block">
            <h1 className="font-semibold text-lg capitalize text-gray-700">{links.find(l => l.id === currentView)?.label}</h1>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="ghost" className="rounded-full p-2"><Bell className="w-5 h-5" /></Button>
             <UserProfileDropdown role={role} />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- 7. MAIN APP ENTRY (Client-Side Router Simulation) ---

const App = () => {
  const [currentView, setCurrentView] = useState<string>('login');
  const [userRole, setUserRole] = useState<UserRole>('client');

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setCurrentView(role === 'client' ? 'dashboard' : 'trainer-dashboard');
  };

  const handleLogout = () => {
    setCurrentView('login');
  };

  if (currentView === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <DashboardLayout 
      currentView={currentView} 
      setView={setCurrentView} 
      role={userRole} 
      onLogout={handleLogout}
    >
      {/* Router Switch Simulation */}
      {currentView === 'dashboard' && <DashboardPage setView={setCurrentView} />}
      {currentView === 'metrics' && <MetricsPage />}
      {currentView === 'achievements' && <AchievementsPage />}
      {currentView === 'schedule' && <SchedulePage />}
      {currentView === 'community' && <CommunityPage />}
      
      {currentView === 'trainer-dashboard' && <TrainerDashboardPage setView={setCurrentView} />}
      {currentView === 'trainer-clients' && <TrainerClientsPage />}
    </DashboardLayout>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
