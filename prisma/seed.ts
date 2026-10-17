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
    console.log('🌱 Starting Modern Living furniture seed...');

    // ---------------------------------------------------------
    // 1. Admin User
    // ---------------------------------------------------------
    const adminEmail = requireEnv('ADMIN_EMAIL', 'admin@demo.com');
    const adminPassword = requireEnv('ADMIN_PASSWORD', 'Admin@123456');
    const adminName = process.env.ADMIN_NAME ?? 'Modern Living Admin';

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
    // 3. Furniture & Home Décor Categories
    // ---------------------------------------------------------
    const furnitureCategories = [
        { name: 'Sofas & Armchairs' },
        { name: 'Tables & Desks' },
        { name: 'Bedroom Furniture' },
        { name: 'Lighting' },
        { name: 'Storage & Shelving' },
        { name: 'Home Décor & Accessories' },
    ];

    const categoryRecords = await Promise.all(
        furnitureCategories.map((c) =>
            prisma.category.upsert({
                where: { name: c.name },
                update: {},
                create: c,
            }),
        ),
    );
    console.log(`✅ ${categoryRecords.length} furniture categories ready`);

    const getCatId = (name: string) => categoryRecords.find((c) => c.name === name)!.id;

    // ---------------------------------------------------------
    // 4. Curated Furniture & Décor Products (28 Items)
    // ---------------------------------------------------------
    const furnitureProducts = [
        // --- 1. Sofas & Armchairs ($249–$599) ---
        {
            id: 'seed-furn-boucle-sofa',
            name: 'Nordic 3-Seat Bouclé Sofa',
            description: 'Sculptural three-seat sofa upholstered in premium textured cream bouclé fabric with a kiln-dried solid oak interior frame.',
            price: '589.00',
            stock: 12,
            categoryId: getCatId('Sofas & Armchairs'),
            imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-walnut-chair',
            name: 'Minimalist Walnut Lounge Chair',
            description: 'Mid-century inspired low lounge chair featuring rich American walnut joinery and tailored oatmeal linen cushions.',
            price: '349.00',
            stock: 18,
            categoryId: getCatId('Sofas & Armchairs'),
            imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-fluted-armchair',
            name: 'Curved Velvet Accent Chair',
            description: 'Curved barrel armchair with tailored vertical fluting details, upholstered in warm taupe velvet with brass-capped tapered legs.',
            price: '279.00',
            stock: 15,
            categoryId: getCatId('Sofas & Armchairs'),
            imageUrl: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-linen-chaise',
            name: 'Linen Slipcovered Modular Chaise',
            description: 'Deep-seated relaxed lounge chaise with a removable washed natural Belgian linen slipcover and goose-feather fill blend.',
            price: '495.00',
            stock: 10,
            categoryId: getCatId('Sofas & Armchairs'),
            imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-shearling-bench',
            name: 'Contemporary Minimalist Daybed',
            description: 'Low-profile architectural daybed with a solid walnut plinth base and button-tufted natural linen mattress cushion.',
            price: '449.00',
            stock: 8,
            categoryId: getCatId('Sofas & Armchairs'),
            imageUrl: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1000&q=80',
        },

        // --- 2. Tables & Desks ($79–$349) ---
        {
            id: 'seed-furn-walnut-dining-table',
            name: 'Solid Walnut Oval Dining Table',
            description: 'Hand-finished solid walnut dining table featuring rounded bullnose edges and sculptural pillared trestle pedestal legs.',
            price: '345.00',
            stock: 8,
            categoryId: getCatId('Tables & Desks'),
            imageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-travertine-coffee-table',
            name: 'Travertine Stone Round Coffee Table',
            description: 'Honed Italian travertine stone coffee table with natural porous veining and a monolithic geometric pedestal base.',
            price: '249.00',
            stock: 14,
            categoryId: getCatId('Tables & Desks'),
            imageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-oak-writing-desk',
            name: 'Architectural Oak Writing Desk',
            description: 'Clean-lined executive writing desk crafted from white oak with two discreet soft-close drawers and integrated cable trough.',
            price: '285.00',
            stock: 16,
            categoryId: getCatId('Tables & Desks'),
            imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-fluted-side-table',
            name: 'Matte Ceramic Fluted Side Table',
            description: 'Cylindrical accent side table crafted in matte ivory stoneware with subtle fluted geometric relief.',
            price: '89.00',
            stock: 24,
            categoryId: getCatId('Tables & Desks'),
            imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-nesting-tables',
            name: 'Oak & Brass Nesting Tables',
            description: 'Set of two graduated circular accent tables with solid white oak tops and antique brushed brass sled frames.',
            price: '165.00',
            stock: 18,
            categoryId: getCatId('Tables & Desks'),
            imageUrl: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1000&q=80',
        },

        // --- 3. Bedroom Furniture ($129–$499) ---
        {
            id: 'seed-furn-platform-bed',
            name: 'Upholstered Low Platform Bed Frame',
            description: 'Queen-sized floating platform bed with an integrated low-profile headboard in textured sand linen weave.',
            price: '485.00',
            stock: 9,
            categoryId: getCatId('Bedroom Furniture'),
            imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-walnut-nightstand',
            name: 'Walnut Two-Drawer Nightstand',
            description: 'Compact bedside table in natural walnut grain with hand-carved finger pulls and solid wood mortise joints.',
            price: '175.00',
            stock: 22,
            categoryId: getCatId('Bedroom Furniture'),
            imageUrl: 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-cane-bedside',
            name: 'Woven Cane Bedside Table',
            description: 'Bohemian-modern nightstand featuring natural rattan cane door panels and a light honey oak frame.',
            price: '145.00',
            stock: 18,
            categoryId: getCatId('Bedroom Furniture'),
            imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-bedroom-bench',
            name: 'Oatmeal Wool Bedroom Bench',
            description: 'End-of-bed bench upholstered in durable oatmeal herringbone wool blend over tapered solid walnut dowel legs.',
            price: '215.00',
            stock: 15,
            categoryId: getCatId('Bedroom Furniture'),
            imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
        },

        // --- 4. Lighting ($29–$149) ---
        {
            id: 'seed-furn-pleated-table-lamp',
            name: 'Ceramic Pleated Shade Table Lamp',
            description: 'Hand-thrown stoneware lamp base with a warm oatmeal linen pleated shade, casting ambient warm lighting.',
            price: '79.00',
            stock: 30,
            categoryId: getCatId('Lighting'),
            imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-brass-arc-lamp',
            name: 'Brushed Brass Arc Floor Lamp',
            description: 'Elegant sweeping brass floor lamp with an authentic marble counterweight base and domed spun-brass diffuser.',
            price: '145.00',
            stock: 16,
            categoryId: getCatId('Lighting'),
            imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-ceramic-pendant',
            name: 'Sculptural Terracotta Pendant Light',
            description: 'Matte off-white terracotta ceiling pendant designed to wash dining tables and kitchen islands in warm glow.',
            price: '98.00',
            stock: 25,
            categoryId: getCatId('Lighting'),
            imageUrl: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-mushroom-lamp',
            name: 'Opaline Glass Accent Lamp',
            description: 'Whimsical mid-century hand-blown striped opaline glass lamp providing soft, non-glare ambient illumination.',
            price: '49.00',
            stock: 35,
            categoryId: getCatId('Lighting'),
            imageUrl: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80',
        },

        // --- 5. Storage & Shelving ($99–$399) ---
        {
            id: 'seed-furn-oak-bookshelf',
            name: 'Modular Oak & Steel Bookshelf',
            description: 'Open five-tier architectural bookshelf combining powder-coated matte black steel uprights with solid white oak planks.',
            price: '295.00',
            stock: 12,
            categoryId: getCatId('Storage & Shelving'),
            imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-tambour-credenza',
            name: 'Fluted Tambour Media Console',
            description: 'Low credenza featuring sliding tambour wood doors, brushed brass hardware, and ventilated rear cord management.',
            price: '385.00',
            stock: 10,
            categoryId: getCatId('Storage & Shelving'),
            imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-arched-cane-cabinet',
            name: 'Arched Cane Storage Cabinet',
            description: 'Statement storage cupboard with graceful bentwood arched silhouette and breathable natural woven cane inserts.',
            price: '349.00',
            stock: 8,
            categoryId: getCatId('Storage & Shelving'),
            imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-oak-etagere',
            name: 'Tiered Oak Display Etagere',
            description: 'Narrow freestanding corner display unit designed for ceramic vessels, curated books, and framed art.',
            price: '185.00',
            stock: 18,
            categoryId: getCatId('Storage & Shelving'),
            imageUrl: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1000&q=80',
        },

        // --- 6. Home Décor & Accessories ($12–$129) ---
        {
            id: 'seed-furn-ceramic-vase',
            name: 'Wabi-Sabi Sculptural Ceramic Vase',
            description: 'Raw textured terracotta stoneware vessel with an organic asymmetrical silhouette and chalky matte finish.',
            price: '45.00',
            stock: 40,
            categoryId: getCatId('Home Décor & Accessories'),
            imageUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-brass-arch-mirror',
            name: 'Minimalist Brass Arch Mirror',
            description: 'Full-length floor standing or wall-mounted arch mirror enclosed in a delicate hand-brushed antique brass frame.',
            price: '115.00',
            stock: 20,
            categoryId: getCatId('Home Décor & Accessories'),
            imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-linen-throw',
            name: 'Washed Belgian Linen Throw Blanket',
            description: 'Generously sized pure flax linen throw with fringed edges, pre-washed for effortless tactile softness and drape.',
            price: '65.00',
            stock: 45,
            categoryId: getCatId('Home Décor & Accessories'),
            imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-berber-rug',
            name: 'Hand-Tufted Berber Wool Area Rug (5x8)',
            description: 'Berber-inspired area rug with raised geometric linear pile in un-dyed cream and charcoal wool.',
            price: '125.00',
            stock: 14,
            categoryId: getCatId('Home Décor & Accessories'),
            imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-linen-cushions',
            name: 'Heavy Flax Linen Cushion Covers (Set of 2)',
            description: 'Pair of 20x20 inch square decorative pillow covers tailored from heavyweight earthy flax linen with hidden zips.',
            price: '32.00',
            stock: 60,
            categoryId: getCatId('Home Décor & Accessories'),
            imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80',
        },
        {
            id: 'seed-furn-incense-dish',
            name: 'Smoked Fluted Glass Incense Dish',
            description: 'Hand-cut heavy borosilicate fluted glass dish designed for Japanese stick incense and botanical rituals.',
            price: '18.00',
            stock: 55,
            categoryId: getCatId('Home Décor & Accessories'),
            imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=80',
        },
    ];

    // Upsert all furniture products idempotently
    for (const p of furnitureProducts) {
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

        // Ensure product image is in sync
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

    console.log(`✅ ${furnitureProducts.length} Modern Living furniture & home décor products ready`);

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏷️  BRAND: Modern Living');
    console.log('🛋️  CATALOG: 28 Furniture & Home Décor Products');
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