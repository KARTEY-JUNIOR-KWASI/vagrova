import { PrismaClient, VehicleType, UserRole, UserStatus, ServiceCategoryGroup, PricingModel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Vagrova PostgreSQL database...');

  // 1. Seed initial Super Admin account
  await prisma.user.upsert({
    where: { phone: '+233302000000' },
    update: {},
    create: {
      phone: '+233302000000',
      name: 'Vagrova Operations Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      language: 'en',
    },
  });

  // 2. Seed default Ghana PriceRules (stored in Pesewas)
  const rules: Array<{
    vehicleType: VehicleType;
    baseRateMinor: bigint;
    perKmMinor: bigint;
    perTonneMinor: bigint;
    minimumCharge: bigint;
  }> = [
    { vehicleType: VehicleType.TIPPER, baseRateMinor: 120000n, perKmMinor: 3000n, perTonneMinor: 3500n, minimumCharge: 120000n },
    { vehicleType: VehicleType.FLATBED, baseRateMinor: 180000n, perKmMinor: 3500n, perTonneMinor: 4000n, minimumCharge: 180000n },
    { vehicleType: VehicleType.LOWBED, baseRateMinor: 280000n, perKmMinor: 5000n, perTonneMinor: 5500n, minimumCharge: 280000n },
    { vehicleType: VehicleType.CONTAINER_CARRIER, baseRateMinor: 150000n, perKmMinor: 3200n, perTonneMinor: 3000n, minimumCharge: 150000n },
    { vehicleType: VehicleType.TANKER, baseRateMinor: 200000n, perKmMinor: 3800n, perTonneMinor: 4000n, minimumCharge: 200000n },
    { vehicleType: VehicleType.CRANE_TRUCK, baseRateMinor: 250000n, perKmMinor: 4500n, perTonneMinor: 5000n, minimumCharge: 250000n },
    { vehicleType: VehicleType.TOW_RECOVERY, baseRateMinor: 90000n, perKmMinor: 2500n, perTonneMinor: 2000n, minimumCharge: 90000n },
    { vehicleType: VehicleType.REFRIGERATED, baseRateMinor: 160000n, perKmMinor: 3600n, perTonneMinor: 3500n, minimumCharge: 160000n },
  ];

  const existingCount = await prisma.priceRule.count();
  if (existingCount === 0) {
    for (const rule of rules) {
      await prisma.priceRule.create({
        data: {
          ...rule,
          commissionPct: 15.0,
          version: 1,
        },
      });
    }
    console.log('Inserted 8 default Ghana PriceRule records.');
  }

  // 3. Seed Equipment Categories (Category A: Transport, Category B: Construction & Mining Machinery)
  const catTransport = await prisma.equipmentCategory.upsert({
    where: { code: 'HEAVY_TRANSPORT' },
    update: {},
    create: {
      code: 'HEAVY_TRANSPORT',
      name: 'Heavy-Duty Trucks & Transportation',
      group: ServiceCategoryGroup.TRANSPORT,
      description: 'Commercial haulage, lifting, recovery, and cargo transport fleet',
      sortOrder: 1,
    },
  });

  const catMachinery = await prisma.equipmentCategory.upsert({
    where: { code: 'CONSTRUCTION_MACHINERY' },
    update: {},
    create: {
      code: 'CONSTRUCTION_MACHINERY',
      name: 'Construction & Mining Machinery',
      group: ServiceCategoryGroup.MACHINERY,
      description: 'Heavy earthmoving, grading, compaction, and site machinery rentals',
      sortOrder: 2,
    },
  });

  const equipmentSeed: Array<{
    categoryId: string;
    code: string;
    name: string;
    pricingModel: PricingModel;
    legacyVehicleType?: VehicleType;
    baseRateMinor: bigint;
    unitRateMinor: bigint;
    mobilisationMinor: bigint;
    isProvisional?: boolean;
  }> = [
    // Category A (8)
    { categoryId: catTransport.id, code: 'CRANE', name: 'Crane', pricingModel: PricingModel.HOURLY, legacyVehicleType: VehicleType.CRANE_TRUCK, baseRateMinor: 250000n, unitRateMinor: 65000n, mobilisationMinor: 80000n },
    { categoryId: catTransport.id, code: 'FLATBED_TRUCK', name: 'Flatbed Truck', pricingModel: PricingModel.PER_KM, legacyVehicleType: VehicleType.FLATBED, baseRateMinor: 180000n, unitRateMinor: 3500n, mobilisationMinor: 0n },
    { categoryId: catTransport.id, code: 'TOWING_TRUCK', name: 'Towing Truck', pricingModel: PricingModel.PER_KM, legacyVehicleType: VehicleType.TOW_RECOVERY, baseRateMinor: 90000n, unitRateMinor: 2500n, mobilisationMinor: 0n },
    { categoryId: catTransport.id, code: 'CARGO_STATION', name: 'Cargo Station', pricingModel: PricingModel.PROJECT_CONTRACT, legacyVehicleType: VehicleType.CONTAINER_CARRIER, baseRateMinor: 150000n, unitRateMinor: 0n, mobilisationMinor: 0n, isProvisional: false },
    { categoryId: catTransport.id, code: 'FORKLIFT', name: 'Forklift', pricingModel: PricingModel.HOURLY, legacyVehicleType: VehicleType.CRANE_TRUCK, baseRateMinor: 120000n, unitRateMinor: 35000n, mobilisationMinor: 50000n },
    { categoryId: catTransport.id, code: 'TIPPER_TRUCK', name: 'Tipper Truck', pricingModel: PricingModel.PER_KM, legacyVehicleType: VehicleType.TIPPER, baseRateMinor: 120000n, unitRateMinor: 3000n, mobilisationMinor: 0n },
    { categoryId: catTransport.id, code: 'TRAILER', name: 'Trailer', pricingModel: PricingModel.PER_KM, legacyVehicleType: VehicleType.CONTAINER_CARRIER, baseRateMinor: 160000n, unitRateMinor: 3400n, mobilisationMinor: 0n },
    { categoryId: catTransport.id, code: 'LOWBED_TRUCK', name: 'Lowbed Truck', pricingModel: PricingModel.PER_KM, legacyVehicleType: VehicleType.LOWBED, baseRateMinor: 280000n, unitRateMinor: 5000n, mobilisationMinor: 0n },
    // Category B (7)
    { categoryId: catMachinery.id, code: 'EXCAVATOR', name: 'Excavator', pricingModel: PricingModel.DAILY, baseRateMinor: 450000n, unitRateMinor: 450000n, mobilisationMinor: 180000n },
    { categoryId: catMachinery.id, code: 'BACKHOE', name: 'Backhoe', pricingModel: PricingModel.DAILY, baseRateMinor: 320000n, unitRateMinor: 320000n, mobilisationMinor: 120000n },
    { categoryId: catMachinery.id, code: 'PAYLOADER', name: 'Payloader / Wheel Loader', pricingModel: PricingModel.DAILY, baseRateMinor: 380000n, unitRateMinor: 380000n, mobilisationMinor: 150000n },
    { categoryId: catMachinery.id, code: 'DOZER', name: 'Dozer / Bulldozer', pricingModel: PricingModel.DAILY, baseRateMinor: 520000n, unitRateMinor: 520000n, mobilisationMinor: 200000n },
    { categoryId: catMachinery.id, code: 'GRADER', name: 'Grader', pricingModel: PricingModel.DAILY, baseRateMinor: 480000n, unitRateMinor: 480000n, mobilisationMinor: 180000n },
    { categoryId: catMachinery.id, code: 'ROLLER_COMPACTOR', name: 'Roller / Compactor', pricingModel: PricingModel.DAILY, baseRateMinor: 280000n, unitRateMinor: 280000n, mobilisationMinor: 110000n },
    { categoryId: catMachinery.id, code: 'WATER_TANKER', name: 'Water Tanker', pricingModel: PricingModel.DAILY, legacyVehicleType: VehicleType.TANKER, baseRateMinor: 220000n, unitRateMinor: 220000n, mobilisationMinor: 60000n },
  ];

  for (const eq of equipmentSeed) {
    await prisma.equipmentType.upsert({
      where: { code: eq.code },
      update: {
        isProvisional: eq.isProvisional ?? false,
      },
      create: {
        categoryId: eq.categoryId,
        code: eq.code,
        name: eq.name,
        pricingModel: eq.pricingModel,
        legacyVehicleType: eq.legacyVehicleType ?? null,
        baseRateMinor: eq.baseRateMinor,
        unitRateMinor: eq.unitRateMinor,
        mobilisationMinor: eq.mobilisationMinor,
        isProvisional: eq.isProvisional ?? false,
      },
    });
  }
  console.log('Seeded 2 Equipment Categories and 15 Equipment Types (Category A & Category B).');

  console.log('Vagrova seed completed.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
