// Adds 12 demo products (safe to re-run: each has a fixed document ID, so it updates instead of duplicating).
//   node seed-products.js           -> add / refresh demo products
//   node seed-products.js --remove  -> delete the demo products again
const { init } = require('./admin-init');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const img = (seed) => `https://picsum.photos/seed/devcom-${seed}/600/600`;

const PRODUCTS = [
  ['wireless-earbuds', 'Wireless Earbuds', 'Electronics', 1999, 40, 'Bluetooth 5.3 earbuds with a charging case and up to 24 hours of playback.'],
  ['smart-watch', 'Smart Watch', 'Electronics', 3499, 15, 'Fitness tracking, heart-rate monitor and week-long battery life.'],
  ['power-bank', 'Power Bank 20000 mAh', 'Electronics', 1499, 3, 'Fast-charging power bank with two USB ports.'],
  ['cotton-tshirt', 'Cotton T-Shirt', 'Fashion', 499, 60, 'Soft everyday crew-neck tee in 100% cotton.'],
  ['denim-jacket', 'Denim Jacket', 'Fashion', 2299, 12, 'Classic mid-wash denim jacket with a relaxed fit.'],
  ['table-lamp', 'LED Table Lamp', 'Home', 899, 25, 'Dimmable desk lamp with three colour temperatures.'],
  ['ceramic-mug-set', 'Ceramic Mug Set (4)', 'Home', 799, 0, 'Four stoneware mugs, microwave and dishwasher safe.'],
  ['clean-code', 'Clean Code Handbook', 'Books', 649, 30, 'A practical guide to writing readable, maintainable software.'],
  ['notebook-pack', 'Notebook Pack (3)', 'Books', 299, 80, 'Three ruled notebooks with 160 pages each.'],
  ['yoga-mat', 'Yoga Mat', 'Sports', 899, 22, 'Non-slip 6 mm mat with a carrying strap.'],
  ['football', 'Training Football', 'Sports', 749, 18, 'Size 5 machine-stitched football for training and matches.'],
  ['face-moisturiser', 'Daily Face Moisturiser', 'Beauty', 549, 35, 'Lightweight, fragrance-free moisturiser for all skin types.'],
];

async function main() {
  init();
  const db = getFirestore();
  const batch = db.batch();
  const remove = process.argv.includes('--remove');

  for (const [slug, name, category, price, stock, description] of PRODUCTS) {
    const ref = db.collection('products').doc(`demo-${slug}`);
    if (remove) {
      batch.delete(ref);
    } else {
      batch.set(ref, {
        name,
        description,
        price,
        discountPercent: 0,
        category,
        imageUrl: img(slug),
        stock,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();
  console.log(remove ? 'Demo products removed.' : `Added ${PRODUCTS.length} demo products.`);
}

main().catch((e) => {
  console.error('Failed:', e && e.message ? e.message : e);
  process.exit(1);
});
