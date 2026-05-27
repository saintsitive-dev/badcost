#!/usr/bin/env node
/**
 * Post-deployment smoke test for the anonymous invite flow.
 *
 * Uses Puppeteer to verify that the invite link actually renders
 * the game detail page with real content (not a blank page).
 *
 * Usage:
 *   node scripts/smoke-test-invite.mjs              # test against production
 *   node scripts/smoke-test-invite.mjs --local      # test against local dev server (http://localhost:5173)
 *
 * The smoke test game (inviteCode: ppu1so) must exist in Firestore (or emulator).
 */

import puppeteer from 'puppeteer';

const isLocal = process.argv.includes('--local');
const BASE_URL = isLocal
  ? (process.env.BASE_URL || 'http://localhost:5173/badcost')
  : 'https://saintsitive.space/badcost';
const INVITE_CODE = process.env.INVITE_CODE || 'ppu1so';

async function seedEmulator() {
  const FIRESTORE_EMULATOR = 'http://localhost:8080';
  const PROJECT_ID = 'demo-badcost';

  // Check if emulator is running
  try {
    await fetch(FIRESTORE_EMULATOR);
  } catch {
    console.log('  ⚠ Firestore emulator not reachable, skipping seed');
    return;
  }

  const docUrl = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/games`;

  // Check if test game already exists
  const queryRes = await fetch(`${docUrl}?key=fake`, {
    method: 'GET',
  });
  const existing = await queryRes.json();
  const hasTestGame = existing.documents?.some(
    d => d.fields?.inviteCode?.stringValue === INVITE_CODE
  );

  if (hasTestGame) {
    console.log('  ✓ Test game already exists in emulator');
    return;
  }

  // Seed a test game
  const gameDate = new Date();
  gameDate.setDate(gameDate.getDate() + 1);

  const body = {
    fields: {
      title: { stringValue: 'Smoke Test Game 🏸' },
      venue: { stringValue: 'Test Court' },
      date: { stringValue: gameDate.toISOString().split('T')[0] },
      startTime: { stringValue: '18:00' },
      hostId: { stringValue: 'smoke-test-host' },
      inviteCode: { stringValue: INVITE_CODE },
      status: { stringValue: 'open' },
      gameDate: { timestampValue: gameDate.toISOString() },
      expireAt: { timestampValue: new Date(gameDate.getTime() + 90 * 86400000).toISOString() },
      maxPlayers: { integerValue: '10' },
    },
  };

  const res = await fetch(docUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to seed emulator: ${res.status} ${text}`);
  }

  console.log('  ✓ Seeded test game in emulator');
}

async function main() {
  console.log(`🔍 Running invite flow smoke test (${isLocal ? 'local' : 'production'})...\n`);

  if (isLocal) {
    await seedEmulator();
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Navigate to invite link as anonymous user (fresh context, no localStorage)
    const url = `${BASE_URL}/games/invite/${INVITE_CODE}`;
    console.log(`  Opening: ${url}`);
    const waitUntil = isLocal ? 'domcontentloaded' : 'networkidle2';
    await page.goto(url, { waitUntil, timeout: 15000 }).catch(() => {
      throw new Error(`Page failed to load within 15s: ${url}`);
    });

    // Wait for app to hydrate and navigate
    await page.waitForFunction(
      () => !document.querySelector('.animate-pulse'),
      { timeout: 10000 }
    ).catch(() => {});


    // Should redirect to game detail page
    const finalUrl = page.url();
    console.log(`  Final URL: ${finalUrl}`);

    if (!finalUrl.includes('/games/')) {
      throw new Error(`Did not navigate to game page. Ended up at: ${finalUrl}`);
    }
    // Wait for game content to render
    await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {
      throw new Error('Game detail page did not render (no h1 found within 8s)');
    });

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
