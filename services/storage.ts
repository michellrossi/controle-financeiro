import { Transaction, CreditCard, TransactionType, TransactionStatus, User, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  enableIndexedDbPersistence
} from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_-G-btdRLcjdE--seBNVS28Yvk-_ecI0",
  authDomain: "app-financeiro-2026.firebaseapp.com",
  projectId: "app-financeiro-2026",
  storageBucket: "app-financeiro-2026.firebasestorage.app",
  messagingSenderId: "430504885966",
  appId: "1:430504885966:web:a6142506f5c41ff9175a9f",
  measurementId: "G-TR9F85VDRN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Helpers
export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export const getInvoiceMonth = (date: Date, closingDay: number): Date => {
  const d = new Date(date);
  if (d.getDate() > closingDay) {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
};

export const generateInstallments = (baseTransaction: Transaction, totalInstallments: number, amountType: 'total' | 'installment' = 'installment'): Transaction[] => {
  if (totalInstallments <= 1) return [baseTransaction];

  const transactions: Transaction[] = [];
  const groupId = crypto.randomUUID();
  const baseDate = new Date(baseTransaction.date);

  // Calculate amount per installment
  const installmentValue = amountType === 'total' 
    ? baseTransaction.amount / totalInstallments 
    : baseTransaction.amount;

  for (let i = 0; i < totalInstallments; i++) {
    const newDate = new Date(baseDate);
    newDate.setMonth(baseDate.getMonth() + i);

    transactions.push({
      ...baseTransaction,
      id: crypto.randomUUID(), // Temp ID, will be replaced by Firestore
      amount: parseFloat(installmentValue.toFixed(2)),
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

// Async Service Layer
export const StorageService = {
  // --- Auth ---
  authInstance: auth,
  
  observeAuth: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        callback({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${fbUser.displayName || 'U'}&background=10B981&color=fff`
        });
      } else {
        callback(null);
      }
    });
  },

  loginGoogle: async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  },

  loginEmail: async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  },

  registerEmail: async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  // --- Transactions ---
  // Path: artifacts > default-app-id > users > {userId} > transactions
  
  getTransactions: async (userId: string): Promise<Transaction[]> => {
    // Access subcollection directly. No need for 'where userId' filter.
    const subColRef = collection(db, "artifacts", "default-app-id", "users", userId, "transactions");
    const querySnapshot = await getDocs(subColRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  },

  addTransaction: async (userId: string, t: Transaction) => {
    const { id, ...data } = t; 
    const subColRef = collection(db, "artifacts", "default-app-id", "users", userId, "transactions");
    await addDoc(subColRef, { ...data, userId });
  },

  updateTransaction: async (userId: string, t: Transaction) => {
    const { id, ...data } = t;
    const docRef = doc(db, "artifacts", "default-app-id", "users", userId, "transactions", id);
    await updateDoc(docRef, data);
  },

  deleteTransaction: async (userId: string, id: string) => {
    const docRef = doc(db, "artifacts", "default-app-id", "users", userId, "transactions", id);
    await deleteDoc(docRef);
  },

  toggleStatus: async (userId: string, t: Transaction) => {
    const newStatus = t.status === TransactionStatus.COMPLETED ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;
    const docRef = doc(db, "artifacts", "default-app-id", "users", userId, "transactions", t.id);
    await updateDoc(docRef, { status: newStatus });
  },

  // --- Cards ---
  // Path: artifacts > default-app-id > users > {userId} > cards

  getCards: async (userId: string): Promise<CreditCard[]> => {
    const subColRef = collection(db, "artifacts", "default-app-id", "users", userId, "cards");
    const querySnapshot = await getDocs(subColRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditCard));
  },

  addCard: async (userId: string, c: CreditCard) => {
    const { id, ...data } = c;
    const subColRef = collection(db, "artifacts", "default-app-id", "users", userId, "cards");
    await addDoc(subColRef, { ...data, userId });
  },

  updateCard: async (userId: string, c: CreditCard) => {
    const { id, ...data } = c;
    const docRef = doc(db, "artifacts", "default-app-id", "users", userId, "cards", id);
    await updateDoc(docRef, data);
  },

  deleteCard: async (userId: string, id: string) => {
    const docRef = doc(db, "artifacts", "default-app-id", "users", userId, "cards", id);
    await deleteDoc(docRef);
  }
};