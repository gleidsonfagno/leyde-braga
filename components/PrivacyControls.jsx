'use client';

import Link from 'next/link';
import { createContext, Suspense, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CONSENT_DAYS, GA_ID, META_PIXEL_ID, PRIVACY_KEY, criarPreferencias, lerPreferencias, permiteEstatisticas } from '../lib/privacy';
import MetaPixel from './MetaPixel';
import { criarTracking } from '../lib/tracking';
import { lerPedidoLocal } from '../lib/order-storage';
import { useCart } from './CartContext';

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [privacySignal, setPrivacySignal] = useState(false);
  const [open, setOpen] = useState(false);
  const [intro, setIntro] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [notice, setNotice] = useState('');
  const dialog = useRef(null);
  const tracker = useRef(null);
  const pixelTracker = useRef(null);
  const dismissed = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const informationPage = ['/privacidade', '/termos-de-uso', '/cookies', '/acessibilidade', '/direitos-autorais', '/entregas-e-pagamentos', '/trocas-e-devolucoes'].includes(pathname);
    if (ready && !preferences && !dismissed.current && !informationPage) { setIntro(true); setOpen(true); }
  }, [ready, preferences, pathname]);

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
    if (open) {
      if (!dialog.current.open) dialog.current.showModal();
      dialog.current.querySelector('h2')?.focus();
    }
    if (!open && dialog.current.open) dialog.current.close();
  }, [open, intro]);

  const close = () => { dismissed.current = true; setOpen(false); };
  const configure = () => { setAnalytics(Boolean(preferences?.analytics && !privacySignal)); setMarketing(Boolean(preferences?.marketing && !privacySignal)); setIntro(false); setOpen(true); };
  const save = (value) => {
    const choices = typeof value === 'boolean' ? { analytics: value, marketing: value } : value;
    const next = criarPreferencias({ analytics: !privacySignal && choices.analytics, marketing: !privacySignal && choices.marketing });
    // Revogação interrompe a coleta antes de atualizar a interface.
    if (!next.analytics) tracker.current?.desativar();
    if (!next.marketing) pixelTracker.current?.desativar();
    setPreferences(next);
    try { window.localStorage.setItem(PRIVACY_KEY, JSON.stringify(next)); setNotice('Preferências salvas.'); }
    catch { setNotice('Preferência aplicada somente nesta sessão: o navegador bloqueou o armazenamento.'); }
    close();
  };

  return <PrivacyContext.Provider value={{ ready, preferences, configure, save }}>
    {children}
    <Suspense fallback={null}><MetaPixel tracker={pixelTracker} ready={ready} preferences={preferences} privacySignal={privacySignal} /></Suspense>
    <span className="sr-only" role="status">{notice}</span>
    <dialog ref={dialog} className="privacy-dialog" aria-labelledby="privacy-title" onCancel={close} onClose={close} onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]'));
      const first = controls[0];
      const last = controls.at(-1);
      const outsideSequence = !controls.includes(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outsideSequence)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || outsideSequence)) { event.preventDefault(); first?.focus(); }
    }}>
      <h2 id="privacy-title" tabIndex={-1}>{intro ? 'Sua privacidade' : 'Preferências de privacidade'}</h2>
      {intro ? <>
        <p>Usamos armazenamento necessário para manter seu carrinho e o último pedido neste navegador.</p>
        <p>{META_PIXEL_ID ? 'Com sua permissão, o Pixel da Meta mede visitas ao catálogo para publicidade no Facebook e Instagram. Você pode recusar ou escolher nas preferências.' : GA_ID ? 'Estatísticas são opcionais e só serão ativadas se você permitir.' : 'Não há rastreadores de estatísticas ou publicidade ativos.'}</p>
        <p>Conheça nossa <Link prefetch={false} href="/privacidade" onClick={close}>Política de privacidade</Link>, os <Link prefetch={false} href="/termos-de-uso" onClick={close}>Termos do catálogo</Link> e a <Link prefetch={false} href="/cookies" onClick={close}>Política de cookies</Link>.</p>
        <div className="privacy-actions">
          <button type="button" className="btn solid" onClick={() => save(false)}>Continuar com necessários</button>
          {GA_ID || META_PIXEL_ID ? <button type="button" className="btn solid" onClick={() => save(true)}>Aceitar opcionais</button> : null}
          <button type="button" className="btn" onClick={configure}>Configurar preferências</button>
          <button type="button" className="btn" onClick={close}>Fechar sem escolher</button>
        </div>
      </> : <>
      <p>O carrinho, o pedido local e sua escolha de privacidade são recursos necessários. Eles não dependem de aceitar estatísticas ou publicidade.</p>
      <label className="privacy-option"><input type="checkbox" checked readOnly disabled /> Armazenamento necessário</label>
      <label className="privacy-option"><input type="checkbox" checked={analytics} disabled={!GA_ID || privacySignal} onChange={(event) => setAnalytics(event.target.checked)} /> Estatísticas opcionais de visitas</label>
      <p>{GA_ID ? 'Com sua permissão, o Google Analytics recebe páginas visitadas sem os campos do pedido. Google Signals permanece desativado.' : 'Google Analytics não está configurado.'}</p>
      <label className="privacy-option"><input type="checkbox" checked={marketing} disabled={!META_PIXEL_ID || privacySignal} onChange={(event) => setMarketing(event.target.checked)} /> Publicidade — Pixel da Meta</label>
      <p>{META_PIXEL_ID ? 'Com sua permissão, a Meta recebe visualizações do catálogo, URLs e dados técnicos do navegador para medir publicidade. Não enviamos os campos do pedido nem registramos compras. Checkout, confirmação e busca livre ficam fora do rastreamento.' : 'Pixel da Meta não está configurado.'}</p>
      {privacySignal ? <p>Seu navegador sinalizou preferência por não rastrear; estatísticas e publicidade permanecem desativadas.</p> : null}
      <p><Link prefetch={false} href="/cookies" onClick={close}>Leia a política de cookies e armazenamento</Link>.</p>
      <div className="privacy-actions">
        <button type="button" className="btn" onClick={() => save(false)}>Rejeitar opcionais</button>
        <button type="button" className="btn" onClick={() => save({ analytics, marketing })}>Salvar preferências</button>
        <button type="button" className="btn" onClick={close}>Fechar</button>
      </div>
      </>}
    </dialog>
  </PrivacyContext.Provider>;
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
