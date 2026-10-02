import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { productId, action, rejectionReason } = await request.json();

    let nextStatus = 'DRAFT';
    if (action === 'APPROVE') nextStatus = 'APPROVED';
    if (action === 'REJECT') nextStatus = 'REJECTED';

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        status: nextStatus,
        rejectionReason: action === 'REJECT' ? rejectionReason : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}