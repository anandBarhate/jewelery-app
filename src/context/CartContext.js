"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  saleorFetch,
  GET_SAMPLE_VARIANT,
  CREATE_CHECKOUT,
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

  async function addToCart(configurationPayload) {
    const cartLine = {
      ...configurationPayload,
      cartLineId: Date.now().toString(),
    };

    const nextItems = [...items, cartLine];
    setItems(nextItems);
    localStorage.setItem("local_cart_items", JSON.stringify(nextItems));
    setIsCartOpen(true);

    try {
      const sampleVariantRes = await saleorFetch({ query: GET_SAMPLE_VARIANT });
      const variantId = sampleVariantRes?.products?.edges?.[0]?.node?.variants?.[0]?.id;

      if (variantId) {
        const metadataArray = [
          { key: "metal", value: String(configurationPayload.metal || "") },
          { key: "carat", value: String(configurationPayload.carat || "") },
          { key: "shape", value: String(configurationPayload.shape || "") },
          { key: "clarity", value: String(configurationPayload.clarity || "") },
          { key: "colour", value: String(configurationPayload.colour || "") },
          { key: "cert", value: String(configurationPayload.cert || "") },
          { key: "configuredPrice", value: String(configurationPayload.configuredPrice || "") },
        ];

        const checkoutData = await saleorFetch({
          query: CREATE_CHECKOUT,
          variables: {
            lines: [{ variantId, quantity: 1 }],
            metadata: metadataArray,
          },
        });

        const newCheckoutId = checkoutData?.checkoutCreate?.checkout?.id;
        if (newCheckoutId) {
          setStoredCheckoutId(newCheckoutId);
          setCheckoutId(newCheckoutId);
        }
      }
    } catch (e) {
      console.warn("Saleor sync skipped. Running in local mode.");
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

  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        checkoutId,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);