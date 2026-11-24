import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, TemplateRef } from '@angular/core';
import { ConfirmService } from './confirm.service';
import { UIModalComponent } from 'techtonics-ui/ui-modal';
import { UIButtonComponent } from 'techtonics-ui/ui-button';

@Component({
  selector: 'ui-confirmation',
  standalone: true,
  templateUrl: './ui-confirmation.component.html',
  styleUrls: ['./ui-confirmation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UIModalComponent, NgTemplateOutlet, UIButtonComponent],
})
export class UIConfirmationComponent {
  protected readonly confirmService = inject(ConfirmService);

  protected isModalOpen = computed(() => {
    let state = this.confirmService.state();

    if (state == null) {
      // When the state is null or undefined then there is nothing to show
      // So keep the modal closed.
      return false;
    }

    // There is something in the modal state, so keep it open.
    return true;
  });

  protected isTemplate(content: string | TemplateRef<unknown>): content is TemplateRef<unknown> {
    return content instanceof TemplateRef;
  }

  protected onModalClose(): void {
    this.confirmService.close(undefined);
  }
}
