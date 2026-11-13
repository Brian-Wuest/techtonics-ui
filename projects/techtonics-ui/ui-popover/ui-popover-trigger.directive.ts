import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[uiPopoverTrigger]',
  standalone: true,
  // Exposes the directive instance to template variables
  exportAs: 'uiPopoverTrigger',
})
export class UIPopoverTriggerDirective {
  private elementRef = inject(ElementRef);

  /**
   * Resolves the real actionable layout element.
   * If attached to a custom wrapper component, it will automatically query down
   * to find the wrapped native button element.
   */
  get nativeElement(): HTMLElement {
    const host = this.elementRef.nativeElement;
    return host.tagName.toLowerCase() !== 'button' ? host.querySelector('button') || host : host;
  }
}
