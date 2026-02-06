import React from 'react';
import { Transaction, CreditCard, TransactionType, TransactionStatus, FilterState } from '../types';
import { formatCurrency, getInvoiceMonth } from '../services/storage';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  transactions: Transaction[];
  cards: CreditCard[];
  filter: FilterState;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, filter, cards }) => {
  const { month, year } = filter;
  const targetDate = new Date(year, month, 1);

  // 1. Calculate Summary Cards
  const currentMonthTransactions = transactions.filter(t => {
    // Basic date check
    const tDate = new Date(t.date);
    let belongsToMonth = isSameMonth(tDate, targetDate);

    // If it's a card expense, check the Invoice Date instead
    if (t.type === TransactionType.CARD_EXPENSE && t.cardId) {
       const card = cards.find(c => c.id === t.cardId);
       if (card) {
         belongsToMonth = isSameMonth(getInvoiceMonth(tDate, card.closingDay), targetDate);
       }
    }
    return belongsToMonth;
  });

  const income = currentMonthTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = currentMonthTransactions
    .filter(t => t.type !== TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);
  
  const balance = income - expenses;

  // Pending vs Paid Logic
  const incomePending = currentMonthTransactions
    .filter(t => t.type === TransactionType.INCOME && t.status === TransactionStatus.PENDING)
    .reduce((acc, t) => acc + t.amount, 0);
  
  const expensePending = currentMonthTransactions
    .filter(t => t.type !== TransactionType.INCOME && t.status === TransactionStatus.PENDING) // Card expenses are usually considered "committed" but we can track payment status if we modeled invoice payments separately. simplified here.
    .reduce((acc, t) => acc + t.amount, 0);


  // 2. Chart Data: History (Last 6 Months)
  const historyData = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);

    const monthT = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= start && tDate <= end;
    });

    return {
      name: format(d, 'MMM', { locale: ptBR }),
      receita: monthT.filter(t => t.type === TransactionType.INCOME).reduce((a,b) => a+b.amount, 0),
      despesa: monthT.filter(t => t.type !== TransactionType.INCOME).reduce((a,b) => a+b.amount, 0),
    };
  });

  // 3. Chart Data: Categories (Donut)
  const categoryMap = new Map<string, number>();
  currentMonthTransactions
    .filter(t => t.type !== TransactionType.INCOME)
    .forEach(t => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });
  
  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 5); // Top 5 categories

  const COLORS = ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  const StatCard = ({ title, value, sub, icon: Icon, color, bg }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
           <p className="text-sm font-medium text-slate-500">{title}</p>
           <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(value)}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bg}`}>
          <Icon className={color} size={24} />
        </div>
      </div>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Receitas" 
          value={income} 
          sub={`Pendente: ${formatCurrency(incomePending)}`}
          icon={TrendingUp} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
        />
        <StatCard 
          title="Despesas" 
          value={expenses} 
          sub={`A Pagar: ${formatCurrency(expensePending)}`}
          icon={TrendingDown} 
          color="text-rose-600" 
          bg="bg-rose-50" 
        />
        <StatCard 
          title="Saldo do Mês" 
          value={balance} 
          sub={balance >= 0 ? "Positivo" : "Negativo"}
          icon={Wallet} 
          color={balance >= 0 ? "text-blue-600" : "text-rose-600"} 
          bg={balance >= 0 ? "bg-blue-50" : "bg-rose-50"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* History Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-800 mb-6">Fluxo de Caixa (6 Meses)</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="receita" stroke="#10B981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesa" stroke="#F43F5E" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 mb-2">Gastos por Categoria</h3>
           {categoryData.length > 0 ? (
             <div className="flex-1 flex items-center justify-center relative">
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-2 pr-4">
                   {categoryData.map((item, idx) => (
                     <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-xs text-slate-600">{item.name}</span>
                     </div>
                   ))}
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <AlertCircle size={48} className="mb-2 opacity-50" />
               <p>Sem dados neste mês</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};