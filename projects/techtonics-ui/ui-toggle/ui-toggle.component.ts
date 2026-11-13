import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import {
  DisabledReason,
  FormValueControl,
  ValidationError,
  WithOptionalFieldTree,
} from '@angular/forms/signals';
import { UIFormErrorComponent } from 'techtonics-ui/ui-form-error';

@Component({
  selector: 'ui-toggle',
  standalone: true,
  templateUrl: './ui-toggle.component.html',
  styleUrls: ['./ui-toggle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, UIFormErrorComponent],
})
export class UIToggleComponent implements FormValueControl<boolean> {
  readonly componentClass = input<string>();
  readonly disabled = input<boolean>(false);
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  readonly hidden = input<boolean>(false);

  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');

  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly errors = input<readonly ValidationError[]>([]);

  value = model(false);

  readonly touch = output();

  private inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  protected readonly normalizedErrors = computed<ValidationError[]>(() => {
    const rawErrors = this.errors();
    return Array.isArray(rawErrors) ? [...rawErrors] : [];
  });

  protected readonly shouldShowErrors = computed<boolean>(() => {
    return this.invalid() && this.touched();
  });

  //#region Interface Methods

  /**
   * Invoked automatically by the form system when programmatically calling `.focus()`
   * on the associated form field tree.
   */
  public focus(options?: FocusOptions): void {
    this.inputElement().nativeElement.focus(options);
  }

  /**
   * Invoked automatically when the root form executes a `.reset()` routine.
   */
  public reset(): void {
    this.value.set(false);
  }

  //#endregion

  toggle() {
    if (this.disabled()) {
      return;
    }

    const next = !this.value();
    this.value.set(next);
    this.touch.emit();
  }
}
