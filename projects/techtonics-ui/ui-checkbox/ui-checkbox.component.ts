import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  LOCALE_ID,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  DisabledReason,
  FormCheckboxControl,
  FormValueControl,
  ValidationError,
  WithOptionalFieldTree,
} from '@angular/forms/signals';
import { UIFormErrorComponent } from 'techtonics-ui/ui-form-error';

@Component({
  selector: 'ui-checkbox',
  standalone: true,
  templateUrl: './ui-checkbox.component.html',
  styleUrls: ['./ui-checkbox.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, UIFormErrorComponent, NgClass],
})
export class UICheckboxComponent implements FormCheckboxControl {
  readonly label = input<string>();
  readonly ariaLabel = input<string>();
  readonly componentClass = input<string | undefined>(undefined);

  readonly name = input<string>('');
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);

  checked = model<boolean>(false);

  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  readonly hidden = input<boolean>(false);

  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly errors = input<readonly ValidationError[]>([]);

  private inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  readonly touch = output();
  readonly changed = output<boolean>();

  actualName = computed(() => {
    const currentName = this.name();

    if (currentName == null || currentName.length == 0) {
      return undefined;
    }

    return currentName;
  });

  /**
   * Consolidate errors from either the 3rd-party Form Control instance
   * OR evaluate manual structural rules if no control is attached.
   */
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
    this.checked.set(false);
  }

  //#endregion

  protected changeHandler(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.disabled()) {
      return;
    }

    let currentlyChecked = this.checked();
    this.checked.set(!currentlyChecked);
    this.touch.emit();
    this.changed.emit(!currentlyChecked);
  }
}
