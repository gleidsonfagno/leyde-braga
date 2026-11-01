export default function CatalogMessage({ erro = false, children }) {
  return (
    <div className="container" role={erro ? 'alert' : 'status'} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)' }}>
      <p>{children || (erro ? 'Não foi possível carregar o catálogo. Tente novamente em instantes.' : 'Nenhum produto disponível no momento.')}</p>
      {erro ? <a className="btn" href="" style={{ marginTop: '16px' }}>Tentar novamente</a> : null}
    </div>
  );
}
