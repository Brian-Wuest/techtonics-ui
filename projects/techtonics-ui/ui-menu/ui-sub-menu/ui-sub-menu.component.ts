import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { UIIconInterceptorDirective } from 'techtonics-ui/directives';
import { MenuItem, StandardMenuItem } from '../ui-menu.model';

@Component({
  selector: 'ui-sub-menu',
  standalone: true,
  imports: [CommonModule, UIIconInterceptorDirective],
  styleUrls: ['../ui-menu.component.css'],
  templateUrl: './ui-sub-menu.component.html',
})
export class UISubMenuComponent {
  private elementRef = inject(ElementRef);
  popoverElement = viewChild<ElementRef<HTMLElement>>('popoverElement');

  menuItems = input.required<MenuItem[]>();
  anchorX = input.required<number>();
  anchorY = input.required<number>();
  parentItemElement = input<HTMLElement | null>(null);
  itemTemplate = input<TemplateRef<any> | undefined | null>(null);

  onClick = output<{ menuItem: MenuItem; hostElement: HTMLElement; event: MouseEvent }>();
  onCloseSubmenu = output<void>();

  activeItem = signal<StandardMenuItem | null>(null);
  activeLiElement = signal<HTMLElement | null>(null);
  subMenuCoords = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  private closeTimeout: any;

  isStandardItem(item: MenuItem): item is StandardMenuItem {
    return item.type !== 'separator';
  }

  constructor() {
    effect(() => {
      const popover = this.popoverElement()?.nativeElement;
      if (!popover) return;

      popover.style.left = `${this.anchorX()}px`;
      popover.style.top = `${this.anchorY()}px`;

      if (!popover.matches(':popover-open')) {
        popover.showPopover();
      }
    });
  }

  @HostListener('keydown', ['$event'])
  handleSubmenuKeyboard(event: KeyboardEvent): void {
    event.stopPropagation();

    const items = this.getFocusableElements();
    if (items.length === 0) return;

    const currentActive = document.activeElement as HTMLElement;

    if (currentActive && currentActive.closest('ui-sub-menu ui-sub-menu')) {
      return;
    }

    const activeIndex = items.indexOf(currentActive as HTMLLIElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (activeIndex + 1) % items.length;
        items[nextIndex].focus();
        break;

      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (activeIndex - 1 + items.length) % items.length;
        items[prevIndex].focus();
        break;

      case 'ArrowRight':
        if (activeIndex !== -1) {
          const currentLi = items[activeIndex];
          const matchedItem = this.getMenuItemFromElement(currentLi);

          if (
            matchedItem &&
            this.isStandardItem(matchedItem) &&
            matchedItem.children &&
            matchedItem.children.length > 0
          ) {
            event.preventDefault();
            this.clearCloseTimeout();
            this.calculateSubMenuPosition(currentLi);
            this.activeLiElement.set(currentLi);
            this.activeItem.set(matchedItem);

            setTimeout(() => {
              const subMenus = this.elementRef.nativeElement.querySelectorAll('ui-sub-menu .menu-popover-root');
              const deepPopover = subMenus[subMenus.length - 1];
              const subItems = deepPopover?.querySelector('li.menu-item:not(.disabled)') as HTMLElement;
              if (subItems) {
                subItems.focus();
              }
            }, 50);
          }
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        this.onCloseSubmenu.emit();
        const parentLi = this.parentItemElement();
        if (parentLi) {
          parentLi.focus();
        }
        break;

      case 'Enter':
      case ' ':
        if (activeIndex !== -1) {
          event.preventDefault();
          items[activeIndex].click();
        }
        break;
    }
  }

  private calculateSubMenuPosition(liElement: HTMLElement): void {
    const itemRect = liElement.getBoundingClientRect();
    const parentPopoverEl = this.popoverElement()?.nativeElement;
    if (!parentPopoverEl) return;
    const parentRect = parentPopoverEl.getBoundingClientRect();

    let targetX = parentRect.left + parentRect.width;
    let targetY = itemRect.top;

    if (targetX + 180 > window.innerWidth) {
      targetX = parentRect.left - 180;
    }
    this.subMenuCoords.set({ x: targetX, y: targetY });
  }

  protected focusParentTrigger(): void {
    const parentLi = this.activeLiElement();
    this.activeItem.set(null);
    this.activeLiElement.set(null);
    if (parentLi) {
      setTimeout(() => parentLi.focus(), 10);
    }
  }

  private getFocusableElements(): HTMLLIElement[] {
    const popover = this.popoverElement()?.nativeElement;
    if (!popover) return [];
    return Array.from(popover.querySelectorAll(':scope > ul.menu-list > li.menu-item:not(.disabled)'));
  }

  private getMenuItemFromElement(el: HTMLElement): MenuItem | undefined {
    return this.menuItems().find((i) => i.id === el.id);
  }

  onMouseEnter(item: MenuItem, liElement: HTMLElement): void {
    if (item.type === 'separator' || item.disabled || !item.children || item.children.length === 0) {
      this.onMouseLeave();
      return;
    }
    this.clearCloseTimeout();
    this.calculateSubMenuPosition(liElement);
    this.activeLiElement.set(liElement);
    this.activeItem.set(item);
  }

  onMouseLeave(): void {
    this.clearCloseTimeout();
    this.closeTimeout = setTimeout(() => {
      const active = document.activeElement as HTMLElement;
      if (active && active.closest('ui-sub-menu') && active.closest('ui-sub-menu') !== this.elementRef.nativeElement)
        return;
      this.activeItem.set(null);
      this.activeLiElement.set(null);
    }, 150);
  }

  onSubmenuMouseEnter(): void {
    this.clearCloseTimeout();
  }

  onSubmenuMouseLeave(): void {
    this.onMouseLeave();
  }

  private clearCloseTimeout(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  onItemClick(item: any, event: MouseEvent): void {
    if (item.disabled) return;
    event.stopPropagation();

    if (!item.children || item.children.length === 0) {
      this.onClick.emit({ menuItem: item, hostElement: this.elementRef.nativeElement, event });
    }
  }

  forwardClick(eventData: any): void {
    this.onClick.emit(eventData);
  }
}
