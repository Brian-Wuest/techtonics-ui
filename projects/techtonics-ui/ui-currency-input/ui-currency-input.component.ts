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
import { DisabledReason, FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { UIFormErrorComponent } from 'techtonics-ui/ui-form-error';

@Component({
  selector: 'ui-currency-input',
  standalone: true,
  templateUrl: './ui-currency-input.component.html',
  styleUrls: ['./ui-currency-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, UIFormErrorComponent],
})
export class UICurrencyInputComponent implements FormValueControl<number | null> {
  private locale = inject(LOCALE_ID);
  readonly step = input<number>(0.01);
  readonly currency = input<string | null>('USD');
  readonly showButtons = input<boolean>(true);
  readonly showClear = input<boolean>(true);
  readonly componentClass = input<string>();
  readonly incrementAriaLabel = input<string>('Increment');
  readonly decrementAriaLabel = input<string>('Decrement');

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

  private inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  value = model<number | null>(null);

  readonly touch = output();

  // Cache localized formatting characters dynamically based on active locale
  private decimalSeparator: string = '.';
  private groupSeparator: string = ',';

  display = computed(() => {
    let controlValue = this.value();

    if (controlValue == null) {
      return null;
    }

    return this.format(controlValue);
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

  constructor() {
    this.determineLocaleSeparators();
  }

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
    const nextChar = event.key;
    if (!this.isValidInputChar(nextChar, target.value)) {
      event.preventDefault();
    }
  }

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

  protected onBeforeInput(event: InputEvent): void {
    // Modern browser check to handle virtual keyboards and pasted fragments
    const target = event.target as HTMLInputElement;
    const insertedText = event.data;

    if (insertedText) {
      // Validate every individual character in a multi-character paste or input change
      for (const char of insertedText) {
        if (!this.isValidInputChar(char, target.value)) {
          event.preventDefault();
          break;
        }
      }
    }
  }

  private isValidInputChar(char: string, currentString: string): boolean {
    // Only permit digits, minus symbols, your active localized decimal, or active group separator
    if (/^\d$/.test(char)) {
      return true;
    }

    if (char === this.decimalSeparator) {
      return true;
    }

    if (char === this.groupSeparator) {
      return true;
    }

    // Only allow minus symbol if the minimum allows negatives and it's at the start
    let innerMin = this.min();
    if (char === '-' && innerMin != null && innerMin < 0 && !currentString.includes('-')) {
      return true;
    }

    return false;
  }

  protected get formatter() {
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      minimumFractionDigits: 0,
      currency: this.currency() ?? this.detectCurrency(),
    });
  }

  private detectCurrency() {
    return Intl.NumberFormat().resolvedOptions().currency ?? 'USD';
  }

  private format(n: number) {
    return this.formatter.format(n);
  }

  private parse(str: string): number | null {
    const parts = this.formatter.formatToParts(1234.5);
    const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';

    const normalized = str.replace(/[^\d.,-]/g, '').replace(decimal, '.');
    const num = Number(normalized);
    return isNaN(num) ? null : num;
  }

  protected onInput(raw: string) {
    if (this.disabled()) {
      return;
    }

    const parsed = this.parse(raw);
    this.updateValue(parsed);
  }

  protected onBlur(): void {
    this.touch.emit();
  }

  private determineLocaleSeparators(): void {
    const parts = new Intl.NumberFormat(this.locale).formatToParts(1000.1);
    this.decimalSeparator = parts.find((p) => p.type === 'decimal')?.value || '.';
    this.groupSeparator = parts.find((p) => p.type === 'group')?.value || ',';
  }

  private updateValue(newValue: number | null): void {
    const clamped = newValue !== null ? this.clamp(newValue) : null;
    this.value.set(clamped);
  }

  private clamp(val: number): number {
    let innerMin = this.min();
    let innerMax = this.max();

    innerMin = innerMin == undefined ? val : innerMin;
    innerMax = innerMax == undefined ? val : innerMax;

    return Math.max(innerMin, Math.min(innerMax, val));
  }
}
