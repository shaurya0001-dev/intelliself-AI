/**
 * IntelliSelf AI - Frontend Application Controller
 * Handles 54-item Catalog, AI Recommendation Engine, Cart Drawer,
 * Interactive Working UPI QR Code & Multi-Method Checkout
 */

// Application State
const state = {
  products: [],
  personas: {},
  activePersonaKey: 'upsc',
  cart: [],
  activeCategory: 'all',
  activeSubCategory: 'all',
  searchQuery: '',
  sortBy: 'popular',
  promoCode: '',
  discountAmount: 0,
  SHIPPING_FEE: 100.00, // Standard delivery fee
  selectedPaymentMethod: 'UPI',
  isUpiVerified: false
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  loadCartFromStorage();
  await Promise.all([
    fetchProducts(),
    fetchPersonaBundles()
  ]);
  setupEventListeners();
  renderAll();
});

// Load cart from localStorage
function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('intelliself_cart');
    if (saved) {
      state.cart = JSON.parse(saved);
    }
  } catch (e) {
    state.cart = [];
  }
}

// Persist cart to localStorage
function saveCartToStorage() {
  try {
    localStorage.setItem('intelliself_cart', JSON.stringify(state.cart));
  } catch (e) {
    console.error('Failed to save cart to localStorage:', e);
  }
}

// Fetch products from backend API
async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    state.products = data.products || [];
  } catch (err) {
    console.error('Failed to fetch products:', err);
  }
}

// Fetch persona bundles from backend API
async function fetchPersonaBundles() {
  try {
    const res = await fetch('/api/recommendations/personas');
    const data = await res.json();
    state.personas = data.personas || {};
  } catch (err) {
    console.error('Failed to fetch persona bundles:', err);
  }
}

// Setup DOM Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const mobileSearchInput = document.getElementById('mobileSearchInput');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      toggleClearSearchBtn(!!state.searchQuery);
      renderProductGrid();
    });
  }

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderProductGrid();
    });
  }
}

function toggleClearSearchBtn(show) {
  const btn = document.getElementById('clearSearchBtn');
  if (btn) {
    btn.classList.toggle('hidden', !show);
  }
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  if (searchInput) searchInput.value = '';
  if (mobileSearchInput) mobileSearchInput.value = '';
  state.searchQuery = '';
  toggleClearSearchBtn(false);
  renderProductGrid();
}

// Master Render Function
function renderAll() {
  renderPersonaTabs();
  renderActivePersona();
  renderSubCategoryFilters();
  renderProductGrid();
  updateCartBadge();
  if (window.lucide) window.lucide.createIcons();
}

// -------------------------------------------------------------
// AI RECOMMENDATIONS & PERSONA BUNDLES
// -------------------------------------------------------------

function renderPersonaTabs() {
  const container = document.getElementById('personaTabsContainer');
  if (!container || !state.personas) return;

  const tabs = [
    { key: 'upsc', label: '🎓 UPSC Aspirant' },
    { key: 'jee', label: '🔬 JEE & NEET Scholar' },
    { key: 'art', label: '🎨 Artist Atelier' },
    { key: 'literature', label: '📖 Indian Classics' },
    { key: 'office', label: '💼 Executive Desk' }
  ];

  container.innerHTML = tabs.map(tab => {
    const isActive = state.activePersonaKey === tab.key;
    return `
      <button 
        onclick="setActivePersona('${tab.key}')" 
        class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-sm' 
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        }">
        ${tab.label}
      </button>
    `;
  }).join('');
}

function setActivePersona(key) {
  state.activePersonaKey = key;
  renderPersonaTabs();
  renderActivePersona();
  if (window.lucide) window.lucide.createIcons();
}

