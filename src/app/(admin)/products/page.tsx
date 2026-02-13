"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import type { Product, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Plus, Pencil, Trash2, RotateCcw, Minus } from "lucide-react";

const PAGE_SIZE = 6;

export default function ProductsPage() {
  const { toast } = useToast();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkProducts, setBulkProducts] = useState<
    Array<{
      name: string;
      model: string;
      category_id: string;
      buy_price: number;
      sell_price: number;
      initial_quantity: number;
    }>
  >([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; product: Product | null }>({
    show: false,
    product: null,
  });
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellQuantity, setSellQuantity] = useState("");
  const [selling, setSelling] = useState(false);
  const [sellMessage, setSellMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    category_id: "",
    buy_price: 0,
    sell_price: 0,
    initial_quantity: 0,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const result = await res.json();
      if (result.success) setCategories(result.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const result = await res.json();
      if (result.success) {
        // Normalize stock format
        const normalized = result.data.map((p: any) => ({
          ...p,
          stock:
            Array.isArray(p.stock) && p.stock.length > 0 ? p.stock[0] : p.stock || { quantity: 0 },
        }));
        setAllProducts(normalized);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // Filter and paginate products
  const filteredProducts = allProducts.filter(
    (p) =>
      !p.deleted_at &&
      (!search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.model.toLowerCase().includes(search.toLowerCase()))
  );
  const totalCount = filteredProducts.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const products = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      model: "",
      category_id: "",
      buy_price: 0,
      sell_price: 0,
      initial_quantity: 0,
    });
    setError("");
    setEditingProduct(null);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      model: "",
      category_id: "",
      buy_price: 0,
      sell_price: 0,
      initial_quantity: 0,
    });
    setError("");
    setShowModal(true);
  };

  const openBulkModal = () => {
    setBulkProducts([
      {
        name: "",
        model: "",
        category_id: "",
        buy_price: 0,
        sell_price: 0,
        initial_quantity: 0,
      },
    ]);
    setShowBulkModal(true);
  };

  const addBulkProduct = () => {
    setBulkProducts([
      ...bulkProducts,
      {
        name: "",
        model: "",
        category_id: "",
        buy_price: 0,
        sell_price: 0,
        initial_quantity: 0,
      },
    ]);
  };

  const removeBulkProduct = (index: number) => {
    setBulkProducts(bulkProducts.filter((_, i) => i !== index));
  };

  const updateBulkProduct = (index: number, field: string, value: string | number) => {
    const updated = [...bulkProducts];
    updated[index] = { ...updated[index], [field]: value };
    setBulkProducts(updated);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      model: product.model,
      category_id: product.category_id,
      buy_price: product.buy_price,
      sell_price: product.sell_price,
      initial_quantity: 0,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.model || !formData.category_id) {
      setError("Please fill all required fields");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            model: formData.model,
            category_id: formData.category_id,
            buy_price: formData.buy_price,
            sell_price: formData.sell_price,
          }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            model: formData.model,
            category_id: formData.category_id,
            buy_price: formData.buy_price,
            sell_price: formData.sell_price,
          }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);

        // Add initial stock if specified
        if (formData.initial_quantity > 0 && result.data?.id) {
          await fetch("/api/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: result.data.id,
              quantity: formData.initial_quantity,
              type: "BUY",
              price: formData.buy_price,
            }),
          });
        }
      }

      setShowModal(false);
      fetchProducts();
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSave = async () => {
    if (bulkProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive",
      });
      return;
    }

    // Validate all products
    for (let i = 0; i < bulkProducts.length; i++) {
      const product = bulkProducts[i];
      if (!product.name || !product.model || !product.category_id) {
        toast({
          title: "Error",
          description: `Product ${i + 1}: Please fill all required fields`,
          variant: "destructive",
        });
        return;
      }
      if (product.buy_price <= 0 || product.sell_price <= 0) {
        toast({
          title: "Error",
          description: `Product ${i + 1}: Prices must be greater than 0`,
          variant: "destructive",
        });
        return;
      }
    }

    setBulkSaving(true);

    try {
      for (const product of bulkProducts) {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: product.name,
            model: product.model,
            category_id: product.category_id,
            buy_price: product.buy_price,
            sell_price: product.sell_price,
          }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);

        if (product.initial_quantity > 0 && result.data?.id) {
          await fetch("/api/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: result.data.id,
              quantity: product.initial_quantity,
              type: "BUY",
              price: product.buy_price,
            }),
          });
        }
      }

      setShowBulkModal(false);
      setBulkProducts([]);
      setAllProducts([]);
      fetchProducts();

      toast({
        title: "Success",
        description: `Added ${bulkProducts.length} products successfully`,
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add products",
        variant: "destructive",
      });
    } finally {
      setBulkSaving(false);
    }
  };

  const handleSoftDelete = async (product: Product) => {
    setDeleteConfirm({ show: true, product });
  };

  const confirmDelete = async () => {
    const product = deleteConfirm.product;
    if (!product) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      fetchProducts();
      toast({
        title: "Product deleted",
        description: `"${product.name}" has been moved to recovery.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const openSellModal = (product: Product) => {
    setSellingProduct(product);
    setSellQuantity("");
    setSellMessage("");
    setShowSellModal(true);
  };

  const closeSellModal = () => {
    if (selling) return;
    setShowSellModal(false);
    setSellingProduct(null);
    setSellQuantity("");
    setSellMessage("");
  };

  const handleSell = async () => {
    if (!sellingProduct || !sellQuantity || selling) return;

    const quantityNum = parseInt(sellQuantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setSellMessage("Please enter a valid quantity");
      return;
    }

    const currentStock = sellingProduct.stock?.quantity || 0;
    if (quantityNum > currentStock) {
      setSellMessage(`Cannot sell ${quantityNum} items. Only ${currentStock} in stock.`);
      return;
    }

    setSelling(true);
    setSellMessage("Processing sale...");

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: sellingProduct.id,
          quantity: quantityNum,
          type: "SELL",
          price: sellingProduct.sell_price,
        }),
      });
      const result = await res.json();

      if (result.success) {
        fetchProducts();
        setSellMessage(`Successfully sold ${quantityNum} ${sellingProduct.name}(s)`);
        setTimeout(() => {
          closeSellModal();
        }, 1500);
      } else {
        setSellMessage(result.error || "Sale failed. Please try again.");
        setSelling(false);
      }
    } catch (error) {
      console.error("Error selling product:", error);
      setSellMessage("Sale failed. Please try again.");
      setSelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <SearchBar
            placeholder="Search by name or model..."
            onSearch={handleSearch}
            className="w-72"
          />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/products/recovery" className="btn-secondary flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" />
            Recovery
          </Link>
          <button onClick={openBulkModal} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Bulk Add
          </button>
          <button onClick={openCreate} className="btn-success flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Model
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Buy Price
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Sell Price
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  return (
                    <tr key={product.id} className="table-row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-400">
                              {product.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-white">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{product.model}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {product.category?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {formatCurrency(product.buy_price)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {formatCurrency(product.sell_price)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            product.stock?.quantity === 0
                              ? "red"
                              : product.stock?.quantity && product.stock.quantity <= 5
                                ? "yellow"
                                : "green"
                          }
                          size="sm"
                        >
                          {product.stock?.quantity || 0} units
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openSellModal(product)}
                            disabled={!product.stock?.quantity || product.stock.quantity <= 0}
                            className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Sell"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-md transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSoftDelete(product)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., iPhone 11 Display"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., iPhone 11"
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="input-field"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Buy Price</label>
              <input
                type="number"
                value={formData.buy_price}
                onChange={(e) =>
                  setFormData({ ...formData, buy_price: parseFloat(e.target.value) || 0 })
                }
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sell Price</label>
              <input
                type="number"
                value={formData.sell_price}
                onChange={(e) =>
                  setFormData({ ...formData, sell_price: parseFloat(e.target.value) || 0 })
                }
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
          </div>

          {!editingProduct && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                value={formData.initial_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, initial_quantity: parseInt(e.target.value) || 0 })
                }
                min="0"
                className="input-field"
                placeholder="Initial stock quantity"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Add Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Add Products"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {bulkProducts.map((product, index) => (
            <div key={index} className="border border-slate-600 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-slate-300">Product {index + 1}</h4>
                {bulkProducts.length > 1 && (
                  <button
                    onClick={() => removeBulkProduct(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => updateBulkProduct(index, "name", e.target.value)}
                    className="input-field text-sm"
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Model *</label>
                  <input
                    type="text"
                    value={product.model}
                    onChange={(e) => updateBulkProduct(index, "model", e.target.value)}
                    className="input-field text-sm"
                    placeholder="Model"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category *</label>
                <select
                  value={product.category_id}
                  onChange={(e) => updateBulkProduct(index, "category_id", e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Buy Price</label>
                  <input
                    type="number"
                    value={product.buy_price || ""}
                    onChange={(e) =>
                      updateBulkProduct(index, "buy_price", parseFloat(e.target.value) || 0)
                    }
                    className="input-field text-sm"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Sell Price
                  </label>
                  <input
                    type="number"
                    value={product.sell_price || ""}
                    onChange={(e) =>
                      updateBulkProduct(index, "sell_price", parseFloat(e.target.value) || 0)
                    }
                    className="input-field text-sm"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Initial Qty
                  </label>
                  <input
                    type="number"
                    value={product.initial_quantity || ""}
                    onChange={(e) =>
                      updateBulkProduct(index, "initial_quantity", parseInt(e.target.value) || 0)
                    }
                    className="input-field text-sm"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addBulkProduct} className="w-full btn-secondary text-sm py-2">
            + Add Another Product
          </button>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-600">
          <button onClick={() => setShowBulkModal(false)} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleBulkSave}
            disabled={bulkSaving}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {bulkSaving
              ? "Adding..."
              : `Add ${bulkProducts.length} Product${bulkProducts.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirm.show}
        onOpenChange={(open) => setDeleteConfirm({ show: open, product: null })}
        title="Delete Product"
        description={
          deleteConfirm.product
            ? `Are you sure you want to delete "${deleteConfirm.product.name}"? This action can be undone from the Recovery page.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {/* Sell Product Modal */}
      <Modal
        isOpen={showSellModal}
        onClose={closeSellModal}
        title="Sell Product"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {sellingProduct && (
            <>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">{sellingProduct.name}</h3>
                <div className="text-sm text-slate-300 space-y-1">
                  <p>Model: {sellingProduct.model}</p>
                  <p>Sell Price: {formatCurrency(sellingProduct.sell_price)}</p>
                  <p>Current Stock: {sellingProduct.stock?.quantity || 0} units</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantity to Sell
                </label>
                <input
                  type="number"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  min="1"
                  max={sellingProduct.stock?.quantity || 0}
                  className="input-field"
                  placeholder="Enter quantity"
                  disabled={selling}
                />
              </div>

              {sellMessage && (
                <div
                  className={`text-sm px-3 py-2 rounded-lg ${
                    sellMessage.includes("Successfully")
                      ? "bg-green-500/10 border border-green-500/30 text-green-400"
                      : sellMessage.includes("Cannot") || sellMessage.includes("failed")
                        ? "bg-red-500/10 border border-red-500/30 text-red-400"
                        : "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                  }`}
                >
                  {sellMessage}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-600">
                <button
                  onClick={closeSellModal}
                  disabled={selling}
                  className="btn-secondary flex-1 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSell}
                  disabled={selling || !sellQuantity || parseInt(sellQuantity) <= 0}
                  className="btn-success flex-1 disabled:opacity-50"
                >
                  {selling ? "Selling..." : "Sell Product"}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
