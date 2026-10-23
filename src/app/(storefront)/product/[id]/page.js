"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Check, ShieldCheck, Sparkles, Loader2, AlertCircle } from 'lucide-react';

const METALS = [
  { id: '18k-yellow', label: '18k Yellow Gold', sub: '$45/g', priceDelta: 0 },
  { id: '18k-white', label: '18k White Gold', sub: '$65/g', priceDelta: 120 },
  { id: 'platinum', label: 'Platinum', sub: '$42/g', priceDelta: 250 },
];

const CHAIN_LENGTHS = [
  { label: '16"', sub: 'Included', priceDelta: 0 },
  { label: '18"', sub: '+$60', priceDelta: 60 },
  { label: '20"', sub: '+$120', priceDelta: 120 },
  { label: '22"', sub: '+$180', priceDelta: 180 },
  { label: '24"', sub: '+$240', priceDelta: 240 },
];

const RING_SIZES = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

const ORIGINS = ['Natural Diamond', 'Lab-Created Diamond'];
const SHAPES = ['Round', 'Princess', 'Emerald', 'Oval', 'Heart'];
const CARATS = ['0.5ct', '0.6ct', '1.0ct', '1.3ct', '1.5ct', '2.0ct', '2.6ct', '2.8ct'];
const CLARITIES = ['VVS1', 'VVS2', 'VS1', 'VS2', 'FL', 'IF'];
const COLOURS = ['D', 'E', 'F', 'G'];

