import { Directive, ElementRef, HostListener, input } from '@angular/core';
import { FormControlName } from '@angular/forms';

@Directive({
  selector: '[uiNumericField]',
})
export class NumericFieldDirective {
  uiNumericType = input.required<'int' | 'decimal'>();
  uiMaxValue = input<number>();
  uiMinvalue = input<number>();

  private regex = {
    int: new RegExp(/^-?\d+$/),
    decimal: new RegExp(/^-?\d*\.?\d{0,2}$/),
  };

  private specialKeys = {
    int: ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'],
    decimal: ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete', '.'],
  };

  private current = '';

  constructor(
    private readonly formControl: FormControlName,
    private el: ElementRef,
  ) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.current = this.formControl.value;
    let currentType = this.uiNumericType();

    // Allow special keys for navigation and editing.
    if (this.specialKeys[currentType].indexOf(event.key) !== -1) {
      return;
    }

    const el = this.el.nativeElement;
    const start = el.selectionStart;
    const currentValue: string = el.value;

    // Handle minus sign;

    if (event.key === '-') {
      event.preventDefault();

      // If already has a minus at start, remove it.
      if (currentValue.startsWith('-')) {
        this.formControl.control.setValue(currentType.substring(1));
        return;
      }

      // Add minus at start.
      if (start === 0) {
        this.formControl.control.setValue('-' + currentValue);
        return;
      }

      return;
    }

    // Only allow digits.
    if (!/^\d/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Check if the resulting value would be valid.
    const end = el.selectionEnd;
    const newValue = currentValue.substring(0, start) + event.key + currentValue.substring(end);

    // for decimal type, check decimal places.
    if (currentType == 'decimal') {
      const dotIndex = newValue.indexOf('.');
      if (dotIndex >= 0) {
        const decimalPart = newValue.substring(dotIndex + 1);
        if (decimalPart.length > 2) {
          event.preventDefault();
          return;
        }
      }
    }

    // Validate against appropriate regex.
    const valueToTest = newValue.startsWith('-') ? newValue.substring(1) : newValue;
    if (!this.regex[currentType].test(valueToTest)) {
      event.preventDefault();
      return;
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    const inputValue = this.formControl.value as string;
    let currentType = this.uiNumericType();

    if (inputValue) {
      // Handle negative numbers.
      const isNegative = inputValue.startsWith('-');
      const absValue = isNegative ? inputValue.substring(1) : inputValue;

      if (!String(absValue).match(this.regex[currentType])) {
        // Revert value change if not numeric value was input either by keypress or pasted using only clicks.
        this.formControl.control.setValue(this.current);
        return;
      }

      // When typing "0" or "0.", or "." it's considered "0" here, so we
      // validate, for decimal, until we have something different from 0.
      // Without this check, trying to type any of the cases mentioned abive
      // will be overwrittedn with the current value (which could be empty value)
      // if minimum limit is something like 0.01.
      const numericValue = isNegative ? -Number(absValue) : Number(absValue);
      const min = this.uiMinvalue();

      if (
        min != null &&
        (currentType == 'int' || (currentType == 'decimal' && numericValue !== 0))
      ) {
        // Revert value change if the input is lower than the min value.
        if (numericValue < min) {
          this.formControl.control.setValue(this.current);
          return;
        }
      }

      const max = this.uiMaxValue();

      if (max != null) {
        // Revert value change if the input is higher than the max limit.
        if (numericValue > max) {
          this.formControl.control.setValue(this.current);
          return;
        }
      }
    }
  }
}
