import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ShoppingCart, Package,
  CreditCard, Truck, LogOut, Wrench, ClipboardList, SlidersHorizontal, ScanLine,
} from 'lucide-react'

const LINKS_ADMIN = [
  { to: '/',               label: 'Dashboard',       Icono: LayoutDashboard    },
  { to: '/pos',            label: 'POS',             Icono: ShoppingCart       },
  { to: '/productos',      label: 'Productos',       Icono: Package            },
  { to: '/ventas',         label: 'Ventas',          Icono: CreditCard         },
  { to: '/remitos',        label: 'Remitos',         Icono: ClipboardList      },
  { to: '/ajuste-stock',   label: 'Ajuste stock',    Icono: SlidersHorizontal  },
  { to: '/ingreso-factura',label: 'Ingreso factura', Icono: ScanLine           },
]

const LINKS_EMPLEADO = [
  { to: '/pos',        label: 'POS',        Icono: ShoppingCart },
  { to: '/ventas',     label: 'Mis ventas', Icono: CreditCard },
  { to: '/recepcion',  label: 'Recepción',  Icono: Truck },
]

export default function Sidebar() {
  const { isAdmin, logout } = useAuth()
  const links = isAdmin() ? LINKS_ADMIN : LINKS_EMPLEADO

  return (
    <aside className="w-60 min-h-screen bg-[#1A1A2E] border-r border-white/5 flex flex-col">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF6B35] rounded-xl flex items-center justify-center shrink-0">
            <Wrench size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-black text-base tracking-tight" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              FERRE<span className="text-[#FF6B35]">MAX</span>
            </p>
            <p className="text-[10px] text-white/25 uppercase tracking-widest">Sistema ERP</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 pb-3">Menú</p>
        {links.map(({ to, label, Icono }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-[#FF6B35]/15 text-[#FF6B35]'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[#FF6B35]/20' : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icono size={14} className={isActive ? 'text-[#FF6B35]' : 'text-white/40 group-hover:text-white/70'} />
                </div>
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 group"
        >
          <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-red-500/15 flex items-center justify-center transition-colors">
            <LogOut size={14} className="text-white/30 group-hover:text-red-400 transition-colors" />
          </div>
          Cerrar sesión
        </button>
        <p className="text-[10px] text-white/10 px-3 mt-3 font-mono">v1.0.0</p>
      </div>
    </aside>
  )
}
