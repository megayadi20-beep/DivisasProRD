
import React, { useState } from 'react';
import { ArrowRight, User, Briefcase, DollarSign, Printer, Check, Moon, Sun, ShieldCheck } from 'lucide-react';
import { UserPreferences, ExchangeRate } from '../types';
import { StorageService } from '../services/storage';
import { PrinterService } from '../services/printerService';

interface OnboardingProps {
    onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        userName: '',
        businessName: '',
        slogan: 'Servicios Financieros',
        darkMode: false
    });
    
    // Initial rates state
    const [rates, setRates] = useState<ExchangeRate>({
        usd_dop: { buy: 58.50, sell: 59.50 },
        eur_dop: { buy: 63.00, sell: 65.00 },
        lastUpdated: Date.now()
    });

    const [isConnecting, setIsConnecting] = useState(false);
    const [printerConnected, setPrinterConnected] = useState(false);

    const triggerVibration = () => {
        if (navigator.vibrate) navigator.vibrate(15);
    };

    const handleNext = () => {
        triggerVibration();
        if (step < 4) setStep(step + 1);
        else handleFinish();
    };

    const handleFinish = () => {
        triggerVibration();
        // Save everything
        const prefs: UserPreferences = {
            isSetupCompleted: true,
            userName: formData.userName,
            businessName: formData.businessName,
            slogan: formData.slogan,
            darkMode: formData.darkMode,
            printer: StorageService.getPreferences().printer, 
            dashboardLayout: ['quick', 'stats', 'rates', 'cashbox', 'clients', 'chart']
        };

        StorageService.savePreferences(prefs);
        StorageService.saveRates(rates);
        
        // Apply theme immediately
        if (formData.darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        onComplete();
    };

    const connectPrinter = async () => {
        triggerVibration();
        setIsConnecting(true);
        try {
            const conn = await PrinterService.scanAndConnect();
            if (conn) {
                setPrinterConnected(true);
                const currentPrefs = StorageService.getPreferences();
                StorageService.savePreferences({
                    ...currentPrefs,
                    printer: {
                        deviceId: conn.device.id,
                        deviceName: conn.device.name || 'Impresora',
                        serviceId: 'auto',
                        characteristicId: 'auto'
                    }
                });
            }
        } catch (e) {
            alert('No se pudo conectar. Puedes configurarlo más tarde en Ajustes.');
        } finally {
            setIsConnecting(false);
        }
    };

    const updateRate = (pair: 'usd_dop' | 'eur_dop', type: 'buy' | 'sell', val: string) => {
        setRates(prev => ({
            ...prev,
            [pair]: {
                ...prev[pair],
                [type]: parseFloat(val) || 0
            }
        }));
    };

    const StepIndicator = () => (
        <div className="flex gap-2 mb-8 justify-center relative z-10">
            {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-brand-500 shadow-lg shadow-brand-500/30' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
            
            {/* Animated Background Blobs (Modern/Fluid) */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-300 dark:bg-emerald-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-slate-800/50 relative z-10">
                
                <StepIndicator />

                <div className="min-h-[340px]">
                    {/* STEP 0: WELCOME & PROFILE */}
                    {step === 0 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/40 rounded-2xl flex items-center justify-center text-brand-600 mb-6 mx-auto shadow-inner">
                                <User size={32} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white text-center mb-2 tracking-tight">Bienvenido</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-center mb-8 text-sm leading-relaxed">
                                DivisasPro es tu herramienta profesional de gestión. <br/>Dinos cómo llamarte.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block pl-1">Tu Nombre</label>
                                    <input 
                                        value={formData.userName}
                                        onChange={e => setFormData({...formData, userName: e.target.value})}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-500 rounded-xl outline-none font-bold text-slate-800 dark:text-white transition-all shadow-inner focus:shadow-lg focus:shadow-brand-500/10 text-lg"
                                        placeholder="Ej. Carlos Pérez"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: BUSINESS IDENTITY */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 mb-6 mx-auto shadow-inner">
                                <Briefcase size={32} />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">Identidad del Negocio</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-center mb-8 text-sm">Personaliza tus recibos y reportes.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block pl-1">Nombre de la Empresa</label>
                                    <input 
                                        value={formData.businessName}
                                        onChange={e => setFormData({...formData, businessName: e.target.value})}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-bold text-slate-800 dark:text-white transition-all shadow-inner text-lg"
                                        placeholder="Ej. Divisas Santo Domingo"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block pl-1">Slogan (Opcional)</label>
                                    <input 
                                        value={formData.slogan}
                                        onChange={e => setFormData({...formData, slogan: e.target.value})}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none text-slate-800 dark:text-white transition-all shadow-inner"
                                        placeholder="Ej. Confianza y Seguridad"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: INITIAL RATES */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 mx-auto shadow-inner">
                                <DollarSign size={32} />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">Tasas del Día</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-center mb-8 text-sm">Define los precios iniciales para hoy.</p>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-3 font-bold text-slate-700 dark:text-white text-sm">
                                        <span className="text-lg">🇺🇸</span> Dólar (USD)
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block">Compra</label>
                                            <input type="number" value={rates.usd_dop.buy} onChange={e => updateRate('usd_dop', 'buy', e.target.value)} className="w-full p-2 rounded-lg font-bold text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">Venta</label>
                                            <input type="number" value={rates.usd_dop.sell} onChange={e => updateRate('usd_dop', 'sell', e.target.value)} className="w-full p-2 rounded-lg font-bold text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-3 font-bold text-slate-700 dark:text-white text-sm">
                                        <span className="text-lg">🇪🇺</span> Euro (EUR)
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block">Compra</label>
                                            <input type="number" value={rates.eur_dop.buy} onChange={e => updateRate('eur_dop', 'buy', e.target.value)} className="w-full p-2 rounded-lg font-bold text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">Venta</label>
                                            <input type="number" value={rates.eur_dop.sell} onChange={e => updateRate('eur_dop', 'sell', e.target.value)} className="w-full p-2 rounded-lg font-bold text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PRINTER */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center text-purple-600 mb-6 mx-auto shadow-inner">
                                <Printer size={32} />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Impresora Térmica</h1>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">Conecta tu dispositivo Bluetooth ahora para imprimir recibos.</p>
                            
                            {printerConnected ? (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center justify-center gap-2 mb-8 border border-emerald-200 dark:border-emerald-800 animate-in zoom-in duration-300">
                                    <Check size={20} /> Impresora Conectada
                                </div>
                            ) : (
                                <button 
                                    onClick={connectPrinter}
                                    disabled={isConnecting}
                                    className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 mb-4 flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {isConnecting ? 'Buscando...' : 'Escanear Bluetooth'}
                                </button>
                            )}

                            <div className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                Soporta impresoras 58mm/80mm (Zjiang, Goojprt, Genéricas)
                            </div>
                        </div>
                    )}

                    {/* STEP 4: INTERFACE & FINISH */}
                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center">
                            <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/40 rounded-2xl flex items-center justify-center text-brand-600 mb-6 mx-auto shadow-inner">
                                <ShieldCheck size={32} />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">¡Todo Listo!</h1>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">Selecciona tu tema preferido para trabajar.</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button 
                                    onClick={() => { triggerVibration(); setFormData({...formData, darkMode: false}); }}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${!formData.darkMode ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-md transform scale-105' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <Sun size={24} />
                                    <span className="font-bold text-sm">Claro</span>
                                </button>
                                <button 
                                    onClick={() => { triggerVibration(); setFormData({...formData, darkMode: true}); }}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.darkMode ? 'border-brand-500 bg-slate-800 text-brand-400 shadow-md transform scale-105' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <Moon size={24} />
                                    <span className="font-bold text-sm">Oscuro</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-6 flex gap-3">
                    {step > 0 && (
                        <button 
                            onClick={() => { triggerVibration(); setStep(step - 1); }}
                            className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Atrás
                        </button>
                    )}
                    <button 
                        onClick={handleNext}
                        disabled={step === 0 && !formData.userName || step === 1 && !formData.businessName}
                        className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                        {step === 4 ? 'Empezar a Trabajar' : (step === 3 ? (printerConnected ? 'Continuar' : 'Omitir') : 'Siguiente')}
                        {step < 4 && <ArrowRight size={20} />}
                    </button>
                </div>

            </div>
            
            <p className="mt-8 text-[10px] text-slate-400 font-medium relative z-10 opacity-60">DivisasPro Mobile v0.1 • Producción</p>
        </div>
    );
};

export default Onboarding;
