'use client';

import { useEffect, useRef, useState } from 'react';
import { mapaLocalizacao, solicitarLocalizacao } from '../lib/location';

export default function DeliveryLocation({ value, onChange }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const solicitacao = useRef(0);
  useEffect(() => () => { solicitacao.current++; }, []);

  const capturar = async () => {
    const atual = ++solicitacao.current;
    setCarregando(true);
    setErro('');
    onChange(null);
    try {
      const ponto = await solicitarLocalizacao({ geolocation: navigator.geolocation, secureContext: window.isSecureContext });
      if (solicitacao.current === atual) onChange(ponto);
    } catch (error) {
      if (solicitacao.current === atual) setErro(error.message);
    } finally {
      if (solicitacao.current === atual) setCarregando(false);
    }
  };
  const mapa = mapaLocalizacao(value);

  return <div className="form-grupo" style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
    <p style={{ fontWeight: 500, marginBottom: '8px' }}>Localização para entrega (opcional)</p>
    <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
      Está no endereço de entrega? Toque no botão e permita a localização. Não precisa saber usar o Google Maps.
      Ao confirmar o pedido, o ponto será incluído na mensagem para a loja no WhatsApp.
    </p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      <button className="btn" type="button" onClick={capturar} disabled={carregando}>
        {carregando ? 'Buscando localização…' : mapa ? 'Atualizar minha localização' : 'Usar minha localização'}
      </button>
      {mapa ? <>
        <a className="btn" href={mapa} target="_blank" rel="noopener noreferrer">Conferir ponto no mapa</a>
        <button className="btn" type="button" onClick={() => { solicitacao.current++; onChange(null); setErro(''); }}>Remover localização</button>
      </> : null}
    </div>
    <div aria-live="polite" style={{ fontSize: '13px', marginTop: '10px' }}>
      {erro ? <p role="alert">{erro}</p> : null}
      {mapa ? <p>Localização capturada. Precisão aproximada: {value.precisaoMetros} m.{value.precisaoMetros > 100 ? ' O ponto pode estar impreciso; confira o mapa e informe uma referência.' : ''}</p> : null}
      <p style={{ color: 'var(--muted)' }}>Este é um ponto capturado agora, sem rastreamento contínuo. Confira também rua, número e bairro.</p>
    </div>
  </div>;
}
