import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        imageUrl: body.imageUrl || '',
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
        status: 'DRAFT',
        rejectionReason: null,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, props) {
  try {
    const params = await props.params;
    const { id } = params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}