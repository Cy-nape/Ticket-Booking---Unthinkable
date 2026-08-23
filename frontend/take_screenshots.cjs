const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  // 1. Home Page Screenshot
  console.log("Capturing Home Page...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'public/screenshots/1-home.png' });

  // 2. Login & Register Screenshot
  console.log("Capturing Login Page...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'public/screenshots/2-login.png' });

  // 3. Register a test user to ensure login works
  console.log("Registering test user...");
  try {
      await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "demo@example.com", password: "password123", role: "CUSTOMER" })
      });
  } catch(e) {}

  // Login
  console.log("Logging in...");
  await page.type('input[type="email"]', 'demo@example.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  // 4. Get Event ID and Go to Seat Map
  console.log("Capturing Seat Map...");
  const eventsRes = await fetch('http://localhost:8000/events');
  const events = await eventsRes.json();
  if (events.length > 0) {
    const eventId = events[0].id;
    await page.goto(`http://localhost:5173/events/${eventId}`, { waitUntil: 'networkidle0' });
    
    // Wait for websocket/seats to load
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'public/screenshots/3-seatmap.png' });
    
    // Click a seat to show the checkout panel and popup
    console.log("Clicking a seat to show hold state...");
    // Find the first available seat (teal color)
    await page.evaluate(() => {
        const availableSeats = document.querySelectorAll('.bg-teal-500\\/20');
        if (availableSeats.length > 0) {
            availableSeats[0].click();
        }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'public/screenshots/4-checkout.png' });
  }

  // 5. Dashboard Screenshot
  console.log("Capturing Dashboard...");
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'public/screenshots/5-dashboard.png' });

  await browser.close();
  console.log("Done!");
})();
