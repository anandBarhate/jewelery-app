"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function ApprovalsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/pim/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }

  async function handleAction(productId, action) {
    try {
      await fetch("/api/pim/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action, userRole: "APPROVER" }),
      });
      fetchProducts();
    } catch (error) {
      console.error("Failed to submit approval status:", error);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Approval Workflow Queue</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review catalog submissions before publishing to the storefront.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.length === 0 ? (
          <div className="p-8 border border-slate-800 bg-slate-900/50 rounded-lg text-slate-400 text-center text-sm">
            No products currently awaiting review.
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{product.name}</h3>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded">
                    {product.category}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Type: {product.type} | Weight: {product.baseMetalWeightGrams}g | Labor: ${product.manufacturingLabor}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-semibold text-slate-400 mr-2">
                  Status: {product.status}
                </span>
                <button
                  onClick={() => handleAction(product.id, "APPROVE")}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleAction(product.id, "REJECT")}
                  className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}