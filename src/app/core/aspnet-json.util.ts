/** Read string from JSON when API uses camelCase or PascalCase (.NET default). */
export function jsonStr(obj: unknown, camel: string, pascal: string): string {
  if (!obj || typeof obj !== 'object') return '';
  const o = obj as Record<string, unknown>;
  const v = o[camel] ?? o[pascal];
  return v == null ? '' : String(v);
}

export function jsonStrNull(obj: unknown, camel: string, pascal: string): string | null {
  const s = jsonStr(obj, camel, pascal);
  return s === '' ? null : s;
}

/** Optional numeric field (camelCase / PascalCase); omits when missing or invalid. */
export function jsonOptionalNum(obj: unknown, camel: string, pascal: string): number | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as Record<string, unknown>;
  const v = o[camel] ?? o[pascal];
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}
