
import React, { useState, useMemo } from 'react';
import { Search, Printer, Share2, ArrowDownLeft, ArrowUpRight, FileText, Calendar } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { generateReceiptPDF, shareOnWhatsApp, getSymbols } from '../utils/receiptGenerator';

interface TransactionsProps {
  transactions: Transaction[];
}

const Transactions: React.FC<TransactionsProps> = ({ transactions }) => {
  const [filter, setFilter] = useState('');

  // Memoize filtering calculation
  const filtered = useMemo(() => {
    return transactions.filter(t => 
      t.clientName.toLowerCase().includes(filter.toLowerCase()) ||
      t.amount.toString().includes(filter) ||
      t.id.includes(filter)
    );
  }, [transactions, filter]);

  return (
    <div className="p-4 pb-24 h-full flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
           <h2 className="text-xl font-bold text-slate-900 dark:text-white">Historial</h2>
           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Transacciones recientes</p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-400">
           {transactions.length} registros
        </div>
      </div>
      
      {/* Search */}
      <div className="relative mb-6 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Buscar cliente, monto o ID..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-white transition-all shadow-sm focus:shadow-md"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {filtered.map(tx => {
           const { src, tgtSym } = getSymbols(tx.pair);
           const isBuy = tx.type === TransactionType.BUY;
           
           return (
            <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow relative overflow-hidden group">
              
              <div className="flex justify-between items-start mb-3">
                 {/* Left Info */}
                 <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-inner ${isBuy ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'}`}>
                        {isBuy ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                            {tx.clientName}
                            {tx.clientId === 'WALK_IN' && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">Casual</span>}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(tx.timestamp).toLocaleDateString()}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                 </div>

                 {/* Right Amounts */}
                 <div className="text-right">
                     <div className={`text-lg font-bold tracking-tight ${isBuy ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                        {tgtSym} {tx.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                     </div>
                     <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {tx.amount} {src} <span className="text-slate-300 dark:text-slate-600">|</span> <span className="text-slate-500 font-normal">Tasa: {tx.rate}</span>
                     </div>
                 </div>
              </div>

              {/* Action Footer (Visible on hover/tap) */}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
                   <div className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
                       ID: {tx.id.slice(0,6)}
                   </div>
                   <div className="flex gap-2">
                        <button 
                            onClick={() => shareOnWhatsApp(tx)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Compartir"
                        >
                            <Share2 size={16} />
                        </button>
                        <button 
                            onClick={() => generateReceiptPDF(tx)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium rounded-lg shadow hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                        >
                            <Printer size={14} /> 
                            <span>Recibo</span>
                        </button>
                   </div>
              </div>

            </div>
           );
        })}
        
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
                 <FileText size={24} className="opacity-40" />
             </div>
             <p className="font-medium">Sin resultados</p>
             <p className="text-xs opacity-60 mt-1">Intenta cambiar el filtro de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
