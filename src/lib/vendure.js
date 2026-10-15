const VENDURE_SHOP_API = process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL || 'http://localhost:3050/shop-api';
const AUTH_TOKEN_KEY = 'vendure_auth_token';

// Helper to get/set auth token from localStorage
export function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function setAuthToken(token) {
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

// Fetch wrapper for Vendure Shop API
export async function vendureFetch({ query, variables = {} }) {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(VENDURE_SHOP_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      credentials: 'omit',
    });

    // Check for auth token in header responses
    const responseToken = res.headers.get('vendure-auth-token');
    if (responseToken) {
      setAuthToken(responseToken);
    }

    const json = await res.json();
    if (json.errors) {
      console.error('Vendure GraphQL Error:', json.errors);
    }
    return json.data;
  } catch (error) {
    console.error('Vendure Network Error:', error);
    return null;
  }
}

// Vendure GraphQL Operations
export const GET_ACTIVE_ORDER = `
  query GetActiveOrder {
    activeOrder {
      id
      code
      state
      totalWithTax
      shippingWithTax
      lines {
        id
        quantity
        linePriceWithTax
        customFields
        productVariant {
          id
          name
          price
          product {
            name
          }
        }
      }
    }
  }
`;

export const ADD_ITEM_TO_ORDER = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!, $customFields: OrderLineCustomFieldsInput) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity, customFields: $customFields) {
      ... on Order {
        id
        code
        totalWithTax
        lines {
          id
          quantity
          linePriceWithTax
          customFields {
            configuration
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const REMOVE_ORDER_LINE = `
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        id
        totalWithTax
        lines {
          id
          quantity
          linePriceWithTax
        }
      }
    }
  }
`;