import { DataSource } from 'typeorm';
import { Gift } from '../../modules/gifts/entities/gift.entity';

const sampleGifts: Partial<Gift>[] = [
  {
    name: 'Samsung Galaxy S9 - Midnight Black 4/64 GB',
    description:
      'Ukuran layar: 6.2 inci, Dual Edge Super AMOLED 2960 x 1440 (Quad HD+) 529 ppi, 18.5:9. Memori: RAM 6 GB (LPDDR4), ROM 64 GB, MicroSD up to 400GB. Sistem operasi: Android 8.0 (Oreo).',
    image: 'https://example.com/images/galaxy-s9-black.jpg',
    stock: 25,
    pointsRequired: 200000,
    isHot: true,
    isNew: true,
  },
  {
    name: 'Samsung Galaxy S9 - Lilac Purple 4/64 GB',
    description: 'Samsung Galaxy S9 varian warna Lilac Purple.',
    image: 'https://example.com/images/galaxy-s9-purple.jpg',
    stock: 3,
    pointsRequired: 200000,
    isHot: false,
    isNew: true,
  },
  {
    name: 'Samsung Galaxy S9 - Coral Blue 4/64 GB',
    description: 'Samsung Galaxy S9 varian warna Coral Blue.',
    image: 'https://example.com/images/galaxy-s9-blue.jpg',
    stock: 10,
    pointsRequired: 200000,
    isHot: true,
    isNew: false,
  },
  {
    name: 'Samsung Clear View Standing Cover S9',
    description: 'Case resmi Samsung untuk Galaxy S9.',
    image: 'https://example.com/images/s9-case.jpg',
    stock: 50,
    pointsRequired: 15000,
    isHot: false,
    isNew: false,
  },
  {
    name: 'Samsung Wireless Charger Duo',
    description: 'Charger wireless untuk 2 perangkat sekaligus.',
    image: 'https://example.com/images/wireless-charger.jpg',
    stock: 0,
    pointsRequired: 50000,
    isHot: false,
    isNew: false,
  },
  {
    name: 'Samsung Galaxy Buds',
    description: 'True wireless earbuds dengan suara AKG.',
    image: 'https://example.com/images/galaxy-buds.jpg',
    stock: 15,
    pointsRequired: 75000,
    isHot: true,
    isNew: true,
  },
];

export async function seedGifts(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Gift);
  const existing = await repo.count();
  if (existing > 0) {
    console.log(`  • ${existing} gifts already present, skipping.`);
    return;
  }

  const entities = sampleGifts.map((g) => repo.create(g));
  await repo.save(entities);
  console.log(`  • ${entities.length} sample gifts created.`);
}
