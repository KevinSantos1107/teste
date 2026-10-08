import { describe, it, expect } from 'vitest';
import { CATEGORIES, getCardsForType } from './categories';
import { normalizeForCompare } from './syncLogic';

describe('CATEGORIES', () => {
  it('has exactly 20 categories per type', () => {
    const light = CATEGORIES.filter((c) => c.type === 'light');
    const abstract = CATEGORIES.filter((c) => c.type === 'abstract');
    const couple = CATEGORIES.filter((c) => c.type === 'couple');

    expect(light.length).toBe(20);
    expect(abstract.length).toBe(20);
    expect(couple.length).toBe(20);
  });

  it('has no duplicate texts (normalized)', () => {
    const texts = CATEGORIES.map((c) => normalizeForCompare(c.text));
    const uniqueTexts = new Set(texts);
    expect(uniqueTexts.size).toBe(CATEGORIES.length);
  });

  it('has no duplicate ids', () => {
    const ids = CATEGORIES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(CATEGORIES.length);
  });
});

describe('getCardsForType', () => {
  it('returns cards of the requested type, excluding specified ones', () => {
    const cards = getCardsForType('light', ['Uma fruta']);
    expect(cards.length).toBe(3);
    expect(cards).not.toContain('Uma fruta');
    
    // Check if they are actually from the 'light' type
    const lightTexts = CATEGORIES.filter((c) => c.type === 'light').map(c => c.text);
    for (const card of cards) {
      expect(lightTexts).toContain(card);
    }
  });

  it('does not return duplicates within the drawn cards', () => {
    const cards = getCardsForType('couple', [], 5);
    const uniqueCards = new Set(cards);
    expect(uniqueCards.size).toBe(cards.length);
  });
});
