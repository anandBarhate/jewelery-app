import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



export async function GET() {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        category: body.category,
        type: body.type,
        baseMetalWeightGrams: parseFloat(body.baseMetalWeightGrams),
        manufacturingLabor: parseFloat(body.manufacturingLabor),
        allowedChainLengths: JSON.stringify(body.allowedChainLengths || []),
        allowedDiamondShapes: JSON.stringify(body.allowedDiamondShapes || []),
        allowedDiamondOrigins: JSON.stringify(body.allowedDiamondOrigins || []),
        allowedCaratWeights: JSON.stringify(body.allowedCaratWeights || []),
        allowedClarities: JSON.stringify(body.allowedClarities || []),
        allowedColours: JSON.stringify(body.allowedColours || []),
        allowedCutGrades: JSON.stringify(body.allowedCutGrades || []),
        allowedCertificates: JSON.stringify(body.allowedCertificates || []),
        status: 'DRAFT'
      }
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// PUT: Update / Reconfigure existing product
export async function PUT(request, props) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await request.json();

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        type: body.type,
        baseMetalWeightGrams: parseFloat(body.baseMetalWeightGrams),
        manufacturingLabor: parseFloat(body.manufacturingLabor),
        // Re-entering DRAFT forces re-approval after edits
        status: 'DRAFT',
        rejectionReason: null,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove product blueprint
export async function DELETE(request, props) {
  try {
    const params = await props.params;
    const { id } = params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}