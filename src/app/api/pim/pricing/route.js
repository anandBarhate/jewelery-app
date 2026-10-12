import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let pricingRules = await prisma.pricingRules.findFirst();
    if (!pricingRules) {
      pricingRules = await prisma.pricingRules.create({
        data: { id: 1, retailMarkupPercentage: 40.0, logisticsFee: 50.0, packagingFee: 15.0 },
      });
    }

    const metals = await prisma.metal.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ pricingRules, metals });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { pricingRules, metals } = await request.json();

    const updatedRules = await prisma.pricingRules.upsert({
      where: { id: 1 },
      update: {
        retailMarkupPercentage: parseFloat(pricingRules.retailMarkupPercentage),
        logisticsFee: parseFloat(pricingRules.logisticsFee),
        packagingFee: parseFloat(pricingRules.packagingFee),
      },
      create: {
        id: 1,
        retailMarkupPercentage: parseFloat(pricingRules.retailMarkupPercentage),
        logisticsFee: parseFloat(pricingRules.logisticsFee),
        packagingFee: parseFloat(pricingRules.packagingFee),
      },
    });

    if (Array.isArray(metals)) {
      for (const m of metals) {
        await prisma.metal.upsert({
          where: { name: m.name },
          update: { pricePerGram: parseFloat(m.pricePerGram) },
          create: { name: m.name, pricePerGram: parseFloat(m.pricePerGram) },
        });
      }
    }

    const updatedMetals = await prisma.metal.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ pricingRules: updatedRules, metals: updatedMetals });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}