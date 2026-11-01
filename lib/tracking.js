// Nenhuma conexão com o Google ocorre até ativar() receber consentimento válido.
export function criarTracking({ win, doc, id }) {
  let ativo = false;
  let script;
  let configurado = false;
  const valido = /^G-[A-Z0-9]{5,20}$/.test(id || '');
  function comando() { if (ativo) win.dataLayer.push(arguments); }
  const paginaSegura = () => ({ page_location: `${win.location.origin}${win.location.pathname}`, page_referrer: '', page_title: 'Catálogo LEYDE BRAGA' });

  function desativar() {
    ativo = false;
    if (!valido) return;
    win[`ga-disable-${id}`] = true;
    script?.remove();
    script = undefined;
    // Remove apenas cookies do Analytics, incluindo variantes no domínio pai.
    const partes = win.location.hostname.split('.');
    const dominios = ['', ...partes.map((_, indice) => `; Domain=${partes.slice(indice).join('.')}`)];
    for (const cookie of doc.cookie.split(';')) {
      const nome = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(nome)) continue;
      for (const dominio of dominios) doc.cookie = `${nome}=; Max-Age=0; Path=/${dominio}; SameSite=Lax`;
    }
  }

  return {
    ativar(permitido) {
      if (!permitido || !valido) { desativar(); return; }
      ativo = true;
      win[`ga-disable-${id}`] = false;
      win.dataLayer = win.dataLayer || [];
      if (!configurado) {
        comando('js', new Date());
        comando('config', id, { ...paginaSegura(), send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 180 * 86400 });
        configurado = true;
      }
      if (!script) {
        script = doc.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
        script.referrerPolicy = 'no-referrer';
        script.dataset.leydeTracking = 'analytics';
        doc.head.appendChild(script);
      }
    },
    pagina() { if (ativo) comando('event', 'page_view', paginaSegura()); },
    desativar,
  };
}
