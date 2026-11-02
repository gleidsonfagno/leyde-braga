'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { META_PIXEL_ID, permitePublicidade } from '../lib/privacy';
import { criarMetaPixel } from '../lib/meta-pixel';

export default function MetaPixel({ tracker, ready, preferences, privacySignal }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const allowed = ready && permitePublicidade(preferences, { privacySignal });

  useEffect(() => {
    tracker.current = criarMetaPixel({ win: window, doc: document, id: META_PIXEL_ID });
    return () => tracker.current?.desativar();
  }, [tracker]);

  useEffect(() => {
    tracker.current?.ativar(allowed);
    tracker.current?.pagina();
  }, [allowed, pathname, search, tracker]);

  return null;
}
