import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Home, Beef, Syringe, Baby, Scale, Wheat, Menu, X, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Dashboard from './pages/Dashboard'
import Matrizes from './pages/Matrizes'
import Inseminacoes from './pages/Inseminacoes'
import Bezerros from './pages/Bezerros'
import Pesagens from './pages/Pesagens'
import Alimentacao from './pages/Alimentacao'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/matrizes', icon: Beef, label: 'Matrizes' },
  { to: '/inseminacoes', icon: Syringe, label: 'Inseminações' },
  { to: '/bezerros', icon: Baby, label: 'Bezerros' },
  { to: '/alimentacao', icon: Wheat, label: 'Alimentação' },
  { to: '/pesagens', icon: Scale, label: 'Pesagens' },
]

const pageLabels = {
  '/': 'Dashboard',
  '/matrizes': 'Matrizes',
  '/inseminacoes': 'Inseminações',
  '/bezerros': 'Bezerros',
  '/alimentacao': 'Alimentação',
  '/pesagens': 'Pesagens',
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const currentPage = pageLabels[location.pathname] || ''

  return (
    <div className="flex h-screen bg-gray-50/80">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:inset-auto',
        'bg-gradient-to-b from-green-800 via-green-800 to-green-900 text-white',
        'shadow-xl lg:shadow-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm">
              &#x1F404;
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Fazenda</h1>
              <p className="text-green-300 text-xs font-medium">Controle de Rebanho</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/10" />

        {/* Nav */}
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/15 text-white shadow-sm backdrop-blur-sm'
                  : 'text-green-200 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon size={18} strokeWidth={isActive => isActive ? 2.5 : 2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-white/8 rounded-lg px-3 py-2 text-center">
            <p className="text-green-300 text-xs">v1.0 — Fazenda App</p>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-4 lg:px-6 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-1.5 text-sm">
            <span className="text-gray-400">Fazenda</span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="font-medium text-gray-700">{currentPage}</span>
          </div>

          <h1 className="lg:hidden text-lg font-semibold text-gray-800">{currentPage}</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/matrizes" element={<Matrizes />} />
            <Route path="/inseminacoes" element={<Inseminacoes />} />
            <Route path="/bezerros" element={<Bezerros />} />
            <Route path="/alimentacao" element={<Alimentacao />} />
            <Route path="/pesagens" element={<Pesagens />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
