import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { CardsView } from './components/Cards';
import { TransactionForm } from './components/TransactionForm';
import { StorageService, generateInstallments } from './services/storage';
import { User, Transaction, ViewState, FilterState } from './types';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function App() {
  // --- Global State ---
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState(StorageService.getCards());

  // UX State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Auth (Mock)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // --- Effects ---
  useEffect(() => {
    const u = StorageService.getUser();
    if (u) {
      setUser(u);
      refreshData();
    }
  }, []);

  const refreshData = () => {
    const d = StorageService.getData();
    setTransactions(d.transactions);
    setCards(d.cards);
  };

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPass) {
      // Mock logic: name is part before @
      const name = loginEmail.split('@')[0];
      const u = StorageService.login(name.charAt(0).toUpperCase() + name.slice(1), loginEmail);
      setUser(u);
      refreshData();
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
  };

  const handleTransactionSubmit = (t: Transaction, installments: number) => {
    if (editingTransaction) {
      StorageService.updateTransaction(t);
    } else {
      const allT = generateInstallments(t, installments);
      allT.forEach(tx => StorageService.addTransaction(tx));
    }
    refreshData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      StorageService.deleteTransaction(id);
      refreshData();
    }
  };

  const handleToggleStatus = (id: string) => {
    StorageService.toggleStatus(id);
    refreshData();
  };

  const changeMonth = (increment: number) => {
    setFilter(prev => {
      let newMonth = prev.month + increment;
      let newYear = prev.year;
      
      if (newMonth > 11) { newMonth = 0; newYear++; }
      if (newMonth < 0) { newMonth = 11; newYear--; }
      
      return { ...prev, month: newMonth, year: newYear };
    });
  };

  // --- Render ---

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
           <div className="text-center mb-8">
             <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">F</div>
             <h1 className="text-2xl font-bold text-slate-800">Finanças 2026</h1>
             <p className="text-slate-500 mt-2">Controle sua vida financeira.</p>
           </div>
           <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
               <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="seu@email.com" required />
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-500 mb-1">Senha</label>
               <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" required />
             </div>
             <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Entrar</button>
           </form>
           <div className="mt-6 text-center">
             <button className="text-sm text-slate-400 hover:text-blue-600">Criar nova conta</button>
           </div>
        </div>
      </div>
    );
  }

  const currentDateDisplay = format(new Date(filter.year, filter.month, 1), 'MMMM yyyy', { locale: ptBR });

  return (
    <Layout currentView={currentView} setView={setCurrentView} user={user} onLogout={handleLogout}>
      
      {/* Header / Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 capitalize">
             {currentView === 'DASHBOARD' ? 'Visão Geral' : 
              currentView === 'TRANSACTIONS' ? 'Extrato' : 'Meus Cartões'}
           </h1>
           <p className="text-slate-500 text-sm">Bem vindo de volta, {user.name.split(' ')[0]}</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft size={20} /></button>
              <span className="min-w-[140px] text-center font-medium text-slate-700 capitalize select-none">{currentDateDisplay}</span>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight size={20} /></button>
           </div>
           
           <button 
             onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
             className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-medium"
           >
             <Plus size={20} />
             <span className="hidden md:inline">Nova Transação</span>
           </button>
        </div>
      </div>

      {/* Main Views */}
      {currentView === 'DASHBOARD' && <Dashboard transactions={transactions} filter={filter} cards={cards} />}
      
      {currentView === 'TRANSACTIONS' && (
        <Transactions 
          transactions={transactions} 
          filter={filter} 
          onEdit={(t) => { setEditingTransaction(t); setIsModalOpen(true); }} 
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}
      
      {currentView === 'CARDS' && (
        <CardsView cards={cards} transactions={transactions} filterMonth={filter.month} filterYear={filter.year} />
      )}

      {/* Modals */}
      <TransactionForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleTransactionSubmit}
        initialData={editingTransaction}
        cards={cards}
      />

    </Layout>
  );
}

export default App;