import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  LOCALE_ID,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DisabledReason, FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { UIFormErrorComponent } from 'techtonics-ui/ui-form-error';

@Component({
  selector: 'ui-number-spinner',
  standalone: true,
  templateUrl: './ui-number-spinner.component.html',
  styleUrls: ['./ui-number-spinner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgClass, UIFormErrorComponent],
})
export class UINumberSpinnerComponent implements FormValueControl<number | null> {
  private locale = inject(LOCALE_ID);

  // --- Component Inputs (Signals or Standard Inputs) ---
  readonly componentClass = input<string>();
  readonly step = input<number>(0.01);

  readonly decimalPlaces = input<number>(2);
  readonly showThousandthsSeparator = input<boolean>(true);
  readonly showButtons = input<boolean>(true);
  readonly showClear = input<boolean>(true);
  readonly clearAriaLabel = input<string>('Clear value');
  readonly decrementAriaLabel = input<string>('Decrement');
  readonly incrementAriaLabel = input<string>('Increment');

  readonly min = input<number | undefined>(Number.MIN_SAFE_INTEGER);
  readonly max = input<number | undefined>(Number.MAX_SAFE_INTEGER);

  readonly disabled = input<boolean>(false);
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);

  readonly required = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');

  // Validation Inputs
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly errors = input<readonly ValidationError[]>([]);

  value = model<number | null>(null);

  readonly touch = output();

  private spinnerInput = viewChild.required<ElementRef<HTMLInputElement>>('spinnerInput');

  protected inputValue = '';

  // Cache localized formatting characters dynamically based on active locale
  private decimalSeparator: string = '.';
  private groupSeparator: string = ',';

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

  constructor() {
    this.determineLocaleSeparators();

    // This effect runs automatically whenever displayValue changes
    effect(() => {
      const displayValue = this.determineDisplayValue(this.value());
      this.inputValue = displayValue;
    });
  }

  //#region Interface Methods

  /**
   * Invoked automatically by the form system when programmatically calling `.focus()`
   * on the associated form field tree.
   */
  public focus(options?: FocusOptions): void {
    this.spinnerInput().nativeElement.focus(options);
  }

  /**
   * Invoked automatically when the root form executes a `.reset()` routine.
   */
  public reset(): void {
    this.value.set(null);
  }

  //#endregion

  private determineDisplayValue(value: number | null): string {
    const val = value;
    let innerVal = '';

    if (val == null) {
      return '';
    }

    let minVal = this.min() == null ? val : this.min();
    let maxVal = this.max() == null ? val : this.max();

    innerVal = this.formatNumber(Math.min(maxVal!, Math.max(minVal!, val)));

    return innerVal;
  }

  protected onKeyDown(event: KeyboardEvent): void {
    // Intercept physical Up/Down Arrow keys to step values
    if (event.key === 'ArrowUp') {
      event.preventDefault(); // Stop standard browser caret movement
      this.increment();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.decrement();
      return;
    }

    // Allow structural navigation and command hotkeys (Backspace, Delete, Tabs, Arrows, Ctrl+A, Ctrl+C, etc.)
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'Tab' ||
      event.key === 'Escape' ||
      event.key === 'Enter' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.metaKey ||
      event.ctrlKey
    ) {
      return;
    }

    // Fallback check for raw keys to handle instant typing blocking
    const target = event.target as HTMLInputElement;

    const futureValue =
      target.value.slice(0, target.selectionStart || 0) + event.key + target.value.slice(target.selectionEnd || 0);

    if (!this.isValidInputStr(futureValue)) {
      event.preventDefault();
    }
  }

  protected onBeforeInput(event: InputEvent): void {
    const target = event.target as HTMLInputElement;
    const insertedText = event.data;

    if (insertedText) {
      const futureValue =
        target.value.slice(0, target.selectionStart || 0) + insertedText + target.value.slice(target.selectionEnd || 0);

      if (!this.isValidInputStr(futureValue)) {
        event.preventDefault();
      }
    }
  }

  protected onInputChange(event: InputEvent) {
    const target = event.target as HTMLInputElement;
    const insertedText = target.value;

    if (insertedText != null) {
      const originalSelectionStart = target.selectionStart || 0;
      const originalLength = insertedText.length;

      // If it's a transient state (ends in dot, ends in zero following a dot, or just a standalone minus)
      // we let the user keep typing without running the strict clamp/format validation cycle.
      const escapedDecimal = this.decimalSeparator.replace(/[-\/\\^\$*+?.()|[\]{}]/g, '\\$&');
      const trailingZeroOrDecimalRegex = new RegExp(`(${escapedDecimal}$|${escapedDecimal}\\d*0+$)`);

      if (insertedText === '-' || trailingZeroOrDecimalRegex.test(insertedText)) {
        // Keep the text on screen exactly as typed, but you can optionally update an internal
        // un-clamped model here if other components rely on instant value updates.
        return;
      }

      let parsedValue = this.parseLocalizedNumber(insertedText);
      this.updateValue(parsedValue);

      // Restore caret position relative to characters added/removed by formatters
      const newLength = target.value.length;
      const lengthDifference = newLength - originalLength;
      const newSelectionPosition = originalSelectionStart + lengthDifference;

      target.setSelectionRange(newSelectionPosition, newSelectionPosition);
    }
  }

  protected onInputFocus(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    const valueLength = target.value.length;

    // Execute on the next task tick to override default browser click positioning
    setTimeout(() => {
      // Set both the start and end selection points to the end of the text
      target.setSelectionRange(valueLength, valueLength);
    }, 0);
  }

  private isValidInputStr(futureString: string): boolean {
    // Escape separators safely for Regex ingestion
    const escapedGroup = this.groupSeparator.replace(/[-\/\\^\$*+?.()|[\]{}]/g, '\\$&');
    const escapedDecimal = this.decimalSeparator.replace(/[-\/\\^\$*+?.()|[\]{}]/g, '\\$&');
    const precision = this.decimalPlaces();

    // If decimals are completely disabled (precision = 0)
    if (precision === 0) {
      // Allows optional leading minus, followed by digits and optional group separators
      const integerRegex = new RegExp(`^-?\\d*(${escapedGroup}\\d+)*$`);
      return integerRegex.test(futureString);
    }

    // If decimals are enabled (precision > 0)
    // Match integer parts, an optional decimal point, and up to X fractional digits
    const decimalRegex = new RegExp(`^-?\\d*(${escapedGroup}\\d+)*(${escapedDecimal}\\d{0,${precision}})?$`);

    try {
      let result = decimalRegex.test(futureString);
      console.log(result);
      return result;
    } catch (someError) {
      console.error(someError);
      return false;
    }
  }

  // --- ControlValueAccessor Implementation ---
  writeValue(value: any): void {
    if (value === null || value === undefined || value === '') {
      this.value.set(null);
    } else {
      const num = Number(value);
      if (!isNaN(num)) {
        this.value.set(this.clamp(num));
      }
    }
  }

  // --- Interactivity Methods ---
  protected increment(): void {
    if (this.disabled()) {
      return;
    }

    const current = this.value() ?? 0;
    this.updateValue(current + this.step());
  }

  protected decrement(): void {
    if (this.disabled()) {
      return;
    }

    const current = this.value() ?? 0;
    this.updateValue(current - this.step());
  }

  protected clear(): void {
    if (this.disabled()) {
      return;
    }
    this.updateValue(null);
  }

  protected onInputBlur(): void {
    this.touch.emit();

    const inputEl = this.spinnerInput()?.nativeElement;
    if (inputEl) {
      const parsed = this.parseLocalizedNumber(inputEl.value);

      // Make sure to untrack a value change to the opposite of the current value.
      // This way when the actual value change occurs below the signal will be forced to update to the user.
      untracked(() => {
        let currentValue = this.value();

        if (currentValue != null) {
          this.value.set(-currentValue);
        }
      });

      this.updateValue(parsed === null || isNaN(parsed) ? this.value() : parsed);
    }
  }

  private updateValue(newValue: number | null): void {
    const clamped = newValue !== null ? this.clamp(newValue) : null;

    this.value.update((_val) => {
      return clamped;
    });
  }

  private clamp(val: number): number {
    let innerMin = this.min();
    let innerMax = this.max();

    innerMin = innerMin == undefined ? val : innerMin;
    innerMax = innerMax == undefined ? val : innerMax;

    return Math.max(innerMin, Math.min(innerMax, val));
  }

  // --- Internationalization Tools ---
  private determineLocaleSeparators(): void {
    const parts = new Intl.NumberFormat(this.locale).formatToParts(1000.1);
    this.decimalSeparator = parts.find((p) => p.type === 'decimal')?.value || '.';
    this.groupSeparator = parts.find((p) => p.type === 'group')?.value || ',';
  }

  // --- Internationalization Mechanics ---
  private formatNumber(val: number): string {
    const precision = this.decimalPlaces();
    return new Intl.NumberFormat(this.locale, {
      // Allows typing "1.1" without forcing "1.10" instantly
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
      useGrouping: this.showThousandthsSeparator(),
    }).format(val);
  }

  private parseLocalizedNumber(input: string): number | null {
    if (!input.trim()) return null;

    // Remove group separators and swap localized decimal separator with standard JavaScript dot format
    const escapedGroup = this.groupSeparator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escapedDecimal = this.decimalSeparator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    const sanitized = input.replace(new RegExp(escapedGroup, 'g'), '').replace(new RegExp(escapedDecimal, 'g'), '.');

    const result = parseFloat(sanitized);
    return isNaN(result) ? null : result;
  }
}
