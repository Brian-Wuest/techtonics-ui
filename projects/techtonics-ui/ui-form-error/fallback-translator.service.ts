// shared-ui/src/lib/validation/fallback-translator.service.ts
import { Service } from '@angular/core';
import { ValidationTranslator } from './validation-translator.token';
import { extractAndUnifyValidationContext, SupportedValidationKey } from './validation-registry';

@Service()
export class FallbackTranslatorService implements ValidationTranslator {
  private messages: Record<SupportedValidationKey, string | ((ctx: any) => string)> = {
    required: 'This field is required.',
    requiredtrue: 'You must accept the terms and conditions.',
    email: 'Please enter a valid email address.',
    pattern: (ctx) => `The format is invalid. Required expression: ${ctx['pattern']}.`,
    min: (ctx) => `Value must be at least ${ctx['min'] ?? 0}.`,
    max: (ctx) => `Value cannot exceed ${ctx['max'] ?? 0}.`,
    minlength: (ctx) => `Must be at least ${ctx['length'] ?? 0} characters long.`,
    maxlength: (ctx) => `Cannot be more than ${ctx['length'] ?? 0} characters long.`,
    passwordstrength: 'Password must include uppercase, lowercase, numbers, and symbols.',
    integersonly: 'Please enter digits/numbers only.',
    invalidcreditcard: 'Please enter a valid credit card number.',
    fieldmatch: (ctx) => `This field must match the ${ctx['matchField'] ?? 'corresponding'} field.`,
  };

  translate(kind: string, rawErrorContext?: Record<string, any>): string {
    const normalizedKind = kind.toLowerCase() as SupportedValidationKey;
    const message = this.messages[normalizedKind];

    if (!message) {
      return `Invalid value (Error code: ${kind}).`;
    }

    const normalizedContext = extractAndUnifyValidationContext(rawErrorContext);
    return typeof message === 'function' ? message(normalizedContext) : message;
  }
}
