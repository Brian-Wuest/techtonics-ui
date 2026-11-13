import { Component, inject, input } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';

import { VALIDATION_TRANSLATOR } from './validation-translator.token';

@Component({
  selector: 'ui-form-error',
  standalone: true,
  templateUrl: './ui-form-error.component.html',
  styleUrls: ['./ui-form-error.component.css'],
  host: {
    '[style.display]': 'visible() ? "inline" : "none"',
  },
})
export class UIFormErrorComponent {
  // Try to get consumer's engine; fall back smoothly to library's English service
  private translator = inject(VALIDATION_TRANSLATOR);

  // Input accepting field states from parent input
  readonly errors = input<ValidationError[]>([]);
  readonly visible = input<boolean>(false);

  protected getMessage(error: ValidationError & Record<string, any>): string {
    return this.translator.translate(error.kind, error);
  }
}
