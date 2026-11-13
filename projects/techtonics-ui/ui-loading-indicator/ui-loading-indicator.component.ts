import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { UtilsService, LoaderService } from 'techtonics-ui/services';

@Component({
  selector: 'ui-loading-indicator',
  templateUrl: './ui-loading-indicator.component.html',
  styleUrls: ['./ui-loading-indicator.component.css'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UILoadingIndicatorComponent {
  protected loadingService = inject(LoaderService);
  private utils = inject(UtilsService);

  private document = inject(DOCUMENT);

  private delayedSetAction: (callback: () => void, delay: number) => void;
  private setDelay = 100;

  readonly ariaLabel = input<string>('Loading content, please wait');

  /**
   * Determines of the loading spinner is showing or not.
   */
  public loading = model<boolean>(false);

  constructor() {
    this.delayedSetAction = this.utils.createCanceableAction();

    effect(() => {
      let loadingServiceValue = this.loadingService.isLoading();
      let loadingScreenValue = this.loading();

      this.delayedSetAction(() => {
        if (loadingScreenValue != loadingServiceValue) {
          this.loading.set(loadingServiceValue);
        }
      }, this.setDelay);
    });

    effect(() => {
      const isActive = this.loading();

      // Select the primary application sibling blocks inside <body> (like <app-root>)
      // skipping the loading indicator container itself to keep it active
      const bodyElements = this.document.body.children;

      for (let i = 0; i < bodyElements.length; i++) {
        const el = bodyElements[i] as HTMLElement;

        // Don't flag elements that contain our component wrapper
        if (el.contains(this.document.querySelector('app-loading-indicator'))) {
          continue;
        }

        if (isActive) {
          el.setAttribute('inert', '');
        } else {
          el.removeAttribute('inert');
        }
      }
    });
  }
}
