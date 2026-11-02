'use client';

import Link from 'next/link';
import { useState } from 'react';

// Prepara somente a rota pretendida, sem antecipar todos os produtos visíveis.
export default function CatalogLink({ children, ...props }) {
  const [intent, setIntent] = useState(false);
  return <Link {...props} prefetch={intent ? null : false}
    onPointerEnter={(event) => { setIntent(true); props.onPointerEnter?.(event); }}
    onFocus={(event) => { setIntent(true); props.onFocus?.(event); }}>
    {children}
  </Link>;
}
