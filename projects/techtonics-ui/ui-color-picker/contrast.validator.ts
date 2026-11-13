import { validate } from '@angular/forms/signals';
import { getContrastRatio } from './color-utils';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function signalFormsContrastValidator(textPath: any, backgroundPath: any, targetRatio = 4.5) {
  // Attaches to the Foreground Picker
  const textRule = validate(textPath, ({ value, valueOf }) => {
    const textVal = value();
    const bgVal = valueOf(backgroundPath);
    if (!textVal || !bgVal || typeof textVal !== 'string' || typeof bgVal !== 'string') return null;

    if (getContrastRatio(textVal, bgVal) < targetRatio) {
      return { kind: 'contrastAccessibility', message: `Contrast is poor.` };
    }
    return null;
  });

  // Attaches to the Background Picker to create dual-error visibility
  const bgRule = validate(backgroundPath, ({ value, valueOf }) => {
    const bgVal = value();
    const textVal = valueOf(textPath);
    if (!textVal || !bgVal || typeof textVal !== 'string' || typeof bgVal !== 'string') return null;

    if (getContrastRatio(textVal, bgVal) < targetRatio) {
      return { kind: 'contrastAccessibility', message: `Contrast is poor.` };
    }
    return null;
  });

  return [textRule, bgRule];
}

export function reactiveFormsContrastValidator(
  textControlName: string,
  bgControlName: string,
  targetRatio = 4.5,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const textControl = control.get(textControlName);
    const bgControl = control.get(bgControlName);

    if (!textControl || !bgControl) return null;

    const textVal = textControl.value;
    const bgVal = bgControl.value;

    if (!textVal || !bgVal || typeof textVal !== 'string' || typeof bgVal !== 'string') {
      return null;
    }

    if (getContrastRatio(textVal, bgVal) < targetRatio) {
      const errorPayload = {
        contrastAccessibility: {
          message: `Contrast is poor (${getContrastRatio(textVal, bgVal).toFixed(2)}:1). Target is ${targetRatio}:1.`,
        },
      };

      // Set errors on both controls directly so both UI pickers flash validation visual highlights
      textControl.setErrors({ ...textControl.errors, ...errorPayload });
      bgControl.setErrors({ ...bgControl.errors, ...errorPayload });

      return errorPayload;
    }

    // Clean up cross-field error flags if color balances clear the threshold bounds
    if (textControl.hasError('contrastAccessibility')) {
      const { contrastAccessibility, ...remainingErrors } = textControl.errors || {};
      textControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }
    if (bgControl.hasError('contrastAccessibility')) {
      const { contrastAccessibility, ...remainingErrors } = bgControl.errors || {};
      bgControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }

    return null;
  };
}
