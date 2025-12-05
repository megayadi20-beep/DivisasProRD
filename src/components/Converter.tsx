import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, AlertCircle, CheckCircle, Printer, History, Plus, Check, Search, X, UserPlus, Phone } from 'lucide-react';
import { ExchangeRate, TransactionType, Client, Transaction, CurrencyPair, ConverterConfig } from '../types';
import { StorageService } from '../services/storage';
import { generateReceiptPDF } from '../utils/receiptGenerator';

interface ConverterProps {
  rates: ExchangeRate;
  clients: Client[]; // Receives global clients
  onTransactionComplete: (tx: Transaction) => void;
  onClientAdd: (clients: Client[]) => void; // Call back to update global state
  initialConfig?: ConverterConfig; // New prop for Quick Actions
}

const MAX_TRANSACTION_AMOUNT = 1000000;
const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

const Converter: React.FC<ConverterProps> = ({ rates, clients, onTransactionComplete, onClientAdd, initialConfig }) => {
  const [amount, setAmount] = useState<string>('');
  const [mode, setMode] = useState<TransactionType>(TransactionType.BUY);
  const [pair, setPair] = useState<CurrencyPair>('USD_DOP');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Apply initial config if provided (Quick Actions)
  useEffect(() => {
      if (initialConfig?.initialMode) setMode(initialConfig.initialMode);
      if (initialConfig?.initialPair) setPair(initialConfig.initialPair);
      // Auto-focus logic
      setTimeout(() => {
          inputRef.current?.focus();
      }, 100);
  }, [initialConfig]);

  // Client Selection State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  // Client Selector Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Success Modal State
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);
  const [showSuccessContent, setShowSuccessContent] = useState(false);

  // Animation effect for success modal
  useEffect(() => {
    if (successTx) {
      setShowSuccessContent(false);
      const timer = setTimeout(() => {
        setShowSuccessContent(true);
      }, 450); 
      return () => clearTimeout(timer);
    }
  }, [successTx]);

  // --- OPTIMIZED CALCULATION LOGIC ---

  // 1. Determine robustly which rate key to use from storage
  const rateKey = useMemo(() => {
      return pair === 'USD_DOP' ? 'usd_dop' : 'eur_dop';
  }, [pair]);

  // 2. Get specific Rate Details (Buy/Sell object)
  const rateDetail = useMemo(() => {
      return rates[rateKey] || { buy: 0, sell: 0 };
  }, [rates, rateKey]);

  // 3. Determine the Active Rate based on Transaction Mode
  const activeRate = useMemo(() => {
      return mode === TransactionType.BUY ? rateDetail.buy : rateDetail.sell;
  }, [rateDetail, mode]);

  // 4. Calculate Total with precision handling
  const numericAmount = parseFloat(amount) || 0;
  
  const total = useMemo(() => {
      const rawTotal = numericAmount * activeRate;
      // Precision Rounding to 2 decimal places to avoid floating point errors
      return Math.round(rawTotal * 100) / 100;
  }, [numericAmount, activeRate]);

  // Labels
  const [sourceCurrency, targetCurrency] = pair.split('_');
  const sourceSymbol = sourceCurrency === 'USD' ? '$' : '€';
  const isBuy = mode === TransactionType.BUY;

  // Selected Client Object
  const selectedClient = useMemo(() => {
      return clients.find(c => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Filtered Clients for Search
  const filteredClients = useMemo(() => {
      if (!clientSearch) return clients;
      return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  }, [clients, clientSearch]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (['e', 'E', '-', '+'].some(char => value.includes(char))) return;
    if (value === '') { setAmount(''); return; }
    const regex = /^\d*(\.\d{0,2})?$/;
    if (!regex.test(value)) return;
    const numValue = parseFloat(value);
    if (numValue > MAX_TRANSACTION_AMOUNT) return;
    setAmount(value);
  };

  const addPresetAmount = (val: number) => {
      if (navigator.vibrate) navigator.vibrate(10);
      setAmount(val.toString());
      inputRef.current?.focus();
  };

  const handleSave = () => {
    if (numericAmount <= 0) return alert('Ingrese un monto válido mayor a 0');
    if (numericAmount > MAX_TRANSACTION_AMOUNT) return alert(`El monto excede el límite permitido de ${MAX_TRANSACTION_AMOUNT}`);
    
    // Handle Optional Client
    let clientId = 'WALK_IN';
    let clientName = 'Cliente Ocasional';
    
    if (selectedClientId && selectedClient) {
        clientId = selectedClient.id;
        clientName = selectedClient.name;
    }

    // Profit Calculation Logic
    const spread = rateDetail.sell - rateDetail.buy;
    // Prevent negative profit calculation if spread is inverted by mistake
    const safeSpread = Math.max(0, spread); 
    const estimatedProfit = numericAmount * safeSpread;

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      clientId: clientId,
      clientName: clientName,
      type: mode,
      pair: pair,
      amount: numericAmount,
      rate: activeRate,
      total: total,
      estimatedProfit: estimatedProfit,
      timestamp: Date.now()
    };

    StorageService.saveTransaction(newTx);
    
    // Update Cashbox
    const box = StorageService.getCashbox();
    if (mode === TransactionType.BUY) {
      if (sourceCurrency === 'USD') box.usdPhysical += numericAmount;
      if (sourceCurrency === 'EUR') box.eurPhysical += numericAmount;
      if (targetCurrency === 'DOP') box.dopPhysical -= total;
    } else {
      if (sourceCurrency === 'USD') box.usdPhysical -= numericAmount;
      if (sourceCurrency === 'EUR') box.eurPhysical -= numericAmount;
      if (targetCurrency === 'DOP') box.dopPhysical += total;
    }
    StorageService.saveCashbox(box);

    setSuccessTx(newTx);
    setAmount(''); 
    setSelectedClientId('');
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };

  const handleCloseModal = () => setSuccessTx(null);
  const handleGoToHistory = () => { if (successTx) onTransactionComplete(successTx); };
  const handlePrintReceipt = () => { if (successTx) generateReceiptPDF(successTx); };

  // --- CLIENT SELECTOR LOGIC ---
  const openClientSelector = () => {
      setClientSearch('');
      setIsAddingClient(false);
      setIsClientModalOpen(true);
      if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleQuickAddClient = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newClientName.trim()) return;

      // VALIDATION: Check for duplicates
      const exists = clients.some(c => c.name.toLowerCase() === newClientName.trim().toLowerCase());
      if (exists) {
          alert('¡Ya existe un cliente con este nombre! Búscalo en la lista.');
          return;
      }

      const newClient: Client = {
          id: crypto.randomUUID(),
          name: newClientName.trim(),
          phone: newClientPhone.trim(),
          createdAt: Date.now()
      };

      StorageService.saveClient(newClient);
      
      // Update Global State via Prop
      const updatedList = StorageService.getClients();
      onClientAdd(updatedList);
      
      // Auto-select
      setSelectedClientId(newClient.id);
      
      // Cleanup
      setNewClientName('');
      setNewClientPhone('');
      setIsClientModalOpen(false);
      if (navigator.vibrate) navigator.vibrate(20);
  };

  const CurrencyTab = ({ p, label, symbol }: { p: CurrencyPair, label: string, symbol: string }) => (
    <button
      onClick={() => {
          if (navigator.vibrate) navigator.vibrate(10);
          setPair(p);
      }}
      className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
        pair === p 
          ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg transform scale-[1.02]' 
          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
      }`}
    >
      <span className="opacity-50">{symbol}</span> {label}
    </button>
  );

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 h-full overflow-y-auto">
      
      {/* 1. Selector de Moneda */}
      <div className="flex gap-3">
        <CurrencyTab p="USD_DOP" label="Dólar (USD)" symbol="$" />
        <CurrencyTab p="EUR_DOP" label="Euro (EUR)" symbol="€" />
      </div>

      {/* 2. Selector de Acción */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-800 flex">
        <button
          onClick={() => {
             if (navigator.vibrate) navigator.vibrate(10);
             setMode(TransactionType.BUY);
          }}
          className={`flex-1 py-4 rounded-xl text-center font-bold text-lg transition-all ${
            mode === TransactionType.BUY
              ? 'bg-emerald-500 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="text-xs opacity-70 mb-1 font-normal">RECIBO DIVISA</div>
          COMPRAR
        </button>
        <button
          onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setMode(TransactionType.SELL);
          }}
          className={`flex-1 py-4 rounded-xl text-center font-bold text-lg transition-all ${
            mode === TransactionType.SELL
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="text-xs opacity-70 mb-1 font-normal">ENTREGO DIVISA</div>
          VENDER
        </button>
      </div>

      {/* 3. Tarjeta Principal de Cálculo */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg dark:shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-6 pb-2">
          <label className={`text-xs font-bold uppercase tracking-wider mb-2 block transition-colors ${isBuy ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
            Monto a {isBuy ? 'Recibir' : 'Entregar'} ({sourceCurrency})
          </label>
          <div className={`
             flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 shadow-inner
             ${isBuy 
                ? 'bg-emerald-100/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 focus-within:border-emerald-500 focus-within:bg-emerald-50 dark:focus-within:bg-emerald-900/30' 
                : 'bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 focus-within:border-blue-500 focus-within:bg-blue-50 dark:focus-within:bg-blue-900/30'
             }
             focus-within:ring-4 focus-within:ring-white dark:focus-within:ring-slate-800
          `}>
            <span className={`text-3xl font-light transition-colors ${isBuy ? 'text-emerald-500 dark:text-emerald-400' : 'text-blue-500 dark:text-blue-400'}`}>
                {sourceSymbol}
            </span>
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              onKeyDown={(e) => { if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault(); }}
              className="w-full text-4xl font-bold text-slate-900 dark:text-white placeholder-slate-300 bg-transparent outline-none tracking-tight"
              placeholder="0.00"
              autoFocus
            />
          </div>
        </div>

        {/* PRESET CHIPS */}
        <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {PRESET_AMOUNTS.map(val => (
                <button
                    key={val}
                    onClick={() => addPresetAmount(val)}
                    className="flex-shrink-0 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                    {sourceSymbol}{val}
                </button>
            ))}
        </div>

        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Tasa de Cambio</div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 px-3 py-1 rounded border border-slate-300 dark:border-slate-600 inline-block shadow-sm">
              {activeRate.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Total a {isBuy ? 'Pagar' : 'Cobrar'}</div>
            <div className={`text-3xl font-bold ${isBuy ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
              <span className="text-lg mr-1 text-slate-400 dark:text-slate-500 font-normal">RD$</span>
              {total.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Selector de Cliente (MEJORADO) */}
      <button 
        onClick={openClientSelector}
        className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-md dark:shadow-sm border transition-all text-left flex items-center gap-3 group ${selectedClientId ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-slate-200 dark:border-slate-800'}`}
      >
        <div className={`p-2.5 rounded-full transition-colors ${selectedClientId ? 'bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
            <User size={20} />
        </div>
        <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Cliente Asignado</label>
            <div className={`font-bold text-lg ${selectedClientId ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {selectedClientId ? selectedClient?.name : 'Cliente Ocasional'}
            </div>
        </div>
        <div className="text-slate-300 group-hover:text-brand-500 transition-colors">
            <Search size={18} />
        </div>
      </button>

      {/* 5. Botón de Acción */}
      <button 
        onClick={handleSave}
        className={`w-full py-5 rounded-2xl font-bold text-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3 text-white ${
            isBuy ? 'bg-emerald-600 shadow-emerald-200 dark:shadow-none hover:bg-emerald-700' : 'bg-blue-600 shadow-blue-200 dark:shadow-none hover:bg-blue-700'
        }`}
      >
        <Check size={28} strokeWidth={3} />
        {isBuy ? 'COMPLETAR COMPRA' : 'COMPLETAR VENTA'}
      </button>

      <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
        <AlertCircle size={10} />
        Verifique la tasa antes de confirmar la operación.
      </p>

      {/* SUCCESS MODAL */}
      {successTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative">
                <div className={`bg-emerald-500 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center justify-center ${showSuccessContent ? 'h-48' : 'h-80'}`}>
                    <div className={`bg-white/20 p-4 rounded-full transition-all duration-500 ${showSuccessContent ? 'scale-100' : 'scale-[1.8]'}`}>
                        <CheckCircle size={48} className="text-white animate-in zoom-in duration-300" />
                    </div>
                    <div className={`text-center mt-4 transition-all duration-500 ${showSuccessContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <h3 className="text-2xl font-bold text-white">¡Operación Exitosa!</h3>
                        <p className="text-emerald-100 mt-1 text-sm">Registrado correctamente</p>
                    </div>
                </div>
                
                <div className={`p-6 space-y-4 bg-white dark:bg-slate-900 transition-all duration-500 delay-75 ${showSuccessContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="text-center mb-6">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Total Transacción</div>
                        <div className="text-3xl font-bold text-slate-800 dark:text-white">
                            RD$ {successTx.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handlePrintReceipt}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors transform active:scale-95"
                        >
                            <Printer size={24} className="text-slate-600 dark:text-slate-300" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Imprimir</span>
                        </button>
                        <button 
                            onClick={handleGoToHistory}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors transform active:scale-95"
                        >
                            <History size={24} className="text-slate-600 dark:text-slate-300" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Ver Historial</span>
                        </button>
                    </div>

                    <button 
                        onClick={handleCloseModal}
                        className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-200 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Plus size={20} />
                        Nueva Operación
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* CLIENT SELECTION MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
             {/* Modal Header */}
             <div className="bg-white dark:bg-slate-900 px-4 py-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                 <button onClick={() => setIsClientModalOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                     <X size={24} className="text-slate-600 dark:text-slate-300" />
                 </button>
                 <h2 className="text-lg font-bold text-slate-800 dark:text-white flex-1">
                     {isAddingClient ? 'Registrar Cliente' : 'Seleccionar Cliente'}
                 </h2>
                 {!isAddingClient && (
                     <button onClick={() => setIsAddingClient(true)} className="text-brand-600 font-bold text-sm flex items-center gap-1 bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 rounded-lg">
                         <UserPlus size={16} /> Nuevo
                     </button>
                 )}
             </div>

             {/* Modal Content */}
             <div className="flex-1 overflow-y-auto p-4">
                 {isAddingClient ? (
                     // ADD NEW CLIENT FORM
                     <div className="max-w-md mx-auto space-y-4 mt-4">
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nombre Completo *</label>
                             <input 
                                 autoFocus
                                 value={newClientName}
                                 onChange={(e) => setNewClientName(e.target.value)}
                                 className="w-full p-4 text-lg border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-brand-500"
                                 placeholder="Ej. Juan Pérez"
                             />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Teléfono (Opcional)</label>
                             <input 
                                 value={newClientPhone}
                                 onChange={(e) => setNewClientPhone(e.target.value)}
                                 className="w-full p-4 text-lg border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-brand-500"
                                 placeholder="809-000-0000"
                                 type="tel"
                             />
                         </div>
                         <button 
                             onClick={handleQuickAddClient}
                             disabled={!newClientName.trim()}
                             className="w-full py-4 bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg mt-4 flex items-center justify-center gap-2"
                         >
                             <Check size={20} /> Guardar y Seleccionar
                         </button>
                         <button 
                             onClick={() => setIsAddingClient(false)}
                             className="w-full py-3 text-slate-500 font-medium"
                         >
                             Cancelar
                         </button>
                     </div>
                 ) : (
                     // SEARCH LIST
                     <div className="max-w-md mx-auto">
                         <div className="relative mb-4">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                             <input 
                                 autoFocus
                                 value={clientSearch}
                                 onChange={(e) => setClientSearch(e.target.value)}
                                 className="w-full p-3 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                                 placeholder="Buscar por nombre..."
                             />
                         </div>

                         <div className="space-y-2">
                             <button
                                 onClick={() => { setSelectedClientId(''); setIsClientModalOpen(false); }}
                                 className={`w-full p-3 rounded-xl flex items-center gap-3 border ${!selectedClientId ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/10 dark:border-brand-900/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                             >
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!selectedClientId ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                                     <User size={20} />
                                 </div>
                                 <div className="text-left flex-1">
                                     <div className={`font-bold ${!selectedClientId ? 'text-brand-700 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200'}`}>Cliente Ocasional</div>
                                     <div className="text-xs text-slate-500">Sin registro</div>
                                 </div>
                                 {!selectedClientId && <Check size={20} className="text-brand-600" />}
                             </button>

                             {filteredClients.map(client => (
                                 <button
                                     key={client.id}
                                     onClick={() => { setSelectedClientId(client.id); setIsClientModalOpen(false); }}
                                     className={`w-full p-3 rounded-xl flex items-center gap-3 border transition-colors ${selectedClientId === client.id ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/10 dark:border-brand-900/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-300'}`}
                                 >
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${selectedClientId === client.id ? 'bg-brand-100 text-brand-600 border-brand-200' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>
                                         {client.name.charAt(0).toUpperCase()}
                                     </div>
                                     <div className="text-left flex-1">
                                         <div className={`font-bold ${selectedClientId === client.id ? 'text-brand-700 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200'}`}>{client.name}</div>
                                         <div className="text-xs text-slate-500 flex items-center gap-1">
                                             {client.phone && <Phone size={10} />} {client.phone || 'Sin teléfono'}
                                         </div>
                                     </div>
                                     {selectedClientId === client.id && <Check size={20} className="text-brand-600" />}
                                 </button>
                             ))}
                             
                             {filteredClients.length === 0 && (
                                 <div className="text-center py-8 text-slate-400">
                                     <p>No se encontraron clientes.</p>
                                     <button onClick={() => setIsAddingClient(true)} className="text-brand-600 font-bold mt-2 hover:underline">
                                         Crear "{clientSearch}"
                                     </button>
                                 </div>
                             )}
                         </div>
                     </div>
                 )}
             </div>
        </div>
      )}

    </div>
  );
};

export default Converter;