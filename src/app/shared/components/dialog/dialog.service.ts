import { Injectable, signal } from '@angular/core';

export type DialogKind = 'confirm' | 'alert';

export type DialogState = {
  open: boolean;
  kind: DialogKind;
  title?: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  busy?: boolean;
};

type PendingResolver =
  | { kind: 'confirm'; resolve: (value: boolean) => void }
  | { kind: 'alert'; resolve: () => void };

@Injectable({ providedIn: 'root' })
export class DialogService {
  private pending: PendingResolver | null = null;

  private readonly _state = signal<DialogState>({
    open: false,
    kind: 'alert',
    message: '',
    confirmText: 'OK',
  });
  readonly state = this._state.asReadonly();

  confirm(opts: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.pending = { kind: 'confirm', resolve };
      this._state.set({
        open: true,
        kind: 'confirm',
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText ?? 'Confirm',
        cancelText: opts.cancelText ?? 'Cancel',
      });
    });
  }

  alert(opts: { title?: string; message: string; confirmText?: string }): Promise<void> {
    return new Promise<void>((resolve) => {
      this.pending = { kind: 'alert', resolve };
      this._state.set({
        open: true,
        kind: 'alert',
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText ?? 'OK',
      });
    });
  }

  setBusy(busy: boolean): void {
    const cur = this._state();
    if (!cur.open) return;
    this._state.set({ ...cur, busy });
  }

  closeWithConfirm(): void {
    const p = this.pending;
    if (!p) return;
    this.pending = null;
    this._state.set({ ...this._state(), open: false, busy: false });
    if (p.kind === 'confirm') p.resolve(true);
    else p.resolve();
  }

  closeWithCancel(): void {
    const p = this.pending;
    if (!p) return;
    this.pending = null;
    this._state.set({ ...this._state(), open: false, busy: false });
    if (p.kind === 'confirm') p.resolve(false);
    else p.resolve();
  }
}

