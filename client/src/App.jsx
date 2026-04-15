import { Routes, Route, NavLink } from 'react-router-dom'
import { Home, Beef, Syringe, Baby, Scale, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Matrizes from './pages/Matrizes'
import Inseminacoes from './pages/Inseminacoes'
import Bezerros from './pages/Bezerros'
import Pesagens from './pages/Pesagens'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/matrizes', icon: Beef, label: 'Matrizes' },
  { to: '/inseminacoes', icon: Syringe, label: 'Inseminações' },
  { to: '/bezerros', icon: Baby, label: 'Bezerros' },
  { to: '/pesagens', icon: Scale, label: 'Pesagens' },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-green-800 text-white transform transition-transform duration-200
        lg:translate-x-0 lg:static lg:inset-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">&#x1F404;</span> Fazenda
          </h1>
          <p className="text-green-200 text-sm mt-1">Controle de Rebanho</p>
        </div>
        <nav className="mt-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-green-700 text-white border-r-4 border-green-300'
                  : 'text-green-100 hover:bg-green-700/50'}`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar mobile */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-lg font-semibold text-green-800">Fazenda</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/matrizes" element={<Matrizes />} />
            <Route path="/inseminacoes" element={<Inseminacoes />} />
            <Route path="/bezerros" element={<Bezerros />} />
            <Route path="/pesagens" element={<Pesagens />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
