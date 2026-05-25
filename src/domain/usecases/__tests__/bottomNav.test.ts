import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tabs } from '../../../presentation/components/BottomNav';

describe('BottomNav tabs', () => {
  it('should have 4 navigation tabs', () => {
    assert.equal(tabs.length, 4);
  });

  it('should include the games management tab', () => {
    const gamesTab = tabs.find(t => t.to === '/games/manage');
    assert.ok(gamesTab, 'Games tab should exist in navigation');
    assert.equal(gamesTab.label, 'เปิดตี้');
  });

  it('should have unique routes', () => {
    const routes = tabs.map(t => t.to);
    const unique = new Set(routes);
    assert.equal(unique.size, routes.length, 'All tab routes should be unique');
  });

  it('should have all required tabs', () => {
    const routes = tabs.map(t => t.to);
    assert.ok(routes.includes('/'), 'Should have home/players tab');
    assert.ok(routes.includes('/games/manage'), 'Should have games management tab');
    assert.ok(routes.includes('/history'), 'Should have history tab');
    assert.ok(routes.includes('/settings'), 'Should have settings tab');
  });
});
