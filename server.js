const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const products = require('./data/products.json');
const { sendOrderConfirmationEmail, getEmailLogs } = require('./services/emailService');
const { getCartRecommendations, getRelatedProducts, getPersonaBundles } = require('./services/recommender');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, 'public');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper to read orders
function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (e) {
    return [];
  }
}

// Helper to save order
function saveOrder(order) {
  const orders = readOrders();
  orders.unshift(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Helper to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper to parse POST request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2e6) { // 2MB safety limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Static file server with directory fallback to index.html
function serveStaticFile(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    if (stats.isDirectory()) {
      const indexCandidate = path.join(filePath, 'index.html');
      if (fs.existsSync(indexCandidate)) {
        return serveStaticFile(indexCandidate, res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // Parse URL modern WHATWG standard
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:' + PORT}`);
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // GET /api/products
  if (req.method === 'GET' && pathname === '/api/products') {
    let filtered = [...products];

    // Category filter: "Books" or "Stationery"
    if (query.category && query.category.toLowerCase() !== 'all') {
      filtered = filtered.filter(p => p.category.toLowerCase() === query.category.toLowerCase());
    }

    // Subcategory filter
    if (query.subCategory && query.subCategory.toLowerCase() !== 'all') {
      filtered = filtered.filter(p => p.subCategory.toLowerCase() === query.subCategory.toLowerCase());
    }

    // Search filter (title, author, tags)
    if (query.search) {
      const q = query.search.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.author_or_brand.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Min / Max price
    if (query.minPrice) {
      filtered = filtered.filter(p => p.price >= Number(query.minPrice));
    }
    if (query.maxPrice) {
      filtered = filtered.filter(p => p.price <= Number(query.maxPrice));
    }

    // Sorting
    if (query.sort) {
      switch (query.sort) {
        case 'price_low_high':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price_high_low':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'popular':
        default:
          filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
          break;
      }
    }

    return sendJSON(res, 200, {
      total: filtered.length,
      totalCatalogSize: products.length,
      products: filtered
    });
  }

  // GET /api/products/:id
  if (req.method === 'GET' && pathname.startsWith('/api/products/')) {
    const id = pathname.replace('/api/products/', '');
    const product = products.find(p => p.id === id);
    if (!product) {
      return sendJSON(res, 404, { error: 'Product not found' });
    }
    const related = getRelatedProducts(id, 4);
    return sendJSON(res, 200, { product, related });
  }

  // GET /api/recommendations/personas
  if (req.method === 'GET' && pathname === '/api/recommendations/personas') {
    const bundles = getPersonaBundles();
    return sendJSON(res, 200, { personas: bundles });
  }

  // POST /api/recommendations/cart
  if (req.method === 'POST' && pathname === '/api/recommendations/cart') {
    try {
      const body = await parseRequestBody(req);
      const cartItemIds = body.cartItemIds || [];
      const recommendations = getCartRecommendations(cartItemIds, 4);
      return sendJSON(res, 200, { recommendations });
    } catch (err) {
      return sendJSON(res, 400, { error: err.message });
    }
  }

  // POST /api/orders (Checkout & Email Dispatch)
  if (req.method === 'POST' && pathname === '/api/orders') {
    try {
      const body = await parseRequestBody(req);
      const { customer, shippingAddress, items, paymentMethod, promoCode } = body;

      if (!items || !items.length) {
        return sendJSON(res, 400, { error: 'Cannot checkout with an empty cart' });
      }

      if (!customer || !customer.fullName || !customer.phone || !customer.email) {
        return sendJSON(res, 400, { error: 'Customer name, phone, and email are required' });
      }

      if (!shippingAddress || !shippingAddress.addressLine || !shippingAddress.pincode) {
        return sendJSON(res, 400, { error: 'Valid delivery address and pincode are required' });
      }

      // Calculate Subtotal
      let itemsSubtotal = 0;
      const orderItems = items.map(cartItem => {
        const prod = products.find(p => p.id === cartItem.id);
        const price = prod ? prod.price : cartItem.price;
        const qty = Math.max(1, parseInt(cartItem.quantity || 1, 10));
        itemsSubtotal += price * qty;
        return {
          id: cartItem.id,
          title: prod ? prod.title : cartItem.title,
          author_or_brand: prod ? prod.author_or_brand : '',
          category: prod ? prod.category : 'General',
          price: price,
          quantity: qty,
          total: price * qty
        };
      });

      // Fixed Shipping Amount = 100 Rupee as required
      const SHIPPING_AMOUNT = 100.00;

      // Calculate Discount
      let discountAmount = 0;
      if (promoCode) {
        const code = promoCode.toUpperCase().trim();
        if (code === 'INTELLI10') {
          discountAmount = Math.round(itemsSubtotal * 0.10);
        } else if (code === 'WELCOME50') {
          discountAmount = 50;
        }
      }

      // Total Billing = Subtotal - Discount + Fixed Shipping (₹100)
      const totalBillingAmount = Math.max(0, itemsSubtotal - discountAmount + SHIPPING_AMOUNT);

      // Create Order Record
      const orderId = 'ISAI-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      const order = {
        orderId: orderId,
        createdAt: new Date().toISOString(),
        customer: {
          fullName: customer.fullName.trim(),
          email: customer.email.trim(),
          phone: customer.phone.trim()
        },
        shippingAddress: {
          addressLine: shippingAddress.addressLine.trim(),
          city: shippingAddress.city || 'New Delhi',
          state: shippingAddress.state || 'Delhi',
          pincode: shippingAddress.pincode.trim(),
          country: 'India'
        },
        items: orderItems,
        billing: {
          subtotal: itemsSubtotal,
          shippingFee: SHIPPING_AMOUNT, // Required 100 rupee shipping
          discount: discountAmount,
          promoCode: promoCode || null,
          totalAmount: totalBillingAmount
        },
        paymentMethod: paymentMethod || 'UPI',
        paymentStatus: 'PAID',
        paymentReference: 'TXN-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        orderStatus: 'CONFIRMED'
      };

      // Save order to persistent store
      saveOrder(order);

      // Send Order Confirmation Email to henrymark0076@gmail.com
      const emailResult = await sendOrderConfirmationEmail(order);

      return sendJSON(res, 201, {
        success: true,
        message: 'Order placed successfully and confirmation email dispatched!',
        order: order,
        emailDispatch: emailResult
      });
    } catch (err) {
      console.error('Checkout error:', err);
      return sendJSON(res, 500, { error: 'Failed to process order: ' + err.message });
    }
  }

  // GET /api/orders
  if (req.method === 'GET' && pathname === '/api/orders') {
    const orders = readOrders();
    return sendJSON(res, 200, { total: orders.length, orders });
  }

  // GET /api/dispatched-emails (To inspect email log sent to henrymark0076@gmail.com)
  if (req.method === 'GET' && pathname === '/api/dispatched-emails') {
    const logs = getEmailLogs();
    return sendJSON(res, 200, { total: logs.length, logs });
  }

  // -------------------------------------------------------------
  // STATIC ASSETS SERVING (ROBUST CROSS-PLATFORM)
  // -------------------------------------------------------------
  let rawFile = pathname === '/' || pathname === '' ? 'index.html' : pathname;
  // Remove leading slashes
  rawFile = rawFile.replace(/^[\/\\]+/, '');
  // Normalize
  const normalizedFile = path.normalize(rawFile).replace(/^(\.\.[\/\\])+/, '');
  const targetFile = path.resolve(PUBLIC_DIR, normalizedFile);

  // Security check: ensure target stays inside PUBLIC_DIR
  if (!targetFile.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  serveStaticFile(targetFile, res);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ IntelliSelf AI Server running at http://localhost:${PORT}`);
  console.log(`📦 Loaded ${products.length} Indian Books & Stationery items`);
  console.log(`✉️ Order Confirmations route to: henrymark0076@gmail.com`);
  console.log(`🚚 Standard Shipping configured: ₹100`);
  console.log(`=======================================================`);
});
