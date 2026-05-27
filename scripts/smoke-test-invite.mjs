#!/usr/bin/env node
/**
 * Post-deployment smoke test for the anonymous invite flow.
 *
 * Uses Puppeteer to verify that the invite link actually renders
 * the game detail page with real content (not a blank page).
 *
 * The smoke test game (inviteCode: ppu1so) must exist in Firestore.
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'https://saintsitive.space/badcost';
const INVITE_CODE = 'ppu1so';

async function main() {
  console.log('🔍 Running invite flow smoke test...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Navigate to invite link as anonymous user (fresh context, no localStorage)
    const url = `${BASE_URL}/games/invite/${INVITE_CODE}`;
    console.log(`  Opening: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Should redirect to game detail page
    const finalUrl = page.url();
    console.log(`  Final URL: ${finalUrl}`);

    if (!finalUrl.includes('/games/')) {
      throw new Error(`Did not navigate to game page. Ended up at: ${finalUrl}`);
    }

    // Wait for game content to render
    await page.waitForSelector('h1', { timeout: 10000 });

    // Verify key elements exist on the game detail page
    const title = await page.$eval('h1', el => el.textContent);
    console.log(`  Game title: ${title}`);

    if (!title || title.trim().length === 0) {
      throw new Error('Game title is empty');
    }

    // Check that the join section or participant list is visible
    const pageContent = await page.content();
    const hasJoinButton = pageContent.includes('ลงชื่อเข้าร่วม') || pageContent.includes('ใส่ชื่อของคุณ');
    const hasParticipantList = pageContent.includes('ใครสนใจลงชื่อ');

    if (!hasJoinButton && !hasParticipantList) {
      throw new Error('Neither join button nor participant list found on page');
    }

    console.log(`  ✓ Join/participant section present`);
    console.log('\n✅ Invite smoke test passed!');
  } catch (err) {
    console.error(`\n❌ Smoke test failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
