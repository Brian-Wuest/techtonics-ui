import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, InputSignal, output } from '@angular/core';
import { UIIconInterceptorDirective } from 'techtonics-ui/directives';

@Component({
  selector: 'ui-button',
  standalone: true,
  templateUrl: './ui-button.component.html',
  styleUrls: ['./ui-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, UIIconInterceptorDirective],
})
export class UIButtonComponent {
  /**
   * @description Controls the aesthetic filling styling rules for rendering this button anchor wrapper
   */
  readonly variant = input<'solid' | 'outline' | 'ghost' | 'icon'>('solid');
  readonly type = input<'button' | 'submit'>('button');
  readonly color = input<'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'>('primary');

  /**
   * Sets whether the button element ignores user click action events completely
   */
  readonly disabled = input(false);
  readonly componentClass = input<string>();
  readonly iconClass: InputSignal<string | null> = input<string | null>(null);
  readonly visible = input<boolean>(true);

  readonly click = output<PointerEvent>();

  icon = computed(() => {
    let innerIcon = this.iconClass();

    if (innerIcon == null || innerIcon.trim() == '') {
      return '';
    }

    return innerIcon;
  });

  colorClass = computed(() => {
    let innerColor = this.color();
    let innerComponentClass = this.componentClass();

    let classValue = '';
    switch (innerColor) {
      case 'success': {
        classValue = 'color-success';
        break;
      }
      case 'warning': {
        classValue = 'color-warning';
        break;
      }
      case 'error': {
        classValue = 'color-error';
        break;
      }
      case 'info': {
        classValue = 'color-info';
        break;
      }

      case 'secondary': {
        classValue = 'color-secondary';
        break;
      }

      default: {
        classValue = 'color-primary';
        break;
      }
    }

    if (innerComponentClass != null && innerComponentClass.length > 0) {
      classValue = `${classValue} ${innerComponentClass}`;
    }

    return classValue;
  });

  computedIconClass = computed(() => {
    let innerIcon = this.icon();

    let classValue = '';

    if (innerIcon != '') {
      classValue = `${innerIcon}`;
    } else {
      classValue = 'hidden';
    }

    return classValue;
  });

  protected onClick(event: PointerEvent) {
    event.stopPropagation();
    this.click.emit(event);
  }
}
