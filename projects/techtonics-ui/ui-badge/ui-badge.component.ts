import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-badge',
  standalone: true,
  templateUrl: './ui-badge.component.html',
  styleUrls: ['./ui-badge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class UIBadgeComponent {
  readonly variant = input<'success' | 'warning' | 'error' | 'info'>('info');
  readonly componentClass = input<string>();
  readonly visible = input<boolean>(true);

  get variantClass() {
    return `badge-${this.variant()}`;
  }
}
