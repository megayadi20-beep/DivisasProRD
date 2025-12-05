
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calculator, Users, History, Wallet, Settings as SettingsIcon, Banknote } from 'lucide-react';
import { ViewState, ExchangeRate, Transaction, CashBox, UserPreferences, Client, ConverterConfig, TransactionType, CurrencyPair } from './types';
import { StorageService } from './services/storage';

// DIRECT IMPORTS FOR INSTANT PERFORMANCE
import Dashboard from './components/Dashboard';
import Converter from './components/Converter';
import Transactions from './components/Transactions';
import Clients from './components/Clients';
import Settings from './components/Settings';
import WalletComponent from './components/Wallet';
import Onboarding from './components/Onboarding';

const App: React.FC = () => {
  // --- INITIALIZATION STATE ---
  // We check if setup is done. If not, we show Onboarding.
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    const saved = StorageService.getPreferences();
    if (saved.darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    return saved;
  });

  // INITIAL VIEW: CONVERTER (Action First)
  const [currentView, setCurrentView] = useState<ViewState>('CONVERTER');
  
  // CENTRALIZED STATE
  const [rates, setRates] = useState<ExchangeRate>(() => StorageService.getRates());
  const [cashbox, setCashbox] = useState<CashBox>(() => StorageService.getCashbox());
  const [transactions, setTransactions] = useState<Transaction[]>(() => StorageService.getTransactions());
  const [clients, setClients] = useState<Client[]>(() => StorageService.getClients());
  
  // Converter Config (Quick Actions)
  const [converterConfig, setConverterConfig] = useState<ConverterConfig>({});
  
  // Animation State
  const [showUsd, setShowUsd] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
        setShowUsd(prev => !prev);
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  // --- HANDLERS ---

  const handleSetupComplete = () => {
      // Reload prefs and data after setup
      const newPrefs = StorageService.getPreferences();
      setPrefs(newPrefs);
      setRates(StorageService.getRates());
      // Go directly to Converter to start working
      setCurrentView('CONVERTER');
  };

  const handleTransactionComplete = (newTx: Transaction) => {
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    setCashbox(StorageService.getCashbox());
    setCurrentView('HISTORY');
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
  };

  const handleUpdateRates = (newRates: ExchangeRate) => {
    setRates(newRates);
  };

  const handleUpdatePrefs = (newPrefs: UserPreferences) => {
      setPrefs(newPrefs);
      if (newPrefs.darkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  };

  const handleUpdateClients = (newClients: Client[]) => {
      setClients(newClients);
  };

  const handleUpdateCashbox = (newBox: CashBox) => {
      setCashbox(newBox);
  };
  
  const handleQuickAction = (mode: TransactionType, pair: CurrencyPair) => {
      if (navigator.vibrate) navigator.vibrate(20);
      setConverterConfig({ initialMode: mode, initialPair: pair });
      setCurrentView('CONVERTER');
  };

  // --- RENDER ONBOARDING IF NOT SETUP ---
  if (!prefs.isSetupCompleted) {
      return <Onboarding onComplete={handleSetupComplete} />;
  }

  // --- MAIN APP ---
  const NavButton = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button 
      onClick={() => {
          if (navigator.vibrate) navigator.vibrate(10);
          setCurrentView(view);
      }}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${currentView === view ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
    >
      <Icon size={24} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-900 px-4 py-4 shadow-md dark:shadow-sm z-10 flex justify-between items-center relative overflow-hidden transition-colors border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Banknote size={20} strokeWidth={2.5} />
          </div>
          <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">
                  DIVISAS<span className="text-brand-600">PRO</span>
              </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
            {/* Rate Ticker */}
            <div className="flex flex-col items-end text-right min-w-[140px] relative h-10 justify-center">
                <div className={`absolute right-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${showUsd ? 'opacity-100 translate-y-0 scale-100 blur-0 visible' : 'opacity-0 -translate-y-3 scale-95 blur-sm invisible'}`}>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider flex items-center justify-end gap-1">
                        <span className="text-lg">🇺🇸</span> Tasa USD
                    </div>
                    <div className="flex gap-3 text-sm font-mono font-bold text-slate-700 dark:text-slate-200 justify-end">
                        <span className="text-emerald-600 dark:text-emerald-400">C:{rates.usd_dop.buy.toFixed(2)}</span>
                        <span className="text-blue-600 dark:text-blue-400">V:{rates.usd_dop.sell.toFixed(2)}</span>
                    </div>
                </div>

                <div className={`absolute right-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${!showUsd ? 'opacity-100 translate-y-0 scale-100 blur-0 visible' : 'opacity-0 translate-y-3 scale-95 blur-sm invisible'}`}>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider flex items-center justify-end gap-1">
                        <span className="text-lg">🇪🇺</span> Tasa EUR
                    </div>
                    <div className="flex gap-3 text-sm font-mono font-bold text-slate-700 dark:text-slate-200 justify-end">
                        <span className="text-emerald-600 dark:text-emerald-400">C:{rates.eur_dop.buy.toFixed(2)}</span>
                        <span className="text-blue-600 dark:text-blue-400">V:{rates.eur_dop.sell.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => setCurrentView('SETTINGS')}
                className={`p-2 rounded-full transition-colors ${currentView === 'SETTINGS' ? 'bg-slate-200 dark:bg-slate-800 text-brand-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
                <SettingsIcon size={22} />
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
            <div className={currentView === 'DASHBOARD' ? 'block h-full' : 'hidden'}>
                <Dashboard 
                    transactions={transactions} 
                    preferences={prefs} 
                    rates={rates}
                    cashbox={cashbox} 
                    clients={clients} 
                    onUpdateRates={handleUpdateRates}
                    onQuickAction={handleQuickAction} 
                />
            </div>
            <div className={currentView === 'CONVERTER' ? 'block h-full' : 'hidden'}>
                <Converter 
                    rates={rates} 
                    clients={clients} 
                    onTransactionComplete={handleTransactionComplete} 
                    onClientAdd={handleUpdateClients}
                    initialConfig={converterConfig} 
                />
            </div>
            <div className={currentView === 'HISTORY' ? 'block h-full' : 'hidden'}>
                <Transactions transactions={transactions} />
            </div>
            <div className={currentView === 'CLIENTS' ? 'block h-full' : 'hidden'}>
                <Clients 
                    clients={clients} 
                    transactions={transactions} 
                    onUpdateClients={handleUpdateClients} 
                />
            </div>
            <div className={currentView === 'SETTINGS' ? 'block h-full' : 'hidden'}>
                <Settings 
                    currentRates={rates} 
                    currentPrefs={prefs}
                    onUpdateRates={handleUpdateRates}
                    onUpdatePrefs={handleUpdatePrefs}
                />
            </div>
            <div className={currentView === 'WALLET' ? 'block h-full' : 'hidden'}>
                <WalletComponent 
                    cashbox={cashbox} 
                    transactions={transactions}
                    onUpdateCashbox={handleUpdateCashbox}
                />
            </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe pt-1 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 transition-colors">
        <div className="flex justify-between items-end max-w-md mx-auto">
          <NavButton view="DASHBOARD" icon={LayoutDashboard} label="Inicio" />
          <NavButton view="CLIENTS" icon={Users} label="Clientes" />
          
          <div className="relative -top-5">
            <button 
              onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(10);
                  setConverterConfig({});
                  setCurrentView('CONVERTER');
              }}
              className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all transform ${currentView === 'CONVERTER' ? 'bg-brand-700 scale-110 shadow-brand-500/50' : 'bg-brand-500 hover:bg-brand-600'}`}
            >
              <Calculator size={28} />
            </button>
          </div>

          <NavButton view="HISTORY" icon={History} label="Historial" />
          <NavButton view="WALLET" icon={Wallet} label="Caja" />
        </div>
      </nav>
    </div>
  );
};

export default App;
