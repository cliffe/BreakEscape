// Create a game for a mission id: node s6_newgame.mjs <missionId> -> prints the game URL
import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.goto(`http://127.0.0.1:3001/break_escape/missions/${process.argv[2]}`, { waitUntil: 'domcontentloaded' });
const btn = p.locator('form[action*="games"] [type=submit], a[href*="games"], button:has-text("Start"), button:has-text("Play")').first();
await Promise.all([p.waitForURL(/games\/\d+/, { timeout: 30000 }), btn.click()]);
console.log('GAME', p.url());
await b.close();
