import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed...');

    // ---------------------------------------------------------
    // 1. Admin user
    // ---------------------------------------------------------
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
    const adminName = process.env.ADMIN_NAME ?? 'Admin';

    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: Role.ADMIN,
            isEmailVerified: true,
        },
        create: {
            email: adminEmail,
            password: hashedAdminPassword,
            name: adminName,
            role: Role.ADMIN,
            isEmailVerified: true,
        },
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // ---------------------------------------------------------
    // 2. Demo customer
    // ---------------------------------------------------------
    const customerEmail = process.env.DEMO_CUSTOMER_EMAIL ?? 'customer@example.com';
    const customerPassword = process.env.DEMO_CUSTOMER_PASSWORD ?? 'Customer@123456';

    const hashedCustomerPassword = await bcrypt.hash(customerPassword, 12);

    const customer = await prisma.user.upsert({
        where: { email: customerEmail },
        update: { isEmailVerified: true },
        create: {
            email: customerEmail,
            password: hashedCustomerPassword,
            name: 'Demo Customer',
            role: Role.CUSTOMER,
            isEmailVerified: true,
        },
    });
    console.log(`✅ Customer created: ${customer.email}`);

    // ---------------------------------------------------------
    // 3. Categories
    // ---------------------------------------------------------
    const categoriesData = [
        { name: 'Electronics' },
        { name: 'Clothing' },
        { name: 'Books' },
        { name: 'Home & Kitchen' },
    ];

    const categories = await Promise.all(
        categoriesData.map((c) =>
            prisma.category.upsert({
                where: { name: c.name },
                update: {},
                create: c,
            }),
        ),
    );
    console.log(`✅ ${categories.length} categories created`);

    // ---------------------------------------------------------
    // 4. Products
    // ---------------------------------------------------------
    const electronics = categories.find((c) => c.name === 'Electronics')!;
    const clothing = categories.find((c) => c.name === 'Clothing')!;
    const books = categories.find((c) => c.name === 'Books')!;

    const productsData = [
        {
            name: 'Wireless Bluetooth Headphones',
            description: 'Premium noise-cancelling over-ear headphones with 30h battery life.',
            price: '199.99',
            stock: 50,
            categoryId: electronics.id,
        },
        {
            name: 'Mechanical Keyboard RGB',
            description: 'Compact TKL mechanical keyboard with hot-swappable switches.',
            price: '129.50',
            stock: 30,
            categoryId: electronics.id,
        },
        {
            name: '4K Webcam Pro',
            description: 'Ultra HD webcam with autofocus and dual noise-cancelling mics.',
            price: '89.00',
            stock: 25,
            categoryId: electronics.id,
        },
        {
            name: 'Cotton T-Shirt (Unisex)',
            description: 'Premium 100% cotton t-shirt. Available in multiple colors.',
            price: '24.99',
            stock: 100,
            categoryId: clothing.id,
        },
        {
            name: 'Denim Jacket',
            description: 'Classic vintage-wash denim jacket with durable stitching.',
            price: '79.00',
            stock: 40,
            categoryId: clothing.id,
        },
        {
            name: 'Clean Code (Robert C. Martin)',
            description: 'A handbook of agile software craftsmanship. Essential reading.',
            price: '34.99',
            stock: 60,
            categoryId: books.id,
        },
        {
            name: 'The Pragmatic Programmer',
            description: 'Your journey to mastery. 20th anniversary edition.',
            price: '39.99',
            stock: 45,
            categoryId: books.id,
        },
    ];

    for (const product of productsData) {
        await prisma.product.upsert({
            where: {
                id: `seed-${product.name.toLowerCase().replace(/\s+/g, '-')}`,
            },
            update: {},
            create: {
                id: `seed-${product.name.toLowerCase().replace(/\s+/g, '-')}`,
                ...product,
            },
        });
    }
    console.log(`✅ ${productsData.length} products created`);

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👑 Admin:    ${adminEmail} / ${adminPassword}`);
    console.log(`👤 Customer: ${customerEmail} / ${customerPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });