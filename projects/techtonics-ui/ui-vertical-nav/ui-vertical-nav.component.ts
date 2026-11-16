import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  ElementRef,
  HostListener,
  input,
  signal,
  TemplateRef,
  output,
  inject,
} from '@angular/core';
import { UIIconInterceptorDirective } from 'techtonics-ui/directives';
import { NavItem } from 'techtonics-ui/ui-app-nav';
import { TooltipDirective } from 'techtonics-ui/ui-tooltip';

@Component({
  selector: 'ui-vertical-nav',
  standalone: true,
  imports: [NgTemplateOutlet, TooltipDirective, NgClass, UIIconInterceptorDirective],
  templateUrl: './ui-vertical-nav.component.html',
  styleUrls: ['./ui-vertical-nav.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UIVerticalNavComponent implements AfterViewInit {
  private host: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  readonly items = input<NavItem[]>([]);
  readonly itemTemplate = contentChild<TemplateRef<any> | null>('item');
  readonly groupHeaderTemplate = contentChild<TemplateRef<any> | null>('groupHeader');

  readonly highlightActive = input(false);
  readonly isActive = input<((item: NavItem) => boolean) | null>(null);
  readonly componentClass = input<string>();
  readonly visible = input<boolean>(true);

  readonly sticky = input(false);
  collapsed = signal(false);
  readonly collapseToggleIcon = input<string | null>(null);
  readonly side = input<'left' | 'right'>('left');

  readonly itemClick = output<NavItem>();

  openGroups = signal<Set<string | number>>(new Set());
  openPopoverId = signal<string | number | null>(null);

  ngAfterViewInit() {
    if (this.highlightActive()) {
      this.items().forEach((item) => {
        if (item.children?.some((child) => this.isItemActive(child))) {
          this.toggleGroup(item.id);
        }
      });
    }
  }

  isItemActive(item: NavItem): boolean {
    if (!this.highlightActive()) return false;

    const isActive = this.isActive();
    if (isActive) {
      return isActive(item);
    }

    if (item.route) {
      return window.location.pathname === item.route;
    }

    return false;
  }

  isGroupOpen(id: string | number): boolean {
    return this.openGroups().has(id);
  }

  toggleGroup(id: string | number) {
    const set = new Set(this.openGroups());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.openGroups.set(set);
  }

  onItemClick(item: NavItem, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }

    const hasChildren = !!item.children?.length;

    const currentPopoverId = this.openPopoverId();

    if (this.collapsed() && hasChildren) {
      // collapsed mode → open popover
      this.openPopoverId.set(currentPopoverId === item.id ? null : item.id);

      requestAnimationFrame(() => {
        this.positionPopover(item.id);
      });

      return;
    }

    if (hasChildren) {
      this.toggleGroup(item.id);
    } else {
      this.itemClick.emit(item);

      requestAnimationFrame(() => {
        this.openPopoverId.set(null);
      });
    }
  }

  toggleCollapsed() {
    this.collapsed.set(!this.collapsed());
    this.openPopoverId.set(null);
  }

  getAbbrev(label: string): string {
    return label
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  private positionPopover(id: string | number) {
    const hostEl = this.host.nativeElement;
    const trigger = hostEl.querySelector(`[data-nav-trigger="${id}"]`) as HTMLElement | null;
    const popover = hostEl.querySelector(`[data-nav-popover="${id}"]`) as HTMLElement | null;

    if (!trigger || !popover) return;

    const tRect = trigger.getBoundingClientRect();
    const pRect = popover.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = tRect.top;
    let left: number;

    if (this.side() === 'left') {
      left = tRect.right + 8;
      if (left + pRect.width > vw) {
        left = vw - pRect.width - 8;
      }
    } else {
      left = tRect.left - pRect.width - 8;
      if (left < 0) {
        left = 8;
      }
    }

    if (top + pRect.height > vh) {
      top = vh - pRect.height - 8;
    }
    if (top < 8) top = 8;

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  @HostListener('window:resize')
  onResize() {
    const currentPopoverId = this.openPopoverId();

    if (currentPopoverId) {
      requestAnimationFrame(() => {
        this.positionPopover(currentPopoverId!);
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    if (!this.host.nativeElement.contains(target)) {
      this.openPopoverId.set(null);
    }
  }
}
