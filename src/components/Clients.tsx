import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, StickyNote, User, Calendar, CreditCard, X, Search, TrendingUp } from 'lucide-react';
import { Client, Transaction } from '../types';
import { StorageService } from '../services/storage';

interface ClientsProps {
    clients: Client[];
    transactions?: Transaction[];
    onUpdateClients: (clients: Client[]) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, transactions = [], onUpdateClients }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', cedula: '', notes: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate stats for filtered clients
  const enrichedClients = useMemo(() => {
    return clients.map(client => {
        const clientTxs = transactions.filter(t => t.clientId === client.id);
        const totalVolume = clientTxs.reduce((acc, t) => acc + t.amount, 0);
        return { ...client, totalVolume, txCount: clientTxs.length };
    }).sort((a, b) => b.totalVolume - a.totalVolume); // SORT BY VOLUME DESCENDING
  }, [clients, transactions]);

  const filteredClients = useMemo(() => {
      if (!searchTerm) return enrichedClients;
      const lower = searchTerm.toLowerCase();
      return enrichedClients.filter(c => 
          c.name.toLowerCase().includes(lower) || 
          c.cedula?.includes(lower) || 
          c.phone?.includes(lower)
      );
  }, [enrichedClients, searchTerm]);

  const handleAddNew = () => {
    setFormData({ name: '', phone: '', cedula: '', notes: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (client: Client) => {
    setFormData({
        name: client.name,
        phone: client.phone,
        cedula: client.cedula || '',
        notes: client.notes || ''
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', phone: '', cedula: '', notes: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const existingClient = editingId ? clients.find(c => c.id === editingId) : null;

    const clientToSave: Client = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      phone: formData.phone,
      cedula: formData.cedula,
      notes: formData.notes,
      createdAt: existingClient ? existingClient.createdAt : Date.now()
    };

    StorageService.saveClient(clientToSave);
    onUpdateClients(StorageService.getClients()); // Refresh global
    handleCloseForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar cliente permanentemente?')) {
      StorageService.deleteClient(id);
      onUpdateClients(StorageService.getClients());
    }
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col bg-slate-100 dark:bg-slate-950">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Clientes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gestión de cartera</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-brand-600 text-white p-3 rounded-full shadow-lg shadow-brand-500/30 active:scale-95 transition-transform hover:bg-brand-700"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
          </div>
          <input 
              type="text" 
              placeholder="Buscar por nombre, cédula o teléfono..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-white transition-all shadow-sm"
          />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-100 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white">
                        {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h3>
                    <button type="button" onClick={handleCloseForm} className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nombre Completo</label>
                        <input 
                            placeholder="Ej. Juan Pérez" 
                            className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all font-medium"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Teléfono / WhatsApp</label>
                            <input 
                                placeholder="809-000-0000" 
                                className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl outline-none focus:border-brand-500 transition-all font-medium"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cédula / ID</label>
                            <input 
                                placeholder="001-000..." 
                                className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl outline-none focus:border-brand-500 transition-all font-medium"
                                value={formData.cedula}
                                onChange={e => setFormData({...formData, cedula: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Notas Internas</label>
                        <textarea 
                            placeholder="Información relevante..." 
                            className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl outline-none focus:border-brand-500 text-sm resize-none font-medium"
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-500/20 active:scale-95 transition-all">
                        {editingId ? 'Guardar Cambios' : 'Registrar Cliente'}
                    </button>
                </div>
            </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800 group relative overflow-hidden transition-shadow hover:shadow-lg">
            
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-lg border border-brand-200 dark:border-brand-900/30">
                     {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">{client.name}</h3>
                     <div className="flex items-center gap-2 mt-1">
                        {client.cedula ? (
                            <span className="flex items-center gap-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-medium">
                                <CreditCard size={10} /> {client.cedula}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Sin Cédula</span>
                        )}
                     </div>
                  </div>
               </div>
               
               {/* Actions */}
               <div className="flex gap-2">
                 <button 
                    onClick={() => handleEdit(client)}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                 >
                    <Edit2 size={18} />
                 </button>
                 <button 
                    onClick={() => handleDelete(client.id)} 
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                 >
                    <Trash2 size={18} />
                 </button>
               </div>
            </div>

            {/* CRM Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                 <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg font-medium border border-slate-200 dark:border-slate-800/50">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Volumen Total</span>
                        <span className="font-bold text-slate-800 dark:text-white font-mono">{client.totalVolume?.toLocaleString() || 0}</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg font-medium border border-slate-200 dark:border-slate-800/50">
                    <Calendar size={14} className="text-blue-500" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Registrado</span>
                        <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                    </div>
                 </div>
            </div>
            
            {/* Notes */}
            {client.notes && (
              <div className="flex items-start gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <StickyNote size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed font-medium">{client.notes}</p>
              </div>
            )}
          </div>
        ))}
        
        {filteredClients.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
                 <User size={24} className="opacity-40" />
             </div>
             <p className="font-medium">Sin Resultados</p>
             <p className="text-xs opacity-60 mt-1">
                 {searchTerm ? 'Intenta con otro término de búsqueda' : 'Agrega clientes para agilizar operaciones'}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;