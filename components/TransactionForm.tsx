import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, INCOME_CATEGORIES, EXPENSE_CATEGORIES, CreditCard } from '../types';
import { X, Calendar, DollarSign, CreditCard as CardIcon, Type, Layers } from 'lucide-react';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (t: Transaction, installments: number) => void;
  initialData?: Transaction | null;
  cards: CreditCard[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit, initialData, cards }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState('');
  const [cardId, setCardId] = useState('');
  const [installments, setInstallments] = useState(1);
  const [status, setStatus] = useState<TransactionStatus>(TransactionStatus.COMPLETED);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setDate(initialData.date.split('T')[0]);
      setType(initialData.type);
      setCategory(initialData.category);
      setCardId(initialData.cardId || '');
      setStatus(initialData.status);
      setInstallments(1); // Editing installments is complex, disabling for simplicity
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setType(TransactionType.EXPENSE);
    setCategory(EXPENSE_CATEGORIES[0]);
    setCardId(cards[0]?.id || '');
    setStatus(TransactionStatus.COMPLETED);
    setInstallments(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    const newTransaction: Transaction = {
      id: initialData?.id || crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      type,
      category,
      status: type === TransactionType.CARD_EXPENSE ? TransactionStatus.COMPLETED : status, // Card expenses are usually treated as "spent" on the card
      cardId: type === TransactionType.CARD_EXPENSE ? cardId : undefined,
    };

    onSubmit(newTransaction, installments);
    onClose();
  };

  if (!isOpen) return null;

  const categories = type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Type Selection */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {[
              { id: TransactionType.INCOME, label: 'Receita', color: 'bg-emerald-500 text-white' },
              { id: TransactionType.EXPENSE, label: 'Despesa', color: 'bg-rose-500 text-white' },
              { id: TransactionType.CARD_EXPENSE, label: 'Cartão', color: 'bg-indigo-500 text-white' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as TransactionType)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  type === t.id ? `${t.color} shadow-md` : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Description & Amount */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição</label>
              <div className="relative">
                <Type className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="Ex: Supermercado"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Valor</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="w-1/3">
                 <label className="block text-xs font-semibold text-slate-500 mb-1">Data</label>
                 <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
              </div>
            </div>
          </div>

          {/* Category & Card Logic */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {type === TransactionType.CARD_EXPENSE && (
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Cartão</label>
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Installments & Status */}
          <div className="flex gap-4">
             {/* Only show installments for new transactions to avoid complex edit logic */}
            {!initialData && (
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Parcelas (Recorrência)</label>
                <div className="relative">
                   <Layers className="absolute left-3 top-3 text-slate-400" size={18} />
                   <input
                    type="number"
                    min="1"
                    max="48"
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
            
            {type !== TransactionType.CARD_EXPENSE && (
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                <button
                  type="button"
                  onClick={() => setStatus(status === TransactionStatus.COMPLETED ? TransactionStatus.PENDING : TransactionStatus.COMPLETED)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    status === TransactionStatus.COMPLETED 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}
                >
                  {status === TransactionStatus.COMPLETED ? 'Concluído' : 'Pendente'}
                </button>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95"
            >
              Salvar Transação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};