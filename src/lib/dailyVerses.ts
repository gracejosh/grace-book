export interface DailyVerseEntry {
  book: string;
  chapter: string;
  verse: string;
  category: string;
  textAm?: string;
  referenceAm?: string;
}

export const dailyVerses: DailyVerseEntry[] = [
  { book: 'John', chapter: '3', verse: '16', category: 'Love', referenceAm: 'ዮሐንስ 3:16' },
  { book: 'Jeremiah', chapter: '29', verse: '11', category: 'Hope', referenceAm: 'ኤርምያስ 29:11' },
  { book: 'Philippians', chapter: '4', verse: '13', category: 'Strength', referenceAm: 'ፊልጵስዩስ 4:13' },
  { book: 'Psalms', chapter: '23', verse: '1', category: 'Peace', referenceAm: 'መዝሙር 23:1' },
  { book: 'Romans', chapter: '8', verse: '28', category: 'Faith', referenceAm: 'ሮሜ 8:28' },
  { book: 'Proverbs', chapter: '3', verse: '5', category: 'Wisdom', referenceAm: 'ምሳሌ 3:5' },
  { book: 'Isaiah', chapter: '41', verse: '10', category: 'Courage', referenceAm: 'ኢሳይያስ 41:10' },
  { book: 'Matthew', chapter: '11', verse: '28', category: 'Rest', referenceAm: 'ማቴዎስ 11:28' },
  { book: 'Joshua', chapter: '1', verse: '9', category: 'Courage', referenceAm: 'ኢያሱ 1:9' },
  { book: '2 Corinthians', chapter: '12', verse: '9', category: 'Grace', referenceAm: '2ኛ ቆሮንቶስ 12:9' },
  { book: 'Psalms', chapter: '46', verse: '1', category: 'Refuge', referenceAm: 'መዝሙር 46:1' },
  { book: '1 John', chapter: '4', verse: '19', category: 'Love', referenceAm: '1ኛ ዮሐንስ 4:19' },
  { book: 'Hebrews', chapter: '11', verse: '1', category: 'Faith', referenceAm: 'ዕብራውያን 11:1' },
  { book: 'Galatians', chapter: '5', verse: '22', category: 'Fruit', referenceAm: 'ገላትያ 5:22' },
];

/** Day-of-year rotation so everyone sees the same verse on the same day. */
export function getDailyVerseIndex(date: Date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86_400_000);
  return dayOfYear % dailyVerses.length;
}

export function getDailyVerseEntry(date: Date = new Date()): DailyVerseEntry {
  return dailyVerses[getDailyVerseIndex(date)]!;
}

export function getRandomVerseEntry(): DailyVerseEntry {
  return dailyVerses[Math.floor(Math.random() * dailyVerses.length)]!;
}
