function normalizeDigits(value: string): string {
  return value
    // الأرقام العربية: ٠١٢٣٤٥٦٧٨٩
    .replace(/[٠-٩]/g, (digit) =>
      String(digit.charCodeAt(0) - '٠'.charCodeAt(0)),
    )
    // الأرقام الفارسية: ۰۱۲۳۴۵۶۷۸۹
    .replace(/[۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - '۰'.charCodeAt(0)),
    );
}

export function maskPhoneNumbers(text: string): string {
  const normalizedText = normalizeDigits(text);

  // يمسك أرقام مثل:
  // +20 101 234 5678
  // 010-1234-5678
  // (010) 12345678
  const phonePattern = /(?:\+?\d[\d\s().-]{5,}\d)/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = phonePattern.exec(normalizedText)) !== null) {
    const startIndex = match.index;
    const candidate = match[0];

    const digitsCount = candidate.replace(/\D/g, '').length;

    // أرقام الهاتف الدولية غالبًا من 7 إلى 15 رقم
    if (digitsCount < 7 || digitsCount > 15) {
      continue;
    }

    result += text.slice(lastIndex, startIndex);

    const originalCandidate = text.slice(
      startIndex,
      startIndex + candidate.length,
    );

    const maskedCandidate = originalCandidate.replace(
      /[0-9٠-٩۰-۹]/g,
      '*',
    );

    result += maskedCandidate;
    lastIndex = startIndex + candidate.length;
  }

  result += text.slice(lastIndex);

  return result;
}