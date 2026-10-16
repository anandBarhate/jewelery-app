import { NextResponse } from 'next/server';

const SALEOR_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL || 'http://localhost:8000/graphql/';

async function getAdminToken() {
  const query = `
    mutation {
      tokenCreate(email: "admin@example.com", password: "admin") {
        token
      }
    }
  `;
  const res = await fetch(SALEOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  return data?.data?.tokenCreate?.token;
}

export async function POST(req) {
  try {
    const { configuration } = await req.json();
    const adminToken = await getAdminToken();

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    };

    // 1. Fetch the default Channel ID and a Base Product to attach the variant to
    const setupQuery = `
      query GetSetup {
        channels {
          id
          slug
        }
        products(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
    `;

    const setupRes = await fetch(SALEOR_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: setupQuery }),
    });
    const setupData = await setupRes.json();

    const channel = setupData?.data?.channels?.find((c) => c.slug === 'default-channel') || setupData?.data?.channels?.[0];
    const productId = setupData?.data?.products?.edges?.[0]?.node?.id;

    if (!channel || !productId) {
      throw new Error('Could not find channel or product to attach variant.');
    }

    // 2. Generate on-the-fly SKU & descriptive name
    const timestamp = Date.now().toString().slice(-6);
    const metalCode = (configuration.metal || 'GLD').replace(/\s+/g, '').slice(0, 4).toUpperCase();
    const shapeCode = (configuration.shape || 'RD').slice(0, 2).toUpperCase();
    const sku = `JWL-${metalCode}-${configuration.carat || '1.0'}CT-${shapeCode}-${timestamp}`;
    const variantName = `${configuration.productName || 'Bespoke Ring'} (${configuration.metal}, ${configuration.carat}ct ${configuration.shape}, ${configuration.clarity || 'VS1'})`;

    // 3. Create the Variant in Saleor
    const createVariantMutation = `
      mutation CreateCustomVariant($input: ProductVariantCreateInput!) {
        productVariantCreate(input: $input) {
          productVariant {
            id
            sku
            name
          }
          errors {
            field
            message
          }
        }
      }
    `;

    const variantRes = await fetch(SALEOR_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: createVariantMutation,
        variables: {
          input: {
            product: productId,
            sku: sku,
            name: variantName,
            trackInventory: false, // Prevents out-of-stock validation on custom items
            metadata: [
              { key: 'metal', value: String(configuration.metal || '') },
              { key: 'carat', value: String(configuration.carat || '') },
              { key: 'shape', value: String(configuration.shape || '') },
              { key: 'clarity', value: String(configuration.clarity || '') },
              { key: 'colour', value: String(configuration.colour || '') },
              { key: 'cert', value: String(configuration.cert || '') },
              { key: 'configuredPrice', value: String(configuration.configuredPrice || '') },
            ],
          },
        },
      }),
    });

    const variantJson = await variantRes.json();
    const variant = variantJson?.data?.productVariantCreate?.productVariant;

    if (!variant?.id) {
      throw new Error(variantJson?.data?.productVariantCreate?.errors?.[0]?.message || 'Variant creation failed');
    }

    // 4. Set the exact calculated price on default-channel
    const setPriceMutation = `
      mutation SetVariantPrice($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
        productVariantChannelListingUpdate(id: $id, input: $input) {
          productVariant {
            id
          }
          errors {
            field
            message
          }
        }
      }
    `;

    await fetch(SALEOR_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: setPriceMutation,
        variables: {
          id: variant.id,
          input: [
            {
              channelId: channel.id,
              price: parseFloat(configuration.configuredPrice || 0),
            },
          ],
        },
      }),
    });

    return NextResponse.json({
      success: true,
      variantId: variant.id,
      sku: variant.sku,
      name: variant.name,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}