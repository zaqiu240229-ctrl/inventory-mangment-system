"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  exchangeRate: number;
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("");
  const [fromCurrency, setFromCurrency] = useState<"USD" | "IQD">("USD");
  const [toCurrency, setToCurrency] = useState<"USD" | "IQD">("IQD");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/currency/convert?from=${fromCurrency}&to=${toCurrency}&amount=${numAmount}`
      );

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        toast({
          title: "Conversion Successful",
          description: `${numAmount} ${fromCurrency} = ${data.data.convertedAmount} ${toCurrency}`,
        });
      } else {
        toast({
          title: "Conversion Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to convert currency. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card p-6 rounded-lg border border-border">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Currency Converter</h3>
          <p className="text-sm text-muted-foreground">
            Convert between USD and Iraqi Dinar (IQD)
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field w-full"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as "USD" | "IQD")}
              className="input-field w-full"
            >
              <option value="USD">USD ($)</option>
              <option value="IQD">IQD (د.ع)</option>
            </select>
          </div>

          <div className="flex justify-center pb-2">
            <button
              onClick={swapCurrencies}
              className="p-2 border border-border rounded-md hover:bg-accent"
            >
              ⇄
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value as "USD" | "IQD")}
              className="input-field w-full"
            >
              <option value="USD">USD ($)</option>
              <option value="IQD">IQD (د.ع)</option>
            </select>
          </div>
        </div>

        <Button onClick={handleConvert} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Convert
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Result:</div>
            <div className="text-lg font-semibold">
              {result.amount} {result.from} = {result.convertedAmount} {result.to}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Exchange rate: 1 {result.from} = {result.exchangeRate.toFixed(2)} {result.to}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}