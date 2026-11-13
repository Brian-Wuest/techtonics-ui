import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

@Directive({
  selector: '[uiClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private elementRef = inject(ElementRef);

  readonly uiClickOutside = output<void>();

  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement: EventTarget | null): void {
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);

    if (!clickedInside) {
      this.uiClickOutside.emit();
    }
  }
}
