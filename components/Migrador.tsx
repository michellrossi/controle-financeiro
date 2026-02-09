import React, { useState } from 'react';
import { db } from '../services/storage';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { Database, Loader2, AlertTriangle } from 'lucide-react';
import { TransactionType, TransactionStatus } from '../types';

export const Migrador: React.FC<{ userId: string; onMigrationComplete: () => void }> = ({ userId, onMigrationComplete }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [log, setLog] = useState('');

  const handleMigrate = async () => {
    if (!confirm("Isso importará e converterá os dados antigos. Certifique-se de não duplicar se já executou antes. Deseja continuar?")) return;
    
    setStatus('loading');
    setLog('Iniciando migração...');

    try {
      // 1. Migrar Transações
      setLog('Lendo e convertendo transações antigas...');
      
      const oldTxRef = collection(db, "artifacts", "default-app-id", "users", userId, "transactions");
      const txSnap = await getDocs(oldTxRef);
      
      setLog(`Processando ${txSnap.size} transações...`);
      
      const newTxRef = collection(db, "transactions");
      let txCount = 0;
      
      for (const docSnapshot of txSnap.docs) {
         const oldData = docSnapshot.data();
         
         // --- Lógica de Conversão ---

         // 1. Definição do Tipo (Type)
         let newType: TransactionType = TransactionType.EXPENSE; // Default

         // Regra: Identificar Entradas
         if (oldData.type === 'income') {
             newType = TransactionType.INCOME;
         } 
         // Regra: Identificar Despesa de Cartão (Tem cardId e NÃO é pagamento de fatura)
         else if (oldData.cardId && !oldData.isInvoicePayment) {
             newType = TransactionType.CARD_EXPENSE;
         }
         // Regra: Identificar Despesa Comum (Type expense e sem cardId - já é o default)
         
         // 2. Definição do Status
         // Regra: 'completed' vira 'COMPLETED', o resto 'PENDING'
         const newStatus = oldData.status === 'completed' 
            ? TransactionStatus.COMPLETED 
            : TransactionStatus.PENDING;

         // 3. Tratamento de Data (Date)
         let newDate = new Date().toISOString();
         
         if (oldData.date) {
            // Se for Timestamp do Firestore (objeto com seconds)
            if (oldData.date.seconds) {
                newDate = new Date(oldData.date.seconds * 1000).toISOString();
            } 
            // Se já for string ou Date
            else {
                const parsedDate = new Date(oldData.date);
                if (!isNaN(parsedDate.getTime())) {
                    newDate = parsedDate.toISOString();
                }
            }
         }

         // Montar objeto novo
         const newTransaction = {
             userId: userId,
             description: oldData.description || 'Sem descrição',
             amount: Number(oldData.amount) || 0,
             date: newDate,
             type: newType,
             category: oldData.category || 'Outros',
             status: newStatus,
             // Só mantemos cardId se for despesa de cartão
             cardId: (newType === TransactionType.CARD_EXPENSE) ? oldData.cardId : null,
             // Tenta preservar parcelas se existirem
             installments: oldData.installments ? {
                current: Number(oldData.installments.current),
                total: Number(oldData.installments.total),
                groupId: oldData.installments.groupId || crypto.randomUUID()
             } : undefined
         };

         await addDoc(newTxRef, newTransaction);
         txCount++;
      }

      // 2. Migrar Cartões
      setLog('Migrando cartões...');
      const oldCardRef = collection(db, "artifacts", "default-app-id", "users", userId, "cards");
      const cardSnap = await getDocs(oldCardRef);
      
      const newCardRef = collection(db, "cards");
      let cardCount = 0;

      for (const docSnapshot of cardSnap.docs) {
          const data = docSnapshot.data();
          
          // Garante que campos numéricos sejam números
          await addDoc(newCardRef, {
              userId: userId,
              name: data.name || 'Cartão Sem Nome',
              limit: Number(data.limit) || 0,
              closingDay: Number(data.closingDay) || 1,
              dueDay: Number(data.dueDay) || 10,
              color: data.color || 'bg-slate-800'
          });
          cardCount++;
      }

      setLog(`Sucesso! ${txCount} transações convertidas e ${cardCount} cartões migrados.`);
      setStatus('success');
      
      setTimeout(() => {
          onMigrationComplete();
      }, 2500);

    } catch (error: any) {
      console.error(error);
      setLog(`Erro: ${error.message}`);
      setStatus('error');
    }
  };

  if (status === 'success') {
      return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl max-w-sm border border-slate-700">
         <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg shrink-0">
               {status === 'loading' ? <Loader2 className="animate-spin" /> : <Database />}
            </div>
            <div>
               <h4 className="font-bold text-sm">Migração de Dados V2</h4>
               <p className="text-xs text-slate-400 mt-1">
                 {status === 'idle' 
                    ? 'Clique para converter e importar dados antigos para o novo formato.' 
                    : log}
               </p>
               
               {status === 'idle' && (
                 <button 
                   onClick={handleMigrate}
                   className="mt-3 bg-white text-slate-900 text-xs font-bold px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors w-full"
                 >
                    Importar Dados Antigos
                 </button>
               )}

               {status === 'error' && (
                 <div className="mt-2 flex items-center gap-2 text-rose-400 text-xs font-bold">
                    <AlertTriangle size={14} /> Falha na migração
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};