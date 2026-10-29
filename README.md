# IntelliSelf AI — Indian Books & Stationery E-Commerce Platform

IntelliSelf AI is a modern full-stack e-commerce web application specializing in Indian literature, academic and competitive exam preparation texts (UPSC, IIT-JEE, NEET, Board Guides), and authentic Indian scholastic stationery brands (Classmate, Camlin, Doms, Reynolds, Parker, Faber-Castell).

---

## 🌟 Key Features

1. **Rich Indian Catalog (54+ Curated Items)**:
   - **27 Popular Indian Books**: *Wings of Fire*, *The Shiva Trilogy*, *Indian Polity (Laxmikanth)*, *Concepts of Physics (H.C. Verma)*, *Malgudi Days*, *The Palace of Illusions*, *The Discovery of India*, *Gita Press Bhagavad Gita*, Sudha Murty titles, and more.
   - **27 Authentic Stationery Essentials**: Classmate Spiral Notebooks, Camlin Kokuyo Exam Boards & Geometry Sets, Doms Groove Pencils & Brush Pens, Reynolds Trimax, Parker Vector Fountain Pens, 3M Post-it notes, Kangaro Staplers, and Brustro Sketchbooks.

2. **IntelliSelf AI Recommendation Engine**:
   - **Study & Career Persona Bundles**: Instant 1-click tailored sets for:
     - 🎓 *UPSC & Civil Services Aspirant*
     - 🔬 *IIT-JEE & NEET Science Scholar*
     - 🎨 *Creative Artist & Calligrapher*
     - 📖 *Indian Classics & Philosophy Connoisseur*
     - 💼 *Modern Executive Desk*
   - **In-Bag "Frequently Bought Together" Upsells**: Dynamically pairs complementary stationery with selected books and vice versa.

3. **Cart & Shipping Calculation**:
   - Dynamic slide-over shopping bag with item quantity modification.
   - **Fixed ₹100 Shipping & Freight** automatically applied across all Indian destinations.
   - Promo code discounts (e.g. `INTELLI10` for 10% off, `WELCOME50` for ₹50 off).

4. **Multi-Method Checkout & Payment**:
   - 📱 **UPI / QR Code**: Google Pay, PhonePe, Paytm, BHIM.
   - 💳 **Credit / Debit Cards**: RuPay, Visa, MasterCard.
   - 🏦 **Net Banking**: SBI, HDFC, ICICI, Axis Bank.
   - 💵 **Cash on Delivery (COD)**.

5. **Automated Order Confirmation & Dispatch to `henrymark0076@gmail.com`**:
   - Itemized order confirmation sent directly to **`henrymark0076@gmail.com`**.
   - Contains order ID, customer details, shipping address, product list, subtotal, ₹100 shipping fee, and grand total.
   - Persistent email audit ledger (`/api/dispatched-emails`) viewable in-app.
   - Printable / downloadable PDF invoice for customers.

---

## 🚀 Running the Project

### Start the Server:
```bash
node server.js
```
Then visit:
```
http://localhost:3000
```

### Optional Live SMTP Configuration:
Create a `.env` file or export environment variables:
```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```
*(If no SMTP credentials are provided, the server uses safe simulated delivery and persists full receipts to the audit ledger at `data/dispatched_emails.json`)*.
