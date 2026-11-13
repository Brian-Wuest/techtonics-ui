import { Component, input, output, contentChild, TemplateRef, model, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AccordionModel<T = any> {
  key: string;
  header?: string;
  body?: string;
  data: T;
  disabled: boolean;
  expanded: boolean;
}

@Component({
  selector: 'ui-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-accordion.component.html',
  styleUrl: './ui-accordion.component.css',
})
export class UIAccordionComponent<T = any> {
  // --- Input & Model Signals ---
  // Using model() allows two-way binding so the parent state stays synchronized
  public items = model.required<AccordionModel[]>();
  public readonly showActionButtons = input<boolean>(false);
  public readonly exclusive = input<boolean>(false);

  public readonly itemToggled = output<{ item: AccordionModel<T>; expanded: boolean }>();

  // Look for custom templates provided by the parent
  protected headerTemplate = contentChild<TemplateRef<any>>('accordionHeader');
  protected bodyTemplate = contentChild<TemplateRef<any>>('accordionBody');

  protected toggleItem(index: number, event: Event): void {
    this.items.update((currentItems) => {
      const updated = [...currentItems];
      if (!updated[index] || updated[index].disabled) return updated;

      const targetNextState = !updated[index].expanded;

      if (this.exclusive() && targetNextState) {
        // Close everything else if single-expand mode is active
        return currentItems.map((item, idx) => {
          if (idx === index) {
            this.itemToggled.emit({ item: { ...item, expanded: true }, expanded: true });
            return { ...item, expanded: true };
          }
          return item.disabled ? item : { ...item, expanded: false };
        });
      }

      // Standard independent toggle logic
      updated[index] = { ...updated[index], expanded: targetNextState };
      this.itemToggled.emit({ item: updated[index], expanded: targetNextState });
      return updated;
    });
  }

  // --- Public Programmatic API ---
  public expandAll(): void {
    if (this.exclusive()) {
      // In exclusive mode, "Expand All" safely expands just the first enabled item
      const firstEnabledIndex = this.items().findIndex((item) => !item.disabled);
      if (firstEnabledIndex !== -1) this.expandItem(this.items()[firstEnabledIndex].key);
      return;
    }

    this.items.update((currentItems) =>
      currentItems.map((item) => (item.disabled ? item : { ...item, expanded: true })),
    );
  }

  public collapseAll(): void {
    this.items.update((currentItems) =>
      currentItems.map((item) => (item.disabled ? item : { ...item, expanded: false })),
    );
  }

  public expandItem(key: string): void {
    this.items.update((currentItems) => {
      return currentItems.map((item) => {
        if (item.key === key && !item.disabled) {
          return { ...item, expanded: true };
        }
        // If single-expand mode is on, shut down all other fields
        return this.exclusive() && !item.disabled ? { ...item, expanded: false } : item;
      });
    });
  }

  public collapseItem(key: string): void {
    this.items.update((currentItems) =>
      currentItems.map((item) => (item.key === key && !item.disabled ? { ...item, expanded: false } : item)),
    );
  }
}
