'use client';

export interface ToastItem { id: string; msg: string; type?: string }

export default function Toasts({ items }: { items: ToastItem[] }) {
  return (
    <div id="toasts">
      {items.map(t => (
        <div key={t.id} className={'toast ' + (t.type || '')}>{t.msg}</div>
      ))}
    </div>
  );
}
