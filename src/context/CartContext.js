"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  saleorFetch,
  CREATE_CHECKOUT,
  ADD_TO_CHECKOUT,
  getStoredCheckoutId,
  setStoredCheckoutId,
} from "@/lib/saleor";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutId, setCheckoutId] = useState("");

  useEffect(() => {
    const savedId = getStoredCheckoutId();
    if (savedId) setCheckoutId(savedId);

    const savedItems = localStorage.getItem("local_cart_items");
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (e) {
        setItems([]);
      }
    }
  }, []);

  // 1. ADD NEW CONFIGURATION & SYNC BASKET TO SALEOR
  async function addToCart(configurationPayload) {
    const cartLineId = Date.now().toString();

    try {
      // Provision dynamic SKU and dynamic price in Saleor
      const res = await fetch('/api/cart/variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuration: configurationPayload }),
      });
      const data = await res.json();

      if (!data.success || !data.variantId) {
        throw new Error(data.error || "Failed to provision variant in Saleor");
      }

      const cartLine = {
        ...configurationPayload,
        cartLineId,
        variantId: data.variantId,
        sku: data.sku,
        productName: data.name,
      };

      const nextItems = [...items, cartLine];
      setItems(nextItems);
      localStorage.setItem("local_cart_items", JSON.stringify(nextItems));
      setIsCartOpen(true);

      // Persist basket directly in Saleor
      let activeCheckoutId = checkoutId || getStoredCheckoutId();
      let syncSuccess = false;

      if (activeCheckoutId) {
        try {
          const addRes = await saleorFetch({
            query: ADD_TO_CHECKOUT,
            variables: {
              id: activeCheckoutId,
              lines: [{ variantId: data.variantId, quantity: 1 }],
            },
          });
          if (addRes?.checkoutLinesAdd?.checkout?.id) {
            syncSuccess = true;
          }
        } catch {
          // If the checkout expired or was completed, clear it and create a fresh one below
          activeCheckoutId = "";
        }
      }

      if (!syncSuccess) {
        const createRes = await saleorFetch({
          query: CREATE_CHECKOUT,
          variables: {
            input: {
              channel: "default-channel",
              lines: [{ variantId: data.variantId, quantity: 1 }],
            },
          },
        });

        const newId = createRes?.checkoutCreate?.checkout?.id;
        if (newId) {
          setStoredCheckoutId(newId);
          setCheckoutId(newId);
        }
      }
    } catch (e) {
      console.warn("Cart sync warning:", e.message);
      const fallbackItem = { ...configurationPayload, cartLineId };
      const nextItems = [...items, fallbackItem];
      setItems(nextItems);
      localStorage.setItem("local_cart_items", JSON.stringify(nextItems));
      setIsCartOpen(true);
    }
  }

  // 2. IN-PLACE CONFIGURATION MUTATION (Path B)
  async function updateCartItem(cartLineId, updatedConfiguration) {
    const existingIndex = items.findIndex((item) => item.cartLineId === cartLineId);
    if (existingIndex === -1) return;

    const currentItem = items[existingIndex];
    const mergedItem = { ...currentItem, ...updatedConfiguration };

    const nextItems = [...items];
    nextItems[existingIndex] = mergedItem;
    setItems(nextItems);
    localStorage.setItem("local_cart_items", JSON.stringify(nextItems));

    if (currentItem.variantId) {
      try {
        await fetch('/api/cart/variant', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantId: currentItem.variantId,
            configuration: mergedItem,
          }),
        });
      } catch (err) {
        console.warn("In-place variant update deferred:", err.message);
      }
    }
  }

  function removeFromCart(cartLineId) {
    const updated = items.filter((item) => item.cartLineId !== cartLineId);
    setItems(updated);
    localStorage.setItem("local_cart_items", JSON.stringify(updated));
  }

  function clearCart() {
    setItems([]);
    setCheckoutId("");
    setStoredCheckoutId("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("local_cart_items");
      localStorage.removeItem("saleor_checkout_id");
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: items.length,
        checkoutId,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);