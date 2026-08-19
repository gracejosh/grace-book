export interface BibleVerseData {
  text: string;
  reference: string;
  referenceAm?: string;
  translation?: string;
}

export async function fetchRandomVerse(): Promise<BibleVerseData | null> {
  try {
    const res = await fetch('https://labs.bible.org/api/?passage=random&type=json');
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const v = data[0];
      return {
        text: v.text.replace(/<[^>]+>/g, ''),
        reference: `${v.bookname} ${v.chapter}:${v.verse}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchEnglishVerse(book: string, chapterVerse: string): Promise<BibleVerseData | null> {
  try {
    const res = await fetch(`https://bible-api.com/${book}+${chapterVerse}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.text) {
      return {
        text: data.text.trim(),
        reference: data.reference,
        translation: data.translation_name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchAmharicVerse(book: string, chapter: string, verse: string): Promise<BibleVerseData | null> {
  try {
    const res = await fetch(`https://getbible.net/v2/amharic/${book}/${chapter}/${verse}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.verses && data.verses.length > 0) {
      const v = data.verses[0];
      const bookName = data.book?.name ?? book;
      return {
        text: v.text.trim(),
        reference: `${bookName} ${chapter}:${verse}`,
        referenceAm: `${bookName} ${chapter}:${verse}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchVerseForLang(lang: 'en' | 'am', book: string, chapter: string, verse: string): Promise<BibleVerseData | null> {
  if (lang === 'am') {
    const am = await fetchAmharicVerse(book, chapter, verse);
    if (am) return am;
  }
  return fetchEnglishVerse(book, `${chapter}:${verse}`);
}
