
export enum Currency {
  USD = 'USD',
  DOP = 'DOP',
  EUR = 'EUR'
}

export type CurrencyPair = 'USD_DOP' | 'EUR_DOP';

export enum TransactionType {
  BUY = 'COMPRA', // We buy foreign currency from client
  SELL = 'VENTA'  // We sell foreign currency to client
}

export interface Client {
  id: string;
  name: string;
  phone: string; 
  cedula?: string;
  notes?: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  type: TransactionType;
  pair: CurrencyPair; // e.g., USD_DOP
  amount: number;     // The source amount (e.g., 100 USD)
  rate: number;
  total: number;      // The result amount (e.g., 5850 DOP)
  estimatedProfit: number; // Gross profit based on spread
  timestamp: number;
  note?: string;
}

export interface RateDetail {
  buy: number;
  sell: number;
}

export interface ExchangeRate {
  usd_dop: RateDetail;
  eur_dop: RateDetail;
  lastUpdated: number;
}

export interface CashBox {
  usdPhysical: number;
  eurPhysical: number;
  dopPhysical: number;
  usdBank: number;
  dopBank: number;
}

export type AdjustmentType = 'DEPOSIT' | 'WITHDRAWAL' | 'EXPENSE';

export interface CashAdjustment {
  id: string;
  type: AdjustmentType;
  amount: number;
  currency: 'USD' | 'EUR' | 'DOP';
  reason: string;
  timestamp: number;
}

export interface PrinterConfig {
  deviceId: string | null;
  deviceName: string | null;
  serviceId: string | null;
  characteristicId: string | null;
}

export interface UserPreferences {
  isSetupCompleted: boolean; // New flag for onboarding
  userName: string;      
  businessName: string;
  slogan?: string;       
  darkMode: boolean;
  printer?: PrinterConfig;
  dashboardLayout?: string[];
}

// Helper para configurar el conversor desde fuera
export interface ConverterConfig {
    initialMode?: TransactionType;
    initialPair?: CurrencyPair;
}

export type ViewState = 'DASHBOARD' | 'CONVERTER' | 'CLIENTS' | 'HISTORY' | 'WALLET' | 'SETTINGS';
