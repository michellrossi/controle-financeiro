import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, TransactionStatus, FilterState } from '../types';
import { formatCurrency } from '../services/storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUp, ArrowDown, CreditCard, Edit2, Trash2, Calendar, DollarSign } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  filter: FilterState;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions, filter, onEdit, onDelete, onToggleStatus }) => {
  const { month, year } = filter;
  const [localSortBy, setLocalSortBy] = useState<'date' | 'amount'>('date');

  // Local Sort Handler
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .sort((a, b) => {
        let valA = localSortBy === 'date' ? new Date(a.date).getTime() : a.amount;
        let valB = localSortBy === 'date' ? new Date(b.date).getTime() : b.amount;
        // Default sort descending for date, descending for amount
        return valB - valA;
      });
  }, [transactions, month, year, localSortBy]);

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Header Sort Toggle */}
      <div className="flex justify-end mb-2">
         <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
           <button 
             onClick={() => setLocalSortBy('date')}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${localSortBy === 'date' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <Calendar size={14} /> Data ↓
           </button>
           <button 
             onClick={() => setLocalSortBy('amount')}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${localSortBy === 'amount' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <DollarSign size={14} /> Valor
           </button>
         </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredTransactions.length === 0 ? (
           <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <Calendar size={32} />
             </div>
             <p className="text-slate-500 font-medium">Nenhuma transação neste período.</p>
           </div>
        ) : filteredTransactions.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-slate-100 hover:shadow-md transition-all gap-4">
             
             {/* Left Section: Icon & Details */}
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-500' :
                  t.type === TransactionType.CARD_EXPENSE ? 'bg-indigo-50 text-indigo-500' :
                  'bg-rose-50 text-rose-500'
                }`}>
                  {t.type === TransactionType.INCOME ? <ArrowUp size={24} /> : 
                   t.type === TransactionType.CARD_EXPENSE ? <CreditCard size={24} /> : <ArrowDown size={24} />}
                </div>

                <div className="flex flex-col gap-1">
                   <span className="font-bold text-slate-800 text-base">{t.description}</span>
                   <div className="flex items-center gap-2 text-xs">
                     <span className="text-slate-400">{format(new Date(t.date), 'dd/MM/yyyy')}</span>
                     <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase font-semibold text-[10px] tracking-wide">{t.category}</span>
                     {t.installments && (
                       <span className="text-slate-400">({t.installments.current}/{t.installments.total})</span>
                     )}
                   </div>
                </div>
             </div>

             {/* Right Section: Amount & Actions */}
             <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                <span className={`text-lg font-bold whitespace-nowrap ${
                  t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {t.type === TransactionType.INCOME ? '+ ' : ''} {formatCurrency(t.amount)}
                </span>
                
                <div className="flex items-center gap-4">
                   <button 
                     onClick={() => onToggleStatus(t.id)}
                     className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider min-w-[90px] text-center transition-colors ${
                       t.status === TransactionStatus.COMPLETED 
                         ? 'bg-emerald-100 text-emerald-600' 
                         : 'bg-blue-50 text-blue-500'
                     }`}
                   >
                      {t.status === TransactionStatus.COMPLETED 
                        ? (t.type === TransactionType.INCOME ? 'Recebido' : 'Pago') 
                        : (t.type === TransactionType.INCOME ? 'A Receber' : 'A Pagar')
                      }
                   </button>
                   
                   <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(t)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};