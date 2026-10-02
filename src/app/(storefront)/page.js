"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PLP() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/shop/catalog')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-4xl font-serif text-neutral-900">High Jewelry Collections</h1>
        <p className="text-neutral-500 text-sm">Customizable rings, necklaces, and bracelets configured with fine metals and diamonds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map(p => (
          <div key={p.id} className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">{p.category}</span>
              <h2 className="text-xl font-serif text-neutral-900 mt-1">{p.name}</h2>
              <p className="text-xs text-neutral-500 mt-2">Style: {p.type} | Metal Weight: {p.baseMetalWeightGrams}g</p>
            </div>

            <Link href={`/product/${p.id}`} className="mt-6 block text-center bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors">
              Configure & Price
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}