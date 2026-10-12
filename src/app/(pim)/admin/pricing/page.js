"use client";
import React, { useState, useEffect } from 'react';
import { DollarSign, Layers, Save, CheckCircle } from 'lucide-react';

export default function PricingPage() {
  const [pricingRules, setPricingRules] = useState({
    retailMarkupPercentage: 40.0,
    logisticsFee: 50.0,
    packagingFee: 15.0,
  });
  const [metals, setMetals] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/pim/pricing')
      .then((res) => res.json())
      .then((data) => {
        if (data.pricingRules) setPricingRules(data.pricingRules);
        if (data.metals) setMetals(data.metals);
      });
  }, []);

  const handleMetalChange = (index, value) => {
    const updated = [...metals];
    updated[index].pricePerGram = parseFloat(value) || 0;
    setMetals(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/pim/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricingRules, metals }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Pricing & Supply Chain Matrix</h1>
          <p className="text-slate-400 text-sm mt-1">
            Updates to daily metal rates and markups dynamically adjust storefront retail prices in real time.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded text-sm font-semibold">
            <CheckCircle className="w-4 h-4" /> Pricing Updated Live!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Precious Metals */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Live Metal Rates ($/gram)
            </h2>
            <div className="space-y-3">
              {metals.map((m, idx) => (
                <div key={m.id || m.name} className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
                  <span className="text-sm text-slate-300 font-medium">{m.name}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={m.pricePerGram}
                    onChange={(e) => handleMetalChange(idx, e.target.value)}
                    className="w-28 bg-slate-800 border border-slate-700 text-right text-sm p-1.5 rounded text-white font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Supply Chain Fees & Markups */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
              <Layers className="w-5 h-5" /> Supply Chain Markups & Fees
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
                <span className="text-sm text-slate-300 font-medium">Retail Markup (%)</span>
                <input
                  type="number"
                  step="0.5"
                  value={pricingRules.retailMarkupPercentage}
                  onChange={(e) => setPricingRules({ ...pricingRules, retailMarkupPercentage: e.target.value })}
                  className="w-28 bg-slate-800 border border-slate-700 text-right text-sm p-1.5 rounded text-white font-mono"
                />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
                <span className="text-sm text-slate-300 font-medium">Logistics & Insurance ($)</span>
                <input
                  type="number"
                  step="1"
                  value={pricingRules.logisticsFee}
                  onChange={(e) => setPricingRules({ ...pricingRules, logisticsFee: e.target.value })}
                  className="w-28 bg-slate-800 border border-slate-700 text-right text-sm p-1.5 rounded text-white font-mono"
                />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded">
                <span className="text-sm text-slate-300 font-medium">Packaging Fee ($)</span>
                <input
                  type="number"
                  step="1"
                  value={pricingRules.packagingFee}
                  onChange={(e) => setPricingRules({ ...pricingRules, packagingFee: e.target.value })}
                  className="w-28 bg-slate-800 border border-slate-700 text-right text-sm p-1.5 rounded text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded text-sm transition-colors"
        >
          <Save className="w-4 h-4" /> Save Global Pricing Matrix
        </button>
      </form>
    </div>
  );
}