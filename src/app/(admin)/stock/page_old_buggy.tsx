"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { demoDataStore, isDemoMode } from "@/lib/demo-data";
import type { Stock, Product, TransactionType } from "@/types";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import SearchBar from "@/components/ui/SearchBar";
import { Plus, Minus, Package } from "lucide-react";

export default function StockPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalType, setModalType] = useState<"add" | "reduce">("add");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);

  const fetchData = useCallback(async () => {
    if (isDemoMode) {
      const products = demoDataStore.getProducts();
      setAllProducts(products);
      // Convert products to stock items
      const stockItems = products.map(product => ({
        id: product.stock?.id || `stock_${product.id}`,
        product_id: product.id,
        quantity: product.stock?.quantity || 0,
        min_alert_quantity: product.stock?.min_alert_quantity || 5,
        updated_at: product.stock?.updated_at || new Date().toISOString(),
        product
      }));
      setStocks(stockItems);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    
    // Fetch all products
    const { data: productsData } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .is("deleted_at", null)
      .order("name");

    // Fetch all stocks
    const { data: stocksData } = await supabase
      .from("stocks")
      .select("*")
      .order("updated_at", { ascending: false });

    if (productsData) setAllProducts(productsData);
    if (stocksData) setStocks(stocksData);
    setLoading(false);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const getProductStock = (productId: string): Stock | null => {
    return stocks.find(s => s.product_id === productId) || null;
  };

  const filteredProducts = allProducts.filter(product => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.model?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    fetchData();
    
    // Subscribe to demo data changes
    if (isDemoMode) {
      const unsubscribe = demoDataStore.subscribe(() => {
        const products = demoDataStore.getProducts();
        setAllProducts(products);
        // Convert products to stock items
        const stockItems = products.map(product => ({
          id: product.stock?.id || `stock_${product.id}`,
          product_id: product.id,
          quantity: product.stock?.quantity || 0,
          min_alert_quantity: product.stock?.min_alert_quantity || 5,
          updated_at: product.stock?.updated_at || new Date().toISOString(),
          product
        }));
        setStocks(stockItems);
      });
      return unsubscribe;
    }
  }, [fetchData]);

  const openModal = (product: Product, type: "add" | "reduce") => {
    setSelectedProduct(product);
    setModalType(type);
    setQuantity(1);
    setPrice(0);
    setError("");
    setShowModal(true);
  };

  const handleStockUpdate = async () => {
    if (!selectedProduct) {
      setError("No product selected");
      return;
    }
    if (quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    setSaving(true);
    setError("");

    // Demo mode - use centralized data store
    if (isDemoMode) {
      const currentStock = stocks.find(s => s.product_id === selectedProduct.id);
      const currentQty = currentStock?.quantity || 0;
      
      const newQty = modalType === "add"
        ? currentQty + quantity
        : currentQty - quantity;

      if (newQty < 0) {
        setError("Insufficient stock. Cannot reduce below 0.");
        setSaving(false);
        return;
      }

      // Update the centralized store
      demoDataStore.updateStock(selectedProduct.id, newQty);
      
      // Create transaction record for this stock change
      const transactionPrice = modalType === "add" ? selectedProduct.buy_price : selectedProduct.sell_price;
      const transactionType = modalType === "add" ? "BUY" : "SELL";
      
      demoDataStore.addTransaction({
        product_id: selectedProduct.id,
        type: transactionType as any,
        quantity: quantity,
        price: transactionPrice,
        total: transactionPrice * quantity,
        currency: selectedProduct.currency,
      });
      
      setShowModal(false);
      setSaving(false);
      return;
    }

    const supabase = createClient();

    try {
      const { data: currentStock } = await supabase
        .from("stocks")
        .select("*")
        .eq("product_id", selectedProduct.id)
        .single();

      if (!currentStock) {
        if (modalType === "reduce") {
          throw new Error("Cannot reduce stock for a product with no stock record");
        }
        await supabase.from("stocks").insert({
          product_id: selectedProduct.id,
          quantity: quantity,
          min_alert_quantity: 5,
        });
      } else {
        const newQty =
          modalType === "add"
            ? currentStock.quantity + quantity
            : currentStock.quantity - quantity;

        if (newQty < 0) {
          throw new Error("Insufficient stock. Cannot reduce below 0.");
        }

        const { error: updateError } = await supabase
          .from("stocks")
          .update({ quantity: newQty })
          .eq("id", currentStock.id);

        if (updateError) throw updateError;
      }

      const txnType: TransactionType = modalType === "add" ? "BUY" : "SELL";
      const finalPrice =
        price > 0
          ? price
          : modalType === "add"
          ? selectedProduct?.buy_price || 0
          : selectedProduct?.sell_price || 0;

      await supabase.from("transactions").insert({
        product_id: selectedProduct.id,
        type: txnType,
        quantity: quantity,
        price: finalPrice,
        total: finalPrice * quantity,
      });

      await supabase.from("activity_logs").insert({
        action: modalType === "add" ? "STOCK_ADD" : "STOCK_REDUCE",
        entity_type: "stock",
        entity_id: selectedProduct.id,
        details: {
          product_name: selectedProduct?.name,
          quantity: quantity,
          type: txnType,
        },
      });

      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <SearchBar
            placeholder="Search products by name or model..."
            onSearch={handleSearch}
            className="w-72"
          />
        </div>
      </div>

      {/* Products Stock Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Alert Level
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    {search ? "No products found matching your search" : "No products found"}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = getProductStock(product.id);
                  const currentQty = stock?.quantity || 0;
                  const alertLevel = stock?.min_alert_quantity || 5;

                  return (
                    <tr key={product.id} className="table-row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Package className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {product.model}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-white">{currentQty}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-red-400 flex items-center justify-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-400"></span>
                          {alertLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(product, "add")}
                            className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-md transition-colors"
                            title="Add Stock"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(product, "reduce")}
                            className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                            title="Reduce Stock"
                            disabled={currentQty === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${modalType === "add" ? "Add Stock (Purchase)" : "Reduce Stock (Sale)"} - ${selectedProduct?.name || ""}`}
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {selectedProduct && (
            <div className="bg-[#0B1120] border border-[#1e293b] rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{selectedProduct.name}</p>
                  <p className="text-xs text-slate-500">{selectedProduct.model}</p>
                  <p className="text-xs text-slate-400">
                    Buy: ${selectedProduct.buy_price} • Sell: ${selectedProduct.sell_price}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price per unit ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                placeholder={`Default: $${modalType === "add" ? selectedProduct?.buy_price || 0 : selectedProduct?.sell_price || 0}`}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleStockUpdate}
              disabled={saving}
              className={`flex-1 disabled:opacity-50 ${
                modalType === "add" ? "btn-success" : "btn-danger"
              }`}
            >
              {saving
                ? "Processing..."
                : modalType === "add"
                ? "Add Stock"
                : "Reduce Stock"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