export default function ProductConfiguratorPage() {
  const params = useParams();
  const productId = params?.id;
  const { addToCart } = useCart();

  // Dynamic Product State
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Configurator Options State
  const [metal, setMetal] = useState('18k Yellow Gold');
  const [chainLength, setChainLength] = useState('18"');
  const [ringSize, setRingSize] = useState('6.5');
  const [origin, setOrigin] = useState('Natural Diamond');
  const [shape, setShape] = useState('Round');
  const [carat, setCarat] = useState('1.0ct');
  const [clarity, setClarity] = useState('VVS1');
  const [colour, setColour] = useState('D');
  const [cut] = useState('Excellent');
  const [cert] = useState('GIA');
  const [isAdding, setIsAdding] = useState(false);

  // 1. Fetch live product details from the API
  useEffect(() => {
    if (!productId) return;

    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/shop/product/${productId}`);
        if (!res.ok) throw new Error(`Product not found (${res.status})`);
        const data = await res.json();
        const productData = data?.product || data;
        setProduct(productData);

        // Pre-select shape if specified by base product
        if (productData?.defaultShape && SHAPES.includes(productData.defaultShape)) {
          setShape(productData.defaultShape);
        }
      } catch (err) {
        console.error("Configurator fetch error:", err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  // Identify jewelry category
  const productName = product?.name || 'Fine Jewelry';
  const categoryStr = (product?.category?.name || product?.name || '').toLowerCase();
  const isNecklace = categoryStr.includes('necklace') || categoryStr.includes('pendant');
  const isRing = categoryStr.includes('ring') || (!isNecklace && !categoryStr.includes('earring'));

  // 2. Dynamic Price Engine
  const basePrice = product?.basePrice || product?.price || 1850;
  const metalDelta = METALS.find((m) => m.label === metal)?.priceDelta || 0;
  const chainDelta = isNecklace ? (CHAIN_LENGTHS.find((c) => c.label === chainLength)?.priceDelta || 0) : 0;
  const caratMultiplier = parseFloat(carat) || 1.0;
  const originDiscount = origin.includes('Lab') ? 0.65 : 1.0;

  const configuredPrice = (
    (basePrice + metalDelta + chainDelta) *
    (caratMultiplier * 0.9 + 0.5) *
    originDiscount
  ).toFixed(2);

  // 3. Add to Cart Handler
  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart({
      productId,
      productName,
      metal,
      chainLength: isNecklace ? chainLength : undefined,
      ringSize: isRing ? ringSize : undefined,
      origin,
      shape,
      carat: carat.replace('ct', ''),
      clarity,
      colour,
      cut,
      cert,
      configuredPrice: parseFloat(configuredPrice),
    });
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <span className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
          Loading Customizer...
        </span>
      </div>
    );
  }

  if (fetchError || !product) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 border border-neutral-200 rounded-xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-serif font-bold text-neutral-900">Piece Not Available</h2>
        <p className="text-xs text-neutral-500">
          Unable to load product configuration. Please select a valid item from the catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

        {/* ================= LEFT COLUMN: STICKY PREVIEW CARD ================= */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-8 space-y-6 shadow-sm">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-amber-900 block mb-1">
                {isNecklace ? 'Bespoke Necklace' : isRing ? 'Bespoke Ring' : 'Fine Jewelry'}
              </span>
              <h1 className="text-3xl font-serif text-neutral-900">{productName}</h1>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                {carat} {shape} ({origin}) • {clarity} | {colour} | {cert}
                {isNecklace && ` • ${chainLength} Chain`}
                {isRing && ` • Size ${ringSize}`}
              </p>
            </div>

            {/* Visual Canvas Placeholder */}
            <div className="aspect-[4/3] bg-neutral-100 rounded-lg border border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <Sparkles className="w-8 h-8 text-neutral-300" />
              <span className="text-xs tracking-wide">Fine Jewelry Preview</span>
            </div>

            {/* Price Badge */}
            <div className="border-t border-neutral-200 pt-5 flex justify-between items-end">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                  Configured Price
                </span>
                <span className="text-3xl font-serif font-bold text-neutral-900">
                  ${parseFloat(configuredPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium bg-emerald-50 px-2.5 py-1 rounded">
                <ShieldCheck className="w-4 h-4" />
                <span>Certified Genuine</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: CONFIGURATION STEPS ================= */}
        <div className="lg:col-span-7 space-y-8">

          {/* 1. SELECT METAL */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              1. Select Metal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {METALS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetal(m.label)}
                  className={`p-3.5 text-left rounded-lg border transition-all ${
                    metal === m.label
                      ? 'border-amber-700 bg-amber-50/30 ring-1 ring-amber-700'
                      : 'border-neutral-200 hover:border-neutral-400 bg-white'
                  }`}
                >
                  <div className="text-xs font-bold text-neutral-900">{m.label}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. SIZING STEP (Chain Length for Necklaces OR Ring Size for Rings) */}
          {isNecklace && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  2. Chain Length
                </h2>
                <span className="text-xs text-neutral-500 font-mono font-medium">{chainLength}</span>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {CHAIN_LENGTHS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setChainLength(c.label)}
                    className={`py-3 px-2 text-center rounded-lg border transition-all ${
                      chainLength === c.label
                        ? 'border-amber-700 bg-amber-50/40 text-amber-900 ring-1 ring-amber-700 font-semibold'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                    }`}
                  >
                    <div className="text-sm font-semibold">{c.label}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{c.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isRing && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  2. Ring Size (US)
                </h2>
                <span className="text-xs text-neutral-500 font-mono font-medium">Size {ringSize}</span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                {RING_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setRingSize(sz)}
                    className={`py-2.5 text-center text-xs rounded-lg border transition-all ${
                      ringSize === sz
                        ? 'border-amber-700 bg-amber-50/40 text-amber-900 ring-1 ring-amber-700 font-semibold'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. DIAMOND ORIGIN */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              3. Diamond Origin
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {ORIGINS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrigin(o)}
                  className={`py-3 px-4 text-center rounded-lg text-xs font-medium border transition-all ${
                    origin === o
                      ? 'border-amber-700 bg-amber-50/30 text-amber-900 ring-1 ring-amber-700 font-semibold'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* 4. DIAMOND SHAPE */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              4. Diamond Shape
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {SHAPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShape(s)}
                  className={`px-6 py-2.5 text-xs rounded-lg border transition-all ${
                    shape === s
                      ? 'border-amber-700 bg-amber-50/40 text-amber-900 ring-1 ring-amber-700 font-semibold'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 5. CARAT WEIGHT */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              5. Carat Weight
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {CARATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCarat(c)}
                  className={`py-2.5 text-center text-xs rounded-lg border transition-all ${
                    carat === c
                      ? 'border-amber-700 bg-amber-50/40 text-amber-900 ring-1 ring-amber-700 font-semibold'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 6. CLARITY & COLOUR SPLIT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">6. Clarity</h2>
              <div className="grid grid-cols-3 gap-2">
                {CLARITIES.map((cl) => (
                  <button
                    key={cl}
                    type="button"
                    onClick={() => setClarity(cl)}
                    className={`py-2 text-center text-xs rounded-lg border transition-all ${
                      clarity === cl
                        ? 'border-amber-700 bg-amber-50/40 text-amber-900 ring-1 ring-amber-700 font-semibold'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                    }`}
                  >
                    {cl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Colour</h2>
              <div className="grid grid-cols-4 gap-2">
                {COLOURS.map((co) => (
                  <button
                    key={co}
                    type="button"
                    onClick={() => setColour(co)}
                    className={`py-2 text-center text-xs rounded-lg border transition-all ${
                      colour === co
                        ? 'border-amber-700 bg-amber-50/40 text-amber-900 ring-1 ring-amber-700 font-semibold'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                    }`}
                  >
                    {co}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CUT & CERTIFICATE SUMMARY */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="border border-neutral-200 p-3.5 rounded-lg bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                Cut Grade
              </span>
              <span className="text-xs font-semibold text-neutral-800">{cut}</span>
            </div>
            <div className="border border-neutral-200 p-3.5 rounded-lg bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                Certificate
              </span>
              <span className="text-xs font-semibold text-neutral-800">{cert} Verified</span>
            </div>
          </div>

          {/* ADD TO CART ACTION */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-400 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Custom Item...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Add Configuration to Cart (${parseFloat(configuredPrice).toFixed(2)})
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}