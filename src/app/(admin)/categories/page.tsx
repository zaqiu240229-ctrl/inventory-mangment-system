"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { demoDataStore, isDemoMode } from "@/lib/demo-data";
import type { Category, Product } from "@/types";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import { Plus, ChevronRight, Package, ArrowLeft } from "lucide-react";
import { formatPriceInIQDSync } from "@/lib/utils";

export default function CategoriesPage() {
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
  const nextIdRef = useRef(8);

  const fetchCategories = useCallback(async () => {
    if (isDemoMode) {
      setCategories(demoDataStore.getCategories());
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (data) setCategories(data);
    if (error) console.error(error);
    setLoading(false);
  }, []);

  const fetchCategoryProducts = useCallback(async (categoryId: string) => {
    if (isDemoMode) {
      setCategoryProducts(demoDataStore.getProductsByCategory(categoryId));
      return;
    }
    
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .is("deleted_at", null)
      .order("name");
    
    if (data) setCategoryProducts(data);
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
  const filteredCategories = categories.filter(category =>
    !search || category.name.toLowerCase().includes(search.toLowerCase())
  );

  // Filter products based on search
  const filteredProducts = categoryProducts.filter(product =>
    !productSearch || 
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.model.toLowerCase().includes(productSearch.toLowerCase())
  );

  useEffect(() => {
    fetchCategories();
    
    // Subscribe to demo data changes
    if (isDemoMode) {
      const unsubscribe = demoDataStore.subscribe(() => {
        setCategories(demoDataStore.getCategories());
        // If viewing category products, refresh them too
        if (selectedCategory) {
          setCategoryProducts(demoDataStore.getProductsByCategory(selectedCategory.id));
        }
      });
      return unsubscribe;
    }
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

    // Demo mode - update local state
    // Demo mode - use centralized data store
    if (isDemoMode) {
      try {
        if (editingCategory) {
          demoDataStore.updateCategory(editingCategory.id, {
            name: formData.name,
            description: formData.description || null,
          });
        } else {
          demoDataStore.addCategory({
            name: formData.name,
            description: formData.description || null,
            is_active: true,
          });
        }
        setShowModal(false);
      } catch (err) {
        setError("Failed to save category");
      }
      setSaving(false);
      return;
    }

    // Real Supabase mode
    const supabase = createClient();
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({ name: formData.name, description: formData.description || null })
          .eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({ name: formData.name, description: formData.description || null });
        if (error) throw error;
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save category");
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
                  {filteredProducts.length} of {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}
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
                    : "No products match your search"
                  }
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
                          {formatPriceInIQDSync(product.buy_price, product.currency)}
                        </td>  
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {formatPriceInIQDSync(product.sell_price, product.currency)}
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
                  {categories.length === 0 ? "No categories found. Create one to get started." : "No categories match your search."}
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
            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary flex-1"
            >
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
    </div>
  );
}
