
// Servicio para obtener tasas del mercado global (API Pública)
export interface MarketRates {
    usd_dop: number;
    eur_dop: number;
    lastUpdated: number;
}

export const LiveRateService = {
    fetchRates: async (): Promise<MarketRates | null> => {
        try {
            // Usamos una API pública gratuita (ExchangeRate-API)
            // 1. Obtener base USD
            const resUsd = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const dataUsd = await resUsd.json();
            const usdToDop = dataUsd.rates.DOP;

            // 2. Obtener base EUR
            const resEur = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
            const dataEur = await resEur.json();
            const eurToDop = dataEur.rates.DOP;

            return {
                usd_dop: usdToDop,
                eur_dop: eurToDop,
                lastUpdated: Date.now()
            };
        } catch (error) {
            console.error("Error fetching live rates:", error);
            return null;
        }
    }
};
