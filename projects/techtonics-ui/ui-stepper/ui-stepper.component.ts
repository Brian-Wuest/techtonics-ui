import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  input,
  output,
  TemplateRef,
} from '@angular/core';

export interface TimelineEvent<T = any> {
  key: string;
  label: string;
  description?: string;
  disabled?: boolean;
  data?: T;
}
@Component({
  selector: 'ui-stepper',
  standalone: true,
  imports: [NgTemplateOutlet, NgClass],
  templateUrl: './ui-stepper.component.html',
  styleUrls: ['./ui-stepper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UIStepperComponent {
  // Inputs using signals
  readonly steps = input.required<TimelineEvent[]>();
  readonly currentStepIndex = input.required<number>();
  readonly orientation = input<'vertical' | 'horizontal'>('horizontal');
  readonly visible = input<boolean>(true);

  readonly disableFutureSteps = input<boolean>(false);
  readonly alternateSides = input<boolean>(false);
  readonly componentClass = input<string>();
  readonly ariaLabelStepPrefix = input<string>('Go to ');

  // Content child template hook looking for #label ref
  readonly labelTemplate = contentChild<TemplateRef<any>>('label');

  // Emit the step object alongside its index position
  readonly stepClick = output<{ step: TimelineEvent; index: number }>();

  onStepClick(step: TimelineEvent, index: number): void {
    this.stepClick.emit({ step, index });
  }

  getAlignmentSide(index: number): 'left' | 'right' | null {
    if (this.orientation() !== 'vertical' || !this.alternateSides()) {
      return null;
    }

    return index % 2 === 0 ? 'left' : 'right';
  }
}
