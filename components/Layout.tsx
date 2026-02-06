import React from 'react';
import { ViewState, User } from '../types';
import { LayoutDashboard, Receipt, CreditCard, LogOut, Menu, X } from 'lucide-react';
import { StorageService } from '../services/storage';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (v: ViewState) => void;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, label, icon: Icon }: { view: ViewState; label: string; icon: any }) => (
    <button
      onClick={() => { setView(view); setIsMobileMenuOpen(false); }}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-bold text-slate-800">Finanças 2026</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem view="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
          <NavItem view="TRANSACTIONS" label="Transações" icon={Receipt} />
          <NavItem view="CARDS" label="Cartões" icon={CreditCard} />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 px-2 text-sm transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-20 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
         <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">F</span>
          </div>
          <span className="font-bold text-slate-800">Finanças 2026</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
           {isMobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-10 pt-20 px-4 flex flex-col gap-2">
           <NavItem view="DASHBOARD" label="Dashboard" icon={LayoutDashboard} />
           <NavItem view="TRANSACTIONS" label="Transações" icon={Receipt} />
           <NavItem view="CARDS" label="Cartões" icon={CreditCard} />
           <div className="mt-auto mb-8 border-t pt-4">
              <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 font-medium">
                <LogOut size={20} /> Sair da conta
              </button>
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};