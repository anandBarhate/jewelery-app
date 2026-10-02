"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function StorefrontLayout({ children }) {
  const [cart] = useState([]);
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif tracking-widest uppercase font-bold">AURA FINE JEWELRY</Link>
          <nav className="flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="hover:text-amber-700">Collections</Link>
            <Link href="/admin/catalog" className="text-xs bg-slate-900 text-slate-100 px-3 py-1.5 rounded-full">PIM Admin Portal</Link>
            <Link href="/checkout" className="relative flex items-center gap-2"><ShoppingBag className="w-5 h-5" /></Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}