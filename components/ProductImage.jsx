'use client';

import { IMAGEM_PADRAO } from '../lib/catalog';

export default function ProductImage({ src, alt, ...props }) {
  return <img {...props} src={src || IMAGEM_PADRAO} alt={alt ?? 'Imagem do produto'} referrerPolicy="no-referrer" onError={(event) => {
    event.currentTarget.onerror = null;
    if (event.currentTarget.getAttribute('src') !== IMAGEM_PADRAO) event.currentTarget.src = IMAGEM_PADRAO;
  }} />;
}
