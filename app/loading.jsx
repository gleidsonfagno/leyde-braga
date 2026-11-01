export default function Loading() {
  return (
    <main className="container" aria-busy="true">
      <p role="status" style={{ padding: '30px 0', color: 'var(--muted)' }}>Carregando página…</p>
      <div className="grid-prod" aria-hidden="true">
        {Array.from({ length: 4 }, (_, indice) => (
          <div key={indice} style={{ aspectRatio: '3 / 4', background: 'var(--surface)', borderRadius: 'var(--radius)' }} />
        ))}
      </div>
    </main>
  );
}
