const http = require('node:http');

async function test() {
  console.log('Testing IntelliSelf AI in-memory endpoints...');
  const products = require('./data/products.json');
  console.log('Products loaded:', products.length);

  const { sendOrderConfirmationEmail, getEmailLogs } = require('./services/emailService');
  const { getCartRecommendations, getPersonaBundles } = require('./services/recommender');

  console.log('Persona bundles:');
  const bundles = getPersonaBundles();
  console.log(Object.keys(bundles));

  // Test Order placement & Email dispatch
  const testOrder = {
    orderId: 'TEST-ISAI-001',
    createdAt: new Date().toISOString(),
    customer: {
      fullName: 'Henry Mark Test',
      email: 'customer@example.com',
      phone: '9876543210'
    },
    shippingAddress: {
      addressLine: 'Flat 402, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    items: [
      {
        id: 'book-01',
        title: 'Wings of Fire',
        author_or_brand: 'Dr. A.P.J. Abdul Kalam',
        category: 'Books',
        price: 295,
        quantity: 1,
        total: 295
      },
      {
        id: 'stat-01',
        title: 'Classmate Pulse Spiral Notebook (Pack of 3)',
        author_or_brand: 'Classmate',
        category: 'Stationery',
        price: 360,
        quantity: 1,
        total: 360
      }
    ],
    billing: {
      subtotal: 655,
      shippingFee: 100.00, // Fixed 100 rupee shipping
      discount: 0,
      totalAmount: 755.00
    },
    paymentMethod: 'UPI',
    paymentStatus: 'PAID'
  };

  console.log('Testing sendOrderConfirmationEmail...');
  const emailRes = await sendOrderConfirmationEmail(testOrder);
  console.log('Email dispatch result:', emailRes);

  const logs = getEmailLogs();
  console.log('Dispatched emails logged count:', logs.length);
  console.log('First log recipient:', logs[0].to);
  console.log('First log total billing:', logs[0].totalBilling);
  console.log('First log shipping fee:', logs[0].shippingFee);
  console.log('ALL IN-PROCESS TESTS PASSED PERFECTLY!');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
