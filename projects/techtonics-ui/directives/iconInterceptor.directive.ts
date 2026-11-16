import { ComponentRef, Directive, effect, ElementRef, inject, input, Renderer2, ViewContainerRef } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Directive({
  selector: '[ui-icon]',
  standalone: true,
})
export class UIIconInterceptorDirective {
  private el: ElementRef = inject(ElementRef);
  private renderer: Renderer2 = inject(Renderer2);
  private viewContainer: ViewContainerRef = inject(ViewContainerRef);

  // Catch the class string passed by the developer (e.g., "ti ti-camera" or "ti-heart")
  icon = input<string | undefined | null>('', { alias: 'ui-icon' });
  iconYPosition = input<'higher' | 'lower' | 'baseline'>('baseline', { alias: 'ui-icon-y-position' });

  private iconComponentRef?: ComponentRef<NgIcon>;

  constructor() {
    effect(() => {
      let iconUpdate = this.icon();

      if (iconUpdate) {
        this.replaceFontWithSvg(iconUpdate);
      }
    });
  }

  private replaceFontWithSvg(classString: string) {
    // Clean up any previously created dynamic component instance to prevent memory leaks
    if (this.iconComponentRef) {
      this.iconComponentRef.destroy();
      this.viewContainer.clear();
    }

    // Extract raw icon name (e.g., "ti ti-camera-content" -> "camera-content")
    if (classString == null || classString.indexOf('ti') == -1) {
      // This only works with Tabler icons.
      return;
    }

    const rawName = classString.replace('ti', '').replace('ti-', '').trim();

    // Convert kebab-case to camelCase and prefix with 'tabler'
    const camelCaseName = rawName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const ngIconName = `tabler${camelCaseName.charAt(0).toUpperCase()}${camelCaseName.slice(1)}`;

    const mainElement = this.el.nativeElement as HTMLElement;

    // Clear font styles so the library doesn't try to load the web font glyph
    this.renderer.removeClass(mainElement, 'ti');

    try {
      // Instantiate NgIcon as a live Angular component inside this container
      this.iconComponentRef = this.viewContainer.createComponent(NgIcon);

      // Explicitly pass inputs to the component instance
      this.iconComponentRef.setInput('name', ngIconName);

      // Apply some basic alignment styles directly to the native element of NgIcon
      const hostNativeElement = this.iconComponentRef.location.nativeElement;
      this.renderer.addClass(hostNativeElement, 'ui-icon');
      this.renderer.setStyle(hostNativeElement, 'display', 'inline-block');
      this.renderer.setStyle(hostNativeElement, 'font-size', '1.25rem');

      let innerIconYPosition = this.iconYPosition();

      if (innerIconYPosition == 'lower' || innerIconYPosition == 'higher') {
        this.renderer.setStyle(hostNativeElement, 'position', 'relative');

        if (innerIconYPosition == 'lower') {
          this.renderer.setStyle(hostNativeElement, 'top', '3px');
        } else {
          this.renderer.setStyle(hostNativeElement, 'top', '-3px');
        }
      }

      const parentElement = this.el.nativeElement;
      const firstChild = parentElement.firstChild;

      // Move the icon element to be the very first child inside the component
      if (firstChild) {
        this.renderer.insertBefore(parentElement, hostNativeElement, firstChild);
      } else {
        this.renderer.appendChild(parentElement, hostNativeElement);
      }

      // Manually trigger Angular's change detection cycle for this dynamically spawned icon
      this.iconComponentRef.changeDetectorRef.detectChanges();
    } catch (error) {
      console.warn(
        `[LibIconInterceptor] Failed to load icon: ${ngIconName}. Make sure it is added to provideIcons().`,
        error,
      );
    }
  }
}
