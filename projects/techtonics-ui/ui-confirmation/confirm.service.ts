import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  DOCUMENT,
  EnvironmentInjector,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { ActiveConfirmState, ConfirmOptions } from './confirm.models';
import { UIConfirmationComponent } from './ui-confirmation.component';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);

  private hostRef: ComponentRef<UIConfirmationComponent> | null = null;

  // Private writable state, exposed as read-only to the modal component
  private readonly _state = signal<ActiveConfirmState<any> | null>(null);
  readonly state = this._state.asReadonly();

  /**
   * Opens the confirmation modal and resolves with the clicked button's value,
   * or `undefined` if dismissed via Escape / backdrop click.
   */
  open<T = boolean>(options: ConfirmOptions<T>): Promise<T | undefined> {
    this.ensureHostMounted();

    // If a confirmation is already open, resolve it as cancelled before opening the next
    if (this._state()) {
      this.close(undefined);
    }

    return new Promise<T | undefined>((resolve) => {
      this._state.set({
        title: options.title,
        message: options.message,
        closeOnBackdrop: options.closeOnBackdrop ?? true,
        buttons: options.buttons ?? [
          { label: 'Cancel', value: false as T, variant: 'secondary' },
          { label: 'Confirm', value: true as T, variant: 'primary' },
        ],
        resolve,
      });
    });
  }

  /**
   * Called by the modal component when a user clicks an action button or dismisses.
   */
  close<T>(result: T | undefined): void {
    const current = this._state();
    if (!current) return;

    this._state.set(null);
    current.resolve(result);
  }

  private ensureHostMounted(): void {
    if (this.hostRef) return;

    // Create the standalone component using the root EnvironmentInjector
    this.hostRef = createComponent(UIConfirmationComponent, {
      environmentInjector: this.injector,
    });

    // Attach its view to Angular's change detection tree (works in zoneless too)
    this.appRef.attachView(this.hostRef.hostView);

    // Append the root DOM element directly to <body>
    const domElem = this.hostRef.location.nativeElement as HTMLElement;
    this.document.body.appendChild(domElem);
  }
}
