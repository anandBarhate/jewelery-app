const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL || 'http://localhost:8000/graphql/';
const AUTH_TOKEN_KEY = 'saleor_auth_token';
const CHECKOUT_ID_KEY = 'saleor_checkout_id';

export function getSaleorToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function setSaleorToken(token) {
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getStoredCheckoutId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(CHECKOUT_ID_KEY) || '';
}

export function setStoredCheckoutId(id) {
  if (typeof window !== 'undefined') {
    if (id) localStorage.setItem(CHECKOUT_ID_KEY, id);
    else localStorage.removeItem(CHECKOUT_ID_KEY);
  }
}

export async function saleorFetch({ query, variables = {} }) {
  const token = getSaleorToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(SALEOR_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();
    if (json.errors) {
      console.warn('Saleor GraphQL Warnings:', json.errors);
    }
    return json.data || null;
  } catch (error) {
    console.warn('Saleor backend not reachable at http://localhost:8000/graphql/. Running locally.');
    return null;
  }
}

// 1. Customer Authentication Queries & Mutations
export const REGISTER_CUSTOMER_MUTATION = `
  mutation RegisterCustomer($email: String!, $password: String!, $redirectUrl: String!) {
    accountRegister(
      input: {
        email: $email
        password: $password
        redirectUrl: $redirectUrl
        channel: "default-channel"
      }
    ) {
      user {
        id
        email
      }
      errors {
        field
        message
      }
    }
  }
`;

export const LOGIN_CUSTOMER_MUTATION = `
  mutation LoginCustomer($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      user {
        id
        email
        firstName
        lastName
      }
      errors {
        field
        message
      }
    }
  }
`;

export const GET_CUSTOMER_ORDERS = `
  query GetCustomerOrders {
    me {
      id
      email
      firstName
      orders(first: 10) {
        edges {
          node {
            id
            number
            created
            status
            total {
              gross {
                amount
                currency
              }
            }
            lines {
              id
              productName
              variantName
              quantity
            }
          }
        }
      }
    }
  }
`;

// 2. Headless Checkout & Cart Operations
export const GET_SAMPLE_VARIANT = `
  query GetSampleVariant {
    products(first: 1, channel: "default-channel") {
      edges {
        node {
          variants {
            id
            name
            pricing {
              price {
                gross {
                  amount
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CREATE_CHECKOUT = `
  mutation CreateCheckout($lines: [CheckoutLineInput!]!, $metadata: [MetadataInput!]) {
    checkoutCreate(
      input: {
        channel: "default-channel"
        lines: $lines
        metadata: $metadata
      }
    ) {
      checkout {
        id
        totalPrice {
          gross {
            amount
            currency
          }
        }
        lines {
          id
          quantity
          variant {
            id
            name
            product {
              name
            }
          }
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

// 3. Checkout Progression & Payment Flow
export const UPDATE_CHECKOUT_EMAIL = `
  mutation UpdateCheckoutEmail($id: ID!, $email: String!) {
    checkoutEmailUpdate(id: $id, email: $email) {
      checkout { id }
      errors { field message }
    }
  }
`;

// export const UPDATE_CHECKOUT_ADDRESS = `
//   mutation UpdateCheckoutAddress($id: ID!, $address: AddressInput!) {
//     checkoutShippingAddressUpdate(id: $id, shippingAddress: $address) {
//       checkout {
//         id
//         shippingMethods {
//           id
//           name
//           price {
//             amount
//             currency
//           }
//         }
//         availableShippingMethods {
//           id
//           name
//         }
//       }
//       errors { field message }
//     }
//     checkoutBillingAddressUpdate(id: $id, billingAddress: $address) {
//       checkout { id }
//       errors { field message }
//     }
//   }
// `;

export const UPDATE_SHIPPING_ADDRESS = `
  mutation UpdateShippingAddress($id: ID!, $address: AddressInput!) {
    checkoutShippingAddressUpdate(id: $id, shippingAddress: $address) {
      checkout {
        id
        shippingMethods {
          id
          name
        }
      }
      errors { field message }
    }
  }
`;

export const UPDATE_BILLING_ADDRESS = `
  mutation UpdateBillingAddress($id: ID!, $address: AddressInput!) {
    checkoutBillingAddressUpdate(id: $id, billingAddress: $address) {
      checkout { id }
      errors { field message }
    }
  }
`;

export const CREATE_PAYMENT = `
  mutation CreatePayment($id: ID!, $amount: PositiveDecimal!) {
    checkoutPaymentCreate(
      id: $id
      input: {
        gateway: "mirumee.payments.dummy"
        token: "fully_charged"
        amount: $amount
      }
    ) {
      payment { id }
      errors { field message }
    }
  }
`;

export const UPDATE_DELIVERY_METHOD = `
  mutation UpdateDeliveryMethod($id: ID!, $deliveryMethodId: ID!) {
    checkoutDeliveryMethodUpdate(id: $id, deliveryMethodId: $deliveryMethodId) {
      checkout {
        id
        totalPrice {
          gross {
            amount
          }
        }
      }
      errors { field message }
    }
  }
`;


export const COMPLETE_CHECKOUT = `
  mutation CompleteCheckout($id: ID!) {
    checkoutComplete(id: $id) {
      order {
        id
        number
      }
      errors { field message }
    }
  }
`;