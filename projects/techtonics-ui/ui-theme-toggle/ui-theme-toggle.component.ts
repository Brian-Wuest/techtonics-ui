import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from 'techtonics-ui/services';
import { UIToggleComponent } from 'techtonics-ui/ui-toggle';
import { UIIconInterceptorDirective } from 'techtonics-ui/directives';

@Component({
  selector: 'ui-theme-toggle',
  standalone: true,
  templateUrl: './ui-theme-toggle.component.html',
  styleUrls: ['./ui-theme-toggle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UIToggleComponent, FormsModule, UIIconInterceptorDirective],
})
export class UIThemeToggleComponent {
  theme: ThemeService = inject(ThemeService);

  disabled = input<boolean>(false);

  isDarkMode = computed(() => {
    return this.theme.theme() == 'dark';
  });

  toggleTheme() {
    this.theme.toggle();
  }
}
