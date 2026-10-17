import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function requireEnv(name: string, fallback: string): string {
    const value = process.env[name];
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && !value) {
        throw new Error(
            `❌ ${name} must be explicitly set when NODE_ENV=production. ` +
            `Refusing to use the default value (${fallback}).`,
        );
    }

    return value ?? fallback;
}

async function main() {
    console.log('🌱 Starting database seed...');

    // ---------------------------------------------------------
    // 1. Admin User
    // ---------------------------------------------------------
    const adminEmail = requireEnv('ADMIN_EMAIL', 'admin@demo.com');
    const adminPassword = requireEnv('ADMIN_PASSWORD', 'Admin@123456');
    const adminName = process.env.ADMIN_NAME ?? 'Mohamed (Admin)';

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
    console.log(`✅ Admin ready: ${admin.email}`);

    // ---------------------------------------------------------
    // 2. Demo Customer
    // ---------------------------------------------------------
    const customerEmail = requireEnv(
        'DEMO_CUSTOMER_EMAIL',
        'customer@demo.com',
    );
    const customerPassword = requireEnv(
        'DEMO_CUSTOMER_PASSWORD',
        'Customer@123456',
    );

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
    console.log(`✅ Customer ready: ${customer.email}`);

    // ---------------------------------------------------------
    // 3. Categories
    // ---------------------------------------------------------
    const categoriesData = [
        { name: 'Electronics' },
        { name: 'Clothing' },
        { name: 'Books' },
        { name: 'Home & Kitchen' },
        { name: 'Fitness & Wellness' },
    ];

    const categoryRecords = await Promise.all(
        categoriesData.map((c) =>
            prisma.category.upsert({
                where: { name: c.name },
                update: {},
                create: c,
            }),
        ),
    );
    console.log(`✅ ${categoryRecords.length} categories ready`);

    const getCatId = (name: string) => categoryRecords.find((c) => c.name === name)!.id;

    // ---------------------------------------------------------
    // 4. Curated Products (Realistic USD Prices $5.00 - $49.99 & Unsplash Images)
    // ---------------------------------------------------------
    const productsData = [
        // --- Electronics ($19.99 - $44.99) ---
        {
            id: 'seed-prod-wireless-mouse',
            name: 'Ergonomic Wireless Mouse',
            description: 'Ultra-silent click wireless mouse with adjustable 4000 DPI and long-lasting rechargeable battery.',
            price: '29.99',
            stock: 45,
            categoryId: getCatId('Electronics'),
            imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-mechanical-keycaps',
            name: 'Custom Mechanical Keycaps Set',
            description: 'Durable PBT double-shot keycaps set with custom Cherry MX stem profile for custom keyboards.',
            price: '24.50',
            stock: 35,
            categoryId: getCatId('Electronics'),
            imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-usbc-hub',
            name: '7-in-1 Aluminum USB-C Hub',
            description: 'Multi-port adapter with 4K HDMI, 100W Power Delivery, SD/TF card reader, and high-speed USB 3.0 ports.',
            price: '34.99',
            stock: 30,
            categoryId: getCatId('Electronics'),
            imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-laptop-stand',
            name: 'Adjustable Aluminum Laptop Stand',
            description: 'Foldable ergonomic riser supporting up to 17-inch laptops with improved heat dissipation airflow.',
            price: '27.50',
            stock: 40,
            categoryId: getCatId('Electronics'),
            imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-desk-mat',
            name: 'Waterproof Leather Desk Mat',
            description: 'Large extended desk pad (80x40 cm) protecting your table from scratches, spills, and friction.',
            price: '19.99',
            stock: 55,
            categoryId: getCatId('Electronics'),
            imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-anc-earbuds',
            name: 'True Wireless Noise-Cancelling Earbuds',
            description: 'Crystal-clear Hi-Fi sound, active noise cancellation, ambient pass-through mode, and 28-hour playtime.',
            price: '44.99',
            stock: 25,
            categoryId: getCatId('Electronics'),
            imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-streaming-webcam',
            name: '1080p HD Streaming Webcam',
            description: 'Full HD 60FPS webcam with automatic light correction and built-in stereo dual noise-cancelling mics.',
            price: '39.99',
            stock: 20,
            categoryId: getCatId('Electronics'),
            imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
        },

        // --- Clothing ($12.50 - $49.00) ---
        {
            id: 'seed-prod-cotton-tee',
            name: 'Heavyweight Minimalist Cotton T-Shirt',
            description: '100% pre-shrunk combed organic cotton. Premium relaxed unisex fit with reinforced collar stitching.',
            price: '18.50',
            stock: 70,
            categoryId: getCatId('Clothing'),
            imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-denim-jacket',
            name: 'Vintage Wash Denim Jacket',
            description: 'Classic rugged denim jacket with brass button closures and functional deep front welt pockets.',
            price: '49.00',
            stock: 28,
            categoryId: getCatId('Clothing'),
            imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-fleece-hoodie',
            name: 'Comfort Fit Pullover Hoodie',
            description: 'Plush brushed fleece interior with double-lined drawstring hood and spacious kangaroo pocket.',
            price: '38.00',
            stock: 45,
            categoryId: getCatId('Clothing'),
            imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-baseball-cap',
            name: 'Minimalist Cotton Baseball Cap',
            description: 'Classic 6-panel low-profile dad hat made from breathable cotton twill with adjustable strap back.',
            price: '14.99',
            stock: 60,
            categoryId: getCatId('Clothing'),
            imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-canvas-tote',
            name: 'Heavyweight Eco Canvas Tote Bag',
            description: 'Durable 16oz cotton canvas tote with heavy-duty shoulder straps, ideal for groceries, books, and daily carry.',
            price: '12.50',
            stock: 85,
            categoryId: getCatId('Clothing'),
            imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        },

        // --- Books ($29.99 - $42.50) ---
        {
            id: 'seed-prod-clean-code',
            name: 'Clean Code (Robert C. Martin)',
            description: 'A handbook of agile software craftsmanship. The definitive industry guide to writing readable, maintainable code.',
            price: '32.00',
            stock: 50,
            categoryId: getCatId('Books'),
            imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-ddia-book',
            name: 'Designing Data-Intensive Applications',
            description: 'The big ideas behind reliable, scalable, and maintainable systems by Martin Kleppmann.',
            price: '42.50',
            stock: 40,
            categoryId: getCatId('Books'),
            imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-pragmatic-programmer',
            name: 'The Pragmatic Programmer',
            description: 'Your journey to mastery (20th Anniversary Edition) by David Thomas and Andrew Hunt.',
            price: '36.00',
            stock: 35,
            categoryId: getCatId('Books'),
            imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-system-design',
            name: 'System Design Interview – Volume 1',
            description: 'Step-by-step framework to master real-world software architecture and distributed systems interviews.',
            price: '29.99',
            stock: 45,
            categoryId: getCatId('Books'),
            imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
        },

        // --- Home & Kitchen ($14.50 - $35.00) ---
        {
            id: 'seed-prod-ceramic-mug',
            name: 'Artisan Ceramic Coffee Mug',
            description: 'Hand-glazed 12oz stoneware mug with comfortable wide-grip handle. Microwave and dishwasher safe.',
            price: '14.50',
            stock: 65,
            categoryId: getCatId('Home & Kitchen'),
            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-vacuum-bottle',
            name: 'Insulated Stainless Steel Bottle (750ml)',
            description: 'Double-walled vacuum insulation keeps liquids icy cold for 24 hours or piping hot for 12 hours.',
            price: '22.00',
            stock: 50,
            categoryId: getCatId('Home & Kitchen'),
            imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-desk-lamp',
            name: 'Minimalist Dimmable LED Desk Lamp',
            description: 'Eye-caring architectural LED lamp with 3 color temperatures, touch slider dimmer, and USB charging port.',
            price: '35.00',
            stock: 30,
            categoryId: getCatId('Home & Kitchen'),
            imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-soy-candle',
            name: 'Natural Soy Wax Aromatherapy Candle',
            description: 'Non-toxic hand-poured soy wax candle infused with lavender and amber essential oils. 50-hour clean burn.',
            price: '16.99',
            stock: 45,
            categoryId: getCatId('Home & Kitchen'),
            imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-lumbar-pillow',
            name: 'Memory Foam Lumbar Support Cushion',
            description: 'Ergonomically contoured back pillow relieving lower-spine tension during long coding or desk sessions.',
            price: '26.50',
            stock: 35,
            categoryId: getCatId('Home & Kitchen'),
            imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
        },

        // --- Fitness & Wellness ($15.99 - $28.00) ---
        {
            id: 'seed-prod-yoga-mat',
            name: 'Extra Thick Eco Yoga Mat (6mm)',
            description: 'Non-slip high-density TPE yoga mat providing soft joint cushioning with carrying strap included.',
            price: '28.00',
            stock: 40,
            categoryId: getCatId('Fitness & Wellness'),
            imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-foam-roller',
            name: 'Trigger Point Muscle Foam Roller',
            description: 'Textured deep-tissue grid roller for soothing muscle soreness and accelerating post-workout recovery.',
            price: '19.50',
            stock: 35,
            categoryId: getCatId('Fitness & Wellness'),
            imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-resistance-bands',
            name: 'Resistance Workout Loop Bands (Set of 5)',
            description: 'Natural latex exercise bands with 5 resistance levels from light to extra-heavy, with travel pouch.',
            price: '15.99',
            stock: 60,
            categoryId: getCatId('Fitness & Wellness'),
            imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'seed-prod-protein-shaker',
            name: 'Leak-Proof Stainless Steel Shaker (24oz)',
            description: 'Odor-resistant steel workout shaker bottle with measurement markings and silent whisking ball.',
            price: '18.00',
            stock: 50,
            categoryId: getCatId('Fitness & Wellness'),
            imageUrl: 'https://images.unsplash.com/photo-1577741314755-048d8525d31e?auto=format&fit=crop&w=800&q=80',
        },
    ];

    for (const p of productsData) {
        const product = await prisma.product.upsert({
            where: { id: p.id },
            update: {
                name: p.name,
                description: p.description,
                price: p.price,
                stock: p.stock,
                categoryId: p.categoryId,
            },
            create: {
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price,
                stock: p.stock,
                categoryId: p.categoryId,
            },
        });

        // Ensure product image is synced
        await prisma.productImage.deleteMany({
            where: { productId: product.id },
        });

        await prisma.productImage.create({
            data: {
                url: p.imageUrl,
                publicId: `seed-image-${product.id}`,
                productId: product.id,
            },
        });
    }

    console.log(`✅ ${productsData.length} products created with images & updated USD prices`);

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