function renderActivePersona() {
  const card = document.getElementById('activePersonaCard');
  if (!card) return;

  const bundle = state.personas[state.activePersonaKey];
  if (!bundle) return;

  const itemsHTML = bundle.items.map(item => `
    <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white transition">
      <img src="${item.image}" alt="${item.title}" class="w-12 h-14 object-cover rounded-lg shrink-0 shadow-sm" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'"/>
      <div class="flex-1 min-w-0">
        <h5 class="text-xs font-bold text-slate-800 truncate">${item.title}</h5>
        <p class="text-[11px] text-slate-500 truncate">${item.author_or_brand} • <span class="text-blue-600 font-semibold">₹${item.price}</span></p>
      </div>
      <button onclick="addToCart('${item.id}', 1)" title="Add single item" class="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 shrink-0">
        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  `).join('');

  card.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div class="lg:col-span-5 space-y-3">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
            ${bundle.badge || 'AI Curated Kit'}
          </span>
          <span class="text-xs text-slate-400 font-medium">${bundle.items.length} Synergy Items</span>
        </div>
        <h3 class="text-xl font-bold text-slate-900">${bundle.title}</h3>
        <p class="text-xs text-slate-600 leading-relaxed">${bundle.description}</p>
        
        <div class="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
          <div>
            <span class="text-[11px] text-slate-500 block">Bundle Special Price</span>
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-extrabold text-indigo-900">₹${bundle.totalBundlePrice}</span>
              <span class="text-xs text-slate-400 line-through">₹${bundle.totalOriginalPrice}</span>
              <span class="text-xs font-bold text-emerald-600">${bundle.bundleDiscount}% OFF</span>
            </div>
          </div>
          <button 
            onclick="addPersonaBundleToCart('${state.activePersonaKey}')" 
            class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            <span>Add Complete Bundle</span>
          </button>
        </div>
      </div>

      <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        ${itemsHTML}
      </div>
    </div>
  `;
}

function addPersonaBundleToCart(key) {
  const bundle = state.personas[key];
  if (!bundle) return;

  bundle.items.forEach(item => {
    const existing = state.cart.find(c => c.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id: item.id,
        title: item.title,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        author_or_brand: item.author_or_brand,
        category: item.category,
        quantity: 1
      });
    }
  });

  saveCartToStorage();
  updateCartBadge();
  toggleCartDrawer(true);
  showToast(`Added ${bundle.items.length} items from ${bundle.title} to your bag!`);
}

// -------------------------------------------------------------
// FILTERING & PRODUCT GRID
// -------------------------------------------------------------

function setCategoryFilter(category) {
  state.activeCategory = category;
  state.activeSubCategory = 'all';

  document.querySelectorAll('#categoryPills .cat-pill').forEach(btn => {
    if (btn.getAttribute('data-cat') === category) {
      btn.className = 'cat-pill active px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition bg-blue-600 text-white';
    } else {
      btn.className = 'cat-pill px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition bg-slate-100 text-slate-700 hover:bg-slate-200';
    }
  });

  renderSubCategoryFilters();
  renderProductGrid();
}

function renderSubCategoryFilters() {
  const container = document.getElementById('subCategoryPills');
  if (!container) return;

  let availableSubs = new Set();
  state.products.forEach(p => {
    if (state.activeCategory === 'all' || p.category.toLowerCase() === state.activeCategory.toLowerCase()) {
      if (p.subCategory) availableSubs.add(p.subCategory);
    }
  });

  const list = ['all', ...Array.from(availableSubs)];

  container.innerHTML = list.map(sub => {
    const isSelected = state.activeSubCategory === sub;
    const label = sub === 'all' ? 'All Subcategories' : sub;
    return `
      <button 
        onclick="setSubCategoryFilter('${sub}')" 
        class="px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
          isSelected 
            ? 'bg-slate-800 text-white' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }">
        ${label}
      </button>
    `;
  }).join('');
}

function setSubCategoryFilter(sub) {
  state.activeSubCategory = sub;
  renderSubCategoryFilters();
  renderProductGrid();
}

function handleSortChange(sortVal) {
  state.sortBy = sortVal;
  renderProductGrid();
}

function resetFilters() {
  state.activeCategory = 'all';
  state.activeSubCategory = 'all';
  state.searchQuery = '';
  state.sortBy = 'popular';
  
  const searchInput = document.getElementById('searchInput');
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  const sortSelect = document.getElementById('sortSelect');
  if (searchInput) searchInput.value = '';
  if (mobileSearchInput) mobileSearchInput.value = '';
  if (sortSelect) sortSelect.value = 'popular';

  toggleClearSearchBtn(false);
  setCategoryFilter('all');
}

function getFilteredProducts() {
  let list = [...state.products];

  // Category filter
  if (state.activeCategory !== 'all') {
    list = list.filter(p => p.category.toLowerCase() === state.activeCategory.toLowerCase());
  }

  // Subcategory filter
  if (state.activeSubCategory !== 'all') {
    list = list.filter(p => p.subCategory === state.activeSubCategory);
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.author_or_brand.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  // Sort
  switch (state.sortBy) {
    case 'price_low_high':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price_high_low':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      list.sort((a, b) => b.rating - a.rating);
      break;
    case 'popular':
    default:
      list.sort((a, b) => b.reviewsCount - a.reviewsCount);
      break;
  }

  return list;
}

function renderProductGrid() {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyCatalogState');
  const countLabel = document.getElementById('productCountLabel');
  if (!grid) return;

  const filtered = getFilteredProducts();

  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} of ${state.products.length} items`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  grid.innerHTML = filtered.map(item => {
    return `
      <div class="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-200">
        
        <!-- Image & Badges -->
        <div class="relative h-56 bg-slate-100 overflow-hidden cursor-pointer" onclick="openProductModal('${item.id}')">
          <img 
            src="${item.image}" 
            alt="${item.title}" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
            onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'"
          />
          
          <!-- Category & Badge -->
          <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-900/80 backdrop-blur text-white shadow-sm">
              ${item.category === 'Books' ? '📖 Book' : '✏️ Stationery'}
            </span>
            ${item.badge ? `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-sm">
                ${item.badge}
              </span>
            ` : ''}
          </div>

          <!-- Quick view icon overlay -->
          <div class="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <span class="px-3 py-1.5 bg-white/95 rounded-full text-xs font-bold text-slate-800 shadow flex items-center gap-1">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> Quick View
            </span>
          </div>
        </div>

        <!-- Product Details -->
        <div class="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span class="truncate font-medium text-slate-500">${item.author_or_brand}</span>
              <span class="flex items-center gap-0.5 text-amber-500 font-bold">
                <i data-lucide="star" class="w-3 h-3 fill-amber-400 text-amber-400"></i>
                ${item.rating}
              </span>
            </div>

            <h4 
              onclick="openProductModal('${item.id}')"
              class="text-sm font-bold text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition leading-snug">
              ${item.title}
            </h4>
          </div>

          <!-- Price & Add Button -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-base font-extrabold text-slate-900">₹${item.price}</span>
                <span class="text-xs text-slate-400 line-through">₹${item.originalPrice}</span>
              </div>
              <span class="text-[10px] font-bold text-emerald-600">${item.discount}</span>
            </div>

            <button 
              onclick="addToCart('${item.id}', 1)" 
              class="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm">
              <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
              <span>Add</span>
            </button>
          </div>

        </div>

      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// -------------------------------------------------------------
// CART & BILLING CALCULATIONS
// -------------------------------------------------------------

function addToCart(productId, qty = 1) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  const existing = state.cart.find(c => c.id === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    state.cart.push({
      id: prod.id,
      title: prod.title,
      price: prod.price,
      originalPrice: prod.originalPrice,
      image: prod.image,
      author_or_brand: prod.author_or_brand,
      category: prod.category,
      quantity: qty
    });
  }

  saveCartToStorage();
  updateCartBadge();
  renderCartDrawer();
  toggleCartDrawer(true);
  showToast(`Added "${prod.title.slice(0, 24)}..." to bag`);
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.find(c => c.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCartToStorage();
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(c => c.id !== productId);
  saveCartToStorage();
  updateCartBadge();
  renderCartDrawer();
}

function updateCartBadge() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cartCountBadge');
  const drawerCount = document.getElementById('cartDrawerItemCount');
  if (badge) badge.textContent = count;
  if (drawerCount) drawerCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
}

function calculateCartTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = state.cart.length > 0 ? state.SHIPPING_FEE : 0;

  let discount = 0;
  if (state.promoCode === 'INTELLI10') {
    discount = Math.round(subtotal * 0.10);
  } else if (state.promoCode === 'WELCOME50') {
    discount = 50;
  }

  const grandTotal = Math.max(0, subtotal - discount + shippingFee);

  return { subtotal, shippingFee, discount, grandTotal };
}

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  const panel = document.getElementById('cartPanel');

  if (open) {
    drawer.classList.remove('pointer-events-none');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100', 'pointer-events-auto');
    panel.classList.remove('translate-x-full');
    renderCartDrawer();
    fetchCartUpsells();
  } else {
    backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    panel.classList.add('translate-x-full');
    setTimeout(() => {
      drawer.classList.add('pointer-events-none');
    }, 300);
  }
}

function renderCartDrawer() {
  const list = document.getElementById('cartItemsList');
  const subtotalText = document.getElementById('cartSubtotalText');
  const discountRow = document.getElementById('promoDiscountRow');
  const discountText = document.getElementById('cartDiscountText');
  const grandTotalText = document.getElementById('cartGrandTotalText');
  const checkoutBtn = document.getElementById('proceedToCheckoutBtn');

  if (!list) return;

  const { subtotal, shippingFee, discount, grandTotal } = calculateCartTotals();

  if (state.cart.length === 0) {
    list.innerHTML = `
      <div class="py-12 text-center space-y-3">
        <div class="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <i data-lucide="shopping-bag" class="w-8 h-8"></i>
        </div>
        <h4 class="text-base font-bold text-slate-800">Your bag is empty</h4>
        <p class="text-xs text-slate-500 max-w-xs mx-auto">Discover 50+ classic Indian literature and premium stationery tools!</p>
        <button onclick="toggleCartDrawer(false)" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
          Explore Catalog
        </button>
      </div>
    `;

    if (subtotalText) subtotalText.textContent = '₹0.00';
    if (discountRow) discountRow.classList.add('hidden');
    if (grandTotalText) grandTotalText.textContent = '₹0.00';
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  list.innerHTML = state.cart.map(item => `
    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <img src="${item.image}" alt="${item.title}" class="w-14 h-16 object-cover rounded-lg shrink-0" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'"/>
      
      <div class="flex-1 min-w-0">
        <h5 class="text-xs font-bold text-slate-800 truncate">${item.title}</h5>
        <p class="text-[11px] text-slate-500 truncate">${item.author_or_brand}</p>
        <span class="text-xs font-bold text-blue-600">₹${item.price}</span>
      </div>

      <!-- Quantity controls -->
      <div class="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shrink-0">
        <button onclick="updateCartQuantity('${item.id}', -1)" class="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold">-</button>
        <span class="px-2 text-xs font-bold text-slate-800">${item.quantity}</span>
        <button onclick="updateCartQuantity('${item.id}', 1)" class="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold">+</button>
      </div>

      <!-- Remove button -->
      <button onclick="removeFromCart('${item.id}')" class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition shrink-0">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  `).join('');

  if (subtotalText) subtotalText.textContent = `₹${subtotal.toFixed(2)}`;
  
  if (discount > 0 && discountRow && discountText) {
    discountRow.classList.remove('hidden');
    discountRow.classList.add('flex');
    discountText.textContent = `-₹${discount.toFixed(2)}`;
  } else if (discountRow) {
    discountRow.classList.add('hidden');
    discountRow.classList.remove('flex');
  }

  if (grandTotalText) grandTotalText.textContent = `₹${grandTotal.toFixed(2)}`;
  if (window.lucide) window.lucide.createIcons();
}

async function fetchCartUpsells() {
  const container = document.getElementById('cartUpsellItems');
  if (!container || state.cart.length === 0) return;

  try {
    const res = await fetch('/api/recommendations/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItemIds: state.cart.map(c => c.id) })
    });
    const data = await res.json();
    const items = data.recommendations || [];

    if (items.length === 0) {
      container.innerHTML = `<p class="text-[11px] text-slate-400">Your basket looks well-rounded!</p>`;
      return;
    }

    container.innerHTML = items.slice(0, 2).map(item => `
      <div class="flex items-center justify-between p-2 rounded-lg bg-white border border-indigo-100">
        <div class="flex items-center gap-2 min-w-0">
          <img src="${item.image}" alt="${item.title}" class="w-8 h-10 object-cover rounded shrink-0"/>
          <div class="truncate">
            <h6 class="text-[11px] font-bold text-slate-800 truncate">${item.title}</h6>
            <span class="text-[11px] font-bold text-indigo-700">₹${item.price}</span>
          </div>
        </div>
        <button onclick="addToCart('${item.id}', 1)" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-md text-[11px] font-bold shrink-0 transition">
          + Add
        </button>
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load cart upsells:', e);
  }
}

function applyPromoCode() {
  const input = document.getElementById('promoInput');
  const msg = document.getElementById('promoMessage');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (code === 'INTELLI10') {
    state.promoCode = code;
    if (msg) {
      msg.textContent = '✓ 10% coupon INTELLI10 applied!';
      msg.className = 'text-xs text-emerald-600 font-bold block';
    }
  } else if (code === 'WELCOME50') {
    state.promoCode = code;
    if (msg) {
      msg.textContent = '✓ ₹50 discount WELCOME50 applied!';
      msg.className = 'text-xs text-emerald-600 font-bold block';
    }
  } else {
    state.promoCode = '';
    if (msg) {
      msg.textContent = 'Invalid promo code. Try INTELLI10';
      msg.className = 'text-xs text-red-500 block';
    }
  }

  renderCartDrawer();
}

// -------------------------------------------------------------
// CHECKOUT, PAYMENT SWITCHER & FUNCTIONAL UPI QR CODE
// -------------------------------------------------------------

function generateUpiQrCode(amount) {
  // UPI Deep Link Specification
  const upiId = "intelliself@icici";
  const payeeName = "IntelliSelf AI";
  const note = "Books and Stationery Order";
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  const qrImg = document.getElementById('upiQrCodeImg');
  const amountTag = document.getElementById('qrAmountTag');

  if (amountTag) {
    amountTag.textContent = `Scan to Pay: ₹${amount.toFixed(2)}`;
  }

  if (qrImg) {
    // Generate high-resolution scannable QR Code via dynamic QR engine
    const encodedUpiUri = encodeURIComponent(upiUri);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodedUpiUri}&color=0f172a&bgcolor=ffffff&qzone=1`;
    
    // Set image src with fallback to SVG QR generator
    qrImg.src = qrUrl;
    qrImg.onerror = () => {
      // Fallback SVG representation
      qrImg.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="%23ffffff"/><rect x="15" y="15" width="40" height="40" fill="%230f172a"/><rect x="22" y="22" width="26" height="26" fill="%23ffffff"/><rect x="27" y="27" width="16" height="16" fill="%230f172a"/><rect x="105" y="15" width="40" height="40" fill="%230f172a"/><rect x="112" y="22" width="26" height="26" fill="%23ffffff"/><rect x="117" y="27" width="16" height="16" fill="%230f172a"/><rect x="15" y="105" width="40" height="40" fill="%230f172a"/><rect x="22" y="112" width="26" height="26" fill="%23ffffff"/><rect x="27" y="117" width="16" height="16" fill="%230f172a"/><rect x="65" y="25" width="12" height="12" fill="%230f172a"/><rect x="80" y="40" width="12" height="12" fill="%230f172a"/><rect x="65" y="70" width="28" height="28" fill="%230f172a"/><rect x="100" y="70" width="12" height="12" fill="%230f172a"/><rect x="70" y="115" width="18" height="18" fill="%230f172a"/><rect x="105" y="105" width="30" height="30" fill="%230f172a"/><text x="80" y="88" font-size="9" fill="%23ffffff" text-anchor="middle" font-family="sans-serif" font-weight="bold">UPI</text></svg>`;
    };
  }
}

function selectPaymentMethod(method) {
  state.selectedPaymentMethod = method;

  // Toggle button styles
  const methods = ['UPI', 'Card', 'NetBanking', 'COD'];
  methods.forEach(m => {
    const tab = document.getElementById(`tab-${m.toLowerCase()}`);
    const box = document.getElementById(`payment-box-${m.toLowerCase()}`);
    const radio = document.querySelector(`input[name="paymentMethod"][value="${m}"]`);

    if (m === method) {
      if (tab) {
        tab.className = 'pay-method-pill border-2 border-blue-600 bg-blue-50/70 rounded-xl p-3 flex items-start gap-2 cursor-pointer transition shadow-sm';
      }
      if (box) box.classList.remove('hidden');
      if (radio) radio.checked = true;
    } else {
      if (tab) {
        tab.className = 'pay-method-pill border border-slate-200 rounded-xl p-3 flex items-start gap-2 cursor-pointer hover:bg-slate-50 transition';
      }
      if (box) box.classList.add('hidden');
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

function copyUpiId() {
  navigator.clipboard.writeText('intelliself@icici');
  showToast('Copied UPI ID: intelliself@icici');
}

function simulateUpiVerification() {
  state.isUpiVerified = true;
  const badge = document.getElementById('upiStatusBadge');
  const btn = document.getElementById('upiVerifyBtn');

  if (badge) {
    badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-500 flex items-center gap-1';
    badge.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i> Verified via UPI`;
  }
  if (btn) {
    btn.className = 'w-full py-1.5 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5';
    btn.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5"></i><span>✓ UPI Payment Verified</span>`;
  }

  showToast('✓ UPI Payment scan detected & verified!');
  if (window.lucide) window.lucide.createIcons();
}

function verifyUserUpiId() {
  const input = document.getElementById('userUpiIdInput');
  const feedback = document.getElementById('userUpiFeedback');
  if (!input) return;

  const vpa = input.value.trim();
  if (!vpa || !vpa.includes('@')) {
    alert('Please enter a valid UPI ID (e.g., name@okhdfcbank or 9876543210@upi)');
    return;
  }

  state.isUpiVerified = true;
  if (feedback) {
    feedback.textContent = `✓ UPI ID verified for ${vpa.split('@')[0].toUpperCase()} • Ready to pay`;
    feedback.classList.remove('hidden');
  }

  const badge = document.getElementById('upiStatusBadge');
  if (badge) {
    badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-500 flex items-center gap-1';
    badge.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i> UPI Verified`;
  }

  showToast(`Payment request sent to ${vpa}`);
  if (window.lucide) window.lucide.createIcons();
}

function openCheckoutModal() {
  if (state.cart.length === 0) {
    alert('Please add items to your cart before proceeding to checkout.');
    return;
  }

  toggleCartDrawer(false);

  const { subtotal, shippingFee, discount, grandTotal } = calculateCartTotals();

  const subtotalEl = document.getElementById('modalCheckoutSubtotal');
  const discountRow = document.getElementById('modalCheckoutDiscountRow');
  const discountEl = document.getElementById('modalCheckoutDiscount');
  const totalEl = document.getElementById('modalCheckoutTotal');

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  if (discount > 0 && discountRow && discountEl) {
    discountRow.classList.remove('hidden');
    discountRow.classList.add('flex');
    discountEl.textContent = `-₹${discount.toFixed(2)}`;
  } else if (discountRow) {
    discountRow.classList.add('hidden');
    discountRow.classList.remove('flex');
  }
  if (totalEl) totalEl.textContent = `₹${grandTotal.toFixed(2)}`;

  // Generate dynamic scannable QR Code for current grandTotal
  generateUpiQrCode(grandTotal);

  // Default to UPI
  selectPaymentMethod('UPI');

  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('hidden');
}

async function submitOrder(e) {
  e.preventDefault();

  const confirmBtn = document.getElementById('confirmPaymentBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="animate-pulse">Processing Order & Generating Receipt...</span>`;
  }

  // Form inputs
  const fullName = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const addressLine = document.getElementById('addrLine').value.trim();
  const city = document.getElementById('addrCity').value.trim();
  const addrState = document.getElementById('addrState').value.trim();
  const pincode = document.getElementById('addrPincode').value.trim();

  // Selected payment method
  const paymentMethod = state.selectedPaymentMethod || 'UPI';

  const orderPayload = {
    customer: { fullName, phone, email },
    shippingAddress: { addressLine, city, state: addrState, pincode },
    items: state.cart.map(c => ({ id: c.id, quantity: c.quantity, price: c.price, title: c.title })),
    paymentMethod: paymentMethod,
    promoCode: state.promoCode
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to place order');
    }

    // Success! Clear cart & open receipt modal
    state.cart = [];
    state.promoCode = '';
    state.isUpiVerified = false;
    saveCartToStorage();
    updateCartBadge();

    closeCheckoutModal();
    showOrderSuccess(data.order);
  } catch (err) {
    alert('Error processing order: ' + err.message);
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `<i data-lucide="lock" class="w-4 h-4"></i><span>Place Order & Pay</span>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

function showOrderSuccess(order) {
  const modal = document.getElementById('orderSuccessModal');
  if (!modal) return;

  // Populate receipt elements
  document.getElementById('receiptOrderId').textContent = `#${order.orderId}`;
  document.getElementById('receiptDate').textContent = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  document.getElementById('receiptCustomerName').textContent = order.customer.fullName;
  document.getElementById('receiptCustomerPhone').textContent = `+91 ${order.customer.phone}`;
  document.getElementById('receiptCustomerEmail').textContent = order.customer.email;
  document.getElementById('receiptAddress').textContent = `${order.shippingAddress.addressLine}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`;
  document.getElementById('receiptPaymentMethod').textContent = `${order.paymentMethod} (Ref: ${order.paymentReference || 'TXN'})`;

  // Items table
  const tableBody = document.getElementById('receiptItemsTable');
  tableBody.innerHTML = order.items.map(item => `
    <tr class="text-slate-700">
      <td class="py-2 pr-2">
        <strong>${item.title}</strong>
        <span class="block text-[11px] text-slate-400">${item.author_or_brand || ''}</span>
      </td>
      <td class="py-2 text-center">${item.quantity}</td>
      <td class="py-2 text-right">₹${item.price.toFixed(2)}</td>
      <td class="py-2 text-right font-bold">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  // Calculations breakdown
  document.getElementById('receiptSubtotal').textContent = `₹${order.billing.subtotal.toFixed(2)}`;
  document.getElementById('receiptShipping').textContent = `₹${order.billing.shippingFee.toFixed(2)}`;
  
  const discountRow = document.getElementById('receiptDiscountRow');
  const discountVal = document.getElementById('receiptDiscount');
  if (order.billing.discount > 0) {
    discountRow.classList.remove('hidden');
    discountRow.classList.add('flex');
    discountVal.textContent = `-₹${order.billing.discount.toFixed(2)}`;
  } else {
    discountRow.classList.add('hidden');
    discountRow.classList.remove('flex');
  }

  document.getElementById('receiptTotalAmount').textContent = `₹${order.billing.totalAmount.toFixed(2)}`;

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeSuccessModal() {
  const modal = document.getElementById('orderSuccessModal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// PRODUCT QUICK DETAILS MODAL
// -------------------------------------------------------------

async function openProductModal(productId) {
  const modal = document.getElementById('productDetailModal');
  const content = document.getElementById('productDetailContent');
  if (!modal || !content) return;

  const item = state.products.find(p => p.id === productId);
  if (!item) return;

  content.innerHTML = `
    <!-- Image -->
    <div class="h-72 md:h-full bg-slate-100 relative">
      <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover"/>
      <div class="absolute top-4 left-4">
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 backdrop-blur text-white">
          ${item.category} • ${item.subCategory}
        </span>
      </div>
    </div>

    <!-- Info -->
    <div class="p-6 md:p-8 flex flex-col justify-between space-y-4">
      <div>
        <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">${item.author_or_brand}</p>
        <h3 class="text-xl font-black text-slate-900 leading-tight">${item.title}</h3>
        
        <div class="flex items-center gap-2 mt-2">
          <div class="flex items-center text-amber-500 text-xs font-bold">
            <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1"></i>
            ${item.rating}
          </div>
          <span class="text-xs text-slate-400">(${item.reviewsCount.toLocaleString()} verified ratings)</span>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed mt-4">
          ${item.description}
        </p>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5 mt-3">
          ${(item.tags || []).map(t => `<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">#${t}</span>`).join('')}
        </div>
      </div>

      <!-- Pricing & Actions -->
      <div class="pt-4 border-t border-slate-100 space-y-3">
        <div class="flex items-baseline justify-between">
          <div>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-slate-900">₹${item.price}</span>
              <span class="text-sm text-slate-400 line-through">₹${item.originalPrice}</span>
              <span class="text-xs font-bold text-emerald-600">${item.discount}</span>
            </div>
          </div>
          <span class="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-bold">
            ✓ In Stock (${item.stockCount} units)
          </span>
        </div>

        <button 
          onclick="addToCart('${item.id}', 1); closeProductModal();" 
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm">
          <i data-lucide="shopping-bag" class="w-4 h-4"></i>
          <span>Add Item to Bag</span>
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeProductModal() {
  const modal = document.getElementById('productDetailModal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// TOAST NOTIFICATIONS
// -------------------------------------------------------------

function showToast(message) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 opacity-0 transform translate-y-3 flex items-center gap-2';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i><span>${message}</span>`;
  if (window.lucide) window.lucide.createIcons();

  toast.classList.remove('opacity-0', 'translate-y-3');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-3');
  }, 2400);
}
