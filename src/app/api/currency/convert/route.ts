import { NextRequest, NextResponse } from "next/server";
import { convertUSDToIQD, convertIQDToUSD, getExchangeRate } from "@/lib/utils";

// GET /api/currency/convert?from=USD&to=IQD&amount=100
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") as "USD" | "IQD";
  const to = searchParams.get("to") as "USD" | "IQD";
  const amount = parseFloat(searchParams.get("amount") || "0");

  if (!from || !to || isNaN(amount)) {
    return NextResponse.json(
      { success: false, error: "Invalid parameters. Required: from, to, amount" },
      { status: 400 }
    );
  }

  if (!["USD", "IQD"].includes(from) || !["USD", "IQD"].includes(to)) {
    return NextResponse.json(
      { success: false, error: "Supported currencies: USD, IQD" },
      { status: 400 }
    );
  }

  try {
    let convertedAmount: number;

    if (from === "USD" && to === "IQD") {
      convertedAmount = await convertUSDToIQD(amount);
    } else if (from === "IQD" && to === "USD") {
      convertedAmount = await convertIQDToUSD(amount);
    } else {
      convertedAmount = amount; // Same currency
    }

    const exchangeRate = await getExchangeRate(from, to);

    return NextResponse.json({
      success: true,
      data: {
        from,
        to,
        amount,
        convertedAmount: Math.round(convertedAmount),
        exchangeRate,
      },
    });
  } catch (error) {
    console.error("Currency conversion error:", error);
    return NextResponse.json(
      { success: false, error: "Currency conversion failed" },
      { status: 500 }
    );
  }
}