'use client';

import Sheet from './Sheet';

interface Props {
  open: boolean;
  onAdjust: () => void;
  onExportTx: () => void;
  onExportGoals: () => void;
  onReset: () => void;
  onSyncNow: () => void;
  onClose: () => void;
}

export default function MenuSheet(p: Props) {
  return (
    <Sheet open={p.open} ovId="ovMenu" id="sheetMenu" onClose={p.onClose}>
      <h3>Меню</h3>
      <div className="menu-list">
        <button type="button" onClick={p.onSyncNow}>
          <span>☁ СИНХРОНИЗИРОВАТЬ СЕЙЧАС</span><span>→</span>
        </button>
        <button type="button" onClick={() => { p.onClose(); p.onAdjust(); }}>
          <span>⚖ СВЕРИТЬ БАЛАНС</span><span>→</span>
        </button>
        <button type="button" onClick={() => { p.onClose(); p.onExportTx(); }}>
          <span>⤓ EXCEL · ОПЕРАЦИИ</span><span>→</span>
        </button>
        <button type="button" onClick={() => { p.onClose(); p.onExportGoals(); }}>
          <span>⤓ EXCEL · ЦЕЛИ</span><span>→</span>
        </button>
        <button type="button" className="danger" onClick={() => { p.onClose(); p.onReset(); }}>
          <span>♻ СБРОСИТЬ ПРОГРЕСС</span><span>→</span>
        </button>
      </div>
    </Sheet>
  );
}
