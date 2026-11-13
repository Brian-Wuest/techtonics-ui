import { CommonModule, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  Renderer2,
  signal,
} from '@angular/core';
import { Toast, ToastService } from 'techtonics-ui/services';

interface ActiveTimer {
  remaining: number;
  lastStarted: number;
  timeoutId?: any;
}

interface LocalToast extends Toast {
  isLeaving?: boolean;
}

@Component({
  selector: 'ui-toast-container',
  imports: [CommonModule, NgClass],
  standalone: true,
  templateUrl: './ui-toast-container.component.html',
  styleUrls: ['./ui-toast-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UIToastContainerComponent implements OnInit, OnDestroy {
  public toastService = inject(ToastService);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  readonly componentClass = input<string>();

  protected localToasts = signal<LocalToast[]>([]);

  // Tracks active timeouts and remaining times for each toast id
  private timers = new Map<string, ActiveTimer>();

  constructor() {
    // Listen for new arrivals via a Signal Effect
    effect(() => {
      const currentToasts = this.toastService.toasts();

      currentToasts.forEach((toast) => {
        if (!this.timers.has(toast.id)) {
          // Initialize timer state for newly detected toasts
          const duration = toast.duration ?? 4000;
          this.timers.set(toast.id, {
            remaining: duration,
            lastStarted: Date.now(),
          });

          this.localToasts.update((current) => [...current, { ...toast }]);
          this.startTimeout(toast.id, duration);
        }
      });

      // Housekeeping: remove tracked timers for toasts that no longer exist
      const globalIds = new Set(currentToasts.map((t) => t.id));
      this.localToasts.update((current) =>
        current.filter((t) => globalIds.has(t.id) || t.isLeaving),
      );
    });
  }

  ngOnInit() {
    // Append the container directly to the document body to escape any layout restrictions
    this.renderer.appendChild(document.body, this.el.nativeElement);
  }

  ngOnDestroy() {
    this.timers.forEach((t) => clearTimeout(t.timeoutId));

    // Clean up DOM node when container gets destroyed
    this.renderer.removeChild(document.body, this.el.nativeElement);
  }

  private startTimeout(id: string, delay: number) {
    const timer = this.timers.get(id);
    if (!timer) return;

    timer.timeoutId = setTimeout(() => {
      this.animateOutAndRemove(id);
    }, delay);
  }

  pauseToast(id: string) {
    const timer = this.timers.get(id);
    // Don't pause if the toast is already mid-exit transition
    const toast = this.localToasts().find((t) => t.id === id);
    if (!timer || !timer.timeoutId || toast?.isLeaving) {
      return;
    }

    clearTimeout(timer.timeoutId);
    timer.timeoutId = undefined;
    timer.remaining -= Date.now() - timer.lastStarted;

    if (timer.remaining < 0) {
      timer.remaining = 0;
    }
  }

  resumeToast(toast: Toast) {
    const timer = this.timers.get(toast.id);
    const localToast = this.localToasts().find((t) => t.id === toast.id);
    if (!timer || timer.timeoutId || timer.remaining <= 0 || localToast?.isLeaving) {
      return;
    }

    timer.lastStarted = Date.now();
    this.startTimeout(toast.id, timer.remaining);
  }

  animateOutAndRemove(id: string) {
    const timer = this.timers.get(id);
    if (timer?.timeoutId) {
      clearTimeout(timer.timeoutId);
    }

    this.timers.delete(id);

    // Turn on the CSS exit animation class locally
    this.localToasts.update((current) =>
      current.map((t) => (t.id === id ? { ...t, isLeaving: true } : t)),
    );

    // Wait exactly 200ms for the slideOut CSS animation to conclude before purging completely
    setTimeout(() => {
      this.localToasts.update((current) => current.filter((t) => t.id !== id));
      this.toastService.clear(id);
    }, 200);
  }
}
