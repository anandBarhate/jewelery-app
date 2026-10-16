"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShieldCheck, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import {
  saleorFetch,
  CREATE_CHECKOUT,
  UPDATE_SHIPPING_ADDRESS,
  UPDATE_DELIVERY_METHOD,
  CREATE_PAYMENT,
  COMPLETE_CHECKOUT,
} from '@/lib/saleor';

export default function CheckoutPage() {
  const { items, clearCart } = useCart();

  const [shipping, setShipping] = useState({
    firstName: 'Eleanor',
    lastName: 'Vance',
    email: 'eleanor@example.com',
    address: '123 Fifth Avenue',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.configuredPrice || 0), 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg('');

    if (items.length === 0) {
      setErrorMsg('Your cart is empty.');
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Provision fresh, live variants for every cart line
      const lines = [];
      for (const item of items) {
        const res = await fetch('/api/cart/variant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configuration: item }),
        });
        const data = await res.json();
        if (!data.success || !data.variantId) {
          throw new Error(`Variant provisioning failed: ${data.error || 'Server error'}`);
        }
        lines.push({ variantId: data.variantId, quantity: 1 });
      }

      const addressInput = {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        streetAddress1: shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode,
        countryArea: shipping.state,
        country: shipping.country,
      };

      // 2. Create Checkout Session atomically
      const checkoutRes = await saleorFetch({
        query: CREATE_CHECKOUT,
        variables: {
          input: {
            channel: 'default-channel',
            email: shipping.email,
            lines,
            shippingAddress: addressInput,
            billingAddress: addressInput,
          },
        },
      });

      const checkoutErrors = checkoutRes?.checkoutCreate?.errors || [];
      if (checkoutErrors.length > 0) {
        throw new Error(`Checkout Error (${checkoutErrors[0].field}):${checkoutErrors[0].message}`);
      }

      const checkout = checkoutRes?.checkoutCreate?.checkout;
      if (!checkout?.id) throw new Error('Saleor did not return a valid Checkout ID.');

      let finalAmount = checkout.totalPrice.gross.amount;

      // 3. Handle Delivery Selection only if the items require physical delivery
      if (checkout.isShippingRequired) {
        let shippingMethods = checkout.shippingMethods || [];

        // If not populated initially, trigger address update to recalculate available rates
        if (shippingMethods.length === 0) {
          const shipRes = await saleorFetch({
            query: UPDATE_SHIPPING_ADDRESS,
            variables: { id: checkout.id, address: addressInput },
          });
          shippingMethods = shipRes?.checkoutShippingAddressUpdate?.checkout?.shippingMethods || [];
        }

        if (shippingMethods.length > 0) {
          const deliveryRes = await saleorFetch({
            query: UPDATE_DELIVERY_METHOD,
            variables: {
              id: checkout.id,
              deliveryMethodId: shippingMethods[0].id,
            },
          });

          const deliveryErrors = deliveryRes?.checkoutDeliveryMethodUpdate?.errors || [];
          if (deliveryErrors.length > 0) {
            throw new Error(`Delivery Method: ${deliveryErrors[0].message}`);
          }

          finalAmount =
            deliveryRes?.checkoutDeliveryMethodUpdate?.checkout?.totalPrice?.gross?.amount || finalAmount;
        }
      }

      // 4. Authorize Payment
      const paymentRes = await saleorFetch({
        query: CREATE_PAYMENT,
        variables: {
          id: checkout.id,
          amount: finalAmount,
        },
      });

      const paymentErrors = paymentRes?.checkoutPaymentCreate?.errors || [];
      if (paymentErrors.length > 0) {
        throw new Error(`Payment: ${paymentErrors[0].message}`);
      }

      // 5. Finalize Order
      const completeRes = await saleorFetch({
        query: COMPLETE_CHECKOUT,
        variables: { id: checkout.id },
      });

      const completeErrors = completeRes?.checkoutComplete?.errors || [];
      if (completeErrors.length > 0) {
        throw new Error(`Completion: ${completeErrors[0].message}`);
      }

      const orderNumber = completeRes?.checkoutComplete?.order?.number;
      if (!orderNumber) throw new Error('Saleor did not return an order confirmation number.');

      clearCart();
      setCompletedOrder({ number: orderNumber });
    } catch (err) {
      console.error('Checkout failed:', err);
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
        <div>
          <h1 className="text-3xl font-serif text-neutral-900">Order Confirmed!</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Your custom jewelry order <strong>#{completedOrder.number}</strong> has been created in Saleor.
          </p>
        </div>
        <div className="pt-6">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded text-xs uppercase font-semibold tracking-wider transition-colors"
          >
            View My Orders <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 py-8">
      <div>
        <h1 className="text-3xl font-serif text-neutral-900 mb-6">Checkout</h1>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded">
            <strong>Saleor Notice:</strong> {errorMsg}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b pb-2">
              Contact & Delivery
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-neutral-600 block mb-1">First Name</label>
                <input
                  required
                  value={shipping.firstName}
                  onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })}
                  className="w-full border border-neutral-300 rounded p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-600 block mb-1">Last Name</label>
                <input
                  required
                  value={shipping.lastName}
                  onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })}
                  className="w-full border border-neutral-300 rounded p-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-neutral-600 block mb-1">Email Address</label>
              <input
                required
                type="email"
                value={shipping.email}
                onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                className="w-full border border-neutral-300 rounded p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-neutral-600 block mb-1">Street Address</label>
              <input
                required
                value={shipping.address}
                onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                className="w-full border border-neutral-300 rounded p-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-neutral-600 block mb-1">City</label>
                <input
                  required
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  className="w-full border border-neutral-300 rounded p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-600 block mb-1">State</label>
                <input
                  required
                  maxLength={2}
                  value={shipping.state}
                  onChange={(e) => setShipping({ ...shipping, state: e.target.value.toUpperCase() })}
                  className="w-full border border-neutral-300 rounded p-2.5 text-sm uppercase"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-600 block mb-1">Postal Code</label>
                <input
                  required
                  value={shipping.postalCode}
                  onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                  className="w-full border border-neutral-300 rounded p-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 border-b pb-2">Payment</h2>
            <div className="bg-neutral-100 border border-neutral-200 p-4 rounded text-sm text-neutral-600 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Testing sandbox: authorizes payment via Saleor's dummy gateway.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || items.length === 0}
            className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white py-4 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting to Saleor...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Place Order (${calculateTotal().toFixed(2)})
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-neutral-100 rounded-lg p-8 h-fit sticky top-24">
        <h2 className="text-lg font-serif font-bold text-neutral-900 border-b border-neutral-200 pb-4">Order Summary</h2>

        <div className="divide-y divide-neutral-200 space-y-4 mt-4">
          {items.map((item) => (
            <div key={item.cartLineId} className="pt-4 flex justify-between">
              <div>
                <p className="font-serif font-semibold text-sm text-neutral-900">{item.productName}</p>
                <p className="text-xs text-neutral-500 mt-1">{item.metal} | {item.carat}ct {item.shape}</p>
                {item.cert && (
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {item.clarity} • {item.colour} • {item.cert}
                  </p>
                )}
              </div>
              <p className="text-sm font-bold text-neutral-900">${item.configuredPrice?.toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-300 mt-6 pt-4 flex justify-between items-end">
          <span className="text-sm uppercase text-neutral-500 font-semibold tracking-wider">Total</span>
          <span className="font-serif font-bold text-2xl text-neutral-900">${calculateTotal().toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}