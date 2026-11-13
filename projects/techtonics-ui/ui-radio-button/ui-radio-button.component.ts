import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { UIRadioGroupComponent } from './ui-radio-group.component';

@Component({
  selector: 'ui-radio-button',
  standalone: true,
  templateUrl: './ui-radio-button.component.html',
  styleUrls: ['./ui-radio-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class UIRadioButtonComponent {
  /**
   * The key value for a radio button.
   * This value is not shown to the user.
   * If this radio button is part of a radio button group, this value is used to differentiate between the other
   * radio buttons in the group so each one should have a unique value.
   */
  readonly value = input<any>();
  readonly componentClass = input<string>();
  readonly disabled = input<boolean>();
  readonly hidden = input<boolean>(false);

  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');

  checked = model<boolean>(false);

  readonly change = output<boolean>();
  readonly touch = output();

  protected group = inject(UIRadioGroupComponent, { optional: true });
  private inputRef = viewChild.required<ElementRef<HTMLInputElement>>('radioInput');

  readonly isDisabled = computed(() => {
    // If within a group, use the group disabled state, otherwise use this component's disabled state.
    if (this.group && this.group.disabled()) {
      return true;
    }

    return this.disabled();
  });

  // Calculates whether this specific instance receives standard user tab focus
  readonly tabIndex = computed(() => {
    if (this.isDisabled()) {
      return -1;
    }

    // If this is not part of a group, just return 0;
    if (!this.group) {
      return 0;
    }

    const siblings = this.group.buttons();
    const checkedSibling = siblings.find((b) => b.checked() && !b.isDisabled());

    if (checkedSibling) {
      return checkedSibling === this ? 0 : -1;
    }

    // Default: If no items are selected, make the first non-disabled button focusable
    const firstEnabled = siblings.find((b) => !b.isDisabled());
    return firstEnabled === this ? 0 : -1;
  });

  /**
   * Invoked automatically when the root form executes a `.reset()` routine.
   */
  public reset(): void {
    this.checked.set(false);
  }

  onSelect(event: Event) {
    if (this.isDisabled()) {
      return;
    }

    // When within a group, update the group's select state.
    if (this.group) {
      this.group.select(this.value());
    } else {
      event.stopPropagation();
      event.preventDefault();
      let checkedValue = !this.checked();
      this.checked.set(checkedValue);
      this.change.emit(checkedValue);
    }

    this.touch.emit();
  }

  getNativeInput(): HTMLInputElement {
    return this.inputRef().nativeElement;
  }

  focusInput() {
    this.inputRef().nativeElement.focus();
  }
}
