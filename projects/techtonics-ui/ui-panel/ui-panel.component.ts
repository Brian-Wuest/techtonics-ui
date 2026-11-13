import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'ui-panel',
  standalone: true,
  templateUrl: './ui-panel.component.html',
  styleUrls: ['./ui-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class UIPanelComponent {
  public collaspable = input<boolean>(true);
  readonly componentClass = input<string>();
  readonly visible = input<boolean>(true);

  protected open = signal<boolean>(false);

  protected toggle() {
    let value = this.open();

    this.open.set(!value);
  }
}
