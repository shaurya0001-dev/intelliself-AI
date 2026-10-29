const products = require('../data/products.json');

/**
 * Persona bundles for IntelliSelf AI Smart Curations
 */
const PERSONAS = {
  upsc: {
    title: "UPSC & Civil Services Aspirant Kit",
    badge: "Most Popular",
    description: "Curated essential syllabus bibles, high-durability spiral notebooks, and pastel/neon highlighters for extensive revision.",
    itemIds: ["book-06", "book-07", "stat-01", "stat-12", "stat-07", "stat-18"]
  },
  jee: {
    title: "IIT-JEE & NEET Science Scholar Set",
    badge: "Top STEM Pick",
    description: "Foundational conceptual physics, rigorous mathematics, precision geometry, and smooth high-speed ball pens.",
    itemIds: ["book-09", "book-10", "stat-04", "stat-03", "stat-21", "stat-15"]
  },
  art: {
    title: "Creative Artist & Calligraphy Atelier",
    badge: "Creative Choice",
    description: "Heavyweight acid-free sketchbooks, flexible calligraphy brush pens, watercolor sets, and precision trimming instruments.",
    itemIds: ["stat-22", "stat-06", "stat-23", "stat-11", "stat-26"]
  },
  literature: {
    title: "Indian Classics & Philosophy Connoisseur",
    badge: "Intellectual Journey",
    description: "Timeless Indian masterworks by Kalam, Tagore, Narayan, and Gandhi paired with a classic Parker Vector fountain pen.",
    itemIds: ["book-01", "book-16", "book-24", "book-05", "stat-09"]
  },
  office: {
    title: "Modern Executive & Office Productivity Kit",
    badge: "Workplace Essential",
    description: "Solo expanding organizers, steel staplers, repositionable index tabs, and smooth rollerball pens.",
    itemIds: ["stat-24", "stat-16", "stat-19", "stat-10", "stat-18"]
  }
};

/**
 * Get recommendations based on current cart items
 */
function getCartRecommendations(cartItemIds = [], limit = 4) {
  if (!cartItemIds || cartItemIds.length === 0) {
    // Default bestsellers if empty
    return products.filter(p => p.badge && (p.badge.includes('Bestseller') || p.rating >= 4.8)).slice(0, limit);
  }

  // Find tags and categories of in-cart products
  const cartProducts = products.filter(p => cartItemIds.includes(p.id));
  const activeTags = new Set();
  const hasBooks = cartProducts.some(p => p.category === 'Books');
  const hasStationery = cartProducts.some(p => p.category === 'Stationery');

  cartProducts.forEach(p => {
    (p.tags || []).forEach(t => activeTags.add(t.toLowerCase()));
  });

  // Calculate recommendation score for remaining products
  const scored = products
    .filter(p => !cartItemIds.includes(p.id))
    .map(p => {
      let score = 0;
      
      // Tag overlap
      (p.tags || []).forEach(t => {
        if (activeTags.has(t.toLowerCase())) score += 3;
      });

      // Cross-category synergy (Books + Stationery match)
      if (hasBooks && p.category === 'Stationery') score += 4;
      if (hasStationery && p.category === 'Books') score += 4;

      // Quality signal
      score += (p.rating || 4.5);

      return { product: p, score };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.product);
}

/**
 * Get recommendations for a single product (PDP / Drawer)
 */
function getRelatedProducts(productId, limit = 4) {
  const current = products.find(p => p.id === productId);
  if (!current) return products.slice(0, limit);

  const tags = new Set((current.tags || []).map(t => t.toLowerCase()));

  const candidates = products
    .filter(p => p.id !== productId)
    .map(p => {
      let score = 0;
      // Tag matching
      (p.tags || []).forEach(t => {
        if (tags.has(t.toLowerCase())) score += 4;
      });
      // Sub-category matching
      if (p.subCategory === current.subCategory) score += 5;
      // Cross-category complement (if book -> stationery highlighters/notebooks)
      if (current.category === 'Books' && p.tags && (p.tags.includes('study') || p.tags.includes('highlighters') || p.tags.includes('notebook'))) {
        score += 6;
      }
      return { product: p, score };
    });

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit).map(c => c.product);
}

/**
 * Get persona bundles with enriched product data
 */
function getPersonaBundles() {
  const result = {};
  for (const [key, bundle] of Object.entries(PERSONAS)) {
    const items = bundle.itemIds
      .map(id => products.find(p => p.id === id))
      .filter(Boolean);

    const totalBundlePrice = items.reduce((sum, item) => sum + item.price, 0);
    const totalOriginalPrice = items.reduce((sum, item) => sum + item.originalPrice, 0);

    result[key] = {
      ...bundle,
      items,
      totalBundlePrice,
      totalOriginalPrice,
      bundleDiscount: Math.round(((totalOriginalPrice - totalBundlePrice) / totalOriginalPrice) * 100)
    };
  }
  return result;
}

module.exports = {
  getCartRecommendations,
  getRelatedProducts,
  getPersonaBundles,
  PERSONAS
};
