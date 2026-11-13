import {
  Component,
  input,
  output,
  signal,
  computed,
  model,
  ElementRef,
  HostListener,
  inject,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormValueControl, ValidationError } from '@angular/forms/signals';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-color-picker.component.html',
  styleUrls: ['./ui-color-picker.component.css'],
})
export class UIColorPickerComponent implements FormValueControl<string | null | undefined> {
  private static nextId = 0;

  // --- FormValueControl Core Contract Properties ---
  // Value model and blur trigger output required by the control framework
  public value = model<string | null | undefined>('#ffffff');
  public readonly touch = output<void>();

  // Automated layout hooks: when declared, [formField] updates these inputs natively
  readonly errors = input<readonly ValidationError[]>([]);

  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);

  readonly required = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');

  // --- Configuration Options ---
  public readonly customText = input<string | null>(null);
  public readonly showCopyButton = input<boolean>(true);
  public readonly fallbackColor = input<string>('#ffffff');

  // Fixes the multiple instance bug by isolating anchor scopes using browser crypto
  protected uniqueAnchorName = `--cp-anchor-${window.crypto.randomUUID().split('-')[0]}`;
  protected dropdownId = `custom-dropdown-${UIColorPickerComponent.nextId++}`;
  protected readonly dropDownMenu = viewChild<ElementRef<HTMLDivElement>>('dropDownMenu');

  // --- UI Elements State ---
  protected copied = signal<boolean>(false);
  protected presetColors = signal<string[]>([
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#000000',
    '#6b7280',
    '#d1d5db',
    '#ffffff',
  ]);

  // --- Reactive Validation Projections ---
  protected hasError = computed(() => {
    return this.touched() && this.errors().length > 0;
  });

  protected errorMessage = computed(() => {
    const list = this.errors();
    if (list.length === 0) return '';

    let errorMessage = list[0];

    if ((errorMessage as any).context) {
      // This is a ReactiveForms validation message.
      return (errorMessage as any).context.message ?? 'Invalid color selection';
    }

    // Grabs the custom error message attached by our contrast/schema validators
    return errorMessage.message ?? 'Invalid color selection';
  });

  // --- Normalizations ---
  protected safeColor = computed(() => {
    const rawColor = this.value();
    return rawColor && typeof rawColor === 'string' ? rawColor : this.fallbackColor();
  });

  protected displayText = computed(() => {
    const text = this.customText();
    return text ? text : this.safeColor();
  });

  // --- Action Framework ---
  protected toggleDropdown(event: PointerEvent): void {
    if (this.disabled() || this.readonly()) {
      return;
    }

    const panelEl = this.dropDownMenu();

    if (panelEl) {
      const panel = panelEl.nativeElement;

      panel.togglePopover();
      event.stopPropagation();
      event.preventDefault();
    }
  }

  protected onColorSelect(newColor: string): void {
    if (this.disabled() || this.readonly()) {
      return;
    }

    this.value.set(newColor);
    this.hidePopover();
    this.touch.emit();
  }

  protected onNativeInputChange(event: Event): void {
    if (this.disabled() || this.readonly()) {
      return;
    }

    const inputElement = event.target as HTMLInputElement;
    this.value.set(inputElement.value);
  }

  protected async copyToClipboard(event: Event): Promise<void> {
    event.stopPropagation();

    if (this.disabled() || this.readonly()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.safeColor());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy color code: ', err);
    }
  }

  protected hidePopover() {
    const panelEl = this.dropDownMenu();

    if (panelEl) {
      const panel = panelEl.nativeElement;

      if (panel.matches(':popover-open')) {
        panel.hidePopover();
      }
    }
  }
}
