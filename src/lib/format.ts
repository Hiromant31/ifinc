export function fmt(n: number) { return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100); }
export function money(n: number) { return fmt(n) + ' ₽'; }
export function parseNum(v: string | number) { const x = parseFloat(String(v).replace(/\s+/g, '').replace(',', '.')); return isNaN(x) ? 0 : x; }
export function esc(v: string | null | undefined) {
  if (v === null || v === undefined) v = '';
  return String(v).replace(/[&<>"']/g, function (c) {
    if (c === '&') return '&';
    if (c === '<') return '<';
    if (c === '>') return '>';
    if (c === '"') return '"';
    return String.fromCharCode(39);
  });
}
export function dstr(ts: number) { const d = new Date(ts); return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }); }
export var DAY = 86400000;
export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
export function fmtPct(n: number) { return Math.round(n * 100) / 100; }