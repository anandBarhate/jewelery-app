// "use client";
// import React, { useState } from "react";
// import Link from "next/link";
// import { ShoppingBag } from "lucide-react";

// export default function StorefrontLayout({ children }) {
//   const [cart] = useState([]);
//   return (
//     <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
//       <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//           <Link href="/" className="text-2xl font-serif tracking-widest uppercase font-bold">AURA FINE JEWELRY</Link>
//           <nav className="flex items-center gap-8 text-sm font-medium">
//             <Link href="/" className="hover:text-amber-700">Collections</Link>
//             <Link href="/admin/catalog" className="text-xs bg-slate-900 text-slate-100 px-3 py-1.5 rounded-full">PIM Admin Portal</Link>
//             <Link href="/checkout" className="relative flex items-center gap-2"><ShoppingBag className="w-5 h-5" /></Link>
//           </nav>
//         </div>
//       </header>
//       <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
//     </div>
//   );
// }


// "use client";
// import React from "react";
// import Link from "next/link";
// import { ShoppingBag, X, Trash2, ArrowRight } from "lucide-react";
// import { CartProvider, useCart } from "@/context/CartContext";

// function HeaderNav() {
//   const { itemCount, setIsCartOpen } = useCart();

//   return (
//     <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
//       <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//         <Link href="/" className="text-2xl font-serif tracking-widest uppercase font-bold text-neutral-900">
//           AURA FINE JEWELRY
//         </Link>
//         <nav className="flex items-center gap-8 text-sm font-medium">
//           <Link href="/" className="hover:text-amber-700 transition-colors">Collections</Link>
//           <Link href="/admin/catalog" className="text-xs bg-slate-900 text-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors">
//             PIM Admin Portal
//           </Link>
//           <button
//             onClick={() => setIsCartOpen(true)}
//             className="relative flex items-center gap-2 text-neutral-700 hover:text-neutral-900"
//           >
//             <ShoppingBag className="w-5 h-5" />
//             {itemCount > 0 && (
//               <span className="bg-amber-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
//                 {itemCount}
//               </span>
//             )}
//           </button>
//         </nav>
//       </div>
//     </header>
//   );
// }

// function CartDrawer() {
//   const { isCartOpen, setIsCartOpen, items, removeFromCart } = useCart();

//   if (!isCartOpen) return null;

//   const calculateTotal = () => {
//     return items.reduce((sum, item) => {
//       const price = item.linePriceWithTax ? item.linePriceWithTax / 100 : item.configuredPrice || 0;
//       return sum + price;
//     }, 0);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
//       <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6">
//         <div>
//           <div className="flex items-center justify-between border-b pb-4">
//             <h2 className="text-lg font-serif font-bold text-neutral-900">Your Shopping Basket</h2>
//             <button onClick={() => setIsCartOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-900">
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           <div className="divide-y divide-neutral-100 max-h-[65vh] overflow-y-auto mt-4 space-y-4">
//             {items.length === 0 ? (
//               <div className="py-12 text-center text-sm text-neutral-500">Your shopping basket is currently empty.</div>
//             ) : (
//               items.map((item, idx) => {
//                 const spec = typeof item.customFields === 'string' ? JSON.parse(item.customFields) : item;
//                 const price = item.linePriceWithTax ? item.linePriceWithTax / 100 : item.configuredPrice || 0;

//                 return (
//                   <div key={item.id || item.cartLineId || idx} className="pt-4 flex justify-between items-start">
//                     <div>
//                       <h3 className="font-serif font-semibold text-sm text-neutral-900">{spec.productName || "Custom Fine Jewelry"}</h3>
//                       <p className="text-xs text-neutral-500 mt-1">
//                         {spec.metal} {spec.carat ? `| ${spec.carat}ct` : ''} {spec.shape ? `${spec.shape}` : ''}
//                       </p>
//                       {spec.clarity && (
//                         <p className="text-[11px] text-neutral-400">
//                           {spec.clarity} | {spec.colour} | {spec.cert}
//                         </p>
//                       )}
//                       <p className="text-xs font-bold text-neutral-900 mt-2">${price.toFixed(2)}</p>
//                     </div>

