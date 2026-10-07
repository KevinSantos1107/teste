import { describe, it, expect } from 'vitest';
import { normalizeWord, levenshteinDistance, isSameWord, validateWord, getRoundTitle } from './syncLogic';

describe('syncLogic', () => {
  describe('normalizeWord', () => {
    it('removes accents and lowercases', () => {
      expect(normalizeWord('Coração')).toBe('coracao');
      expect(normalizeWord('  Açúcar  ')).toBe('acucar');
    });
    it('normalizes spaces', () => {
      expect(normalizeWord('duas   palavras')).toBe('duas palavras');
    });
  });

  describe('levenshteinDistance', () => {
    it('calculates distance correctly', () => {
      expect(levenshteinDistance('gato', 'mato')).toBe(1);
      expect(levenshteinDistance('amor', 'amar')).toBe(1);
      expect(levenshteinDistance('teste', 'test')).toBe(1);
      expect(levenshteinDistance('abacaxi', 'abacate')).toBe(2);
    });
  });

  describe('isSameWord', () => {
    it('identifies exact matches', () => {
      expect(isSameWord('carro', 'Carro ')).toBe(true);
    });
    it('identifies plurals', () => {
      expect(isSameWord('carro', 'carros')).toBe(true);
      expect(isSameWord('carros', 'carro')).toBe(true);
    });
    it('identifies typos within dist 1 for length >= 4', () => {
      expect(isSameWord('livro', 'ivro')).toBe(true);
      expect(isSameWord('amor', 'amar')).toBe(true); // distance 1, len 4 -> true
      expect(isSameWord('sol', 'sal')).toBe(false); // length < 4 -> false
    });
  });

  describe('validateWord', () => {
    const history = [
      { round: 1, words: { p1: 'sol', p2: 'lua' } },
      { round: 2, words: { p1: 'estrela', p2: 'mar' } }
    ];

    it('rejects empty words', () => {
      expect(validateWord('   ', history).valid).toBe(false);
    });

    it('rejects more than 2 words', () => {
      expect(validateWord('um dois tres', history).valid).toBe(false);
    });

    it('rejects words over 30 chars', () => {
      const longWord = 'a'.repeat(31);
      expect(validateWord(longWord, history).valid).toBe(false);
    });

    it('rejects words already used', () => {
      expect(validateWord('Sol', history).valid).toBe(false);
      expect(validateWord('luas', history).valid).toBe(false); // Same word by logic
      expect(validateWord('estrelas', history).valid).toBe(false);
    });

    it('accepts valid new words', () => {
      expect(validateWord('planeta', history).valid).toBe(true);
      expect(validateWord('céu azul', history).valid).toBe(true);
    });
  });

  describe('getRoundTitle', () => {
    it('returns correct titles', () => {
      expect(getRoundTitle(1, true)).toBe('🔮 Telepatia');
      expect(getRoundTitle(2, true)).toBe('💞 Almas gêmeas');
      expect(getRoundTitle(4, true)).toBe('🤝 Em sintonia');
      expect(getRoundTitle(6, true)).toBe('😅 Quase lá');
      expect(getRoundTitle(7, false)).toBe('🌀 Cada um no seu mundo');
    });
  });
});
