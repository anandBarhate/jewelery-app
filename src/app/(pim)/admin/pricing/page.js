"use client";
import React from "react";
import { DollarSign, Layers } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Global Pricing & Supply Chain Matrix</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure daily metal rates, diamond costs, and retail markups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Live Precious Metal Rates (/gram)
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
              <span className="text-sm text-slate-300">18k Yellow Gold</span>
              <input
                defaultValue="65.00"
                className="w-24 bg-slate-800 border border-slate-700 text-right text-sm p-1 rounded text-white"
              />
            </div>
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
              <span className="text-sm text-slate-300">18k White Gold</span>
              <input
                defaultValue="68.00"
                className="w-24 bg-slate-800 border border-slate-700 text-right text-sm p-1 rounded text-white"
              />
            </div>
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
              <span className="text-sm text-slate-300">Platinum</span>
              <input
                defaultValue="42.00"
                className="w-24 bg-slate-800 border border-slate-700 text-right text-sm p-1 rounded text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
            <Layers className="w-5 h-5" /> Supply Chain Markups & Fees
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
              <span className="text-sm text-slate-300">Retail Markup (%)</span>
              <input
                defaultValue="40"
                className="w-24 bg-slate-800 border border-slate-700 text-right text-sm p-1 rounded text-white"
              />
            </div>
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
              <span className="text-sm text-slate-300">Logistics & Insurance ($)</span>
              <input
                defaultValue="50.00"
                className="w-24 bg-slate-800 border border-slate-700 text-right text-sm p-1 rounded text-white"
              />
            </div>
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
              <span className="text-sm text-slate-300">Packaging Fee ($)</span>
              <input
                defaultValue="15.00"
                className="w-24 bg-slate-800 border border-slate-700 text-right text-sm p-1 rounded text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}