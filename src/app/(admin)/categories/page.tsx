"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { Category, Product } from "@/types";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import { Plus, ChevronRight, Package, ArrowLeft, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; category: Category | null }>({
    show: false,
    category: null,
  });
  const nextIdRef = useRef(8);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const result = await res.json();
      if (result.success) setCategories(result.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
    setLoading(false);
  }, []);

  const fetchCategoryProducts = useCallback(async (categoryId: string) => {
    try {
      const res = await fetch(`/api/products?category_id=${categoryId}`);
      const result = await res.json();
      if (result.success) setCategoryProducts(result.data);
    } catch (err) {
      console.error("Error fetching category products:", err);
    }
  }, []);

  const viewCategoryProducts = (category: Category) => {
    setSelectedCategory(category);
    fetchCategoryProducts(category.id);
  };

  const goBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryProducts([]);
    setProductSearch("");
  };

  const handleCategorySearch = (query: string) => {
    setSearch(query);
  };

  const handleProductSearch = (query: string) => {
    setProductSearch(query);
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(
    (category) => !search || category.name.toLowerCase().includes(search.toLowerCase())
  );

  // Filter products based on search
  const filteredProducts = categoryProducts.filter(
    (product) =>
      !productSearch ||
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.model.toLowerCase().includes(productSearch.toLowerCase())
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, selectedCategory]);

  const openCreate = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || "" });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name, description: formData.description || null }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name, description: formData.description || null }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.category) return;

    try {
      const res = await fetch(`/api/categories/${deleteConfirm.category.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        toast({
          title: "Category deleted",
          description: "The category has been deleted successfully.",
        });
        fetchCategories();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete category",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirm({ show: false, category: null });
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
      {selectedCategory ? (
        // Category Products View
        <div>
          {/* Header with Back Button and Search */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={goBackToCategories}
                className="p-2 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedCategory.name}</h2>
                <p className="text-sm text-slate-400">
                  {filteredProducts.length} of {categoryProducts.length} product
                  {categoryProducts.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SearchBar
                placeholder="Search products..."
                onSearch={handleProductSearch}
                className="w-64"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="card overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {categoryProducts.length === 0
                    ? "No products found in this category"
                    : "No products match your search"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e293b]">
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Model
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Buy Price
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Sell Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
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
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {formatCurrency(product.buy_price)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {formatCurrency(product.sell_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Categories List View
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Categories</h1>
              <SearchBar
                placeholder="Search categories..."
                onSearch={handleCategorySearch}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openCreate} className="btn-success flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                New Category
              </button>
            </div>
          </div>

          {/* Categories List */}
          <div className="card overflow-hidden">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">
                  {categories.length === 0
                    ? "No categories found. Create one to get started."
                    : "No categories match your search."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1e293b]">
                {filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between px-6 py-4 hover:bg-[#1a2236] transition-colors ${
                      !cat.is_active ? "opacity-50" : ""
                    }`}
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => viewCategoryProducts(cat)}
                    >
                      <h3 className="text-sm font-medium text-white">{cat.name}</h3>
                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1e293b] hover:bg-[#334155] rounded-md transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, category: cat });
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#1e293b] rounded-md transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-600 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? "Edit Category" : "New Category"}
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Screens"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description..."
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirm.show}
        onOpenChange={(open) => !open && setDeleteConfirm({ show: false, category: null })}
        onConfirm={handleDelete}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteConfirm.category?.name}"? This will mark the category as inactive.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
