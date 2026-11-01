'use client';

import { CartProvider } from '../components/CartContext';
import { ToastProvider } from '../components/ToastContext';
import { PrivacyProvider } from '../components/PrivacyControls';

export default function Providers({ children }) {
  return (
    <CartProvider>
      <ToastProvider><PrivacyProvider>{children}</PrivacyProvider></ToastProvider>
    </CartProvider>
  );
}
