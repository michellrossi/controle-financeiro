import { Transaction, CreditCard, TransactionType, TransactionStatus, User, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';

const STORAGE_KEY_DATA = 'financas2026_data';
const STORAGE_KEY_USER = 'financas2026_user';

interface AppData {
  transactions: Transaction[];
  cards: CreditCard[];
}

// Seed Data for Demo
const INITIAL_CARDS: CreditCard[] = [
  { id: 'c1', name: 'Nubank', limit: 8000, closingDay: 5, dueDay: 12, color: 'bg-purple-600' },
  { id: 'c2', name: 'XP Infinite', limit: 25000, closingDay: 20, dueDay: 27, color: 'bg-slate-800' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', description: 'Salário Mensal', amount: 8500, date: new Date().toISOString(), type: TransactionType.INCOME, category: 'Salário', status: TransactionStatus.COMPLETED },
  { id: 't2', description: 'Aluguel', amount: 2200, date: new Date().toISOString(), type: TransactionType.EXPENSE, category: 'Apê', status: TransactionStatus.PENDING },
  { id: 't3', description: 'Netflix', amount: 55.90, date: new Date().toISOString(), type: TransactionType.CARD_EXPENSE, category: 'Assinaturas', status: TransactionStatus.COMPLETED, cardId: 'c1' },
];

export const StorageService = {
  // --- Auth & User ---
  getUser: (): User | null => {
    const u = localStorage.getItem(STORAGE_KEY_USER);
    return u ? JSON.parse(u) : null;
  },

  login: (name: string, email: string): User => {
    const user: User = { id: 'u1', name, email, avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff` };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    
    // Initialize data if empty
    if (!localStorage.getItem(STORAGE_KEY_DATA)) {
      const data: AppData = { transactions: INITIAL_TRANSACTIONS, cards: INITIAL_CARDS };
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
    }
    return user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  // --- Data Access ---
  getData: (): AppData => {
    const d = localStorage.getItem(STORAGE_KEY_DATA);
    return d ? JSON.parse(d) : { transactions: [], cards: [] };
  },

  saveData: (data: AppData) => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
  },

  // --- Transactions ---
  addTransaction: (t: Transaction) => {
    const data = StorageService.getData();
    data.transactions.push(t);
    StorageService.saveData(data);
  },

  updateTransaction: (updated: Transaction) => {
    const data = StorageService.getData();
    data.transactions = data.transactions.map(t => t.id === updated.id ? updated : t);
    StorageService.saveData(data);
  },

  deleteTransaction: (id: string) => {
    const data = StorageService.getData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    StorageService.saveData(data);
  },

  toggleStatus: (id: string) => {
    const data = StorageService.getData();
    const t = data.transactions.find(tx => tx.id === id);
    if (t) {
      if (t.status === TransactionStatus.COMPLETED) t.status = TransactionStatus.PENDING;
      else t.status = TransactionStatus.COMPLETED;
      StorageService.saveData(data);
    }
  },

  // --- Cards ---
  getCards: (): CreditCard[] => {
    return StorageService.getData().cards;
  }
};

// --- Logic Helpers ---

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export const getInvoiceMonth = (date: Date, closingDay: number): Date => {
  const d = new Date(date);
  if (d.getDate() > closingDay) {
    // Moves to next month
    d.setMonth(d.getMonth() + 1);
  }
  return d;
};

// Generates an array of transaction objects if installments > 1
export const generateInstallments = (baseTransaction: Transaction, totalInstallments: number): Transaction[] => {
  if (totalInstallments <= 1) return [baseTransaction];

  const transactions: Transaction[] = [];
  const groupId = crypto.randomUUID();
  const baseDate = new Date(baseTransaction.date);

  for (let i = 0; i < totalInstallments; i++) {
    const newDate = new Date(baseDate);
    newDate.setMonth(baseDate.getMonth() + i);

    transactions.push({
      ...baseTransaction,
      id: crypto.randomUUID(),
      date: newDate.toISOString(),
      installments: {
        current: i + 1,
        total: totalInstallments,
        groupId
      }
    });
  }
  return transactions;
};