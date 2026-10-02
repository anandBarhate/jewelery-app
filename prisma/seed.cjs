const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Insert Global Pricing Rules
  await prisma.pricingRules.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      retailMarkupPercentage: 40.0,
      logisticsFee: 50.0,
      packagingFee: 15.0,
    },
  });

  // 2. Insert Base Metal Rates
  await prisma.metal.deleteMany({});
  await prisma.metal.createMany({
    data: [
      { name: '18k Yellow Gold', pricePerGram: 65.0 },
      { name: '18k White Gold', pricePerGram: 68.0 },
      { name: 'Platinum', pricePerGram: 42.0 },
    ],
  });

  // 3. Insert Sample Approved Solitaire Ring with Full 4C Attributes
  await prisma.product.deleteMany({});
  await prisma.product.create({
    data: {
      name: 'Classic Solitaire Engagement Ring',
      category: 'Ring',
      type: 'Solitaire',
      baseMetalWeightGrams: 4.5,
      manufacturingLabor: 150.0,
      allowedDiamondShapes: JSON.stringify(['Round', 'Oval', 'Princess', 'Cushion', 'Emerald']),
      allowedDiamondOrigins: JSON.stringify(['Natural Diamond', 'Lab-Created Diamond']),
      allowedCaratWeights: JSON.stringify(['0.5', '0.7', '1.0', '1.2', '1.5', '2.0', '2.5', '3.0']),
      allowedClarities: JSON.stringify(['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2']),
      allowedColours: JSON.stringify(['D', 'E', 'F', 'G', 'H']),
      allowedCutGrades: JSON.stringify(['Excellent', 'Very Good']),
      allowedCertificates: JSON.stringify(['GIA', 'IGI/HRD']),
      allowedChainLengths: JSON.stringify([]),
      status: 'APPROVED',
    },
  });

  console.log('Database seeded successfully with full diamond attributes!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });