import {
  Directive,
  ElementRef,
  Renderer2,
  HostListener,
  TemplateRef,
  ViewContainerRef,
  EmbeddedViewRef,
  OnDestroy,
  inject,
  input,
  OnInit,
} from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipTrigger = 'hover' | 'focus' | 'both';

@Directive({
  selector: '[uiTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnInit, OnDestroy {
  private el: ElementRef = inject(ElementRef);
  private renderer: Renderer2 = inject(Renderer2);
  private vcr: ViewContainerRef = inject(ViewContainerRef);

  readonly tooltipContent = input.required<string | TemplateRef<any>>({ alias: 'uiTooltip' });
  readonly tooltipPosition = input<TooltipPosition>('top');
  readonly tooltipTrigger = input<TooltipTrigger>('hover');
  readonly tooltipShowDelay = input(300); // ms
  readonly tooltipHideDelay = input(300); // ms

  private tooltipElement: HTMLElement | null = null;
  private arrowElement: HTMLElement | null = null;

  private viewRef?: EmbeddedViewRef<any>;
  private showTimeout?: any;
  private hideTimeout?: any;
  private observer: IntersectionObserver | null = null;

  // Event bindings
  @HostListener('mouseenter') onMouseEnter() {
    const tooltipTrigger = this.tooltipTrigger();
    if (tooltipTrigger === 'hover' || tooltipTrigger === 'both') {
      this.scheduleShow();
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    const tooltipTrigger = this.tooltipTrigger();
    if (tooltipTrigger === 'hover' || tooltipTrigger === 'both') {
      this.scheduleHide();
    }
  }

  @HostListener('focus') onFocus() {
    const tooltipTrigger = this.tooltipTrigger();
    if (tooltipTrigger === 'focus' || tooltipTrigger === 'both') {
      this.scheduleShow();
    }
  }

  @HostListener('blur') onBlur() {
    const tooltipTrigger = this.tooltipTrigger();
    if (tooltipTrigger === 'focus' || tooltipTrigger === 'both') {
      this.scheduleHide();
    }
  }

  private scheduleShow() {
    clearTimeout(this.hideTimeout);
    this.showTimeout = setTimeout(() => this.showTooltip(), this.tooltipShowDelay());
  }

  private scheduleHide() {
    clearTimeout(this.showTimeout);
    this.hideTimeout = setTimeout(() => this.hideTooltip(), this.tooltipHideDelay());
  }

  private showTooltip() {
    if (this.tooltipElement) {
      // already visible
      return;
    }

    let content = this.tooltipContent();

    if (content == null || content == '') {
      // Don't render anything if the content is null.
      return;
    }

    this.tooltipElement = this.renderer.createElement('div');

    // main tooltip styles
    this.renderer.addClass(this.tooltipElement, 'ui-tooltip-container');

    if (content instanceof TemplateRef) {
      this.viewRef = this.vcr.createEmbeddedView(content);
      this.viewRef.detectChanges();
      this.viewRef.rootNodes.forEach((node) => {
        this.renderer.appendChild(this.tooltipElement, node);
      });
    } else {
      const text = this.renderer.createText(content);
      this.renderer.appendChild(this.tooltipElement, text);
    }

    //Create the real HTML arrow element and append it to the tooltip
    this.arrowElement = this.renderer.createElement('span');
    this.renderer.addClass(this.arrowElement, 'ui-tooltip-arrow');
    this.renderer.appendChild(this.tooltipElement, this.arrowElement);

    // Append to body with neutral positioning for measurement
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'top', '0px');
    this.renderer.setStyle(this.tooltipElement, 'left', '0px');
    this.renderer.addClass(this.tooltipElement, 'fade-in');

    // Append complete tooltip framework to document body
    this.renderer.appendChild(document.body, this.tooltipElement);

    requestAnimationFrame(() => {
      this.setPosition();
    });
  }

  private hideTooltip() {
    if (this.tooltipElement) {
      this.renderer.removeClass(this.tooltipElement, 'fade-in');
      this.renderer.addClass(this.tooltipElement, 'fade-out');

      // Wait for fade-out animation before removing
      setTimeout(() => {
        this.removeTooltip();
      }, 200); // match CSS fade-out duration
    }
  }

  private removeTooltip() {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
      this.arrowElement = null;
    }

    if (this.viewRef) {
      this.viewRef.destroy();
      this.viewRef = undefined;
    }
  }

  private setPosition() {
    if (!this.tooltipElement || !this.arrowElement) {
      return;
    }

    let content = this.tooltipContent();

    if (content == null || content == '') {
      // Don't set the position if there is no actual content.
      return;
    }

    // Define a padding zone from the edge of the screen
    const VIEWPORT_PADDING = 8;
    const GAP = 8;

    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltipElement.getBoundingClientRect();

    // Find the arrow element dimensions
    const arrowPos = this.arrowElement.getBoundingClientRect();

    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceTop = hostPos.top;
    const spaceBottom = viewportHeight - hostPos.bottom;
    const spaceLeft = hostPos.left;
    const spaceRight = viewportWidth - hostPos.right;

    let position = this.tooltipPosition();

    if (position === 'right' && spaceRight < tooltipPos.width + GAP && spaceLeft > spaceRight) {
      position = 'left';
    } else if (position === 'left' && spaceLeft < tooltipPos.width + GAP && spaceRight > spaceLeft) {
      position = 'right';
    } else if (position === 'top' && spaceTop < tooltipPos.height + GAP && spaceBottom > spaceTop) {
      position = 'bottom';
    } else if (position === 'bottom' && spaceBottom < tooltipPos.height + GAP && spaceTop > spaceBottom) {
      position = 'top';
    }

    // Calculate Coordinates & Shift to Fit Viewport
    let tooltipLeft = 0;
    let tooltipTop = 0;
    let arrowLeft = 0;
    let arrowTop = 0;

    if (position === 'right' || position === 'left') {
      // Primary Side Positioning
      tooltipLeft = position === 'right' ? hostPos.right + GAP : hostPos.left - tooltipPos.width - GAP;

      // Ideal centered alignment on the Cross-Axis (Y-Axis)
      const idealTop = hostPos.top + hostPos.height / 2 - tooltipPos.height / 2;

      // Shift & Clamp Tooltip Body within the screen bounds
      const minTop = VIEWPORT_PADDING;
      const maxTop = viewportHeight - tooltipPos.height - VIEWPORT_PADDING;
      tooltipTop = Math.max(minTop, Math.min(idealTop, maxTop));

      // Compute Arrow Position relative to Tooltip Body
      // Arrow wants to point at the vertical center of the host element
      const hostCenterY = hostPos.top + hostPos.height / 2;
      const arrowIdealTop = hostCenterY - tooltipTop - arrowPos.height / 2;

      // Clamp Arrow so it doesn't slide past the rounded corners of the tooltip
      // Adjust based on the border-radius
      const arrowPadding = 16;
      const minArrowTop = arrowPadding;
      const maxArrowTop = tooltipPos.height - arrowPos.height - arrowPadding;

      arrowTop = Math.max(minArrowTop, Math.min(arrowIdealTop, maxArrowTop));
    } else if (position === 'top' || position === 'bottom') {
      // Primary Side Positioning
      tooltipTop = position === 'bottom' ? hostPos.bottom + GAP : hostPos.top - tooltipPos.height - GAP;

      // Ideal centered alignment on the Cross-Axis (X-Axis)
      const idealLeft = hostPos.left + hostPos.width / 2 - tooltipPos.width / 2;

      // Shift & Clamp Tooltip Body within the screen bounds
      const minLeft = VIEWPORT_PADDING;
      const maxLeft = viewportWidth - tooltipPos.width - VIEWPORT_PADDING;
      tooltipLeft = Math.max(minLeft, Math.min(idealLeft, maxLeft));

      // Compute Arrow Position relative to Tooltip Body
      // Arrow wants to point at the horizontal center of the host element
      const hostCenterX = hostPos.left + hostPos.width / 2;
      const arrowIdealLeft = hostCenterX - tooltipLeft - arrowPos.width / 2;

      // Clamp Arrow within tooltip body bounds
      const arrowPadding = 15;
      const minArrowLeft = arrowPadding;
      const maxArrowLeft = tooltipPos.width - arrowPos.width - arrowPadding;
      arrowLeft = Math.max(minArrowLeft, Math.min(arrowIdealLeft, maxArrowLeft));
    }

    // Apply the Styles
    this.renderer.setStyle(this.tooltipElement, 'left', `${tooltipLeft + scrollX}px`);
    this.renderer.setStyle(this.tooltipElement, 'top', `${tooltipTop + scrollY}px`);

    // Clear out old position classes and add the active one for proper arrow direction CSS
    this.renderer.setAttribute(this.tooltipElement, 'data-position', position);

    // Apply decoupled arrow offsets
    if (position === 'right' || position === 'left') {
      this.renderer.setStyle(this.arrowElement, 'top', `${arrowTop}px`);
      this.renderer.removeStyle(this.arrowElement, 'left'); // resetting cross axis
    } else {
      this.renderer.setStyle(this.arrowElement, 'left', `${arrowLeft}px`);
      this.renderer.removeStyle(this.arrowElement, 'top'); // resetting cross axis
    }
  }

  ngOnInit(): void {
    this.setupVisibilityObserver();
  }

  private setupVisibilityObserver() {
    // IntersectionObserver natively tracks if an element has 0 width/height
    // or is hidden by display: none (intersectionRatio will be 0)
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            // Double-check if it's completely unrendered by display: none
            const isHidden = this.el.nativeElement.offsetParent === null;

            if (isHidden) {
              this.handleInvisible();
            }
          }
        }
      },
      {
        // setting threshold to 0 triggers as soon as even 1px moves or is hidden
        threshold: [0],
      },
    );

    this.observer.observe(this.el.nativeElement);
  }

  private handleInvisible() {
    this.hideTooltip();
  }

  ngOnDestroy() {
    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);
    this.removeTooltip();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
