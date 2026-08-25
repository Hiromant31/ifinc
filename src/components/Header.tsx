'use client';

interface HeaderProps {
  balance: number;
  todayIn: number;
  todayOut: number;
  goalsSavedPct: number;
  lvl: number;
  intel: number;
  xpCur: number;
  xpNeed: number;
  onMenu: () => void;
}

export default function Header(p: HeaderProps) {
  const xpPct = Math.min(100, p.xpCur / p.xpNeed * 100);
  return (
    <header className="top">
      <div className="ava"><img src="https://image.qwenlm.ai/public_source/7aa5602e-8b45-495e-ac8a-0c1ec2559390/1b766ecbe-ee5c-4b5f-9580-d49b036b6308.png" alt="" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} /></div>
      <div className="brand"><b>LIFEQUEST</b><span>ЖИЗНЬ · ИНКРЕМЕНТАЛКА</span></div>
      <div className="sp" />
      <span className="chip">LVL {p.lvl}</span>
      <div className="xpmini" title="прогресс уровня">
        <div style={{ width: xpPct + '%' }} />
      </div>
      <button type="button" className="dots" onClick={p.onMenu} aria-label="меню" />
    </header>
  );
}
