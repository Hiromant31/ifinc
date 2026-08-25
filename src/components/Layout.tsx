export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap">
      {children}
      <footer>LIFEQUEST · ДАННЫЕ ЛОКАЛЬНО · СКОРО: БАЗА + ОБЛАКО</footer>
    </div>
  );
}
