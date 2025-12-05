
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, Briefcase, Settings2, ArrowLeft, ArrowRight, GripVertical, RefreshCw, Save, Zap, ArrowDownLeft, ArrowUpRight, Globe, Signal, Activity } from 'lucide-react';
import { Transaction, TransactionType, CashBox, UserPreferences, ExchangeRate, Client, CurrencyPair } from '../types';
import { StorageService } from '../services/storage';
import { LiveRateService, MarketRates } from '../services/liveRateService';

interface DashboardProps {
  transactions: Transaction[];
  preferences: UserPreferences;
  rates: ExchangeRate;
  cashbox: CashBox;
  clients: Client[];
  onUpdateRates: (rates: ExchangeRate) => void;
  onQuickAction: (mode: TransactionType, pair: CurrencyPair) => void;
}

// --- ANIMATED COUNTER COMPONENT ---
const AnimatedNumber = ({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;

        const duration = 1000;
        const incrementTime = 20;
        const steps = duration / incrementTime;
        const increment = (end - start) / steps;

        const timer = setInterval(() => {
            start += increment;
            if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(start);
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <span>
            {prefix}{displayValue.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 })}{suffix}
        </span>
    );
};

// --- WIDGET COMPONENTS ---

const MarketRatesWidget = () => {
    const [marketRates, setMarketRates] = useState<MarketRates | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await LiveRateService.fetchRates();
            setMarketRates(data);
            setLoading(false);
        };
        load();
        // Refresh every 60 seconds
        const interval = setInterval(load, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-blue-800 p-5 rounded-3xl shadow-lg text-white relative overflow-hidden h-full group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Globe size={80} />
            </div>
            
            <h3 className="font-bold text-blue-100 text-xs uppercase tracking-wider mb-5 flex items-center gap-2 relative z-10">
                <Activity size={14} className={loading ? 'animate-pulse text-blue-400' : 'text-emerald-400'} />
                Mercado Interbancario
            </h3>

            {loading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                    <div className="h-8 bg-white/10 rounded-lg w-full"></div>
                    <div className="h-8 bg-white/10 rounded-lg w-2/3"></div>
                </div>
            ) : marketRates ? (
                <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 opacity-90">
                            <span className="text-xl">🇺🇸</span>
                            <span className="font-bold text-sm">USD/DOP</span>
                        </div>
                        <div className="font-mono font-bold text-xl tracking-tight">
                            ${marketRates.usd_dop.toFixed(2)}
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2 opacity-90">
                            <span className="text-xl">🇪🇺</span>
                            <span className="font-bold text-sm">EUR/DOP</span>
                        </div>
                        <div className="font-mono font-bold text-xl tracking-tight">
                            €{marketRates.eur_dop.toFixed(2)}
                        </div>
                    </div>
                    <div className="pt-2 flex items-start gap-1.5 opacity-60">
                         <Signal size={10} className="mt-0.5" />
                         <p className="text-[9px] leading-tight">
                            Tasas Spot de referencia global (Mid-Market). No incluyen márgenes operativos.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-blue-200 flex flex-col items-center justify-center h-20 text-center">
                    <Signal size={24} className="mb-2 opacity-50" />
                    <span className="text-xs">Sin conexión al mercado global.</span>
                </div>
            )}
        </div>
    );
};

const QuickActionsWidget = ({ onAction }: { onAction: (mode: TransactionType, pair: CurrencyPair) => void }) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col justify-center">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <Zap size={16} />
                </div>
                Accesos Rápidos
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => onAction(TransactionType.BUY, 'USD_DOP')}
                    className="flex flex-col items-center justify-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-95 group"
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <ArrowDownLeft size={16} />
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Comprar USD</div>
                    </div>
                </button>
                <button 
                    onClick={() => onAction(TransactionType.SELL, 'USD_DOP')}
                    className="flex flex-col items-center justify-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95 group"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <ArrowUpRight size={16} />
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Vender USD</div>
                    </div>
                </button>
            </div>
        </div>
    );
};

