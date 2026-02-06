import React from 'react';
import { ViewState, User } from '../types';
import { LayoutDashboard, ArrowUpCircle, ArrowDownCircle, CreditCard, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (v: ViewState) => void;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Helper for Desktop Icons
  const NavIcon = ({ view, icon: Icon, tooltip }: { view: ViewState; icon: any; tooltip: string }) => (
    <button
      onClick={() => setView(view)}
      className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
        currentView === view 
          ? 'bg-emerald-50 text-emerald-600' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
      title={tooltip}
    >
      <Icon size={24} strokeWidth={currentView === view ? 2.5 : 2} />
      {/* Tooltip */}
      <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        {tooltip}
      </span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar (Icon Only) */}
      <aside className="hidden md:flex flex-col items-center w-20 bg-white border-r border-slate-200 py-8">
        <div className="mb-10">
           <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <span className="text-white font-bold text-xl">F</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-4 w-full items-center px-2">
          <NavIcon view="DASHBOARD" icon={LayoutDashboard} tooltip="Visão Geral" />
          <NavIcon view="INCOMES" icon={ArrowUpCircle} tooltip="Entradas" />
          <NavIcon view="EXPENSES" icon={ArrowDownCircle} tooltip="Saídas" />
          <NavIcon view="CARDS" icon={CreditCard} tooltip="Cartões" />
        </nav>

        <div className="mt-auto flex flex-col gap-4 items-center w-full">
           <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
           <button 
             onClick={onLogout} 
             className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
             title="Sair"
           >
             <LogOut size={20} />
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-20 border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
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
           <button onClick={() => { setView('DASHBOARD'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-slate-50 font-medium text-slate-700"><LayoutDashboard size={20}/> Visão Geral</button>
           <button onClick={() => { setView('INCOMES'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-slate-50 font-medium text-slate-700"><ArrowUpCircle size={20}/> Entradas</button>
           <button onClick={() => { setView('EXPENSES'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-slate-50 font-medium text-slate-700"><ArrowDownCircle size={20}/> Saídas</button>
           <button onClick={() => { setView('CARDS'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-slate-50 font-medium text-slate-700"><CreditCard size={20}/> Cartões</button>
           
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