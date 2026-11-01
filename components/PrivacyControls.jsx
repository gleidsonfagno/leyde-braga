'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CONSENT_DAYS, GA_ID, PRIVACY_KEY, criarPreferencias, lerPreferencias, permiteEstatisticas } from '../lib/privacy';
import { criarTracking } from '../lib/tracking';
import { lerPedidoLocal } from '../lib/order-storage';
import { useCart } from './CartContext';

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [privacySignal, setPrivacySignal] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [notice, setNotice] = useState('');
  const dialog = useRef(null);
  const tracker = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const carregar = () => {
      try { setPreferences(lerPreferencias(window.localStorage.getItem(PRIVACY_KEY))); lerPedidoLocal(window.localStorage); }
      catch { setPreferences(null); }
      setPrivacySignal(navigator.globalPrivacyControl === true || navigator.doNotTrack === '1');
      setReady(true);
    };
    carregar();
    window.addEventListener('storage', carregar);
    window.addEventListener('focus', carregar);
    return () => { window.removeEventListener('storage', carregar); window.removeEventListener('focus', carregar); };
  }, []);

  useEffect(() => {
    tracker.current = criarTracking({ win: window, doc: document, id: GA_ID });
    return () => tracker.current?.desativar();
  }, []);

  const privatePage = pathname === '/checkout' || pathname === '/confirmacao';
  const allowed = ready && !privatePage && permiteEstatisticas(preferences, { privacySignal });
  useEffect(() => { if (ready) { tracker.current?.ativar(allowed); if (allowed) tracker.current?.pagina(); } }, [ready, allowed, pathname]);
  useEffect(() => {
    if (!preferences) return;
    const remaining = preferences.updatedAt + CONSENT_DAYS * 86400000 - Date.now();
    const timer = setTimeout(() => setPreferences((previous) => lerPreferencias(JSON.stringify(previous))), Math.min(Math.max(remaining, 0), 2147483647));
    return () => clearTimeout(timer);
  }, [preferences]);
  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) dialog.current.close();
  }, [open]);

  const configure = () => { setAnalytics(Boolean(preferences?.analytics && !privacySignal)); setOpen(true); };
  const save = (value) => {
    const next = criarPreferencias(Boolean(value && !privacySignal));
    // Revogação interrompe a coleta antes de atualizar a interface.
    if (!next.analytics) tracker.current?.desativar();
    setPreferences(next);
    try { window.localStorage.setItem(PRIVACY_KEY, JSON.stringify(next)); setNotice('Preferências salvas.'); }
    catch { setNotice('Preferência aplicada somente nesta sessão: o navegador bloqueou o armazenamento.'); }
    setOpen(false);
  };

  return <PrivacyContext.Provider value={{ ready, preferences, configure, save }}>
    {children}
    <span className="sr-only" role="status">{notice}</span>
    <dialog ref={dialog} className="privacy-dialog" aria-labelledby="privacy-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]'));
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <h2 id="privacy-title">Preferências de privacidade</h2>
      <p>O carrinho, o pedido local e sua escolha de privacidade são recursos necessários. Eles não dependem de aceitar estatísticas.</p>
      <label className="privacy-option"><input type="checkbox" checked readOnly disabled /> Armazenamento necessário</label>
      <label className="privacy-option"><input type="checkbox" checked={analytics} disabled={!GA_ID || privacySignal} onChange={(event) => setAnalytics(event.target.checked)} /> Estatísticas opcionais de visitas</label>
      <p>{GA_ID ? 'Com sua permissão, o Google Analytics recebe páginas visitadas sem os campos do pedido. Publicidade e Google Signals ficam desativados.' : 'Nenhuma ferramenta de estatísticas ou publicidade está configurada neste catálogo.'}</p>
      {privacySignal ? <p>Seu navegador sinalizou preferência por não rastrear; estatísticas permanecem desativadas.</p> : null}
      <p><Link prefetch={false} href="/cookies" onClick={() => setOpen(false)}>Leia a política de cookies e armazenamento</Link>.</p>
      <div className="privacy-actions">
        <button type="button" className="btn" onClick={() => save(false)}>Rejeitar opcionais</button>
        <button type="button" className="btn" onClick={() => save(analytics)}>Salvar preferências</button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>Fechar</button>
      </div>
    </dialog>
  </PrivacyContext.Provider>;
}

export function PrivacyNotice() {
  const { ready, preferences, configure, save } = useContext(PrivacyContext);
  if (!ready || preferences) return null;
  return <section className="privacy-notice container" aria-label="Aviso de cookies e privacidade">
    <p><strong>Sua privacidade</strong> — usamos armazenamento necessário para o carrinho e o pedido neste navegador. {GA_ID ? 'Estatísticas opcionais só serão ativadas com sua permissão.' : 'Não usamos rastreadores de publicidade ou estatísticas.'} <Link prefetch={false} href="/cookies">Saiba mais</Link>.</p>
    <div className="privacy-actions">
      <button type="button" className="btn" onClick={() => save(false)}>Somente necessários</button>
      {GA_ID ? <button type="button" className="btn" onClick={() => save(true)}>Aceitar estatísticas</button> : null}
      <button type="button" className="btn" onClick={configure}>Configurar privacidade</button>
    </div>
  </section>;
}

export function PrivacySettingsButton() {
  const { configure } = useContext(PrivacyContext);
  return <button className="footer-link" type="button" onClick={configure}>Preferências de privacidade</button>;
}

export function PrivacyDataControls() {
  const { limpar } = useCart();
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const remove = () => {
    try {
      limpar();
      for (const key of ['leyde_carrinho', 'leyde_pedido', 'leyde_pedido_contador']) window.localStorage.removeItem(key);
      setMessage('Carrinho e pedido salvos neste navegador foram apagados. Mensagens já enviadas à loja ou ao WhatsApp não são apagadas por este botão.');
    } catch { setMessage('O navegador bloqueou o acesso. Apague os dados deste site nas configurações do navegador.'); }
    setConfirm(false);
  };
  return <section className="privacy-data"><h2>Dados neste navegador</h2>
    <p>Você pode apagar o carrinho e o último pedido, incluindo endereço e localização. Esta ação não envia uma solicitação de exclusão à loja.</p>
    {confirm ? <><p>Deseja apagar o carrinho e o pedido locais?</p><div className="privacy-actions"><button className="btn" onClick={remove}>Confirmar exclusão local</button><button className="btn" onClick={() => setConfirm(false)}>Cancelar</button></div></> : <button className="btn" onClick={() => setConfirm(true)}>Apagar dados deste navegador</button>}
    <p role="status">{message}</p>
  </section>;
}
