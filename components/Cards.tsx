import React from 'react';
import { CreditCard, Transaction, TransactionType } from '../types';
import { formatCurrency, getInvoiceMonth } from '../services/storage';
import { isSameMonth } from 'date-fns';
import { Plus, Edit2, Trash2, MoreHorizontal } from 'lucide-react';

interface CardsProps {
  cards: CreditCard[];
  transactions: Transaction[];
  filterMonth: number;
  filterYear: number;
  onCardClick: (cardId: string) => void;
  onAddTransaction: (cardId: string) => void;
  onEditCard: (card: CreditCard) => void;
  onDeleteCard: (id: string) => void;
  onAddNewCard: () => void;
}

export const CardsView: React.FC<CardsProps> = ({ 
  cards, transactions, filterMonth, filterYear, 
  onCardClick, onAddTransaction, onEditCard, onDeleteCard, onAddNewCard 
}) => {
  const targetDate = new Date(filterYear, filterMonth, 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
      {cards.map(card => {
        // Calculate Invoice for this card in the selected month
        const invoiceTotal = transactions
          .filter(t => 
            t.type === TransactionType.CARD_EXPENSE && 
            t.cardId === card.id &&
            isSameMonth(getInvoiceMonth(new Date(t.date), card.closingDay), targetDate)
          )
          .reduce((acc, t) => acc + t.amount, 0);

        const progress = Math.min((invoiceTotal / card.limit) * 100, 100);

        return (
          <div 
            key={card.id} 
            onClick={() => onCardClick(card.id)}
            className="group relative overflow-hidden rounded-2xl shadow-lg transition-transform hover:-translate-y-1 cursor-pointer"
          >
            {/* Card Background */}
            <div className={`absolute inset-0 ${card.color} opacity-90 transition-opacity group-hover:opacity-100`}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            
            <div className="relative p-6 text-white h-full flex flex-col justify-between min-h-[220px]">
              
              {/* Header with Actions */}
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="font-bold text-lg tracking-wide">{card.name}</h3>
                    <p className="text-white/70 text-sm">Fechamento dia {card.closingDay}</p>
                 </div>
                 
                 {/* 3 Action Buttons */}
                 <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onAddTransaction(card.id)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors" title="Adicionar Transação">
                       <Plus size={16} />
                    </button>
                    <button onClick={() => onEditCard(card)} className="p-1.5 hover:bg-white/20 rounded-md transition-colors" title="Editar Cartão">
                       <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDeleteCard(card.id)} className="p-1.5 hover:bg-white/20 hover:text-red-300 rounded-md transition-colors" title="Excluir Cartão">
                       <Trash2 size={16} />
                    </button>
                 </div>
              </div>

              {/* Chip Image */}
              <div className="mt-4"><img src="https://img.icons8.com/ios/50/ffffff/chip-card.png" className="w-8 h-8 opacity-80" alt="chip"/></div>

              <div className="space-y-4 mt-auto">
                 <div>
                    <p className="text-sm text-white/80 mb-1">Fatura Atual</p>
                    <p className="text-3xl font-bold">{formatCurrency(invoiceTotal)}</p>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex justify-between text-xs font-medium text-white/80">
                      <span>Usado: {Math.round(progress)}%</span>
                      <span>Disp: {formatCurrency(card.limit - invoiceTotal)}</span>
                   </div>
                   <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${progress > 90 ? 'bg-red-400' : 'bg-emerald-400'}`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                   </div>
                   <p className="text-xs text-white/60 text-right">Limite: {formatCurrency(card.limit)}</p>
                 </div>
              </div>
            </div>
          </div>
        );
      })}

      <button onClick={onAddNewCard} className="flex flex-col items-center justify-center h-[220px] rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
         <Plus size={32} />
         <span className="font-medium mt-2">Novo Cartão</span>
      </button>
    </div>
  );
};