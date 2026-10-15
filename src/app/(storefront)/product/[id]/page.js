"use client";
import React, { useState, useEffect, use } from "react";
import { useCart } from "@/context/CartContext";

export default function ConfiguratorPDP({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [metals, setMetals] = useState([]);
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);

  // Storefront Selection States
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [selectedCarat, setSelectedCarat] = useState(null);
  const [selectedClarity, setSelectedClarity] = useState(null);
  const [selectedColour, setSelectedColour] = useState(null);
  const [selectedCut, setSelectedCut] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [selectedLength, setSelectedLength] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/shop/product/${id}`);
        const data = await res.json();
        const prod = data.product;

        setProduct(prod);
        setMetals(data.metals || []);
        setRules(data.pricingRules || null);

        if (data.metals?.length) setSelectedMetal(data.metals[0]);

        const parseFirst = (jsonStr) => {
          try {
            const arr = JSON.parse(jsonStr || '[]');
            return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
          } catch (e) { return null; }
        };

        if (prod) {
          setSelectedOrigin(parseFirst(prod.allowedDiamondOrigins));
          setSelectedShape(parseFirst(prod.allowedDiamondShapes));
          setSelectedCarat(parseFirst(prod.allowedCaratWeights));
          setSelectedClarity(parseFirst(prod.allowedClarities));
          setSelectedColour(parseFirst(prod.allowedColours));
          setSelectedCut(parseFirst(prod.allowedCutGrades));
          setSelectedCert(parseFirst(prod.allowedCertificates));
          setSelectedLength(parseFirst(prod.allowedChainLengths));
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="py-20 text-center font-serif text-neutral-500">Loading Fine Jewelry Configurator...</div>;
  if (!product) return <div className="py-20 text-center font-serif text-neutral-900">Product Not Found</div>;

  const parseArray = (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  };

  const allowedOrigins = parseArray(product.allowedDiamondOrigins);
  const allowedShapes = parseArray(product.allowedDiamondShapes);
  const allowedCarats = parseArray(product.allowedCaratWeights);
  const allowedClarities = parseArray(product.allowedClarities);
  const allowedColours = parseArray(product.allowedColours);
  const allowedCuts = parseArray(product.allowedCutGrades);
  const allowedCerts = parseArray(product.allowedCertificates);
  const allowedLengths = parseArray(product.allowedChainLengths);

  // Dynamic pricing engine calculation
  const metalCost = product.baseMetalWeightGrams * (selectedMetal?.pricePerGram || 0);
  const caratVal = selectedCarat ? parseFloat(selectedCarat) : 1.0;
  const diamondCost = caratVal * 2200 * (selectedOrigin === 'Lab-Created Diamond' ? 0.35 : 1.0);
  const laborAndFees = product.manufacturingLabor + (rules?.logisticsFee || 0) + (rules?.packagingFee || 0);

  const baseTotalCost = metalCost + diamondCost + laborAndFees;
  const finalPrice = baseTotalCost * (1 + (rules?.retailMarkupPercentage || 0) / 100);

  const handleAddToCart = () => {
    const payload = {
      productId: product.id,
      productName: product.name,
      metal: selectedMetal?.name,
      origin: selectedOrigin,
      shape: selectedShape,
      carat: selectedCarat,
      clarity: selectedClarity,
      colour: selectedColour,
      cut: selectedCut,
      cert: selectedCert,
      chainLength: selectedLength,
      configuredPrice: finalPrice,
    };
    addToCart(payload);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-6">
      {/* Summary Side */}
      <div className="bg-neutral-100 rounded-lg p-10 flex flex-col justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-800 font-bold">{product.category}</span>
          <h1 className="text-3xl font-serif mt-2 text-neutral-900">{product.name}</h1>
          <p className="text-sm text-neutral-500 mt-2">
            {selectedCarat && `${selectedCarat}ct `}
            {selectedShape && `${selectedShape} `}
            {selectedOrigin && `(${selectedOrigin}) `}
            {selectedClarity && `| ${selectedClarity} `}
            {selectedColour && `| ${selectedColour} `}
            {selectedCert && `| ${selectedCert}`}
          </p>

          <div className="mt-8 flex justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="max-h-72 object-contain rounded shadow-sm" />
            ) : (
              <div className="w-full h-64 bg-neutral-200/60 rounded flex items-center justify-center text-neutral-400 font-serif text-sm">
                Fine Jewelry Preview
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <span className="text-xs text-neutral-500 uppercase tracking-wider block mb-1">Configured Price</span>
          <p className="text-4xl font-light font-serif text-neutral-900">${finalPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Configurator Controls Side */}
      <div className="space-y-6">
        {/* Metal Selection */}
        {metals.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">1. Select Metal</label>
            <div className="grid grid-cols-2 gap-2">
              {metals.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetal(m)}
                  className={`p-2.5 text-left rounded text-xs transition-all ${
                    selectedMetal?.id === m.id ? 'border-amber-700 bg-amber-50/50 border ring-1 ring-amber-700' : 'border border-neutral-200'
                  }`}
                >
                  <div className="font-semibold text-neutral-900">{m.name}</div>
                  <div className="text-neutral-500">${m.pricePerGram}/g</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Diamond Origin */}
        {allowedOrigins.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">2. Diamond Origin</label>
            <div className="flex gap-2">
              {allowedOrigins.map((origin) => (
                <button
                  key={origin}
                  onClick={() => setSelectedOrigin(origin)}
                  className={`flex-1 py-2 px-3 text-xs font-medium border rounded transition-all ${
                    selectedOrigin === origin ? 'border-amber-700 bg-amber-50/50 text-amber-900 ring-1 ring-amber-700' : 'border-neutral-200 text-neutral-700'
                  }`}
                >
                  {origin}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Diamond Shape */}
        {allowedShapes.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">3. Diamond Shape</label>
            <div className="grid grid-cols-5 gap-1.5">
              {allowedShapes.map((shape) => (
                <button
                  key={shape}
                  onClick={() => setSelectedShape(shape)}
                  className={`py-2 text-xs font-medium border rounded text-center transition-all ${
                    selectedShape === shape ? 'border-amber-700 bg-amber-50/50 text-amber-900 ring-1 ring-amber-700' : 'border-neutral-200 text-neutral-700'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Carat Weights */}
        {allowedCarats.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">4. Carat Weight</label>
            <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto pr-1">
              {allowedCarats.map((carat) => (
                <button
                  key={carat}
                  onClick={() => setSelectedCarat(carat)}
                  className={`py-2 text-xs font-medium border rounded text-center transition-all ${
                    selectedCarat === carat ? 'border-amber-700 bg-amber-50/50 text-amber-900 ring-1 ring-amber-700' : 'border-neutral-200 text-neutral-700'
                  }`}
                >
                  {carat}ct
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clarity & Colour */}
        <div className="grid grid-cols-2 gap-4">
          {allowedClarities.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">Clarity</label>
              <div className="grid grid-cols-3 gap-1">
                {allowedClarities.map((clarity) => (
                  <button
                    key={clarity}
                    onClick={() => setSelectedClarity(clarity)}
                    className={`py-1.5 text-xs font-medium border rounded text-center ${
                      selectedClarity === clarity ? 'border-amber-700 bg-amber-50/50 text-amber-900' : 'border-neutral-200 text-neutral-700'
                    }`}
                  >
                    {clarity}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allowedColours.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">Colour</label>
              <div className="grid grid-cols-3 gap-1">
                {allowedColours.map((colour) => (
                  <button
                    key={colour}
                    onClick={() => setSelectedColour(colour)}
                    className={`py-1.5 text-xs font-medium border rounded text-center ${
                      selectedColour === colour ? 'border-amber-700 bg-amber-50/50 text-amber-900' : 'border-neutral-200 text-neutral-700'
                    }`}
                  >
                    {colour}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cut & Certificate */}
        <div className="grid grid-cols-2 gap-4">
          {allowedCuts.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">Cut Grade</label>
              <div className="flex flex-col gap-1">
                {allowedCuts.map((cut) => (
                  <button
                    key={cut}
                    onClick={() => setSelectedCut(cut)}
                    className={`py-1.5 px-2 text-xs font-medium border rounded text-left ${
                      selectedCut === cut ? 'border-amber-700 bg-amber-50/50 text-amber-900' : 'border-neutral-200 text-neutral-700'
                    }`}
                  >
                    {cut}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allowedCerts.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">Certificate</label>
              <div className="flex flex-col gap-1">
                {allowedCerts.map((cert) => (
                  <button
                    key={cert}
                    onClick={() => setSelectedCert(cert)}
                    className={`py-1.5 px-2 text-xs font-medium border rounded text-left ${
                      selectedCert === cert ? 'border-amber-700 bg-amber-50/50 text-amber-900' : 'border-neutral-200 text-neutral-700'
                    }`}
                  >
                    {cert}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-neutral-900 text-white py-4 rounded font-medium tracking-wide uppercase text-xs hover:bg-neutral-800 transition-colors shadow-sm"
        >
          Add Configuration to Cart
        </button>
      </div>
    </div>
  );
}