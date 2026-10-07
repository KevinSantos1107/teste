export function normalizeWord(word: string): string {
  let w = word.toLowerCase().trim();
  w = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  w = w.replace(/\s+/g, ' ');
  return w;
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

export function removePlural(w: string): string {
  if (w.length > 3 && w.endsWith('s')) {
    return w.slice(0, -1);
  }
  return w;
}

export function isSameWord(w1: string, w2: string): boolean {
  let n1 = normalizeWord(w1);
  let n2 = normalizeWord(w2);
  if (n1 === n2) return true;

  n1 = removePlural(n1);
  n2 = removePlural(n2);
  if (n1 === n2) return true;

  if (n1.length >= 4 && n2.length >= 4) {
    return levenshteinDistance(n1, n2) <= 1;
  }
  return false;
}

export function validateWord(word: string, history: Array<{ round: number; words: Record<string, string> }>): { valid: boolean; error?: string } {
  const trimmed = word.trim();
  if (!trimmed) return { valid: false, error: 'A palavra não pode estar vazia.' };
  if (trimmed.length > 30) return { valid: false, error: 'Máximo de 30 caracteres.' };
  
  const wordsArray = trimmed.split(/\s+/);
  if (wordsArray.length > 2) return { valid: false, error: 'Máximo de 2 palavras.' };
  
  for (const h of history) {
    for (const pId in h.words) {
      if (h.words[pId] && isSameWord(h.words[pId], trimmed)) {
        return { valid: false, error: 'Esta palavra já foi usada na partida.' };
      }
    }
  }

  return { valid: true };
}

export function getRoundTitle(round: number, isSynced: boolean): string {
  if (!isSynced && round > 6) return '🌀 Cada um no seu mundo';
  if (round === 1) return '🔮 Telepatia';
  if (round === 2) return '💞 Almas gêmeas';
  if (round === 3 || round === 4) return '🤝 Em sintonia';
  if (round === 5 || round === 6) return '😅 Quase lá';
  return '🌀 Cada um no seu mundo';
}
