import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-table',
  standalone: true,
  templateUrl: './ui-table.component.html',
  styleUrls: ['./ui-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class UITableComponent {
  readonly componentClass = input<string>();
  readonly visible = input<boolean>(true);
}
