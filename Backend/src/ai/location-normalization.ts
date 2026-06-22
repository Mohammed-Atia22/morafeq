export const LOCATION_ALIASES: Record<string, string> = {
  القاهره: 'القاهرة',
  القاهرة: 'القاهرة',
  cairo: 'القاهرة',
  'مدينة نصر': 'مدينه نصر',
  'مدينه نصر': 'مدينه نصر',
  'nasr city': 'مدينه نصر',
  الرحاب: 'الرحاب',
  'el rehab': 'الرحاب',
  maadi: 'المعادي',
  المعادي: 'المعادي',
  giza: 'الجيزة',
  الجيزه: 'الجيزة',
  الجيزة: 'الجيزة',
  alexandria: 'الإسكندرية',
  الاسكندريه: 'الإسكندرية',
  الإسكندرية: 'الإسكندرية',
  mansoura: 'المنصورة',
  المنصوره: 'المنصورة',
  المنصورة: 'المنصورة',
};

export function normalizeArabic(text?: string): string | undefined {
  if (!text?.trim()) {
    return undefined;
  }

  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

export function applyLocationAlias(text?: string): string | undefined {
  const normalized = normalizeArabic(text);
  if (!normalized) {
    return normalized;
  }

  return LOCATION_ALIASES[normalized] || normalized;
}

export function getLocationSearchTerms(text?: string): string[] {
  const canonical = applyLocationAlias(text);
  if (!canonical) {
    return [];
  }

  const terms = new Set<string>([canonical]);
  for (const [alias, aliasCanonical] of Object.entries(LOCATION_ALIASES)) {
    if (aliasCanonical === canonical) {
      terms.add(alias);
    }
  }

  const normalizedCanonical = normalizeArabic(canonical);
  if (normalizedCanonical) {
    terms.add(normalizedCanonical);
  }

  return [...terms];
}
