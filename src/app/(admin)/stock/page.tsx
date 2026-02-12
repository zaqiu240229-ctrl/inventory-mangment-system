"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import { formatPriceInIQDSync } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  model: string;
  buy_price: number;
  sell_price: number;
  currency: "IQD" | "USD";
  stock?: {
    quantity: number;
  };
}

interface StockItem {
  product_id: string;
  quantity: number;
}

export default function StockManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Simple modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [modalType, setModalType] = useState<"add" | "reduce">("add");

  // Simple processing state
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  // Load data
  const loadData = async () => {
    try {
      const prodRes = await fetch("/api/products");
      const prodResult = await prodRes.json();
      if (prodResult.success) {
        setProducts(prodResult.data);
      }

      const stockRes = await fetch("/api/stock");
      const stockResult = await stockRes.json();
      if (stockResult.success) {
        setStocks(
          stockResult.data.map((s: { product_id: string; quantity: number }) => ({
            product_id: s.product_id,
            quantity: s.quantity,
          }))
        );
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearch(query);
  };

  // Filter products based on search
  const filteredProducts = products.filter(
    (product) =>
      !search ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.model.toLowerCase().includes(search.toLowerCase())
  );

  // Open modal
  const openModal = (product: Product, type: "add" | "reduce") => {
    setSelectedProduct(product);
    setModalType(type);
    setQuantity("");
    setMessage("");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    if (processing) return; // Don't close while processing

    setShowModal(false);
    setSelectedProduct(null);
    setQuantity("");
    setMessage("");
  };

  // Simple stock update - no complex logic
  const updateStock = async () => {
    // Simple validation
    if (!selectedProduct || !quantity || processing) {
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setMessage("Please enter a valid quantity");
      return;
    }

    // Set processing state
    setProcessing(true);
    setMessage("Processing...");

    console.log(`=== STOCK UPDATE START ===`);
    console.log(`Product: ${selectedProduct.name}`);
    console.log(`Action: ${modalType}`);
    console.log(`Quantity: ${quantityNum}`);

    try {
      // Get current stock
      const currentStock = stocks.find((s) => s.product_id === selectedProduct.id);
      const currentQty = currentStock?.quantity || 0;

      console.log(`Current stock: ${currentQty}`);

      // Calculate new quantity
      let newQty: number;
      if (modalType === "add") {
        newQty = currentQty + quantityNum;
      } else {
        newQty = currentQty - quantityNum;
        if (newQty < 0) {
          setMessage("Cannot reduce stock below zero");
          setProcessing(false);
          return;
        }
      }

      console.log(`New stock will be: ${newQty}`);

      // Update stock via API
      const stockRes = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          type: modalType === "add" ? "BUY" : "SELL",
          quantity: quantityNum,
          price: modalType === "add" ? selectedProduct.buy_price : selectedProduct.sell_price,
          total:
            quantityNum *
            (modalType === "add" ? selectedProduct.buy_price : selectedProduct.sell_price),
          currency: selectedProduct.currency,
        }),
      });
      const stockResult = await stockRes.json();

      if (stockResult.success) {
        console.log(`✅ Stock updated successfully`);

        // Reload data
        await loadData();

        setMessage(
          `Successfully ${modalType === "add" ? "added" : "reduced"} ${quantityNum} items`
        );

        // Close modal after short delay
        setTimeout(() => {
          setProcessing(false);
          closeModal();
        }, 1000);
      } else {
        console.log(`❌ Stock update failed`);
        setMessage("Update failed. Please try again.");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      setMessage("Error occurred. Please try again.");
      setProcessing(false);
    }

    console.log(`=== STOCK UPDATE END ===`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Stock Management</h1>
          <p className="text-slate-400">Manage product inventory levels</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          placeholder="Search products by name or model..."
          onSearch={handleSearch}
          className="w-72"
        />
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Products</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Product Name</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Model</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Current Stock</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Buy Price</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Sell Price</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stock = stocks.find((s) => s.product_id === product.id);
                  const currentQty = stock?.quantity || 0;

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="py-4 px-4">
                        <div className="text-white font-medium">{product.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-300">{product.model}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            currentQty === 0
                              ? "bg-red-900/50 text-red-300"
                              : currentQty <= 5
                                ? "bg-yellow-900/50 text-yellow-300"
                                : "bg-green-900/50 text-green-300"
                          }`}
                        >
                          {currentQty} units
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {formatPriceInIQDSync(product.buy_price, product.currency)}
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {formatPriceInIQDSync(product.sell_price, product.currency)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(product, "add")}
                            disabled={processing}
                            className="btn-success text-sm px-3 py-1 disabled:opacity-50"
                          >
                            Add Stock
                          </button>
                          <button
                            onClick={() => openModal(product, "reduce")}
                            disabled={processing || currentQty === 0}
                            className="btn-danger text-sm px-3 py-1 disabled:opacity-50"
                          >
                            Reduce Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-xl font-semibold text-white mb-4">
              {modalType === "add" ? "Add Stock" : "Reduce Stock"}
            </h3>

            {selectedProduct && (
              <div className="mb-4">
                <p className="text-slate-400 mb-2">
                  Product: <span className="text-white">{selectedProduct.name}</span>
                </p>
                <p className="text-slate-400 mb-4">
                  Current Stock:{" "}
                  <span className="text-white">
                    {stocks.find((s) => s.product_id === selectedProduct.id)?.quantity || 0} units
                  </span>
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quantity to {modalType}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={processing}
                placeholder="Enter quantity..."
                min="1"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes("Successfully")
                    ? "bg-green-900/50 text-green-300"
                    : message.includes("Processing")
                      ? "bg-blue-900/50 text-blue-300"
                      : "bg-red-900/50 text-red-300"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={processing}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={updateStock}
                disabled={processing || !quantity}
                className={`flex-1 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  modalType === "add"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {processing ? "Processing..." : modalType === "add" ? "Add Stock" : "Reduce Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
