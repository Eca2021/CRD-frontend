// src/ui/ModalBase.js
import React, { useEffect } from 'react';
import ReactModal from 'react-modal';

const overlayStyle = {
  position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(1px)',
  display: 'grid', placeItems: 'center',
  padding: '16px',
  zIndex: 1000,              // match con --z-overlay
  pointerEvents: 'auto',
};

const contentStyle = {
  inset: 'unset',
  padding: 0,
  border: 'none',
  background: 'transparent',
  overflow: 'visible',
  zIndex: 1001,              // match con --z-modal
};

export default function ModalBase({
  isOpen,
  onRequestClose,
  size = 'md',                 // sm | md | lg | xl
  className = '',
  children,
  shouldCloseOnOverlayClick = true,
  shouldCloseOnEsc = true,
  ariaHideApp = true,
  ...rest
}) {
  useEffect(() => {
    try { ReactModal.setAppElement('#root'); } catch (_) { }
  }, []);

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      shouldCloseOnEsc={shouldCloseOnEsc}
      style={{ overlay: overlayStyle, content: contentStyle }}
      overlayClassName="u-overlay"
      className={`u-modal u-modal--${size}${className ? ' ' + className : ''}`}
      ariaHideApp={ariaHideApp}
      {...rest}
    >
      {children}
    </ReactModal>
  );
}
