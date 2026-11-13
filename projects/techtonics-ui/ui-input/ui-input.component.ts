import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  input,
  model,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DisabledReason,
  FormValueControl,
  ValidationError,
  WithOptionalFieldTree,
} from '@angular/forms/signals';
import { UIFormErrorComponent } from 'techtonics-ui/ui-form-error';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [NgTemplateOutlet, FormsModule, NgClass, UIFormErrorComponent],
  templateUrl: './ui-input.component.html',
  styleUrls: ['./ui-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-input',
  },
})
export class UIInputComponent implements FormValueControl<string | null> {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly showClear = input<boolean>(true);
  readonly clearAriaLabel = input<string>('Clear value');
  readonly componentClass = input<string>();

  // Availability & Field Presence Inputs
  readonly disabled = input<boolean>(false);
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);

  // Constraint & HTML Validation Inputs
  readonly required = input<boolean>(false);
  readonly minLength = input<number>();
  readonly maxLength = input<number>();

  // Interaction & State Tracking Inputs (Read-only states provided down by FormField)
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');

  // Validation Inputs
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly errors = input<readonly ValidationError[]>([]);

  value = model<string | null>(null);

  readonly preInputTemplate = contentChild<TemplateRef<any> | null>('preInput');

  // Element reference to pass focus commands cleanly down to the true DOM node
  private inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  readonly touch = output();

  display = computed(() => {
    let innerValue = this.value();

    if (innerValue == null) {
      return '';
    }

    // Making this computed for now in-case we want to do something with it.
    return this.value();
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
    this.value.set(null);
  }

  //#endregion

  protected onInput(event: InputEvent) {
    if (this.disabled()) {
      return;
    }

    let target = event.currentTarget;

    if (target != null) {
      this.value.set((target as any).value);
    }
  }

  protected clear(): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(null);
  }

  protected onBlur(): void {
    if (this.disabled()) {
      return;
    }

    this.touch.emit();
  }
}
