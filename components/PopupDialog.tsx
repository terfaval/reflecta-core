import React from 'react';
import styles from './PopupDialog.module.css';

interface PopupDialogProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function PopupDialog({
  open,
  message,
  confirmLabel = 'Ok',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: PopupDialogProps) {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          <button
            className={`${styles.button} ${styles.cancel}`}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`${styles.button} ${styles.confirm}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}