//                     <button
//                       onClick={() => removeFromCart(item.id || item.cartLineId)}
//                       className="text-neutral-400 hover:text-rose-600 p-1"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         {items.length > 0 && (
//           <div className="border-t pt-4 space-y-4">
//             <div className="flex justify-between items-center text-sm">
//               <span className="text-neutral-500">Subtotal</span>
//               <span className="font-serif font-bold text-lg text-neutral-900">${calculateTotal().toFixed(2)}</span>
//             </div>

//             <Link
//               href="/checkout"
//               onClick={() => setIsCartOpen(false)}
//               className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded flex items-center justify-center gap-2 text-xs uppercase font-semibold tracking-wider transition-colors"
//             >
//               Proceed to Vendure Checkout <ArrowRight className="w-4 h-4" />
//             </Link>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function StorefrontLayout({ children }) {
//   return (
//     <CartProvider>
//       <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
//         <HeaderNav />
//         <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
//         <CartDrawer />
//       </div>
//     </CartProvider>
//   );
// }


"use client";
import React from "react";
import Link from "next/link";
import { ShoppingBag, User, X, Trash2, ArrowRight } from "lucide-react";
import { CartProvider, useCart } from "@/context/CartContext";

function HeaderNav() {
  const { itemCount, setIsCartOpen } = useCart();

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-serif tracking-widest uppercase font-bold text-neutral-900">
          AURA FINE JEWELRY
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-amber-700 transition-colors">Collections</Link>
          <Link href="/account" className="flex items-center gap-1.5 hover:text-amber-700 transition-colors">
            <User className="w-4 h-4" /> Account & Orders
          </Link>
          <Link href="/admin/catalog" className="text-xs bg-slate-900 text-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors">
            PIM Portal
          </Link>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 text-neutral-700 hover:text-neutral-900"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="bg-amber-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateCartItem, removeFromCart } = useCart();

  if (!isCartOpen) return null;

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.configuredPrice || 0), 0);
  };

  const handleQuickMetalChange = (cartLineId, currentItem, newMetal) => {
    // Recalculate price delta based on metal upgrade/downgrade
    const metalPriceDeltas = {
      "14k White Gold": 0,
      "18k Yellow Gold": 350,
      "Platinum": 750,
    };
    const baseWithoutMetal = (currentItem.configuredPrice || 2500) - (metalPriceDeltas[currentItem.metal] || 0);
    const newPrice = baseWithoutMetal + (metalPriceDeltas[newMetal] || 0);

    updateCartItem(cartLineId, {
      metal: newMetal,
      configuredPrice: newPrice,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-serif font-bold text-neutral-900">Your Shopping Basket</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-100 max-h-[65vh] overflow-y-auto mt-4 space-y-4">
            {items.length === 0 ? (
              <div className="py-12 text-center text-sm text-neutral-500">Your shopping basket is empty.</div>
            ) : (
              items.map((item) => (
                <div key={item.cartLineId} className="pt-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif font-semibold text-sm text-neutral-900">{item.productName}</h3>
                      {item.sku && <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-mono">{item.sku}</span>}
                      <p className="text-xs text-neutral-500 mt-1">
                        {item.carat ? `${item.carat}ct ` : ''}{item.shape} {item.clarity ? `• ${item.clarity}` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.cartLineId)}
                      className="text-neutral-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* IN-PLACE CONFIGURATION SELECTOR */}
                  <div className="flex items-center justify-between bg-neutral-50 p-2 rounded border border-neutral-200">
                    <span className="text-[11px] uppercase font-semibold text-neutral-500">Metal:</span>
                    <select
                      value={item.metal || "18k Yellow Gold"}
                      onChange={(e) => handleQuickMetalChange(item.cartLineId, item, e.target.value)}
                      className="text-xs bg-white border border-neutral-300 rounded px-2 py-1 text-neutral-800"
                    >
                      <option value="14k White Gold">14k White Gold</option>
                      <option value="18k Yellow Gold">18k Yellow Gold (+$350)</option>
                      <option value="Platinum">Platinum (+$750)</option>
                    </select>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-neutral-900">${item.configuredPrice?.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-serif font-bold text-lg text-neutral-900">${calculateTotal().toFixed(2)}</span>
            </div>

            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded flex items-center justify-center gap-2 text-xs uppercase font-semibold tracking-wider transition-colors"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StorefrontLayout({ children }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
        <HeaderNav />
        <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
        <CartDrawer />
      </div>
    </CartProvider>
  );
}