import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { CardsView } from './components/Cards';
import { TransactionForm } from './components/TransactionForm';
import { TransactionListModal } from './components/TransactionListModal';
import { CardForm } from './components/CardForm';
import { StorageService, generateInstallments, getInvoiceMonth } from './services/storage';
import { User, Transaction, ViewState, FilterState, CreditCard, TransactionType, TransactionStatus } from './types';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function App() {
  // --- Global State ---
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);

  // UX State - Transaction Form
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // UX State - Card Form
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // UX State - List Modal (Popup details)
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listModalTitle, setListModalTitle] = useState('');
  const [listModalTransactions, setListModalTransactions] = useState<Transaction[]>([]);

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
      // Fetch initial data
      const d = StorageService.getData();
      setCards(d.cards); 
      setTransactions(d.transactions);
    }
  }, []);

  const refreshData = () => {
    const d = StorageService.getData();
    setTransactions(d.transactions);
    setCards(d.cards);
  };

  // --- Auth Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPass) {
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

  // --- Transaction Handlers ---
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

  // --- Card Handlers ---
  const handleCardSubmit = (c: CreditCard) => {
    if (editingCard) StorageService.updateCard(c);
    else StorageService.addCard(c);
    refreshData();
  };

  const handleDeleteCard = (id: string) => {
    if (window.confirm('Excluir cartão?')) {
      StorageService.deleteCard(id);
      refreshData();
    }
  };

  // --- Modal Logic ---

  // Dashboard Card Click -> Popup with Paid Transactions
  const handleDashboardCardClick = (type: 'INCOME' | 'EXPENSE' | 'BALANCE') => {
    const targetDate = new Date(filter.year, filter.month, 1);
    
    let filteredT = transactions.filter(t => {
      // Date Check
      let dateMatch = isSameMonth(new Date(t.date), targetDate);
      if (t.type === TransactionType.CARD_EXPENSE && t.cardId) {
         const card = cards.find(c => c.id === t.cardId);
         if (card) dateMatch = isSameMonth(getInvoiceMonth(new Date(t.date), card.closingDay), targetDate);
      }
      return dateMatch;
    });

    // 2. Filter by Type and Status (PAID ONLY as requested)
    if (type === 'INCOME') {
      filteredT = filteredT.filter(t => t.type === TransactionType.INCOME && t.status === TransactionStatus.COMPLETED);
      setListModalTitle('Receitas Realizadas');
    } else if (type === 'EXPENSE') {
      filteredT = filteredT.filter(t => t.type !== TransactionType.INCOME && t.status === TransactionStatus.COMPLETED);
      setListModalTitle('Despesas Pagas');
    } else {
      // Balance - Show all realized
      filteredT = filteredT.filter(t => t.status === TransactionStatus.COMPLETED);
      setListModalTitle('Extrato Realizado');
    }

    setListModalTransactions(filteredT);
    setIsListModalOpen(true);
  };

  // Credit Card Click -> Popup with All Transactions for that card
  const handleCreditCardClick = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Show transactions for this card, filtering by invoice date usually, or just show all logic for this card in this view context
    // Let's show selected month invoice items
    const targetDate = new Date(filter.year, filter.month, 1);
    
    const cardTx = transactions.filter(t => 
      t.cardId === cardId && 
      isSameMonth(getInvoiceMonth(new Date(t.date), card.closingDay), targetDate)
    );

    setListModalTitle(`Fatura: ${card.name}`);
    setListModalTransactions(cardTx);
    setIsListModalOpen(true);
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

  // --- Filtering for Main Views ---
  const getFilteredTransactionsForView = () => {
    // If specific view (INCOMES/EXPENSES), filter globally for the table
    // If DASHBOARD/CARDS, this prop isn't strictly used by the view component in the same way
    if (currentView === 'INCOMES') {
      return transactions.filter(t => t.type === TransactionType.INCOME);
    }
    if (currentView === 'EXPENSES') {
      return transactions.filter(t => t.type !== TransactionType.INCOME);
    }
    return transactions;
  };

  // --- Render ---

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-inter">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
           <div className="text-center mb-8">
             <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg shadow-emerald-200">F</div>
             <h1 className="text-2xl font-bold text-slate-800">Finanças 2026</h1>
             <p className="text-slate-500 mt-2">Controle sua vida financeira.</p>
           </div>
           <form onSubmit={handleLogin} className="space-y-4">
             <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="seu@email.com" required />
             <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="••••••••" required />
             <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">Entrar</button>
           </form>
           <div className="mt-6 text-center">
             <button className="text-sm text-slate-400 hover:text-emerald-600">Criar nova conta</button>
           </div>
        </div>
      </div>
    );
  }

  const currentDateDisplay = format(new Date(filter.year, filter.month, 1), 'MMMM yyyy', { locale: ptBR });
  
  // Decide what title to show
  let viewTitle = 'Visão Geral';
  if (currentView === 'INCOMES') viewTitle = 'Minhas Entradas';
  if (currentView === 'EXPENSES') viewTitle = 'Minhas Saídas';
  if (currentView === 'CARDS') viewTitle = 'Meus Cartões';

  return (
    <Layout currentView={currentView} setView={setCurrentView} user={user} onLogout={handleLogout}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 capitalize">{viewTitle}</h1>
           <p className="text-slate-500 text-sm">Bem vindo de volta, {user.name.split(' ')[0]}</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft size={20} /></button>
              <span className="min-w-[140px] text-center font-medium text-slate-700 capitalize select-none">{currentDateDisplay}</span>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight size={20} /></button>
           </div>
           
           <button 
             onClick={() => { setEditingTransaction(null); setIsTxModalOpen(true); }}
             className="flex items-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-xl hover:bg-slate-900 transition-all shadow-lg font-medium"
           >
             <Plus size={20} />
             <span className="hidden md:inline">Nova Transação</span>
           </button>
        </div>
      </div>

      {/* Content */}
      {currentView === 'DASHBOARD' && (
        <Dashboard 
          transactions={transactions} 
          filter={filter} 
          cards={cards} 
          onViewDetails={handleDashboardCardClick}
        />
      )}
      
      {(currentView === 'INCOMES' || currentView === 'EXPENSES') && (
        <Transactions 
          transactions={getFilteredTransactionsForView()} 
          filter={filter} 
          onEdit={(t) => { setEditingTransaction(t); setIsTxModalOpen(true); }} 
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}
      
      {currentView === 'CARDS' && (
        <CardsView 
          cards={cards} 
          transactions={transactions} 
          filterMonth={filter.month} 
          filterYear={filter.year} 
          onCardClick={handleCreditCardClick}
          onAddTransaction={(cardId) => {
            // Pre-fill transaction form for this card
            setEditingTransaction({ 
              id: '', description: '', amount: 0, date: new Date().toISOString(),
              type: TransactionType.CARD_EXPENSE, category: 'Outros', status: TransactionStatus.COMPLETED,
              cardId: cardId
            });
            setIsTxModalOpen(true);
          }}
          onEditCard={(c) => { setEditingCard(c); setIsCardFormOpen(true); }}
          onDeleteCard={handleDeleteCard}
          onAddNewCard={() => { setEditingCard(null); setIsCardFormOpen(true); }}
        />
      )}

      {/* Modals */}
      <TransactionForm 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)} 
        onSubmit={handleTransactionSubmit}
        initialData={editingTransaction}
        cards={cards}
      />

      <CardForm 
        isOpen={isCardFormOpen}
        onClose={() => setIsCardFormOpen(false)}
        onSubmit={handleCardSubmit}
        initialData={editingCard}
      />

      <TransactionListModal 
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        title={listModalTitle}
        transactions={listModalTransactions}
      />

    </Layout>
  );
}

export default App;