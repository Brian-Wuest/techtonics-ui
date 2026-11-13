import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  templateUrl: './ui-card.component.html',
  styleUrls: ['./ui-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class UICardComponent {
  readonly componentClass = input<string>();
  readonly visible = input<boolean>(true);

  protected open = signal<boolean>(false);

  protected toggle() {
    let value = this.open();

    this.open.set(!value);
  }
}
