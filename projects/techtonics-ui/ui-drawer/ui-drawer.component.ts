import {
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  ViewChild,
  contentChild,
  effect,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type DrawerPosition = 'right' | 'left' | 'top' | 'bottom';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-drawer.component.html',
  styleUrl: './ui-drawer.component.css',
})
export class UIDrawerComponent {
  isOpen = input.required<boolean>();
  position = input<DrawerPosition>('right');
  closeOnEscape = input<boolean>(true);
  closeOnBackdrop = input<boolean>(true);
  customSize = input<string>('');

  close = output<void>();

  headerTemplate = contentChild<TemplateRef<any>>('drawerHeader');
  bodyTemplate = contentChild<TemplateRef<any>>('drawerBody');
  footerTemplate = contentChild<TemplateRef<any>>('drawerFooter');

  @ViewChild('drawerContainer', { static: false }) drawerContainer!: ElementRef<HTMLElement>;

  // Controls the assignment of the '.active' CSS class
  isAnimated = signal<boolean>(false);

  constructor(private renderer: Renderer2) {
    effect(() => {
      if (this.isOpen()) {
        this.renderer.setStyle(document.body, 'overflow', 'hidden');

        // Nesting requestAnimationFrames guarantees the browser paints
        // the initial hidden state into the layout timeline before we slide it in.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.isAnimated.set(true);

            // Shifting focus directly to the wrapper container immediately after it renders
            if (this.drawerContainer) {
              this.drawerContainer.nativeElement.focus();
            }
          });
        });
      } else {
        this.renderer.removeStyle(document.body, 'overflow');
        this.isAnimated.set(false);
      }
    });
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    if (event.key === 'Escape' && this.closeOnEscape()) this.closeDrawer();
    if (event.key === 'Tab') this.trapFocus(event);
  }

  closeDrawer() {
    // Remove the active class to trigger the smooth CSS slide-out animation
    this.isAnimated.set(false);

    // Wait for the 300ms CSS transition to finish before allowing the parent component
    // to change the [isOpen] input state (which triggers the @if structural teardown)
    setTimeout(() => {
      this.close.emit();
    }, 300);
  }

  onBackdropClick() {
    if (this.closeOnBackdrop()) {
      this.closeDrawer();
    }
  }

  private trapFocus(event: KeyboardEvent) {
    const focusable = this.getAbsoluteFocusableElements();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }

  private getAbsoluteFocusableElements(): HTMLElement[] {
    if (!this.drawerContainer) return [];
    const selector =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    return Array.from(this.drawerContainer.nativeElement.querySelectorAll<HTMLElement>(selector));
  }
}