const StatsWidget = ({ transactions }: { transactions: Transaction[] }) => {
    const stats = useMemo(() => {
        const today = new Date().setHours(0,0,0,0);
        const todaysTxs = transactions.filter(t => t.timestamp >= today);
        const profit = todaysTxs.reduce((acc, t) => acc + (t.estimatedProfit || 0), 0);
        const txCount = todaysTxs.length;
        const avgTicket = txCount > 0 ? profit / txCount : 0;
        return { profit, txCount, avgTicket };
    }, [transactions]);

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-5 text-white shadow-xl shadow-slate-300 dark:shadow-none relative overflow-hidden ring-1 ring-slate-900/5 h-full">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Briefcase size={120} />
             </div>

             <div className="relative z-10 flex flex-col justify-between h-full">
                 <div>
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <TrendingUp size={16} className="text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Ganancia (Hoy)</span>
                    </div>
                    
                    <div className="text-3xl font-bold font-mono text-emerald-400 mb-1">
                        <AnimatedNumber value={stats.profit} prefix="RD$ " />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
                     <div>
                         <div className="text-xl font-bold"><AnimatedNumber value={stats.txCount} /></div>
                         <div className="text-[10px] text-slate-400 uppercase">Ops</div>
                     </div>
                     <div>
                         <div className="text-xl font-bold text-blue-300">
                             <AnimatedNumber value={stats.avgTicket} prefix="$" />
                         </div>
                         <div className="text-[10px] text-slate-400 uppercase">Avg</div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const RateWidget = ({ rates, onUpdateRates }: { rates: ExchangeRate, onUpdateRates: (r: ExchangeRate) => void }) => {
    const [editing, setEditing] = useState(false);
    const [localRates, setLocalRates] = useState<ExchangeRate>(rates);

    useEffect(() => {
        setLocalRates(rates);
    }, [rates]);

    const handleSave = () => {
        const newRates = { ...localRates, lastUpdated: Date.now() };
        StorageService.saveRates(newRates);
        onUpdateRates(newRates);
        setEditing(false);
    };

    const updateVal = (pair: 'usd_dop' | 'eur_dop', type: 'buy' | 'sell', val: string) => {
        setLocalRates(prev => ({
            ...prev,
            [pair]: {
                ...prev[pair],
                [type]: parseFloat(val) || 0
            }
        }));
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800 transition-shadow hover:shadow-lg relative overflow-hidden h-full">
             <div className="absolute -right-4 -bottom-4 opacity-[0.20] text-slate-900 dark:text-white pointer-events-none">
                 <RefreshCw size={100} />
             </div>
             
             <div className="flex items-center justify-between mb-4 relative z-10">
                 <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                     <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                         <DollarSign size={16} />
                     </div>
                     Mis Tasas
                 </h3>
                 <button 
                    onClick={() => editing ? handleSave() : setEditing(true)}
                    className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all ${editing ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                 >
                     {editing ? <div className="flex items-center gap-1"><Save size={12} /> Guardar</div> : 'Editar'}
                 </button>
             </div>

             <div className="space-y-3 relative z-10">
                 {/* USD */}
                 <div className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                     <div className="flex items-center gap-2">
                         <span className="text-lg">🇺🇸</span>
                         <span className="font-bold text-sm text-slate-700 dark:text-white">USD</span>
                     </div>
                     <div className="flex gap-2">
                         <div className="text-right">
                             <div className="text-[8px] text-emerald-600 font-bold uppercase">C</div>
                             {editing ? (
                                 <input 
                                    type="number" 
                                    value={localRates.usd_dop.buy}
                                    onChange={(e) => updateVal('usd_dop', 'buy', e.target.value)}
                                    className="w-14 p-1 text-right text-xs border rounded bg-slate-50 dark:bg-slate-800 dark:text-white"
                                 />
                             ) : (
                                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{rates.usd_dop.buy.toFixed(2)}</div>
                             )}
                         </div>
                         <div className="text-right">
                             <div className="text-[8px] text-blue-600 font-bold uppercase">V</div>
                             {editing ? (
                                 <input 
                                    type="number" 
                                    value={localRates.usd_dop.sell}
                                    onChange={(e) => updateVal('usd_dop', 'sell', e.target.value)}
                                    className="w-14 p-1 text-right text-xs border rounded bg-slate-50 dark:bg-slate-800 dark:text-white"
                                 />
                             ) : (
                                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{rates.usd_dop.sell.toFixed(2)}</div>
                             )}
                         </div>
                     </div>
                 </div>

                 {/* EUR */}
                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                         <span className="text-lg">🇪🇺</span>
                         <span className="font-bold text-sm text-slate-700 dark:text-white">EUR</span>
                     </div>
                     <div className="flex gap-2">
                         <div className="text-right">
                             <div className="text-[8px] text-emerald-600 font-bold uppercase">C</div>
                             {editing ? (
                                 <input 
                                    type="number" 
                                    value={localRates.eur_dop.buy}
                                    onChange={(e) => updateVal('eur_dop', 'buy', e.target.value)}
                                    className="w-14 p-1 text-right text-xs border rounded bg-slate-50 dark:bg-slate-800 dark:text-white"
                                 />
                             ) : (
                                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{rates.eur_dop.buy.toFixed(2)}</div>
                             )}
                         </div>
                         <div className="text-right">
                             <div className="text-[8px] text-blue-600 font-bold uppercase">V</div>
                             {editing ? (
                                 <input 
                                    type="number" 
                                    value={localRates.eur_dop.sell}
                                    onChange={(e) => updateVal('eur_dop', 'sell', e.target.value)}
                                    className="w-14 p-1 text-right text-xs border rounded bg-slate-50 dark:bg-slate-800 dark:text-white"
                                 />
                             ) : (
                                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{rates.eur_dop.sell.toFixed(2)}</div>
                             )}
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const CashboxWidget = ({ cashbox }: { cashbox: CashBox }) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between group transition-shadow hover:shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-[0.20] transform rotate-12 text-brand-900 dark:text-brand-500 pointer-events-none">
            <DollarSign size={100} />
        </div>
        <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400">
                    <DollarSign size={16} />
                </div>
                Caja Física
            </h3>
        </div>
        
        <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">USD</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white font-mono group-hover:scale-105 transition-transform">
                    $<AnimatedNumber value={cashbox.usdPhysical} />
                </span>
            </div>
            <div className="flex justify-between items-end border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">EUR</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white font-mono group-hover:scale-105 transition-transform">
                    €<AnimatedNumber value={cashbox.eurPhysical} />
                </span>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">DOP</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono group-hover:scale-105 transition-transform">
                    <AnimatedNumber value={cashbox.dopPhysical} prefix="RD$ " />
                </span>
            </div>
        </div>
    </div>
);

const ClientsWidget = ({ clients }: { clients: Client[] }) => {
    const { total, newThisMonth } = useMemo(() => {
        const now = new Date();
        const newClients = clients.filter(c => {
            const d = new Date(c.createdAt);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        return { total: clients.length, newThisMonth: newClients };
    }, [clients]); 

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-shadow hover:shadow-lg h-full flex flex-col justify-center">
            <div className="absolute -right-4 -bottom-4 opacity-[0.20] transform -rotate-12 text-slate-900 dark:text-white pointer-events-none">
                <Users size={100} />
            </div>
            
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-4 flex items-center gap-2 relative z-10">
                 <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Users size={16} />
                </div>
                Cartera
            </h3>
            
            <div className="flex gap-6 relative z-10">
                <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        <AnimatedNumber value={total} />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mt-1 font-semibold">Total</div>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-800"></div>
                <div>
                    <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                        +<AnimatedNumber value={newThisMonth} />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mt-1 font-semibold">Mes</div>
                </div>
            </div>
        </div>
    );
};

const ChartWidget = ({ transactions }: { transactions: Transaction[] }) => {
  const chartData = useMemo(() => {
      const today = new Date().setHours(0,0,0,0);
      const todaysTxs = transactions.filter(t => t.timestamp >= today);
      const bought = todaysTxs.filter(t => t.type === TransactionType.BUY).reduce((acc, t) => acc + t.amount, 0);
      const sold = todaysTxs.filter(t => t.type === TransactionType.SELL).reduce((acc, t) => acc + t.amount, 0);

      return [
        { name: 'Compras', value: bought, color: '#10b981' },
        { name: 'Ventas', value: sold, color: '#3b82f6' },
      ];
  }, [transactions]);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800 h-64 flex flex-col transition-shadow hover:shadow-lg">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-2 flex items-center gap-2">
             <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <TrendingUp size={16} />
            </div>
            Volumen Hoy
        </h3>
        <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f1f5f9'}}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ transactions, preferences, rates, cashbox, clients, onUpdateRates, onQuickAction }) => {
  // Adding 'market' to layout defaults if missing
  const [layout, setLayout] = useState<string[]>(preferences.dashboardLayout || ['stats', 'market', 'quick', 'rates', 'cashbox', 'clients', 'chart']);
  const [isEditing, setIsEditing] = useState(false);
  
  // Ensure 'market' widget is present
  useEffect(() => {
      if (!layout.includes('market')) {
          setLayout(prev => ['market', ...prev]);
      }
  }, []);

  // Save layout when it changes
  useEffect(() => {
      if (JSON.stringify(layout) !== JSON.stringify(preferences.dashboardLayout)) {
          const newPrefs = { ...preferences, dashboardLayout: layout };
          StorageService.savePreferences(newPrefs);
      }
  }, [layout]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Buenas noches';
    if (hour < 12) timeGreeting = 'Buenos días';
    else if (hour < 18) timeGreeting = 'Buenas tardes';

    return { timeGreeting, name: preferences.userName || 'Usuario' };
  };

  const { timeGreeting, name } = getGreeting();

  const moveWidget = (index: number, direction: 'left' | 'right') => {
      const newLayout = [...layout];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newLayout.length) {
          [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
          setLayout(newLayout);
      }
  };

  // Render map
  const renderWidget = (type: string, index: number) => {
      let content = null;
      switch(type) {
          case 'stats': content = <StatsWidget transactions={transactions} />; break;
          case 'market': content = <MarketRatesWidget />; break; // NEW WIDGET
          case 'quick': content = <QuickActionsWidget onAction={onQuickAction} />; break;
          case 'rates': content = <RateWidget rates={rates} onUpdateRates={onUpdateRates} />; break;
          case 'cashbox': content = <CashboxWidget cashbox={cashbox} />; break;
          case 'clients': content = <ClientsWidget clients={clients} />; break;
          case 'chart': content = <ChartWidget transactions={transactions} />; break;
          default: return null;
      }

      if (!content) return null;

      // Stats and Chart take full width. Others share.
      const isFullWidth = type === 'stats' || type === 'chart';
      
      return (
        <div key={type} className={`relative transition-all duration-300 ${isEditing ? 'scale-95 cursor-move ring-2 ring-brand-400 rounded-3xl z-10' : ''} ${isFullWidth ? 'col-span-2' : 'col-span-1'}`}>
            {content}
            
            {/* Reordering Controls Overlay */}
            {isEditing && (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] rounded-3xl flex items-center justify-center gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); moveWidget(index, 'left'); }}
                        disabled={index === 0}
                        className="p-2 bg-white rounded-full shadow-lg disabled:opacity-30 hover:scale-110 transition-transform"
                    >
                        <ArrowLeft size={20} className="text-slate-700" />
                    </button>
                    <div className="bg-white px-3 py-1 rounded-full font-bold text-xs shadow">
                        <GripVertical size={16} className="inline mr-1"/> Mover
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); moveWidget(index, 'right'); }}
                        disabled={index === layout.length - 1}
                        className="p-2 bg-white rounded-full shadow-lg disabled:opacity-30 hover:scale-110 transition-transform"
                    >
                        <ArrowRight size={20} className="text-slate-700" />
                    </button>
                </div>
            )}
        </div>
      );
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto space-y-6">
      
      <div className="flex justify-between items-end py-2">
        <div>
            <h1 className="text-xl font-light text-slate-600 dark:text-slate-300 leading-tight">
                {timeGreeting}, <br />
                <span className="font-bold text-slate-900 dark:text-white text-3xl">{name}</span>
            </h1>
        </div>
        <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-brand-500 text-white shadow-lg rotate-180' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 shadow border border-slate-200 dark:border-slate-700'}`}
        >
            <Settings2 size={20} />
        </button>
      </div>
      
      {isEditing && (
          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-xl text-xs text-center font-bold animate-in fade-in slide-in-from-top-2 border border-blue-200 dark:border-blue-800">
              Modo Edición: Usa las flechas para reordenar los paneles a tu gusto.
          </div>
      )}

      <div className="grid grid-cols-2 gap-4">
          {layout.map((widgetId, index) => renderWidget(widgetId, index))}
      </div>

    </div>
  );
};

export default Dashboard;
