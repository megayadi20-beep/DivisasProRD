
import { Client, Transaction, ExchangeRate, CashBox, UserPreferences, CashAdjustment } from '../types';

const KEYS = {
  CLIENTS: 'divisas_clients',
  TRANSACTIONS: 'divisas_transactions',
  RATES: 'divisas_rates_v3',
  CASHBOX: 'divisas_cashbox_v2',
  ADJUSTMENTS: 'divisas_adjustments_v1',
  PREFS: 'divisas_prefs_v5' // Incremented version for clean install simulation
};

// Helpers
const get = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Error loading key ${key} from storage`, error);
    return defaultValue;
  }
};

const set = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key ${key} to storage`, error);
  }
};

// --- CLEAN SLATE DEFAULTS ---
const DEFAULT_RATES: ExchangeRate = { 
  usd_dop: { buy: 58.50, sell: 59.50 },
  eur_dop: { buy: 63.00, sell: 65.00 },
  lastUpdated: Date.now() 
};

// Empty cashbox for fresh start
const DEFAULT_CASHBOX: CashBox = { 
  usdPhysical: 0, 
  eurPhysical: 0,
  dopPhysical: 0, 
  usdBank: 0, 
  dopBank: 0 
};

const DEFAULT_PREFS: UserPreferences = {
  isSetupCompleted: false, // Triggers Onboarding
  userName: '',
  businessName: '',
  slogan: '',
  darkMode: false,
  printer: {
    deviceId: null,
    deviceName: null,
    serviceId: null,
    characteristicId: null
  },
  dashboardLayout: ['quick', 'stats', 'rates', 'cashbox', 'clients', 'chart']
};

export const StorageService = {
  getClients: (): Client[] => get(KEYS.CLIENTS, []), // Empty array
  saveClient: (client: Client) => {
    const clients = get<Client[]>(KEYS.CLIENTS, []);
    const index = clients.findIndex(c => c.id === client.id);
    if (index >= 0) clients[index] = client;
    else clients.push(client);
    set(KEYS.CLIENTS, clients);
  },
  deleteClient: (id: string) => {
    const clients = get<Client[]>(KEYS.CLIENTS, []);
    set(KEYS.CLIENTS, clients.filter(c => c.id !== id));
  },

  getTransactions: (): Transaction[] => get(KEYS.TRANSACTIONS, []), // Empty array
  saveTransaction: (tx: Transaction) => {
    const txs = get<Transaction[]>(KEYS.TRANSACTIONS, []);
    txs.unshift(tx); // Newest first
    set(KEYS.TRANSACTIONS, txs);
  },

  getRates: (): ExchangeRate => get(KEYS.RATES, DEFAULT_RATES),
  saveRates: (rates: ExchangeRate) => set(KEYS.RATES, rates),

  getCashbox: (): CashBox => get(KEYS.CASHBOX, DEFAULT_CASHBOX),
  saveCashbox: (box: CashBox) => set(KEYS.CASHBOX, box),

  getAdjustments: (): CashAdjustment[] => get(KEYS.ADJUSTMENTS, []), // Empty array
  saveAdjustment: (adj: CashAdjustment) => {
    const list = get<CashAdjustment[]>(KEYS.ADJUSTMENTS, []);
    list.unshift(adj);
    set(KEYS.ADJUSTMENTS, list);
  },

  getPreferences: (): UserPreferences => {
      const prefs = get(KEYS.PREFS, DEFAULT_PREFS);
      return { 
          ...DEFAULT_PREFS, 
          ...prefs,
          dashboardLayout: prefs.dashboardLayout || DEFAULT_PREFS.dashboardLayout 
      };
  },
  savePreferences: (prefs: UserPreferences) => set(KEYS.PREFS, prefs),

  // --- BACKUP SYSTEM ---
  
  createBackup: (): string => {
    try {
        const backupData = {
            version: 5,
            timestamp: Date.now(),
            data: {
                clients: get(KEYS.CLIENTS, []),
                transactions: get(KEYS.TRANSACTIONS, []),
                rates: get(KEYS.RATES, DEFAULT_RATES),
                cashbox: get(KEYS.CASHBOX, DEFAULT_CASHBOX),
                adjustments: get(KEYS.ADJUSTMENTS, []),
                prefs: get(KEYS.PREFS, DEFAULT_PREFS)
            }
        };
        return JSON.stringify(backupData, null, 2);
    } catch (e) {
        console.error("Backup failed", e);
        return "";
    }
  },

  restoreBackup: (jsonString: string): boolean => {
    try {
        const backup = JSON.parse(jsonString);
        
        if (!backup.data) {
            throw new Error("Formato de archivo inválido");
        }

        set(KEYS.CLIENTS, backup.data.clients || []);
        set(KEYS.TRANSACTIONS, backup.data.transactions || []);
        set(KEYS.RATES, backup.data.rates || DEFAULT_RATES);
        set(KEYS.CASHBOX, backup.data.cashbox || DEFAULT_CASHBOX);
        set(KEYS.ADJUSTMENTS, backup.data.adjustments || []);
        set(KEYS.PREFS, backup.data.prefs || DEFAULT_PREFS);
        
        return true;
    } catch (e) {
        console.error("Restore failed", e);
        return false;
    }
  }
};
