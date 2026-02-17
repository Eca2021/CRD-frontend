import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/theme.css';
import './styles/base.css';
import './styles/forms.css';
import './styles/modal.css';
import './styles/buttons.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

/* 🔒 Parche global contra /seguridad/undefined o /seguridad/null */
(function hardenBadSecurityUrls() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Evita aplicar el parche más de una vez (HMR / recargas)
  if (window.__historyPatched) return;

  const BAD = /(^|\/)seguridad\/(undefined|null)(\/)?$/i;
  const isBad = (u) => typeof u === 'string' && BAD.test(u);

  // 1) Bloquear clicks en <a href="...">
  const onClickCapture = (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    const href = a.getAttribute('href');
    if (isBad(href)) {
      e.preventDefault();
      e.stopPropagation();
      console.warn('[guard] Bloqueado link roto:', href);
      window.history.pushState({}, '', '/seguridad/usuarios');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };
  document.addEventListener('click', onClickCapture, true);

  // 2) Corregir <img src="..."> iniciales y nuevas
  const fixImages = (root = document) => {
    root.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src');
      if (isBad(src)) {
        console.warn('[guard] Reemplazando img rota:', src);
        img.setAttribute(
          'src',
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="96"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2399a" font-size="12">sin imagen</text></svg>'
        );
      }
    });
  };

  if (document.readyState !== 'loading') fixImages();
  else document.addEventListener('DOMContentLoaded', () => fixImages());

  const mo = new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) fixImages(n);
      });
      if (m.type === 'attributes' && m.target?.tagName === 'IMG' && m.attributeName === 'src') {
        const img = m.target;
        const src = img.getAttribute('src');
        if (isBad(src)) {
          console.warn('[guard] Corrigiendo img[src] mutado:', src);
          img.setAttribute(
            'src',
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="96"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2399a" font-size="12">sin imagen</text></svg>'
          );
        }
      }
    });
  });
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  });

  // 3) Parchear History API una sola vez, sin 'history' global ni redeclaraciones
  (() => {
    const hist = window.history;
    const _origPush = hist.pushState.bind(hist);
    const _origReplace = hist.replaceState.bind(hist);

    hist.pushState = function (st, title, url) {
      if (isBad(url)) {
        console.warn('[guard] pushState corregido:', url, '→ /seguridad/usuarios');
        return _origPush(st, title, '/seguridad/usuarios');
      }
      return _origPush(st, title, url);
    };

    hist.replaceState = function (st, title, url) {
      if (isBad(url)) {
        console.warn('[guard] replaceState corregido:', url, '→ /seguridad/usuarios');
        return _origReplace(st, title, '/seguridad/usuarios');
      }
      return _origReplace(st, title, url);
    };
  })();

  // 4) Parchear fetch
  const _origFetch = window.fetch?.bind(window);
  if (_origFetch) {
    window.fetch = (input, init) => {
      if (typeof input === 'string' && isBad(input)) {
        console.warn('[guard] fetch corregido:', input, '→ /seguridad/usuarios');
        input = '/seguridad/usuarios';
      }
      return _origFetch(input, init);
    };
  }

  // 5) Parchear XHR
  const OrigXHR = window.XMLHttpRequest;
  if (OrigXHR) {
    const Open = OrigXHR.prototype.open;
    OrigXHR.prototype.open = function (method, url, ...rest) {
      if (typeof url === 'string' && isBad(url)) {
        console.warn('[guard] XHR.open corregido:', url, '→ /seguridad/usuarios');
        url = '/seguridad/usuarios';
      }
      return Open.call(this, method, url, ...rest);
    };
  }

  // Flag para no re-aplicar (HMR)
  window.__historyPatched = true;
})();
/* 🔒 Fin del parche global */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
