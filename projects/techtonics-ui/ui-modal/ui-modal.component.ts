import { NgClass } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'ui-modal',
  standalone: true,
  templateUrl: './ui-modal.component.html',
  styleUrls: ['./ui-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeyDown($event)',
  },
  imports: [NgClass],
})
export class UIModalComponent implements AfterViewInit {
  readonly open = input(false);
  readonly closeOnEscape = input(true);
  readonly closeOnBackdropClick = input(false);
  readonly size = input<'x-small' | 'small' | 'medium' | 'large' | 'x-large'>('small');

  /**
   * Custom class for this modal.
   */
  readonly modalClass = input<string>();

  modalContainer = viewChild<ElementRef<HTMLDivElement>>('modalContainer');

  close = output();

  ngAfterViewInit(): void {
    const element = this.modalContainer();

    element?.nativeElement.focus();
  }

  backdropClicked(click: PointerEvent) {
    if (!this.closeOnBackdropClick()) {
      return;
    }

    this.close.emit();
    click.stopPropagation();
    click.preventDefault();
  }

  mainModalClicked(click: PointerEvent) {
    click.preventDefault();
    click.stopPropagation();
  }

  modalKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close.emit();
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    let keyValue = event.key;

    if (keyValue.toLowerCase() == 'escape' && this.closeOnEscape()) {
      this.close.emit();
      event.stopPropagation();
      event.preventDefault();
    }
  }

  private trapFocus(event: KeyboardEvent) {
    const container = this.modalContainer();
    if (container == null) {
      return;
    }

    const element = container.nativeElement;

    // Find all focusable elements inside the modal template
    const focusableSelector =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    const focusableElements = element.querySelectorAll<HTMLElement>(focusableSelector);

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // If Shift + Tab and on the first element, wrap around to the last
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    }
    // If Tab and on the last element, wrap around to the first
    else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }
}
