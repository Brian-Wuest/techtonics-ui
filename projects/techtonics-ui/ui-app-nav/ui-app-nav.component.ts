import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  HostListener,
  input,
  signal,
  TemplateRef,
  output,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { ClickOutsideDirective, UIIconInterceptorDirective } from 'techtonics-ui/directives';
import { NavItem } from './nav-item';

@Component({
  selector: 'ui-app-nav',
  standalone: true,
  imports: [NgTemplateOutlet, ClickOutsideDirective, NgClass, UIIconInterceptorDirective],
  templateUrl: './ui-app-nav.component.html',
  styleUrls: ['./ui-app-nav.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UIAppNavComponent {
  private router: Router = inject(Router);

  readonly items = input<NavItem[]>([]);

  readonly logo = input<string | null>(null);
  readonly componentClass = input<string>();
  readonly visible = input<boolean>(true);
  readonly logoTemplate = contentChild<TemplateRef<any> | null>('logo');

  readonly showProfileMenu = input<boolean>(true);
  readonly profileItems = input<NavItem[]>([]);
  readonly profileTemplate = contentChild<TemplateRef<any> | null>('profile');
  readonly profileMenuName = input<string>('Profile');

  readonly itemTemplate = contentChild<TemplateRef<any> | null>('item');
  readonly dropdownItemTemplate = contentChild<TemplateRef<any> | null>('dropdownItem');
  readonly megaMenuTemplate = contentChild<TemplateRef<any> | null>('megaMenu');

  // We don't defaultly re-route on item click, generally leave that to the consuming component
  // as they may want to do something else with the nav item which was clicked, who knows.
  // But if they do want us to route when clicking an item, so be it.
  readonly routeOnItemClick = input<boolean>(false);

  readonly itemClick = output<NavItem>();

  mobileOpen = signal(false);
  openDropdownId = signal<string | null>(null);
  openProfile = signal(false);

  toggleMobile() {
    this.mobileOpen.update((v) => !v);
  }

  toggleDropdown(id: string) {
    this.openDropdownId.update((v) => (v === id ? null : id));
  }

  toggleProfile() {
    this.openProfile.update((v) => !v);
  }

  onItemClick(item: NavItem) {
    if (item.disabled) return;

    if (item.route) {
      this.itemClick.emit(item);

      // If the developer wants us to route on navigation item click we do so.
      // Defaultly we won't.
      if (this.routeOnItemClick()) {
        this.router.navigate([item.route]);
      }

      this.mobileOpen.set(false);
      this.openDropdownId.set(null);
      this.openProfile.set(false);
      return;
    }

    if (item.children?.length) {
      this.toggleDropdown(item.id);
    }
  }

  onClickOutside() {
    this.mobileOpen.set(false);
    this.openDropdownId.set(null);
    this.openProfile.set(false);
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 768 && this.mobileOpen()) {
      this.mobileOpen.set(false);
    }
  }
}
