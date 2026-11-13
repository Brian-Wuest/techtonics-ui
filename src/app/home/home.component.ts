import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'ui-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './home.component.css',
})
export class HomeComponent {
  protected readonly title = signal('Techtonics-UI Workbench');
}
