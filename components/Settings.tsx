import React, { useState, useRef, useEffect } from 'react';
import { Save, Moon, Sun, User, DollarSign, Download, Upload, AlertTriangle, Printer, Bluetooth, XCircle, Loader, Type, Briefcase, FileText, Database, RefreshCw, Trash2, Code, HelpCircle, X, Info, Check } from 'lucide-react';
import { ExchangeRate, UserPreferences } from '../types';
import { StorageService } from '../services/storage';
import { PrinterService } from '../services/printerService';

interface SettingsProps {
  currentRates: ExchangeRate;
  currentPrefs: UserPreferences;
  onUpdateRates: (rates: ExchangeRate) => void;
  onUpdatePrefs: (prefs: UserPreferences) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentRates, currentPrefs, onUpdateRates, onUpdatePrefs }) => {
  const [rates, setRates] = useState<ExchangeRate>(currentRates);
  const [prefs, setPrefs] = useState<UserPreferences>(currentPrefs);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Help Modal State
  const [helpContent, setHelpContent] = useState<{title: string, description: string, tips: string[]} | null>(null);

  // Printer State
  const [isConnecting, setIsConnecting] = useState(false);
  const [btError, setBtError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setRates(currentRates);
    setPrefs(currentPrefs);
    
    // Check initial connection state from service memory
    const conn = PrinterService.getActiveConnection();
    setIsConnected(conn.isConnected);

    // Listener for auto-disconnects (e.g. out of range)
    PrinterService.setDisconnectListener(() => {
        setIsConnected(false);
    });

  }, [currentRates, currentPrefs]);

  const handleRateChange = (pair: 'usd_dop' | 'eur_dop', type: 'buy' | 'sell', value: string) => {
    const numValue = parseFloat(value);
    setRates(prev => ({
      ...prev,
      [pair]: {
        ...prev[pair],
        [type]: isNaN(numValue) ? 0 : numValue
      }
    }));
  };

  const handleInstantPrefChange = (key: keyof UserPreferences, value: any) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs); 
    StorageService.savePreferences(newPrefs);
    onUpdatePrefs(newPrefs);
  };

  const saveManualSettings = () => {
    const updatedRates = { ...rates, lastUpdated: Date.now() };
    StorageService.saveRates(updatedRates);
    onUpdateRates(updatedRates);
    StorageService.savePreferences(prefs);
    onUpdatePrefs(prefs);
    alert('Configuración guardada correctamente.');
  };

  const handleDownloadBackup = () => {
    const dataStr = StorageService.createBackup();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `DivisasPro_Backup_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];

    if (file) {
      fileReader.readAsText(file, "UTF-8");
      fileReader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
            const success = StorageService.restoreBackup(content);
            if (success) {
                alert("Restauración completada. La aplicación se reiniciará.");
                window.location.reload();
            } else {
                alert("Error: El archivo de respaldo está dañado o no es válido.");
            }
        }
      };
    }
  };

  const handleFactoryReset = () => {
      if (confirm("⚠️ ¿Estás seguro? \n\nEsto borrará TODOS los datos (clientes, historial, caja) y restablecerá la aplicación a su estado original (Bienvenida).\n\nEsta acción no se puede deshacer.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  // --- HELP DATA ---
  const showHelp = (section: 'profile' | 'rates' | 'printer' | 'backup') => {
      const content = {
          profile: {
              title: "Perfil e Identidad",
              description: "Configura los datos visuales de la aplicación. El 'Nombre de Usuario' se utiliza para saludarte en el Inicio, mientras que el 'Nombre del Negocio' y el 'Slogan' son los que aparecerán impresos en los recibos de tus clientes.",
              tips: [
                  "Usa un nombre de negocio corto para que quepa bien en el ticket.",
                  "El modo oscuro ahorra batería en pantallas OLED."
              ]
          },
          rates: {
              title: "Tasas de Cambio",
              description: "Define los precios base para hoy. 'Compra' es el precio que pagas al recibir divisas, y 'Venta' es el precio que cobras al entregar divisas.",
              tips: [
                  "Actualiza esto cada mañana antes de operar.",
                  "Mantén una diferencia (spread) saludable entre compra y venta para asegurar ganancias."
              ]
          },
          printer: {
              title: "Impresora Bluetooth",
              description: "Conecta una impresora térmica portátil (58mm o 80mm) para entregar tickets físicos. La aplicación usa tecnología Web Bluetooth para conectar directamente sin instalar drivers.",
              tips: [
                  "Si falla la conexión, apaga y prende la impresora.",
                  "Asegúrate de que el GPS/Ubicación esté activado en Android (requerido para escanear Bluetooth)."
              ]
          },
          backup: {
              title: "Seguridad y Datos",
              description: "Toda la información vive dentro de tu teléfono. No usamos servidores en la nube. Por seguridad, debes crear copias de respaldo manualmente.",
              tips: [
                  "Exporta un respaldo al final de cada semana.",
                  "Guarda el archivo .json en tu correo o Google Drive por si pierdes el teléfono."
              ]
          }
      };
      setHelpContent(content[section]);
  };

  // --- PRINTER LOGIC ---
  const handleScanPrinter = async () => {
      setBtError(null);
      setIsConnecting(true);

      if (!PrinterService.isSupported()) {
          setBtError("Tu navegador no soporta Web Bluetooth. Usa Chrome en Android.");
          setIsConnecting(false);
          return;
      }

      try {
          const connection = await PrinterService.scanAndConnect();
          if (connection) {
              const { device } = connection;
              
              const newPrefs = {
                  ...prefs,
                  printer: {
                      deviceId: device.id,
                      deviceName: device.name || 'Impresora Genérica',
                      serviceId: 'auto',
                      characteristicId: 'auto'
                  }
              };
              handleInstantPrefChange('printer', newPrefs.printer);
              setIsConnected(true);
          }
      } catch (err: any) {
          if (err.name !== 'NotFoundError') {
             setBtError("Error al conectar: " + err.message);
          }
          setIsConnected(false);
      } finally {
          setIsConnecting(false);
      }
  };

  const handleDisconnectPrinter = () => {
      PrinterService.disconnect();
      setIsConnected(false);
      handleInstantPrefChange('printer', { 
          deviceId: null, deviceName: null, serviceId: null, characteristicId: null 
      });
  };

  const handleTestPrint = async () => {
      if (!isConnected) {
          alert("Impresora desconectada. Por favor reconecte.");
          return;
      }
      
      try {
           // We pass null to use the active cached characteristic in the service
           await PrinterService.printTestReceipt(null);
      } catch (e: any) {
          alert("Error: " + e.message);
          setIsConnected(false); // Assume disconnection on error
      }
  };

  const ToggleSwitch = ({ checked, onChange, id }: { checked: boolean, onChange: (val: boolean) => void, id: string }) => (
    <div className="flex items-center">
      <label 
        htmlFor={id} 
        className={`
          relative inline-flex items-center cursor-pointer touch-manipulation
          w-14 h-8 rounded-full transition-all duration-500 ease-out border border-slate-200 dark:border-slate-600
          ${checked ? 'bg-brand-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-slate-700 shadow-inner'}
        `}
      >
        <input 
          id={id}
          type="checkbox" 
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only" 
        />
        <span 
          className={`
            absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-md 
            transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            flex items-center justify-center
            ${checked ? 'translate-x-6' : 'translate-x-0'}
          `}
        >
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${checked ? 'bg-brand-500 scale-100' : 'bg-slate-300 scale-0'}`}></span>
        </span>
      </label>
    </div>
  );

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto space-y-6 animate-in fade-in duration-500">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ajustes</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Personalización y Configuración</p>
      </div>

      {/* Perfil y Personalización */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <User size={18} /> Perfil e Identidad
            </h3>
            <button onClick={() => showHelp('profile')} className="text-slate-400 hover:text-brand-500 transition-colors">
                <HelpCircle size={18} />
            </button>
        </div>
        
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <Type size={10} /> Nombre de Usuario (Cajero)
                    </label>
                    <input 
                        type="text" 
                        value={prefs.userName}
                        onChange={(e) => setPrefs({...prefs, userName: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-brand-500 text-slate-800 dark:text-white font-medium transition-all"
                        placeholder="Ej. Carlos Gerente"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Se usará para el saludo de bienvenida.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <Briefcase size={10} /> Nombre del Negocio
                    </label>
                    <input 
                        type="text" 
                        value={prefs.businessName}
                        onChange={(e) => setPrefs({...prefs, businessName: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-brand-500 text-slate-800 dark:text-white font-medium transition-all"
                        placeholder="Ej. Divisas Santo Domingo"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Se usará <strong className="text-brand-600">exclusivamente</strong> para el encabezado del recibo impreso.</p>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <FileText size={10} /> Slogan del Recibo
                    </label>
                    <input 
                        type="text" 
                        value={prefs.slogan || ''}
                        onChange={(e) => setPrefs({...prefs, slogan: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-brand-500 text-slate-800 dark:text-white font-medium transition-all"
                        placeholder="Ej. Servicios Financieros"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Texto secundario en el ticket impreso.</p>
                </div>
            </div>

            {/* Toggle Row: Dark Mode */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors mt-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full transition-colors duration-300 ${prefs.darkMode ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-amber-100 text-amber-600'}`}>
                        {prefs.darkMode ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                        <span className="block font-bold text-slate-700 dark:text-slate-200">Modo Oscuro</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {prefs.darkMode ? 'Activado' : 'Desactivado'}
                        </span>
                    </div>
                </div>
                <ToggleSwitch 
                    id="toggle-darkmode"
                    checked={prefs.darkMode} 
                    onChange={(val) => handleInstantPrefChange('darkMode', val)} 
                />
            </div>
        </div>
      </div>

      {/* Gestión de Tasas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800">
         <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <DollarSign size={18} /> Configuración de Tasas
            </h3>
            <button onClick={() => showHelp('rates')} className="text-slate-400 hover:text-brand-500 transition-colors">
                <HelpCircle size={18} />
            </button>
         </div>
        
        <div className="space-y-6">
            {/* USD */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🇺🇸</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Dólar (USD)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">Compra</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={rates.usd_dop.buy}
                            onChange={(e) => handleRateChange('usd_dop', 'buy', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-800 dark:text-white text-lg focus:border-emerald-500 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-1 block">Venta</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={rates.usd_dop.sell}
                            onChange={(e) => handleRateChange('usd_dop', 'sell', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-800 dark:text-white text-lg focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* EUR */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🇪🇺</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Euro (EUR)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1 block">Compra</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={rates.eur_dop.buy}
                            onChange={(e) => handleRateChange('eur_dop', 'buy', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-800 dark:text-white text-lg focus:border-emerald-500 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-1 block">Venta</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={rates.eur_dop.sell}
                            onChange={(e) => handleRateChange('eur_dop', 'sell', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 font-mono font-bold text-slate-800 dark:text-white text-lg focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- PRINTER CONFIGURATION --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Printer size={18} /> Configuración de Impresora
            </h3>
            <button onClick={() => showHelp('printer')} className="text-slate-400 hover:text-brand-500 transition-colors">
                <HelpCircle size={18} />
            </button>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full transition-colors ${isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                          <Bluetooth size={20} />
                      </div>
                      <div>
                          <div className="font-bold text-sm text-slate-800 dark:text-white">
                              {prefs.printer?.deviceName || "Sin Impresora"}
                          </div>
                          <div className={`text-xs font-medium ${isConnected ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {isConnected ? "Conectado y Listo" : (prefs.printer?.deviceId ? "Desconectado (Requiere reconexión)" : "No configurada")}
                          </div>
                      </div>
                  </div>
                  
                  {isConnected ? (
                      <button 
                          onClick={handleDisconnectPrinter}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Desconectar"
                      >
                          <XCircle size={20} />
                      </button>
                  ) : (
                      <button 
                          onClick={handleScanPrinter}
                          disabled={isConnecting}
                          className={`px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-2 transition-all ${isConnecting ? 'bg-slate-400 text-white cursor-wait' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                      >
                          {isConnecting ? <Loader size={14} className="animate-spin" /> : (prefs.printer?.deviceId ? <><RefreshCw size={14}/> Reconectar</> : 'Escanear')}
                      </button>
                  )}
              </div>

              {btError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-xs rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                      <AlertTriangle size={14} /> {btError}
                  </div>
              )}

              <button 
                  onClick={handleTestPrint}
                  disabled={!isConnected}
                  className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                  <Printer size={14} /> Imprimir Prueba
              </button>
              
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                  Soporte Universal: Compatible con Zjiang, Goojprt, MTP, X-Printer y dispositivos genéricos BLE.
              </p>
          </div>
      </div>

      {/* --- BACKUP SECTION --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md dark:shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Database size={18} /> Seguridad y Datos
            </h3>
            <button onClick={() => showHelp('backup')} className="text-slate-400 hover:text-brand-500 transition-colors">
                <HelpCircle size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
              <button 
                  onClick={handleDownloadBackup}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                  <Download size={24} className="text-brand-600 dark:text-brand-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Exportar Respaldo</span>
              </button>
              <button 
                  onClick={handleRestoreClick}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                  <Upload size={24} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Restaurar Copia</span>
              </button>
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".json" 
                  className="hidden" 
              />
          </div>
          <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
              <AlertTriangle size={10} /> 
              Al restaurar, se reemplazarán todos los datos actuales por los del archivo.
          </p>
      </div>

      <button 
        onClick={saveManualSettings}
        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <Save size={20} /> Guardar Cambios
      </button>

      {/* FOOTER / CREDITS / RESET */}
      <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center pb-8">
          <h4 className="text-slate-900 dark:text-white font-bold text-sm tracking-tight flex items-center justify-center gap-2">
              <div className="w-4 h-4 bg-brand-600 rounded flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">$</span>
              </div>
              DIVISAS<span className="text-brand-600">PRO</span>
          </h4>
          <p className="text-[10px] text-slate-400 font-medium mt-2">Versión 0.1 Final (Producción)</p>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center gap-1">
              <Code size={10} /> Desarrollado por <span className="font-bold text-slate-500 dark:text-slate-300">Frankays</span>
          </p>

          <button 
            onClick={handleFactoryReset}
            className="mt-8 text-[10px] text-red-400 hover:text-red-600 flex items-center justify-center gap-1 mx-auto transition-colors px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          >
              <Trash2 size={12} /> Restablecer de Fábrica
          </button>
      </div>

      {/* --- HELP MODAL --- */}
      {helpContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                <button 
                    onClick={() => setHelpContent(null)}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                    <X size={20} />
                </button>
                
                <div className="p-6">
                    <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mb-4">
                        <Info size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        {helpContent.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                        {helpContent.description}
                    </p>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                            <Check size={12} /> Consejos Pro
                        </h4>
                        <ul className="space-y-2">
                            {helpContent.tips.map((tip, idx) => (
                                <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                                    <span className="text-brand-500">•</span> {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={() => setHelpContent(null)}
                        className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold shadow-lg"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Settings;