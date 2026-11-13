import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { UIIconInterceptorDirective } from 'techtonics-ui/directives';
import { MenuItem, StandardMenuItem } from './ui-menu.model';
import { UISubMenuComponent } from './ui-sub-menu/ui-sub-menu.component';

@Component({
  selector: 'ui-menu',
  standalone: true,
  imports: [UISubMenuComponent, CommonModule, UIIconInterceptorDirective],
  styleUrls: ['./ui-menu.component.css'],
  templateUrl: './ui-menu.component.html',
})
export class UIMenuComponent implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef<HTMLElement>);
  popoverElement = viewChild<ElementRef<HTMLElement>>('popoverElement');
  projectedWrapper = viewChild<ElementRef<HTMLElement>>('projectedWrapper');

  menuItems = input.required<MenuItem[]>();
  isOpen = model<boolean>(false);
  itemTemplate = input<TemplateRef<any> | undefined | null>(null);

  onClick = output<{ menuItem: MenuItem; hostElement: HTMLElement; event: MouseEvent }>();

  activeItem = signal<StandardMenuItem | null>(null);
  activeLiElement = signal<HTMLElement | null>(null);
  subMenuCoords = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  calculatedX = signal<number>(0);
  calculatedY = signal<number>(0);

  private closeTimeout: any;

  // High-precedence guard flag to intercept the upcoming click handler
  private preventNextOpen = false;

  isStandardItem(item: MenuItem): item is StandardMenuItem {
    return item.type !== 'separator';
  }

  constructor() {
    effect(() => {
      const popover = this.popoverElement()?.nativeElement;
      if (!popover) return;

      if (this.isOpen()) {
        this.recalculatePositions();
        popover.style.left = `${this.calculatedX()}px`;
        popover.style.top = `${this.calculatedY()}px`;

        if (!popover.matches(':popover-open')) {
          popover.showPopover();
          setTimeout(() => this.focusItem(0));
        }
      } else {
        if (popover.matches(':popover-open')) {
          popover.hidePopover();
        }
        this.clearTimeoutBuffer();
        this.activeItem.set(null);
        this.activeLiElement.set(null);
      }
    });
  }

  ngAfterViewInit(): void {
    const wrapper = this.projectedWrapper()?.nativeElement;
    if (!wrapper) return;

    // Intercept at pointerdown, which executes BEFORE the light-dismiss macro-task is evaluated.
    // If the menu is open, we close it here programmatically and flag it to stop the upcoming click handler.
    wrapper.addEventListener(
      'pointerdown',
      (event: PointerEvent) => {
        if (this.isOpen()) {
          this.isOpen.set(false);
          this.preventNextOpen = true;
        }
      },
      true,
    );

    // Standard click listener handles opening the menu safely
    wrapper.addEventListener(
      'click',
      (event: MouseEvent) => {
        event.stopPropagation();

        if (this.preventNextOpen) {
          this.preventNextOpen = false;
          return;
        }

        if (!this.isOpen()) {
          this.recalculatePositions();
          this.isOpen.set(true);
        }
      },
      true,
    );
  }

  ngOnDestroy(): void {
    this.clearTimeoutBuffer();
  }

  onPopoverToggle(event: ToggleEvent): void {
    if (event.newState === 'closed') {
      this.calculatedX.set(0);
      this.calculatedY.set(0);

      // Keeps the parent component signal in sync during outside click light-dismissals
      if (this.isOpen()) {
        this.isOpen.set(false);
      }
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeyboardNav(event: KeyboardEvent): void {
    if (!this.isOpen()) return;

    const currentActive = document.activeElement as HTMLElement;
    if (currentActive && currentActive.closest('ui-sub-menu')) {
      return;
    }

    const items = this.getFocusableElements();
    if (items.length === 0) return;

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
            this.clearTimeoutBuffer();
            this.calculateSubMenuPosition(currentLi);
            this.activeLiElement.set(currentLi);
            this.activeItem.set(matchedItem);

            setTimeout(() => {
              const subPopover = document.querySelector('ui-sub-menu .menu-popover-root');
              const subItems = subPopover?.querySelector('li.menu-item:not(.disabled)') as HTMLElement;
              if (subItems) {
                subItems.focus();
              }
            }, 50);
          }
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.isOpen.set(false);
        (this.projectedWrapper()?.nativeElement.firstElementChild as HTMLElement)?.focus();
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

  private focusItem(index: number): void {
    const items = this.getFocusableElements();
    if (items[index]) {
      items[index].focus();
    }
  }

  private recalculatePositions(): void {
    const wrapper = this.projectedWrapper()?.nativeElement;
    if (!wrapper) return;

    const targetElement = wrapper.firstElementChild || wrapper;
    const rect = targetElement.getBoundingClientRect();

    if (rect.left > 0 || rect.top > 0) {
      this.calculatedX.set(rect.left);
      this.calculatedY.set(rect.top + rect.height);
    }
  }

  onMouseEnter(item: MenuItem, liElement: HTMLElement): void {
    if (item.type === 'separator' || item.disabled || !item.children || item.children.length === 0) {
      this.onMouseLeave();
      return;
    }
    this.clearTimeoutBuffer();
    this.calculateSubMenuPosition(liElement);
    this.activeLiElement.set(liElement);
    this.activeItem.set(item);
  }
  onMouseLeave(): void {
    this.clearTimeoutBuffer();
    this.closeTimeout = setTimeout(() => {
      const active = document.activeElement as HTMLElement;
      if (active && active.closest('ui-sub-menu')) return;
      this.activeItem.set(null);
      this.activeLiElement.set(null);
    }, 150);
  }
  onPopoverMouseEnter(): void {
    this.clearTimeoutBuffer();
  }
  onPopoverMouseLeave(): void {
    this.onMouseLeave();
  }
  private clearTimeoutBuffer(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }
  onItemClick(item: any, event: MouseEvent): void {
    if (item.disabled) return;
    event.stopPropagation();
    if (!item.children || item.children.length === 0) {
      this.isOpen.set(false);
      this.onClick.emit({ menuItem: item, hostElement: this.elementRef.nativeElement, event });
    }
  }
  forwardClick(eventData: any): void {
    this.isOpen.set(false);
    this.onClick.emit(eventData);
  }
}
