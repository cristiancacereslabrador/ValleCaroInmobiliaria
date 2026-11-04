'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Cuadro de confirmacion propio (en vez del `window.confirm` del navegador):
 * tarjeta centrada en escritorio y hoja inferior en el celular.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  busyLabel = 'Eliminando…',
  busy = false,
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  tone?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const cancelHandler = useRef(onCancel);
  const busyRef = useRef(busy);
  cancelHandler.current = onCancel;
  busyRef.current = busy;

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busyRef.current) cancelHandler.current();
    }
    window.addEventListener('keydown', onKey);
    document.body.classList.add('has-sheet-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('has-sheet-open');
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="confirm-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className={`confirm-dialog is-${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <span className="confirm-dialog-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path
              d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7M10 10.5v5.5M14 10.5v5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 id="confirm-dialog-title">{title}</h2>
        {children && <div className="confirm-dialog-body">{children}</div>}
        <div className="confirm-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn btn-danger' : 'btn'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
