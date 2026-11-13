import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  templateUrl: './ui-skeleton.component.html',
  styleUrls: ['./ui-skeleton.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class UISkeletonComponent {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly componentClass = input<string>();
  readonly visible = input<boolean>(true);
}
