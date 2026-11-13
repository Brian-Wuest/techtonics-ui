import { Component, ElementRef, ViewChild, effect, input, output, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIPopoverTriggerDirective } from './ui-popover-trigger.directive';

export type PopoverPosition = 'bottom' | 'top' | 'left' | 'right';

let instanceIdCounter = 0;

@Component({
  selector: 'ui-popover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-popover.component.html',
  styleUrl: './ui-popover.component.css',
})
export class UIPopoverComponent {
  // --- Inputs ---
  isOpen = input.required<boolean>();
  maxSize = input<string>('400px');
  position = input<PopoverPosition>('bottom');

  // Accepts a raw native DOM element OR the template reference of our trigger directive
  triggerElement = input.required<HTMLElement | UIPopoverTriggerDirective>();

  // --- Outputs ---
  onClose = output<void>();

  @ViewChild('popoverElement', { static: true }) popoverElement!: ElementRef<HTMLElement>;

  protected uniqueAnchorName = `--ui-popover-anchor-${instanceIdCounter++}`;

  constructor(private renderer: Renderer2) {
    // Dynamic Anchor linkage alignment pass
    effect(() => {
      const triggerInput = this.triggerElement();
      if (!triggerInput) return;

      // Extract the physical element whether it's a directive instantiation or raw element
      const targetAnchorElement =
        triggerInput instanceof UIPopoverTriggerDirective ? triggerInput.nativeElement : triggerInput;

      this.renderer.setStyle(targetAnchorElement, 'anchor-name', this.uniqueAnchorName);
    });

    // Native platform window modal orchestration pass
    effect(() => {
      const showState = this.isOpen();
      const nativeEl = this.popoverElement?.nativeElement;
      if (!nativeEl) return;

      try {
        if (showState) {
          nativeEl.showPopover();
        } else {
          nativeEl.hidePopover();
        }
      } catch (e) {
        // SSR Resilient Safe-Guard
      }
    });
  }

  handleToggle(event: any) {
    if (event.newState === 'closed') {
      this.onClose.emit();
    }
  }
}
