"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

const DIAMOND_SHAPES = ['Round', 'Oval', 'Cushion', 'Pear', 'Princess', 'Marquise', 'Asscher', 'Emerald', 'Radiant', 'Heart'];
const DIAMOND_ORIGINS = ['Natural Diamond', 'Lab-Created Diamond'];
const CARAT_WEIGHTS = Array.from({ length: 40 }, (_, i) => ((i + 1) * 0.1).toFixed(1));
const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'];
const COLOURS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const CUT_GRADES = ['Excellent', 'Very Good', 'Good', 'Fair'];
const CERTIFICATES = ['DF', 'EGL/SGL', 'IGI/HRD', 'GIA'];
const CHAIN_LENGTHS = ['16"', '18"', '20"', '22"', '24"'];

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const initialFormState = {
    name: '',
    category: 'Ring',
    type: 'Solitaire',
    baseMetalWeightGrams: 4.5,
    manufacturingLabor: 150.0,
    allowedChainLengths: ['16"', '18"'],
    allowedDiamondShapes: ['Round', 'Oval', 'Princess'],
    allowedDiamondOrigins: ['Natural Diamond', 'Lab-Created Diamond'],
    allowedCaratWeights: ['0.5', '1.0', '1.5', '2.0'],
    allowedClarities: ['VVS1', 'VVS2', 'VS1', 'VS2'],
    allowedColours: ['D', 'E', 'F', 'G'],
    allowedCutGrades: ['Excellent', 'Very Good'],
    allowedCertificates: ['GIA', 'IGI/HRD']
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/pim/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  function handleCheckboxToggle(field, value) {
    const current = form[field] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setForm({ ...form, [field]: updated });
  }

  function handleSelectAll(field, allValues) {
    const current = form[field] || [];
    if (current.length === allValues.length) {
      setForm({ ...form, [field]: [] });
    } else {
      setForm({ ...form, [field]: [...allValues] });
    }
  }

  function handleEditClick(product) {
    setEditingId(product.id);
    const parseJSON = (val) => {
      try {
        const parsed = JSON.parse(val || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    };

    setForm({
      name: product.name || '',
      category: product.category || 'Ring',
      type: product.type || 'Solitaire',
      baseMetalWeightGrams: product.baseMetalWeightGrams || 0,
      manufacturingLabor: product.manufacturingLabor || 0,
      allowedChainLengths: parseJSON(product.allowedChainLengths),
      allowedDiamondShapes: parseJSON(product.allowedDiamondShapes),
      allowedDiamondOrigins: parseJSON(product.allowedDiamondOrigins),
      allowedCaratWeights: parseJSON(product.allowedCaratWeights),
      allowedClarities: parseJSON(product.allowedClarities),
      allowedColours: parseJSON(product.allowedColours),
      allowedCutGrades: parseJSON(product.allowedCutGrades),
      allowedCertificates: parseJSON(product.allowedCertificates)
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialFormState);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (editingId) {
      await fetch(`/api/pim/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    } else {
      await fetch('/api/pim/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    }

    handleCancelEdit();
    fetchProducts();
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this blueprint?')) return;
    await fetch(`/api/pim/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Product Catalog Management</h1>
        <p className="text-slate-400 text-sm mt-1">Configure offered variations for metals, diamonds, carats, and cuts.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
            {editingId ? <RefreshCw className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? 'Reconfigure Blueprint Specs' : 'Add New Jewelry Blueprint'}
          </h2>

          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <X className="w-4 h-4" /> Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Product Name</label>
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Classic Solitaire Engagement Ring"
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
            >
              <option value="Ring">Ring</option>
              <option value="Necklace">Necklace</option>
              <option value="Bracelet">Bracelet</option>
              <option value="Earrings">Earrings</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Style / Setting Type</label>
            <input
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              placeholder="e.g. Solitaire, Bezel, Halo"
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Metal Weight (Grams)</label>
            <input
              type="number" step="0.1"
              value={form.baseMetalWeightGrams}
              onChange={e => setForm({ ...form, baseMetalWeightGrams: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
            />
          </div>
        </div>

        {/* Necklace Chain Lengths */}
        {form.category === 'Necklace' && (
          <div className="border-t border-slate-800 pt-4">
            <label className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-3">Chain Lengths</label>
            <div className="grid grid-cols-5 gap-2">
              {CHAIN_LENGTHS.map(length => (
                <label key={length} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700/50 hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={(form.allowedChainLengths || []).includes(length)}
                    onChange={() => handleCheckboxToggle('allowedChainLengths', length)}
                    className="accent-amber-500 rounded"
                  />
                  <span>{length}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Diamond Variations Section */}
        <div className="border-t border-slate-800 pt-4 space-y-5">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Offered Diamond Configurations</h3>

          {/* Origin */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-2">Diamond Origin</label>
            <div className="flex gap-4">
              {DIAMOND_ORIGINS.map(origin => (
                <label key={origin} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/50 px-3 py-2 rounded border border-slate-700/50">
                  <input
                    type="checkbox"
                    checked={(form.allowedDiamondOrigins || []).includes(origin)}
                    onChange={() => handleCheckboxToggle('allowedDiamondOrigins', origin)}
                    className="accent-amber-500 rounded"
                  />
                  <span>{origin}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Shapes */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-2">Diamond Shapes</label>
            <div className="grid grid-cols-5 gap-2">
              {DIAMOND_SHAPES.map(shape => (
                <label key={shape} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-2 rounded border border-slate-700/50 hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={(form.allowedDiamondShapes || []).includes(shape)}
                    onChange={() => handleCheckboxToggle('allowedDiamondShapes', shape)}
                    className="accent-amber-500 rounded"
                  />
                  <span>{shape}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Carat Weights (0.1 to 4.0 in steps of 0.1) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-slate-400 font-semibold">Carat Weight Choices (0.1ct – 4.0ct)</label>
              <button
                type="button"
                onClick={() => handleSelectAll('allowedCaratWeights', CARAT_WEIGHTS)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                {(form.allowedCaratWeights || []).length === CARAT_WEIGHTS.length ? 'Deselect All' : 'Select All Carats'}
              </button>
            </div>
            <div className="grid grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/50 border border-slate-800 rounded">
              {CARAT_WEIGHTS.map(carat => (
                <label key={carat} className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer bg-slate-800/40 p-1 rounded border border-slate-800 hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={(form.allowedCaratWeights || []).includes(carat)}
                    onChange={() => handleCheckboxToggle('allowedCaratWeights', carat)}
                    className="accent-amber-500 rounded w-3 h-3"
                  />
                  <span>{carat}ct</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clarity */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-2">Clarity Options</label>
            <div className="grid grid-cols-9 gap-1.5">
              {CLARITIES.map(clarity => (
                <label key={clarity} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-1.5 rounded border border-slate-700/50">
                  <input
                    type="checkbox"
                    checked={(form.allowedClarities || []).includes(clarity)}
                    onChange={() => handleCheckboxToggle('allowedClarities', clarity)}
                    className="accent-amber-500 rounded"
                  />
                  <span>{clarity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Colour */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-2">Colour Options (D to L)</label>
            <div className="grid grid-cols-9 gap-1.5">
              {COLOURS.map(colour => (
                <label key={colour} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-1.5 rounded border border-slate-700/50">
                  <input
                    type="checkbox"
                    checked={(form.allowedColours || []).includes(colour)}
                    onChange={() => handleCheckboxToggle('allowedColours', colour)}
                    className="accent-amber-500 rounded"
                  />
                  <span>{colour}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cut Grade & Certificates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-2">Cut Grades</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CUT_GRADES.map(cut => (
                  <label key={cut} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-1.5 rounded border border-slate-700/50">
                    <input
                      type="checkbox"
                      checked={(form.allowedCutGrades || []).includes(cut)}
                      onChange={() => handleCheckboxToggle('allowedCutGrades', cut)}
                      className="accent-amber-500 rounded"
                    />
                    <span>{cut}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-2">Certificates</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CERTIFICATES.map(cert => (
                  <label key={cert} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-800/50 p-1.5 rounded border border-slate-700/50">
                    <input
                      type="checkbox"
                      checked={(form.allowedCertificates || []).includes(cert)}
                      onChange={() => handleCheckboxToggle('allowedCertificates', cert)}
                      className="accent-amber-500 rounded"
                    />
                    <span>{cert}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded text-sm transition-colors">
          {editingId ? 'Save & Submit for Re-approval' : 'Create & Submit to Draft'}
        </button>
      </form>

      {/* Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Configured Attributes</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {products.map(p => {
              const parseCount = (str) => { try { return JSON.parse(str || '[]').length; } catch(e) { return 0; } };
              return (
                <tr key={p.id}>
                  <td className="p-4 font-medium text-white">{p.name}</td>
                  <td className="p-4">{p.category}</td>
                  <td className="p-4 text-xs text-slate-400">
                    {parseCount(p.allowedDiamondOrigins)} Origins | {parseCount(p.allowedDiamondShapes)} Shapes | {parseCount(p.allowedCaratWeights)} Carats | {parseCount(p.allowedCertificates)} Certs
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEditClick(p)} className="p-1.5 bg-slate-800 text-amber-400 rounded mr-2"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-slate-800 text-rose-400 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}