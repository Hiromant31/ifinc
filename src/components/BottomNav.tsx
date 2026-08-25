'use client';

interface Props {
  tab: 'goals' | 'fin' | 'grow';
  onSelect: (t: 'goals' | 'fin' | 'grow') => void;
}

export default function BottomNav({ tab, onSelect }: Props) {
  return (
    <nav id="bnav">
      <button type="button" className={tab === 'goals' ? 'on' : ''} onClick={() => onSelect('goals')}>ЦЕЛИ</button>
      <button type="button" className={tab === 'fin' ? 'on' : ''} onClick={() => onSelect('fin')}>ЖУРНАЛ</button>
      <button type="button" className={tab === 'grow' ? 'on' : ''} onClick={() => onSelect('grow')}>РОСТ</button>
    </nav>
  );
}
