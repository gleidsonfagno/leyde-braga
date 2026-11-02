// Somente páginas públicas do catálogo. Busca livre e URLs não reconhecidas não são rastreadas.
export function paginaPermitidaPixel({ pathname, search = '' }) {
  if (!['/', '/categoria', '/produto'].includes(pathname)) return false;
  const params = new URLSearchParams(search);
  for (const [key, value] of params) {
    if (['cat', 'marca', 'p'].includes(key) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 160) continue;
    if (key === 'page' && /^[1-9]\d{0,5}$/.test(value)) continue;
    if (['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'].includes(key) && /^[a-zA-Z0-9_-]{1,512}$/.test(value)) continue;
    return false;
  }
  return true;
}

export function criarMetaPixel({ win, doc, id }) {
  const valido = typeof id === 'string' && /^\d{8,25}$/.test(id);
  let ativo = false;
  let iniciado = false;
  let script;
  let ultimaPagina = '';

  function desativar() {
    ativo = false;
    ultimaPagina = '';
    if (!iniciado) return;
    // Descarta eventos que ainda não saíram da fila quando o SDK estava carregando.
    if (!win.fbq?.callMethod && Array.isArray(win.fbq?.queue)) {
      win.fbq.queue = win.fbq.queue.filter((args) => !['track', 'trackSingle', 'trackCustom', 'trackSingleCustom'].includes(args[0]));
    }
    win.fbq?.('consent', 'revoke');
    const partes = win.location.hostname.split('.');
    const dominios = ['', ...partes.map((_, i) => `; Domain=${partes.slice(i).join('.')}`)];
    for (const cookie of doc.cookie.split(';')) {
      const nome = cookie.split('=')[0].trim();
      if (!['_fbp', '_fbc'].includes(nome)) continue;
      for (const dominio of dominios) doc.cookie = `${nome}=; Max-Age=0; Path=/${dominio}; SameSite=Lax`;
    }
  }

  return {
    ativar(permitido) {
      if (!permitido || !valido || !paginaPermitidaPixel(win.location)) { desativar(); return; }
      if (!iniciado) {
        if (!win.fbq) {
          const fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(Array.from(arguments)); };
          fbq.push = fbq;
          fbq.loaded = true;
          fbq.version = '2.0';
          fbq.queue = [];
          win.fbq = fbq;
          if (!win._fbq) win._fbq = fbq;
        }
        win.fbq('consent', 'revoke');
        win.fbq('set', 'autoConfig', false, id);
        win.fbq('set', 'smartSetup', false, id);
        win.fbq('init', id);
        iniciado = true;
        script = doc.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        script.referrerPolicy = 'no-referrer';
        script.dataset.leydeTracking = 'meta-pixel';
        doc.head.appendChild(script);
      }
      if (!ativo) win.fbq('consent', 'grant');
      ativo = true;
    },
    pagina() {
      if (!ativo) return;
      if (!paginaPermitidaPixel(win.location)) { desativar(); return; }
      const pagina = `${win.location.pathname}${win.location.search || ''}`;
      if (pagina === ultimaPagina) return;
      ultimaPagina = pagina;
      win.fbq('trackSingle', id, 'PageView');
    },
    desativar,
  };
}
