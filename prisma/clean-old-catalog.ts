import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const legacyCategoryNames = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Kitchen',
    'Fitness & Wellness',
];

/**
 * Cleanup script with safe Dry-Run / Preview Mode by default.
 *
 * - Default behavior (no flags): Read-only preview reporting all records that match.
 * - Execute behavior (--execute flag): Runs actual deletions inside an atomic transaction.
 *
 * User accounts, orders, order items, carts, and payment records are never modified.
 */
async function main() {
    const isExecuteMode = process.argv.includes('--execute');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (isExecuteMode) {
        console.log('🚨 MODE: EXECUTE (DATABASE DELETIONS WILL BE PERFORMED)');
    } else {
        console.log('🛡️  MODE: DRY-RUN / PREVIEW ONLY (NO DATA WILL BE MODIFIED)');
        console.log('   Pass `--execute` to run actual deletions.');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Find matching legacy categories
    const legacyCategories = await prisma.category.findMany({
        where: { name: { in: legacyCategoryNames } },
        select: {
            id: true,
            name: true,
            _count: { select: { products: true } },
        },
        orderBy: { name: 'asc' },
    });

    const legacyCatIds = legacyCategories.map((c) => c.id);

    // 2. Find matching legacy products
    const legacyProducts = await prisma.product.findMany({
        where: {
            OR: [
                { id: { startsWith: 'seed-prod-' } },
                { categoryId: { in: legacyCatIds } },
            ],
        },
        include: {
            category: { select: { name: true } },
            _count: {
                select: {
                    images: true,
                    cartItems: true,
                },
            },
        },
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    });

    const legacyProductIds = legacyProducts.map((p) => p.id);

    // Separate standard seed products vs manually created products
    const seedProducts = legacyProducts.filter((p) => p.id.startsWith('seed-prod-'));
    const manualProducts = legacyProducts.filter((p) => !p.id.startsWith('seed-prod-'));

    // Count associated records
    const totalImagesCount = legacyProductIds.length > 0
        ? await prisma.productImage.count({ where: { productId: { in: legacyProductIds } } })
        : 0;

    const totalCartItemsCount = legacyProductIds.length > 0
        ? await prisma.cartItem.count({ where: { productId: { in: legacyProductIds } } })
        : 0;

    // -------------------------------------------------------------
    // Display Detailed Preview Output
    // -------------------------------------------------------------
    console.log('📁 TARGETED CATEGORIES:');
    if (legacyCategories.length === 0) {
        console.log('   (None found in database)\n');
    } else {
        legacyCategories.forEach((c) => {
            console.log(`   - "${c.name}" [ID: ${c.id}] (Contains ${c._count.products} products)`);
        });
        console.log('');
    }

    console.log(`📦 TARGETED PRODUCTS (${legacyProducts.length} Total):`);
    if (legacyProducts.length === 0) {
        console.log('   (None found in database)\n');
    } else {
        console.log('   A. Standard Seed Products (ID prefix "seed-prod-"):');
        if (seedProducts.length === 0) {
            console.log('      (None)');
        } else {
            seedProducts.forEach((p) => {
                console.log(`      • [${p.id}] "${p.name}"`);
                console.log(`        Category: ${p.category.name} | Price: $${p.price} | Stock: ${p.stock}`);
                console.log(`        Images: ${p._count.images} | In Carts: ${p._count.cartItems} reference(s)`);
            });
        }

        console.log('\n   B. Manually Created / Custom Products (ID does NOT start with "seed-prod-"):');
        if (manualProducts.length === 0) {
            console.log('      ✅ None detected. All matching products are standard seed demo items.');
        } else {
            manualProducts.forEach((p) => {
                console.log(`      ⚠️  [WARNING: NON-SEED ID DETECTED]`);
                console.log(`         ID: "${p.id}" | Name: "${p.name}"`);
                console.log(`         Category: ${p.category.name} | Price: $${p.price} | Stock: ${p.stock}`);
                console.log(`         Images: ${p._count.images} | In Carts: ${p._count.cartItems} reference(s)`);
            });
        }
        console.log('');
    }

    console.log('📊 RECORD IMPACT SUMMARY:');
    console.log(`   • Categories to delete:   ${legacyCategories.length}`);
    console.log(`   • Products to delete:     ${legacyProducts.length} (Seed: ${seedProducts.length}, Custom/Manual: ${manualProducts.length})`);
    console.log(`   • Product images to drop: ${totalImagesCount}`);
    console.log(`   • Cart items to prune:    ${totalCartItemsCount}`);
    console.log('   • Users / Orders / Logs:  0 (Preserved 100% untouched)\n');

    // If not in execute mode, exit early without making any modifications
    if (!isExecuteMode) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ℹ️  DRY-RUN COMPLETE: No changes were written to the database.');
        console.log('   To execute this deletion atomically, run:');
        console.log('   npm run clean:catalog -- --execute');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return;
    }

    // -------------------------------------------------------------
    // EXECUTE MODE: Perform deletions inside an atomic transaction
    // -------------------------------------------------------------
    console.log('⚡ Executing atomic deletion transaction...');
    await prisma.$transaction(async (tx) => {
        if (legacyProductIds.length > 0) {
            // 1. Remove orphaned cart items
            const cartItems = await tx.cartItem.deleteMany({
                where: { productId: { in: legacyProductIds } },
            });
            console.log(`   ✓ Removed ${cartItems.count} cart item(s).`);

            // 2. Remove product images
            const images = await tx.productImage.deleteMany({
                where: { productId: { in: legacyProductIds } },
            });
            console.log(`   ✓ Removed ${images.count} product image(s).`);

            // 3. Remove products
            const products = await tx.product.deleteMany({
                where: { id: { in: legacyProductIds } },
            });
            console.log(`   ✓ Removed ${products.count} product(s).`);
        }

        // 4. Remove empty legacy categories
        if (legacyCatIds.length > 0) {
            const categories = await tx.category.deleteMany({
                where: { id: { in: legacyCatIds } },
            });
            console.log(`   ✓ Removed ${categories.count} legacy category/categories.`);
        }
    });

    console.log('\n✅ Deletion transaction committed successfully.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Operation failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
