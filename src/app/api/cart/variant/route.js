import { NextResponse } from 'next/server';

const SALEOR_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL || 'http://localhost:8000/graphql/';

let cachedProductId = null;

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

// Builds clean SKU and pure specification variant name (no duplicated product titles)
function buildSkuAndVariantName(config, timestamp = Date.now().toString().slice(-6)) {
  const metalCode = (config.metal || 'GLD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const shapeCode = (config.shape || 'RD').slice(0, 2).toUpperCase();
  const caratCode = (config.carat || '1.0').toString().replace('.', '');
  const lengthCode = config.chainLength ? `-${config.chainLength.replace(/[^0-9]/g, '')}IN` : '';
  const sku = `JWL-${metalCode}-${caratCode}CT-${shapeCode}${lengthCode}-${timestamp}`;

  const specTokens = [
    config.metal,
    config.carat ? `${config.carat}ct ${config.shape || ''}`.trim() : config.shape,
    config.chainLength ? `${config.chainLength} Chain` : null, // e.g. "18\" Chain"
    config.clarity,
    config.colour,
    config.ringSize ? `Size ${config.ringSize}` : null,
  ].filter(Boolean);

  const variantName = specTokens.length > 0 ? specTokens.join(' • ') : 'Standard Specification';

  return { sku, variantName };
}

// Ensure clean ProductType exists
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
        isShippingRequired: true,
        productAttributes: [],
        variantAttributes: [],
      },
    }
  );

  return createData.productTypeCreate.productType.id;
}

// Master product: Clean title with engine details stored in description
async function getOrCreateMasterProduct(channelId) {
  if (cachedProductId) return cachedProductId;

  const productTypeId = await getOrCreateCleanProductType();

  const listData = await saleorAdminFetch(`
    query {
      products(first: 50) {
        edges {
          node {
            id
            name
            slug
            channelListings {
              channel { id }
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

  // Rich description for the admin dashboard
  const descriptionPayload = JSON.stringify({
    time: Date.now(),
    blocks: [
      {
        type: "paragraph",
        data: {
          text: "Bespoke Fine Jewelry Master — Handcrafted to custom specifications.",
        },
      },
    ],
  });

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
          name: "Custom Diamond Ring", // Clean product name displayed on orders
          slug: "bespoke-jewelry-master",
          description: descriptionPayload,
          productType: productTypeId,
          category: categoryId,
        },
      }
    );
    productId = createData.productCreate.product.id;
  } else if (existing?.name !== "Custom Diamond Ring") {
    // Update existing master product title if it still has the old name
    await saleorAdminFetch(
      `
        mutation UpdateMasterDetails($id: ID!, $input: ProductInput!) {
          productUpdate(id: $id, input: $input) {
            product { id name }
          }
        }
      `,
      {
        id: productId,
        input: {
          name: "Custom Diamond Ring",
          description: descriptionPayload,
        },
      }
    );
  }

  // Ensure channel publication
  const isPublished = existing?.channelListings?.some((cl) => cl.channel.id === channelId && cl.isPublished);
  if (!isPublished) {
    await saleorAdminFetch(
      `
        mutation PublishProduct($id: ID!, $input: ProductChannelListingUpdateInput!) {
          productChannelListingUpdate(id: $id, input: $input) {
            product { id }
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
  }

  cachedProductId = productId;
  return productId;
}

// 1. CREATE VARIANT (POST)
export async function POST(req) {
  try {
    const { configuration } = await req.json();

    const channelData = await saleorAdminFetch(`
      query {
        channels { id slug }
        warehouses(first: 1) { edges { node { id } } }
      }
    `);
    const channel = channelData?.channels?.find((c) => c.slug === 'default-channel') || channelData?.channels?.[0];
    const warehouseId = channelData?.warehouses?.edges?.[0]?.node?.id;

    const productId = await getOrCreateMasterProduct(channel.id);
    const { sku, variantName } = buildSkuAndVariantName(configuration);

    // Create Variant (using clean variantName)
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
          name: variantName, // e.g. "18k Yellow Gold • 0.5ct Emerald • VVS1"
          trackInventory: false,
          attributes: [],
        },
      }
    );

    const variant = variantData?.productVariantCreate?.productVariant;
    if (!variant?.id) throw new Error("Variant creation failed.");

    // Assign dynamic price
    const priceAmount = Math.max(1, parseFloat(configuration.configuredPrice || 100));
    await saleorAdminFetch(
      `
        mutation SetVariantPrice($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
          productVariantChannelListingUpdate(id: $id, input: $input) {
            variant { id }
          }
        }
      `,
      {
        id: variant.id,
        input: [{ channelId: channel.id, price: priceAmount }],
      }
    );

    // Ensure warehouse stock availability
    if (warehouseId) {
      await saleorAdminFetch(
        `
          mutation AddStock($variantId: ID!, $stocks: [StockInput!]!) {
            productVariantStocksCreate(variantId: $variantId, stocks: $stocks) {
              productVariant { id }
            }
          }
        `,
        {
          variantId: variant.id,
          stocks: [{ warehouse: warehouseId, quantity: 100 }],
        }
      );
    }

    // Attach complete metadata breakdown for the bench jeweler
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
          { key: 'ringSize', value: String(configuration.ringSize || '6.5') },
          { key: 'engraving', value: String(configuration.engraving || '') },
          { key: 'configuredPrice', value: String(priceAmount) },
          { key: 'chainLength', value: String(configuration.chainLength || '') },
        ],
      }
    );

    console.log(`[Saleor] Line item formatted: Custom Diamond Ring / ${variantName}`);

    return NextResponse.json({
      success: true,
      variantId: variant.id,
      sku: variant.sku,
      name: variantName,
    });
  } catch (error) {
    console.error("Variant API Failure:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. MUTATE VARIANT IN-PLACE (PATCH)
export async function PATCH(req) {
  try {
    const { variantId, configuration } = await req.json();
    if (!variantId) throw new Error('Missing variantId');

    const { sku, variantName } = buildSkuAndVariantName(configuration);

    await saleorAdminFetch(
      `
        mutation UpdateVariant($id: ID!, $input: ProductVariantInput!) {
          productVariantUpdate(id: $id, input: $input) {
            productVariant { id sku name }
          }
        }
      `,
      { id: variantId, input: { sku, name: variantName, trackInventory: false } }
    );

    const channelData = await saleorAdminFetch(`query { channels { id slug } }`);
    const channel = channelData?.channels?.find((c) => c.slug === 'default-channel') || channelData?.channels?.[0];

    const priceAmount = Math.max(1, parseFloat(configuration.configuredPrice || 100));
    await saleorAdminFetch(
      `
        mutation UpdatePrice($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
          productVariantChannelListingUpdate(id: $id, input: $input) {
            variant { id }
          }
        }
      `,
      {
        id: variantId,
        input: [{ channelId: channel.id, price: priceAmount }],
      }
    );

    return NextResponse.json({ success: true, variantId, sku, name: variantName });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}