import { Component, contentChild, effect, input, output, TemplateRef } from '@angular/core';

@Component({
  selector: 'ui-grid-col',
  standalone: true,

  // This is blank on purpose! The grid wraps this configuration
  // and handles all visual cell rendering inside its own table loop.
  template: '',
})
export class UIGridColumnComponent {
  field = input.required<string>();
  header = input('');
  sortable = input(false);
  editable = input(false);
  visible = input(true);

  visibleChange = output<boolean>();

  // Captures the custom template defined inside the column declaration
  readonly template = contentChild(TemplateRef);

  constructor() {
    effect(() => {
      const visibleValue = this.visible();

      this.visibleChange.emit(visibleValue);
    });
  }
}
