/* The listing search is a KEYWORD field: each Enter adds a keyword, and a row is shown
   when it matches ANY of them. The hosts keep one plain string (so their state, their
   "is anything applied" checks and their page resets are untouched) and the keywords
   travel inside it, comma-separated. This file is a leaf on purpose — the toolbar and
   all eight listing hosts import it. */

/** Keywords as typed (case kept for display), trimmed, without repeats. */
export const searchKeywordsOf = (query: string): string[] => {
  const out: string[] = [];
  query.split(',').forEach((part) => {
    const t = part.trim().replace(/\s+/g, ' ');
    if (t && !out.some((k) => k.toLowerCase() === t.toLowerCase())) out.push(t);
  });
  return out;
};

/** Lower-cased keywords, for matching. */
export const searchTermsOf = (query: string): string[] => searchKeywordsOf(query).map((k) => k.toLowerCase());

export const joinSearchKeywords = (keywords: string[]) => keywords.join(', ');
