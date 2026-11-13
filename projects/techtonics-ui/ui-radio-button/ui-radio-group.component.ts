import { Component, model, contentChildren, effect, input, signal } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { UIRadioButtonComponent } from './ui-radio-button.component';

@Component({
  selector: 'ui-radio-group',
  standalone: true,
  template: `
    <div
      class="radio-group"
      [class.is-disabled]="disabled()"
      [class.is-invalid]="isInvalid()"
      role="radiogroup"
      [attr.aria-disabled]="disabled() ? true : null"
      [attr.aria-invalid]="isInvalid() ? true : null"
      (keydown)="handleKeyDown($event)">
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .is-invalid {
      --radio-neutral: var(--error, #dc3545);
    }
  `,
})
export class UIRadioGroupComponent implements FormValueControl<any> {
  // Required by FormValueControl: Two-way binding signal synchronized automatically by Angular Forms
  readonly value = model<any>(null);

  readonly disabled = input<boolean>(false);

  readonly isInvalid = signal<boolean>(false);

  // Queries all child radio buttons in the group
  readonly buttons = contentChildren(UIRadioButtonComponent);

  constructor() {
    // Keep internal children updated when the form value shifts programmatically
    effect(() => {
      const currentValue = this.value();
      this.buttons().forEach((button) => {
        button.checked.set(button.value() === currentValue);
      });
    });
  }

  // Called by child radio buttons when they are clicked
  select(value: any) {
    this.value.set(value);
  }

  handleKeyDown(event: KeyboardEvent) {
    if (this.disabled()) return;

    const availableButtons = this.buttons();
    const enabledButtons = availableButtons.filter((b) => !b.isDisabled());
    if (enabledButtons.length === 0) return;

    // Locate currently focused child item index
    const activeElement = document.activeElement;
    const currentIdx = enabledButtons.findIndex((b) => b.getNativeInput() === activeElement);
    if (currentIdx === -1) return;

    let nextIdx = currentIdx;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIdx = (currentIdx + 1) % enabledButtons.length;
        event.preventDefault();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIdx = (currentIdx - 1 + enabledButtons.length) % enabledButtons.length;
        event.preventDefault();
        break;
      default:
        return; // Exit out if it's not a directional navigation key
    }

    const targetButton = enabledButtons[nextIdx];

    // Select the new target value and pass interactive focus to it
    this.select(targetButton.value());
    setTimeout(() => targetButton.focusInput());
  }
}
