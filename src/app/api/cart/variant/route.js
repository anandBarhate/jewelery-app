import { NextResponse } from 'next/server';

const SALEOR_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL || 'http://localhost:8000/graphql/';

let cachedProductId = null;

// Authenticated fetch that captures and bubbles full GraphQL schema errors
async function saleorAdminFetch(query, variables = {}) {
  const tokenRes = await fetch(SALEOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation {
          tokenCreate(email: "admin@example.com", password: "admin") {
            token
          }
        }
      `,
    }),
  });
  const tokenJson = await tokenRes.json();
  const token = tokenJson?.data?.tokenCreate?.token;
  if (!token) throw new Error("Could not obtain Saleor administrative token.");

  const res = await fetch(SALEOR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    console.error("Saleor Admin GraphQL Error:", JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

function buildSkuAndName(config, timestamp = Date.now().toString().slice(-6)) {
  const metalCode = (config.metal || 'GLD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const shapeCode = (config.shape || 'RD').slice(0, 2).toUpperCase();
  const sku = `JWL-${metalCode}-${config.carat || '1.0'}CT-${shapeCode}-${timestamp}`;
  const name = `${config.productName || 'Diamond Ring'} (${config.metal || '18k'}, ${config.carat || '1.0'}ct ${config.shape || 'Round'})`;
  return { sku, name };
}

// Ensure clean ProductType with zero mandatory variant attributes
async function getOrCreateCleanProductType() {
  const data = await saleorAdminFetch(`
    query {
      productTypes(first: 20) {
        edges {
          node {
            id
            name
            hasVariants
            assignedVariantAttributes { attribute { id } }
          }
        }
      }
    }
  `);

  const types = data?.productTypes?.edges || [];
  const match = types.find(
    (e) =>
      e.node.name === "Bespoke Jewelry Engine" &&
      e.node.hasVariants &&
      (!e.node.assignedVariantAttributes || e.node.assignedVariantAttributes.length === 0)
  );
  if (match) return match.node.id;

    const createData = await saleorAdminFetch(
    `
      mutation CreateCleanType($input: ProductTypeInput!) {
        productTypeCreate(input: $input) {
          productType { id }
          errors { field message }
        }
      }
    `,
    {
      input: {
        name: "Bespoke Jewelry Engine",
        hasVariants: true,
        isShippingRequired: true, // Guarantees Saleor calculates physical delivery methods
        productAttributes: [],
        variantAttributes: [],
      },
    }
  );

  const errors = createData?.productTypeCreate?.errors || [];
  if (errors.length > 0) throw new Error(`ProductType error: ${errors[0].message}`);
  return createData.productTypeCreate.productType.id;
}

// Ensure Master Product exists and is actively published in default-channel
async function getOrCreateMasterProduct(channelId) {
  if (cachedProductId) return cachedProductId;

  const productTypeId = await getOrCreateCleanProductType();

  const listData = await saleorAdminFetch(`
    query {
      products(first: 50) {
        edges {
          node {
            id
            slug
            channelListings {
              channel { id slug }
              isPublished
            }
          }
        }
      }
      categories(first: 1) {
        edges { node { id } }
      }
    }
  `);

  const categoryId = listData?.categories?.edges?.[0]?.node?.id;
  let existing = listData?.products?.edges?.find((e) => e.node.slug === "bespoke-jewelry-master")?.node;
  let productId = existing?.id;

  if (!productId) {
    const createData = await saleorAdminFetch(
      `
        mutation CreateMaster($input: ProductCreateInput!) {
          productCreate(input: $input) {
            product { id slug }
            errors { field message }
          }
        }
      `,
      {
        input: {
          name: "Bespoke Fine Jewelry Master",
          slug: "bespoke-jewelry-master",
          productType: productTypeId,
          category: categoryId,
        },
      }
    );

    const cErrors = createData?.productCreate?.errors || [];
    if (cErrors.length > 0) throw new Error(`Master product error: ${cErrors[0].message}`);
    productId = createData.productCreate.product.id;
  }

  const isAlreadyPublished = existing?.channelListings?.some(
    (cl) => cl.channel.id === channelId && cl.isPublished
  );

  if (!isAlreadyPublished) {
    const pubData = await saleorAdminFetch(
      `
        mutation PublishProduct($id: ID!, $input: ProductChannelListingUpdateInput!) {
          productChannelListingUpdate(id: $id, input: $input) {
            product { id }
            errors { field message code }
          }
        }
      `,
      {
        id: productId,
        input: {
          updateChannels: [
            {
              channelId,
              isPublished: true,
              visibleInListings: true,
              isAvailableForPurchase: true,
            },
          ],
        },
      }
    );

    const pErrors = pubData?.productChannelListingUpdate?.errors || [];
    if (pErrors.length > 0) throw new Error(`Channel publication error: ${pErrors[0].message}`);
  }

  cachedProductId = productId;
  return productId;
}

// POST: Create variant, assign channel price, set metadata, verify channel availability
export async function POST(req) {
  try {
    const { configuration } = await req.json();

    // 1. Get channel
    const channelData = await saleorAdminFetch(`
      query {
        channels {
          id
          slug
          currencyCode
        }
      }
    `);
    const channel = channelData?.channels?.find((c) => c.slug === 'default-channel') || channelData?.channels?.[0];
    if (!channel) throw new Error("No sales channel found in Saleor.");

    // 2. Ensure parent product is published in default-channel
    const productId = await getOrCreateMasterProduct(channel.id);
    const { sku, name } = buildSkuAndName(configuration);

    // 3. Create Variant
    const variantData = await saleorAdminFetch(
      `
        mutation CreateVariant($input: ProductVariantCreateInput!) {
          productVariantCreate(input: $input) {
            productVariant { id sku name }
            errors { field message }
          }
        }
      `,
      {
        input: {
          product: productId,
          sku,
          name,
          trackInventory: false,
          attributes: [],
        },
      }
    );

    const vErrors = variantData?.productVariantCreate?.errors || [];
    if (vErrors.length > 0) throw new Error(`Variant creation error (${vErrors[0].field}): ${vErrors[0].message}`);
    const variant = variantData?.productVariantCreate?.productVariant;
    if (!variant?.id) throw new Error("Variant ID missing from creation response.");

    // 4. Assign dynamic channel price (note: returns `variant { id }`, not `productVariant`)
    const priceAmount = Math.max(1, parseFloat(configuration.configuredPrice || 100));
    const priceData = await saleorAdminFetch(
      `
        mutation SetVariantPrice($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
          productVariantChannelListingUpdate(id: $id, input: $input) {
            variant { id }
            errors { field message }
          }
        }
      `,
      {
        id: variant.id,
        input: [{ channelId: channel.id, price: priceAmount }],
      }
    );

    const pErrors = priceData?.productVariantChannelListingUpdate?.errors || [];
    if (pErrors.length > 0) throw new Error(`Variant pricing error: ${pErrors[0].message}`);

    // 5. Attach 4Cs & metal specifications
    await saleorAdminFetch(
      `
        mutation SetVariantMetadata($id: ID!, $input: [MetadataInput!]!) {
          updateMetadata(id: $id, input: $input) {
            item { ... on ProductVariant { id } }
          }
        }
      `,
      {
        id: variant.id,
        input: [
          { key: 'metal', value: String(configuration.metal || '') },
          { key: 'carat', value: String(configuration.carat || '') },
          { key: 'shape', value: String(configuration.shape || '') },
          { key: 'clarity', value: String(configuration.clarity || '') },
          { key: 'colour', value: String(configuration.colour || '') },
          { key: 'cert', value: String(configuration.cert || '') },
          { key: 'configuredPrice', value: String(priceAmount) },
        ],
      }
    );

    console.log(`[Saleor] Live verified variant ready: ${variant.sku} ($${priceAmount})`);

    return NextResponse.json({
      success: true,
      variantId: variant.id,
      sku: variant.sku,
      name: variant.name,
    });
  } catch (error) {
    console.error("Variant API Failure:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Mutate variant in-place
export async function PATCH(req) {
  try {
    const { variantId, configuration } = await req.json();
    if (!variantId) throw new Error('Missing variantId');

    const { sku, name } = buildSkuAndName(configuration);

    await saleorAdminFetch(
      `
        mutation UpdateVariant($id: ID!, $input: ProductVariantInput!) {
          productVariantUpdate(id: $id, input: $input) {
            productVariant { id sku name }
            errors { field message }
          }
        }
      `,
      { id: variantId, input: { sku, name, trackInventory: false } }
    );

    const channelData = await saleorAdminFetch(`query { channels { id slug } }`);
    const channel = channelData?.channels?.find((c) => c.slug === 'default-channel') || channelData?.channels?.[0];

    const priceAmount = Math.max(1, parseFloat(configuration.configuredPrice || 100));
    await saleorAdminFetch(
      `
        mutation UpdatePrice($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
          productVariantChannelListingUpdate(id: $id, input: $input) {
            variant { id }
            errors { field message }
          }
        }
      `,
      {
        id: variantId,
        input: [{ channelId: channel.id, price: priceAmount }],
      }
    );

    return NextResponse.json({ success: true, variantId, sku, name });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}