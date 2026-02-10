import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function formatCurrency(amount: number, currency: "IQD" | "USD" = "IQD"): string {
  const currencySymbol = currency === "IQD" ? "IQD" : "$";
  return `${currencySymbol}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

// Currency conversion functions
async function getUSDToIQDRate(): Promise<number> {
  const apiKey = process.env.CURRENCY_API_KEY;

  if (!apiKey) {
    console.warn("Currency API key not found, using fallback exchange rate");
    return 1460; // Approximate USD to IQD rate
  }

  try {
    // Try CurrencyAPI.com first (more reliable service)
    const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&currencies=IQD&base_currency=USD`);

    if (response.ok) {
      const data = await response.json();
      const rate = data.data.IQD.value;
      return rate;
    }

    // Fallback to DinarAPI if CurrencyAPI fails
    console.warn("CurrencyAPI failed, trying DinarAPI fallback");
    const dinarResponse = await fetch('https://dinarapi.hediworks.site/api/nrxi-dolar', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (dinarResponse.ok) {
      const dinarData = await dinarResponse.json();
      let rate: number = 1460;

      if (typeof dinarData === 'number') {
        rate = dinarData;
      } else if (dinarData && typeof dinarData === 'object') {
        rate = dinarData.rate || dinarData.value || dinarData.price || dinarData.exchange_rate ||
               dinarData.usd_to_iqd || dinarData.USD_IQD || dinarData.dinar_rate || 1460;
      }

      return rate;
    }

    console.warn("Both APIs failed, using fallback rate");
    return 1460;
  } catch (error) {
    console.error("Currency conversion failed:", error);
    // Fallback to approximate rate
    return 1460;
  }
}

export async function convertUSDToIQD(amount: number): Promise<number> {
  const rate = await getUSDToIQDRate();
  return amount * rate;
}

export async function convertIQDToUSD(amount: number): Promise<number> {
  const rate = await getUSDToIQDRate();
  return amount / rate;
}

export async function getExchangeRate(fromCurrency: "USD" | "IQD", toCurrency: "USD" | "IQD"): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  const rate = await getUSDToIQDRate();

  if (fromCurrency === "USD" && toCurrency === "IQD") {
    return rate;
  } else if (fromCurrency === "IQD" && toCurrency === "USD") {
    return 1 / rate;
  }

  return 1;
}

// Display price in IQD regardless of original currency
export async function formatPriceInIQD(amount: number, originalCurrency: "USD" | "IQD" = "IQD"): Promise<string> {
  let amountInIQD: number;

  if (originalCurrency === "USD") {
    amountInIQD = await convertUSDToIQD(amount);
  } else {
    amountInIQD = amount;
  }

  return formatCurrency(amountInIQD, "IQD");
}

// Synchronous version for cases where async is not suitable
export function formatPriceInIQDSync(amount: number, originalCurrency: "USD" | "IQD" = "IQD"): string {
  let amountInIQD: number;

  if (originalCurrency === "USD") {
    // Use fallback rate for synchronous operations
    amountInIQD = amount * 1460;
  } else {
    amountInIQD = amount;
  }

  return formatCurrency(amountInIQD, "IQD");
}
