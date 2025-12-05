import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, TrendingUp, ArrowUpRight, ArrowDownLeft, 
  Plus, Minus, X, DollarSign, Briefcase, PiggyBank
} from 'lucide-react';
import { XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CashBox, CashAdjustment, Transaction } from '../types';
import { StorageService } from '../services/storage';

interface WalletProps {
    cashbox: CashBox;
    transactions: Transaction[];
    onUpdateCashbox: (box: CashBox) => void;
}

const Wallet: React.FC<WalletProps> = ({ cashbox, transactions, onUpdateCashbox }) => {
  // Use local state for adjustments as they are specific to this view
  const [adjustments, setAdjustments] = useState<CashAdjustment[]>([]);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'STATS'>('OVERVIEW');
  
  // Adjustment Form State
  const [adjType, setAdjType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'EXPENSE'>('DEPOSIT');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjCurrency, setAdjCurrency] = useState<'USD' | 'EUR' | 'DOP'>('DOP');
  const [adjReason, setAdjReason] = useState('');
  const [showAdjModal, setShowAdjModal] = useState(false);

  useEffect(() => {
    setAdjustments(StorageService.getAdjustments());
  }, []);

  // --- STATS CALCULATION ---
  const calculateStats = (timeframe: 'day' | 'week' | 'month') => {
    const now = new Date();
    let startTime = 0;
    
    if (timeframe === 'day') startTime = new Date(now.setHours(0,0,0,0)).getTime();
    if (timeframe === 'week') startTime = new Date(now.setDate(now.getDate() - 7)).getTime();
    if (timeframe === 'month') startTime = new Date(now.setDate(now.getDate() - 30)).getTime();

    const filtered = transactions.filter(t => t.timestamp >= startTime);
    const profit = filtered.reduce((acc, t) => acc + (t.estimatedProfit || 0), 0);
    const volumeUSD = filtered.filter(t => t.pair.startsWith('USD')).reduce((acc, t) => acc + t.amount, 0);
    
    return { profit, volumeUSD };
  };

  const dailyStats = calculateStats('day');
  const weeklyStats = calculateStats('week');

  // Chart Data: Last 7 Days Profit
  const getProfitChartData = () => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);
        
        const dayTxs = transactions.filter(t => {
            const txDate = new Date(t.timestamp);
            return txDate.getDate() === d.getDate() && txDate.getMonth() === d.getMonth();
        });
        
        const dayProfit = dayTxs.reduce((acc, t) => acc + (t.estimatedProfit || 0), 0);
        data.push({
            name: d.toLocaleDateString('es-DO', { weekday: 'short' }),
            profit: dayProfit
        });
    }
    return data;
  };

  const profitChartData = getProfitChartData();

  const handleSaveAdjustment = () => {
    if (!adjAmount || parseFloat(adjAmount) <= 0 || !adjReason) return;
    
    const amount = parseFloat(adjAmount);
    
    // Create Record
    const newAdj: CashAdjustment = {
        id: crypto.randomUUID(),
        type: adjType,
        amount,
        currency: adjCurrency,
        reason: adjReason,
        timestamp: Date.now()
    };
    
    // Update Cashbox
    const newBox = { ...cashbox };
    const factor = adjType === 'DEPOSIT' ? 1 : -1;
    
    if (adjCurrency === 'USD') newBox.usdPhysical += (amount * factor);
    if (adjCurrency === 'EUR') newBox.eurPhysical += (amount * factor);
    if (adjCurrency === 'DOP') newBox.dopPhysical += (amount * factor);

    StorageService.saveAdjustment(newAdj);
    StorageService.saveCashbox(newBox);
    
    // Update State
    onUpdateCashbox(newBox);
    setAdjustments([newAdj, ...adjustments]);
    
    setShowAdjModal(false);
    setAdjAmount('');
    setAdjReason('');
  };

  // Helper to get current balance for modal preview
  const getCurrentBalance = (curr: string) => {
      if (curr === 'USD') return cashbox.usdPhysical;
      if (curr === 'EUR') return cashbox.eurPhysical;
      return cashbox.dopPhysical;
  };

  const BalanceCard = ({ currency, amount, color, icon: Icon }: { currency: string, amount: number, color: string, icon: any }) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-lg transition-shadow">
        <div className={`absolute -right-4 -top-4 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform ${color}`}>
            <Icon size={80} />
        </div>
        <div className="relative z-10">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                {currency} EN CAJA
            </h3>
            <div className="text-3xl font-bold text-slate-800 dark:text-white font-mono tracking-tight">
                {currency === 'DOP' ? 'RD$' : currency === 'EUR' ? '€' : '$'}
                {amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-medium">
                Actualizado por ventas y ajustes
            </p>
        </div>
    </div>
  );

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto bg-slate-100 dark:bg-slate-950">
      
      {/* Header Tabs */}
      <div className="flex p-1 bg-white dark:bg-slate-900 rounded-xl mb-6 shadow-sm border border-slate-300 dark:border-slate-800">
         {['OVERVIEW', 'STATS'].map(tab => (
             <button
                key={tab}
                onClick={() => setViewMode(tab as any)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === tab ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
             >
                {tab === 'OVERVIEW' ? 'CONTROL DE CAJA' : 'RENTABILIDAD'}
             </button>
         ))}
      </div>

      {viewMode === 'OVERVIEW' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Balances */}
            <BalanceCard currency="DOP" amount={cashbox.dopPhysical} color="text-emerald-600" icon={WalletIcon} />
            <div className="grid grid-cols-2 gap-4">
                <BalanceCard currency="USD" amount={cashbox.usdPhysical} color="text-blue-600" icon={DollarSign} />
                <BalanceCard currency="EUR" amount={cashbox.eurPhysical} color="text-indigo-600" icon={DollarSign} />
            </div>

            {/* Quick Actions Button */}
            <button 
                onClick={() => setShowAdjModal(true)}
                className="w-full py-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
                <Briefcase size={20} />
                Gestionar Fondos / Ajustar Caja
            </button>

            {/* Recent Adjustments List */}
            <div className="pt-4">
                <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center justify-between">
                    <span>Movimientos Manuales</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 font-medium">Últimos 5</span>
                </h3>
                <div className="space-y-3">
                    {adjustments.slice(0, 5).map(adj => (
                        <div key={adj.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${adj.type === 'DEPOSIT' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                    {adj.type === 'DEPOSIT' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200 capitalize">{adj.reason}</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{new Date(adj.timestamp).toLocaleDateString()} • {new Date(adj.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                            </div>
                            <div className={`font-mono font-bold ${adj.type === 'DEPOSIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {adj.type === 'DEPOSIT' ? '+' : '-'}{adj.amount.toLocaleString()} <span className="text-[10px]">{adj.currency}</span>
                            </div>
                        </div>
                    ))}
                    {adjustments.length === 0 && (
                        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                             <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No hay movimientos manuales registrados.</p>
                             <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Las ventas y compras se registran automáticamente.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
      )}

      {viewMode === 'STATS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Main Profit Card */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-slate-700">
                  <div className="relative z-10">
                      <h3 className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Utilidad Estimada (Spread)</h3>
                      <div className="text-4xl font-bold tracking-tight text-emerald-400 mb-6">
                          RD$ {dailyStats.profit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                          <span className="text-sm text-slate-400 font-normal ml-2">hoy</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                          <div>
                              <span className="block text-[10px] text-slate-400 uppercase">Volumen USD</span>
                              <span className="font-bold text-lg font-mono">${dailyStats.volumeUSD.toLocaleString()}</span>
                          </div>
                          <div>
                              <span className="block text-[10px] text-slate-400 uppercase">Utilidad Semanal</span>
                              <span className="font-bold text-lg text-emerald-300 font-mono">RD$ {weeklyStats.profit.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          </div>
                      </div>
                  </div>
                  <TrendingUp className="absolute bottom-0 right-0 w-40 h-40 text-white opacity-[0.03] translate-y-8 translate-x-8" />
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6 text-sm flex items-center gap-2">
                    <PiggyBank size={16} className="text-brand-500" />
                    Tendencia de Ganancias (7 Días)
                  </h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={profitChartData}>
                            <defs>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#1e293b' }}
                                formatter={(value: number) => [`RD$ ${value.toLocaleString()}`, 'Ganancia']}
                                labelStyle={{ color: '#64748b', marginBottom: '0.25rem', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                        </AreaChart>
                    </ResponsiveContainer>
                  </div>
              </div>
          </div>
      )}

      {/* Manual Adjustment Bottom Sheet / Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-opacity opacity-100"
                onClick={() => setShowAdjModal(false)}
            />
            
            {/* Modal Content - Bottom Sheet on Mobile */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pointer-events-auto animate-in slide-in-from-bottom-full duration-300 relative max-h-[90vh] overflow-y-auto">
                
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Briefcase size={24} className="text-brand-600" />
                        Ajuste de Caja
                    </h3>
                    <button onClick={() => setShowAdjModal(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5">
                    
                    {/* 1. Tipo de Movimiento */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setAdjType('DEPOSIT'); setAdjReason('Aporte de Capital'); }}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${adjType === 'DEPOSIT' 
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' 
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'}`}
                        >
                            <span className={`block mb-1 ${adjType === 'DEPOSIT' ? 'text-emerald-600' : 'text-slate-400'}`}><Plus size={24} /></span>
                            <span className="font-bold text-sm text-slate-800 dark:text-white">Entrada</span>
                            <span className="text-[10px] text-slate-500 block font-medium">Ingreso de dinero</span>
                        </button>

                        <button
                            onClick={() => { setAdjType('EXPENSE'); setAdjReason('Gasto Operativo'); }}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${adjType !== 'DEPOSIT' 
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500' 
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'}`}
                        >
                            <span className={`block mb-1 ${adjType !== 'DEPOSIT' ? 'text-red-600' : 'text-slate-400'}`}><Minus size={24} /></span>
                            <span className="font-bold text-sm text-slate-800 dark:text-white">Salida</span>
                            <span className="text-[10px] text-slate-500 block font-medium">Retiro o Gasto</span>
                        </button>
                    </div>

                    {/* 2. Moneda */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex">
                        {['DOP', 'USD', 'EUR'].map(curr => (
                            <button
                                key={curr}
                                onClick={() => setAdjCurrency(curr as any)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${adjCurrency === curr ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600' : 'text-slate-500'}`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>

                    {/* 3. Monto */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Monto a {adjType === 'DEPOSIT' ? 'Ingresar' : 'Retirar'}</label>
                        <div className="relative">
                            <input 
                                type="number"
                                inputMode="decimal"
                                value={adjAmount}
                                onChange={(e) => setAdjAmount(e.target.value)}
                                className="w-full p-4 pl-4 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-2xl font-bold outline-none focus:border-brand-500 dark:text-white placeholder-slate-300 text-slate-800"
                                placeholder="0.00"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{adjCurrency}</div>
                        </div>
                        {/* Preview Balance */}
                        <div className="flex justify-between items-center mt-2 px-1">
                            <span className="text-[10px] text-slate-500 font-medium">Saldo actual: {getCurrentBalance(adjCurrency).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                                Nuevo saldo: { adjAmount ? (getCurrentBalance(adjCurrency) + (parseFloat(adjAmount) * (adjType === 'DEPOSIT' ? 1 : -1))).toLocaleString() : '---' }
                            </span>
                        </div>
                    </div>

                    {/* 4. Motivo (Predefinidos + Input) */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Concepto / Razón</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                             {(adjType === 'DEPOSIT' 
                                ? ['Aporte Capital', 'Ajuste Cuadre', 'Devolución'] 
                                : ['Retiro Dueño', 'Gasto Luz/Agua', 'Pago Alquiler', 'Pago Nómina']
                             ).map(tag => (
                                 <button 
                                    key={tag}
                                    onClick={() => setAdjReason(tag)}
                                    className={`text-[10px] px-3 py-1.5 rounded-full border transition-colors font-medium ${adjReason === tag ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' : 'bg-transparent border-slate-300 text-slate-500'}`}
                                 >
                                     {tag}
                                 </button>
                             ))}
                        </div>
                        <input 
                             type="text" 
                             value={adjReason}
                             onChange={(e) => setAdjReason(e.target.value)}
                             className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-800 dark:text-white outline-none focus:border-brand-500 font-medium"
                             placeholder="Escriba el motivo..."
                        />
                    </div>

                    <button 
                        onClick={handleSaveAdjustment}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform mt-4 ${adjType === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {adjType === 'DEPOSIT' ? <Plus size={20} /> : <Minus size={20} />}
                        Confirmar {adjType === 'DEPOSIT' ? 'Ingreso' : 'Salida'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;