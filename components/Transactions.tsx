import React, { useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus, FilterState } from '../types';
import { formatCurrency } from '../services/storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, CreditCard, Search, Calendar, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  filter: FilterState;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions, filter, onEdit, onDelete, onToggleStatus }) => {
  const { month, year, sortBy, sortOrder } = filter;

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .sort((a, b) => {
        let valA = sortBy === 'date' ? new Date(a.date).getTime() : a.amount;
        let valB = sortBy === 'date' ? new Date(b.date).getTime() : b.amount;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [transactions, month, year, sortBy, sortOrder]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transação</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
              <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
               <tr>
                 <td colSpan={6} className="py-12 text-center text-slate-400">
                   Nenhuma transação encontrada neste período.
                 </td>
               </tr>
            ) : filteredTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' :
                      t.type === TransactionType.CARD_EXPENSE ? 'bg-indigo-100 text-indigo-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {t.type === TransactionType.INCOME ? <ArrowUpRight size={18} /> : 
                       t.type === TransactionType.CARD_EXPENSE ? <CreditCard size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t.description}</p>
                      {t.installments && (
                        <span className="text-xs text-slate-400">
                          Parcela {t.installments.current}/{t.installments.total}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {t.category}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-slate-500">
                  {format(new Date(t.date), 'dd MMM yyyy', { locale: ptBR })}
                </td>
                <td className={`py-4 px-6 text-right font-semibold ${
                  t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                </td>
                <td className="py-4 px-6 text-center">
                  <button 
                    onClick={() => onToggleStatus(t.id)}
                    className={`flex items-center justify-center gap-1 mx-auto px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      t.status === TransactionStatus.COMPLETED 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    {t.status === TransactionStatus.COMPLETED ? <CheckCircle size={14} /> : <Circle size={14} />}
                    {t.status === TransactionStatus.COMPLETED ? 'Pago/Recebido' : 'Pendente'}
                  </button>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};