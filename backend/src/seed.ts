import { PoolClient } from 'pg';
import { Faker, en, vi } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Duplicated from frontend constants for backend independence
const TOTAL_PRODUCTS = 170;
const STYLES = ['Office', 'Street Style', 'Evening'];
const COLORS = ['Đen', 'Trắng', 'Xanh dương', 'Đỏ', 'Hồng', 'Vàng', 'Xám', 'Xanh lá', 'Nâu', 'Cam'];
const SHOE_SIZES = ['34', '35', '36', '37', '38', '39'];
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const HEEL_HEIGHTS = ['Bệt', '3cm', '5cm', '7cm', '9cm', '11cm'];
const SHOE_TYPES = ['Giày cao gót', 'Giày xăng đan', 'Giày búp bê', 'Giày boots', 'Giày Sneakers', 'Dép guốc'];
const BAG_TYPES = ['Túi cỡ nhỏ', 'Túi cỡ trung', 'Túi cỡ lớn', 'Ba lo thời trang', 'Ví - Clutch'];
const CLOTHING_TYPES = ['Đầm', 'Áo', 'Váy', 'Quần', 'Jumpsuit'];
const ACCESSORY_TYPES = ['Kính râm', 'Thắt lưng', 'Khăn choàng', 'Mũ', 'Trang sức'];
const ALL_CATEGORIES = [...SHOE_TYPES, ...BAG_TYPES, ...CLOTHING_TYPES, ...ACCESSORY_TYPES];

const vietnameseProductNames = [
    "Áo Sơ Mi Lụa Tay Dài", "Áo Thun Cotton Cổ Tròn", "Váy Hoa Nhí Vintage", "Đầm Suông Chữ A",
    "Quần Jeans Skinny Rách Gối", "Quần Culottes Vải Đũi", "Jumpsuit Hai Dây Ống Rộng",
    "Áo Khoác Blazer Kẻ Sọc", "Chân Váy Bút Chì Công Sở", "Áo Len Cổ Lọ Ấm Áp",
    "Giày Cao Gót Mũi Nhọn Classic", "Sandal Đế Xuồng Mùa Hè", "Giày Búp Bê Nơ Xinh",
    "Boots Da Cổ Ngắn Cá Tính", "Sneakers Trắng Năng Động", "Dép Guốc Quai Trong suốt",
    "Túi Xách Tote Da Công Sở", "Clutch Dự Tiệc Đính Đá", "Balo Mini Dạo Phố",
    "Túi Đeo Chéo Vải Canvas", "Ví Gập Nhỏ Gọn Nhiều Ngăn",
    "Kính Mát Gọng Tròn Retro", "Thắt Lưng Da Bản Nhỏ", "Khăn Choàng Lụa Họa Tiết",
    "Mũ Bucket Vải Jumpsuit", "Vòng Cổ Bạc Tinh Tế"
];

const faker = new Faker({ locale: [vi, en] });
faker.seed(123);

export const seedDatabase = async (client: PoolClient) => {
  // Seed Users
  await client.query('DELETE FROM users');
  const adminPasswordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
  const userPasswordHash = await bcrypt.hash('user123', SALT_ROUNDS);

  const users = [
    {
      id: faker.string.uuid(),
      name: 'Admin OSMS',
      email: 'admin@osms.com',
      password: adminPasswordHash,
      role: 'admin',
      phone: faker.phone.number(),
      avatar: faker.image.avatar(),
      birthDate: faker.date.birthdate().toISOString().split('T')[0],
    },
    ...Array.from({ length: 10 }, (_, i) => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: `user${i + 1}@example.com`,
      password: userPasswordHash,
      role: 'user',
      phone: faker.phone.number(),
      avatar: faker.image.avatar(),
      birthDate: faker.date.birthdate().toISOString().split('T')[0],
    })),
  ];

  for (const user of users) {
    await client.query(
      'INSERT INTO users (id, name, email, password, role, phone, avatar, "birthDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [user.id, user.name, user.email, user.password, user.role, user.phone, user.avatar, user.birthDate]
    );
  }

  // Seed Products
  await client.query('DELETE FROM products');
  for (let i = 0; i < TOTAL_PRODUCTS; i++) {
    const category = faker.helpers.arrayElement(ALL_CATEGORIES);
    let sizes: string[] = [];
    if (SHOE_TYPES.includes(category)) sizes = faker.helpers.arrayElements(SHOE_SIZES, { min: 3, max: 5 });
    else if (CLOTHING_TYPES.includes(category)) sizes = faker.helpers.arrayElements(CLOTHING_SIZES, { min: 2, max: 4 });
    const heelHeight = SHOE_TYPES.includes(category) ? faker.helpers.arrayElement(HEEL_HEIGHTS) : null;
    const name = faker.helpers.arrayElement(vietnameseProductNames) + ' ' + faker.commerce.productAdjective();
    const price = faker.number.int({ min: 200000, max: 2000000 });
    const discount = faker.helpers.weightedArrayElement([
        { weight: 60, value: 0 }, { weight: 30, value: faker.number.int({ min: 10, max: 30 }) }, { weight: 10, value: faker.number.int({ min: 31, max: 50 }) },
    ]);
    const finalPrice = Math.round(price * (1 - discount / 100));

    await client.query(
      `INSERT INTO products (id, name, slug, description, category, style, sizes, colors, price, discount, "finalPrice", images, sku, stock, rating, "isFlashSale", "isNew", "heelHeight")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        faker.string.uuid(),
        name,
        faker.helpers.slugify(name).toLowerCase(),
        faker.lorem.paragraphs(3),
        category,
        faker.helpers.arrayElement(STYLES),
        sizes,
        faker.helpers.arrayElements(COLORS, { min: 1, max: 4 }),
        price,
        discount,
        finalPrice,
        Array.from({ length: 4 }, () => faker.image.url({ width: 800, height: 800 })),
        `OSMS-${faker.string.alphanumeric(8).toUpperCase()}`,
        faker.number.int({ min: 0, max: 150 }),
        faker.number.float({ min: 3.5, max: 5, multipleOf: 0.1 }),
        Math.random() < 0.2,
        Math.random() < 0.15,
        heelHeight,
      ]
    );
  }

  // Seed Vouchers
  await client.query('DELETE FROM vouchers');
  const vouchers = [
    { code: 'SALE30', type: 'percent', value: 30, description: 'Giảm 30% cho mọi đơn hàng', minPurchase: 0 },
    { code: 'OSMS100K', type: 'fixed', value: 100000, description: 'Giảm 100k cho đơn hàng từ 500k', minPurchase: 500000 },
    { code: 'FREESHIP', type: 'fixed', value: 30000, description: 'Miễn phí vận chuyển (tối đa 30k)', minPurchase: 200000 },
  ];

  for (const voucher of vouchers) {
    await client.query(
      `INSERT INTO vouchers (code, type, value, description, "minPurchase", "isActive")
       VALUES ($1, $2, $3, $4, $5, TRUE)`,
       [voucher.code, voucher.type, voucher.value, voucher.description, voucher.minPurchase]
    );
  }
};
