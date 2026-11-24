import { TemplateRef } from '@angular/core';

export interface ConfirmButton<T = boolean> {
  label: string;
  value: T;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  variant?: 'solid' | 'outline' | 'ghost';
}

export interface ConfirmOptions<T = boolean> {
  title: string;
  message: string | TemplateRef<unknown>;
  buttons?: ConfirmButton<T>[];
  closeOnBackdrop?: boolean;
}

export interface ActiveConfirmState<T = unknown> extends Required<Omit<ConfirmOptions<T>, 'buttons'>> {
  buttons: ConfirmButton<T>[];
  resolve: (value: T | undefined) => void;
}
