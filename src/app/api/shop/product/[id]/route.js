// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// export async function GET(request, { params }) {
//   try {
//     const { id } = params;

//     const product = await prisma.product.findUnique({
//       where: { id }
//     });

//     const metals = await prisma.metal.findMany();
//     const diamonds = await prisma.diamond.findMany();
//     const pricingRules = await prisma.pricingRules.findFirst() || {
//       retailMarkupPercentage: 40.0,
//       logisticsFee: 50.0,
//       packagingFee: 15.0
//     };

//     return NextResponse.json({
//       product,
//       metals,
//       diamonds,
//       pricingRules
//     });
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request, props) {
  try {
    // Unwrap params Promise in Next.js 15+
    const params = await props.params;
    const id = params.id;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    const metals = await prisma.metal.findMany();
    const diamonds = await prisma.diamond.findMany();
    const pricingRules = (await prisma.pricingRules.findFirst()) || {
      retailMarkupPercentage: 40.0,
      logisticsFee: 50.0,
      packagingFee: 15.0
    };

    return NextResponse.json({
      product,
      metals,
      diamonds,
      pricingRules
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}