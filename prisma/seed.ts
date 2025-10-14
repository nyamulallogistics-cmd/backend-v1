import { PrismaClient, Role, ShipmentStatus, QuoteStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.bid.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const cargoOwner = await prisma.user.create({
    data: {
      fullName: 'John Mukuka',
      email: 'john@example.com',
      password: hashedPassword,
      companyName: 'Mukuka Trading Ltd',
      phoneNumber: '+260971234567',
      role: Role.CARGO_OWNER,
    },
  });

  const transporter1 = await prisma.user.create({
    data: {
      fullName: 'Alice Banda',
      email: 'alice@transport.com',
      password: hashedPassword,
      companyName: 'ABC Transport Ltd',
      phoneNumber: '+260977654321',
      role: Role.TRANSPORTER,
    },
  });

  const transporter2 = await prisma.user.create({
    data: {
      fullName: 'David Mwale',
      email: 'david@logistics.com',
      password: hashedPassword,
      companyName: 'XYZ Logistics',
      phoneNumber: '+260966123456',
      role: Role.TRANSPORTER,
    },
  });

  const transporter3 = await prisma.user.create({
    data: {
      fullName: 'Grace Phiri',
      email: 'grace@fasttrack.com',
      password: hashedPassword,
      companyName: 'FastTrack Movers',
      phoneNumber: '+260955987654',
      role: Role.TRANSPORTER,
    },
  });

  console.log('✅ Users created');

  // Create shipments
  const shipment1 = await prisma.shipment.create({
    data: {
      cargo: 'Mining Equipment',
      cargoDescription: 'Heavy mining equipment including drills and excavators',
      fromLocation: 'Lusaka',
      fromAddress: '123 Industrial Area, Lusaka',
      toLocation: 'Ndola',
      toAddress: '456 Mining Road, Ndola',
      status: ShipmentStatus.IN_TRANSIT,
      amount: 3500,
      weight: 5000,
      distance: 320,
      dimensions: '6 x 2.4 x 2.6',
      eta: new Date('2024-01-16T10:00:00Z'),
      progress: 65,
      pickupDate: new Date('2024-01-15T08:00:00Z'),
      driverName: 'John Mwansa',
      driverPhone: '+260 975 123 456',
      truckNumber: 'ZM-LU-1234',
      lastUpdate: 'Kasama - 2 hours ago',
      lastUpdateTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      cargoOwnerId: cargoOwner.id,
      transporterId: transporter1.id,
    },
  });

  const shipment2 = await prisma.shipment.create({
    data: {
      cargo: 'Agricultural Supplies',
      cargoDescription: 'Fertilizers and farming equipment',
      fromLocation: 'Kitwe',
      fromAddress: '789 Farm Supply Street, Kitwe',
      toLocation: 'Livingstone',
      toAddress: '321 Agricultural Zone, Livingstone',
      status: ShipmentStatus.AWAITING_PICKUP,
      amount: 2800,
      weight: 3500,
      distance: 850,
      dimensions: '5 x 2 x 2',
      eta: new Date('2024-01-17T10:00:00Z'),
      driverName: 'Peter Banda',
      driverPhone: '+260 975 234 567',
      truckNumber: 'ZM-KW-5678',
      lastUpdate: 'Scheduled for pickup',
      cargoOwnerId: cargoOwner.id,
      transporterId: transporter2.id,
    },
  });

  const shipment3 = await prisma.shipment.create({
    data: {
      cargo: 'Construction Materials',
      cargoDescription: 'Cement bags and steel rods',
      fromLocation: 'Lusaka',
      fromAddress: '555 Builder Street, Lusaka',
      toLocation: 'Chipata',
      toAddress: '888 Construction Site, Chipata',
      status: ShipmentStatus.IN_TRANSIT,
      amount: 4200,
      weight: 7500,
      distance: 580,
      dimensions: '7 x 2.5 x 2.5',
      eta: new Date('2024-01-15T10:00:00Z'),
      progress: 85,
      pickupDate: new Date('2024-01-14T07:00:00Z'),
      driverName: 'Moses Phiri',
      driverPhone: '+260 975 345 678',
      truckNumber: 'ZM-LU-9012',
      lastUpdate: 'Petauke - 30 minutes ago',
      lastUpdateTime: new Date(Date.now() - 30 * 60 * 1000),
      cargoOwnerId: cargoOwner.id,
      transporterId: transporter3.id,
    },
  });

  console.log('✅ Shipments created');

  // Create quotes
  const quote1 = await prisma.quote.create({
    data: {
      cargo: 'Copper Concentrate',
      cargoType: 'mining',
      cargoDescription: 'High-grade copper concentrate for export',
      fromLocation: 'Chingola',
      fromAddress: 'Nchanga Copper Mine, Chingola',
      toLocation: 'Dar es Salaam',
      toAddress: 'Port of Dar es Salaam, Tanzania',
      weight: 25000,
      distance: 1850,
      dimensions: '12 x 2.5 x 2.5',
      estimatedValue: 150000,
      insuranceRequired: true,
      specialInstructions: 'Requires temperature-controlled transport and proper documentation for cross-border',
      pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: QuoteStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      cargoOwnerId: cargoOwner.id,
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      cargo: 'Maize',
      cargoType: 'agricultural',
      cargoDescription: 'Bulk maize grain for export',
      fromLocation: 'Lusaka',
      fromAddress: 'Central Grain Storage, Lusaka',
      toLocation: 'Harare',
      toAddress: 'National Grain Board, Harare, Zimbabwe',
      weight: 15000,
      distance: 850,
      dimensions: '10 x 2.4 x 2.4',
      estimatedValue: 45000,
      insuranceRequired: false,
      specialInstructions: 'Grain-specific transport required, moisture protection essential',
      pickupDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      status: QuoteStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      cargoOwnerId: cargoOwner.id,
    },
  });

  console.log('✅ Quotes created');

  // Create bids
  await prisma.bid.create({
    data: {
      amount: 8500,
      estimatedDays: 3,
      notes: 'Specialized equipment available, experienced with similar loads',
      quoteId: quote1.id,
      transporterId: transporter1.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 8200,
      estimatedDays: 4,
      notes: 'Temperature-controlled trucks ready',
      quoteId: quote1.id,
      transporterId: transporter2.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 9000,
      estimatedDays: 2,
      notes: 'Express delivery available',
      quoteId: quote1.id,
      transporterId: transporter3.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 4000,
      estimatedDays: 2,
      notes: 'Grain-specific transport',
      quoteId: quote2.id,
      transporterId: transporter1.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 4200,
      estimatedDays: 3,
      notes: 'Bulk transport specialists',
      quoteId: quote2.id,
      transporterId: transporter3.id,
    },
  });

  console.log('✅ Bids created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Test accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Cargo Owner:');
  console.log('  Email: john@example.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Transporters:');
  console.log('  Email: alice@transport.com');
  console.log('  Password: password123');
  console.log('');
  console.log('  Email: david@logistics.com');
  console.log('  Password: password123');
  console.log('');
  console.log('  Email: grace@fasttrack.com');
  console.log('  Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

