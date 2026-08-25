'use client';

interface Props {
  open: boolean;
  ovId: string;
  id: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Sheet(p: Props) {
  return (
    <>
      <div className={'overlay' + (p.open ? ' show' : '')} id={p.ovId} onClick={p.onClose} />
      <div className={'sheet' + (p.open ? ' show' : '')} id={p.id}>
        {p.children}
      </div>
    </>
  );
}
