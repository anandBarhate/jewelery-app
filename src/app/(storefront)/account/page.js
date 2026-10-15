"use client";
import React, { useState, useEffect } from "react";
import {
  saleorFetch,
  REGISTER_CUSTOMER_MUTATION,
  LOGIN_CUSTOMER_MUTATION,
  GET_CUSTOMER_ORDERS,
  getSaleorToken,
  setSaleorToken,
} from "@/lib/saleor";
import { User, Package, LogOut, ShieldCheck, Mail, Lock } from "lucide-react";

export default function AccountPage() {
  const [token, setToken] = useState("");
  const [userData, setUserData] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState({ text: "", isError: false });

  useEffect(() => {
    const activeToken = getSaleorToken();
    if (activeToken) {
      setToken(activeToken);
      fetchCustomerOrders();
    }
  }, []);

  async function fetchCustomerOrders() {
    const data = await saleorFetch({ query: GET_CUSTOMER_ORDERS });
    if (data?.me) {
      setUserData(data.me);
    } else {
      handleLogout();
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setStatusMessage({ text: "", isError: false });

    if (isRegistering) {
      const data = await saleorFetch({
        query: REGISTER_CUSTOMER_MUTATION,
        variables: {
          email,
          password,
          redirectUrl: window.location.origin + "/account",
        },
      });

      if (data?.accountRegister?.errors?.length) {
        setStatusMessage({ text: data.accountRegister.errors[0].message, isError: true });
      } else {
        setStatusMessage({
          text: "Registration successful! You may now sign in.",
          isError: false,
        });
        setIsRegistering(false);
      }
    } else {
      const data = await saleorFetch({
        query: LOGIN_CUSTOMER_MUTATION,
        variables: { email, password },
      });

      if (data?.tokenCreate?.token) {
        const receivedToken = data.tokenCreate.token;
        setSaleorToken(receivedToken);
        setToken(receivedToken);
        setUserData(data.tokenCreate.user);
        fetchCustomerOrders();
      } else {
        const err = data?.tokenCreate?.errors?.[0]?.message || "Invalid credentials";
        setStatusMessage({ text: err, isError: true });
      }
    }
  }

  function handleLogout() {
    setSaleorToken("");
    setToken("");
    setUserData(null);
  }

  // 1. Authenticated Account Dashboard & Order History
  if (token && userData) {
    const orders = userData.orders?.edges || [];

    return (
      <div className="max-w-4xl mx-auto py-10 space-y-8">
        <div className="flex justify-between items-center border-b pb-6">
          <div>
            <h1 className="text-3xl font-serif text-neutral-900">Customer Account</h1>
            <p className="text-sm text-neutral-500 mt-1">Signed in as {userData.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs uppercase font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-2 rounded border border-rose-100"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div>
          <h2 className="text-xl font-serif text-neutral-900 flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-amber-700" /> Order History
          </h2>

          {orders.length === 0 ? (
            <div className="bg-neutral-100 p-8 rounded-lg text-center text-sm text-neutral-500">
              No orders placed yet. Configure fine jewelry items in the catalog to complete your first checkout.
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white divide-y">
              {orders.map(({ node }) => (
                <div key={node.id} className="p-5 flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-neutral-900">Order #{node.number}</span>
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                        {node.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Placed on {new Date(node.created).toLocaleDateString()}
                    </p>
                    <div className="mt-3 text-xs text-neutral-600 space-y-1">
                      {node.lines.map((line) => (
                        <div key={line.id}>
                          • {line.productName} ({line.variantName}) × {line.quantity}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right flex md:flex-col justify-between items-end">
                    <span className="text-xs uppercase text-neutral-400 font-semibold">Total</span>
                    <span className="text-lg font-serif font-bold text-neutral-900">
                      ${node.total.gross.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Authentication View (Sign Up / Sign In)
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white p-8 rounded-lg border border-neutral-200 shadow-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-800">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif text-neutral-900">
            {isRegistering ? "Create Customer Account" : "Sign In to Account"}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Access your custom jewelry configurations and order tracking
          </p>
        </div>

        {statusMessage.text && (
          <div
            className={`text-xs p-3 rounded ${
              statusMessage.isError
                ? "bg-rose-50 border border-rose-200 text-rose-700"
                : "bg-emerald-50 border border-emerald-200 text-emerald-700"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded text-sm text-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded text-sm text-neutral-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded text-xs uppercase font-semibold tracking-wider transition-colors"
          >
            {isRegistering ? "Register Account" : "Sign In"}
          </button>
        </form>

        <div className="border-t pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setStatusMessage({ text: "", isError: false });
            }}
            className="text-xs text-amber-800 hover:underline font-medium"
          >
            {isRegistering ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}