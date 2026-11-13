import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { DisabledReason, FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { FuzzyMatchingService } from 'techtonics-ui/services';
import { UIFormErrorComponent } from 'techtonics-ui/ui-form-error';

export interface DropdownItem<T = any> {
  key: string;
  label: string;
  disabled?: boolean;
  selected?: boolean;
  data?: T;
}

@Component({
  selector: 'ui-dropdown',
  standalone: true,
  imports: [NgTemplateOutlet, NgClass, UIFormErrorComponent],
  templateUrl: './ui-dropdown.component.html',
  styleUrls: ['./ui-dropdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UIDropdownComponent implements FormValueControl<DropdownItem | DropdownItem[] | null> {
  // Custom id every time a new dropdown is created.
  private static nextId = 0;

  dropdownId = `custom-dropdown-${UIDropdownComponent.nextId++}`;

  fuzzyMatchService: FuzzyMatchingService = inject(FuzzyMatchingService);

  readonly items = input<DropdownItem[]>([]);

  // Custom options
  readonly placeholder = input<string>('Select…');
  readonly allItemsText = input<string>('All Items Selected');
  readonly showClear = input<boolean>(true);
  readonly showCheckboxes = input<boolean>(false);
  readonly showSelectAll = input<boolean>(false);
  readonly filterPlaceholder = input<string>('Search...');
  readonly showFilter = input<boolean>(false);
  readonly componentClass = input<string>();
  readonly clearAriaLabel = input<string>('Clear value');

  readonly disabled = input<boolean>(false);
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);

  readonly required = input<boolean>(false);
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');

  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly errors = input<readonly ValidationError[]>([]);

  // Form control options
  value = model<DropdownItem | DropdownItem[] | null>(null);

  // Finds a child template of this component called "item" and uses that.
  // Makes it very easy to pass data to it! Also makes it very easy to identify templates
  // associated with this component.
  readonly itemTemplate = contentChild<TemplateRef<any>>('item');
  readonly displayTemplate = contentChild<TemplateRef<any>>('display');
  readonly dropDownMenu = viewChild<ElementRef<HTMLDivElement>>('dropDownMenu');
  readonly dropDownTrigger = viewChild.required<ElementRef<HTMLButtonElement>>('dropDownTrigger');

  readonly touch = output();

  protected filteredItems = computed(() => {
    const q = this.filter().trim();

    if (!q) {
      return this.items();
    }

    const keyFn = (item: DropdownItem) => item.label;

    return this.fuzzyMatchService.matchObjectArray(this.items(), q, keyFn);
  });

  // visual states
  display = computed(() => {
    let eligibleItems = this.filteredItems();
    let currentValue = this.value();
    let currentPlaceHolder = this.placeholder();
    let displayValue = '';
    let valueIsArray = Array.isArray(currentValue);
    let valueAsArray = currentValue as DropdownItem[];
    let valueAsSingular = currentValue as DropdownItem;

    if (eligibleItems == null) {
      eligibleItems = [];
    }

    eligibleItems = eligibleItems.filter((x) => x.disabled == null || x.disabled == false);

    if (currentValue == null && currentPlaceHolder == null) {
      return '';
    } else if (
      currentValue == null ||
      (valueIsArray && valueAsArray != null && valueAsArray.length == 0) ||
      (!valueIsArray && valueAsSingular != null && valueAsSingular.label == null)
    ) {
      return currentPlaceHolder.trim();
    } else if (valueIsArray && valueAsArray != null) {
      // Determine the number of selected items, if there are no selected items, just show the placeholder.
      // If there are more than 4 selected items show the words: "X Items Selected".
      // Otherwise the list will be comma separated.
      let selectedLabels = new Array<string>();

      for (let item of valueAsArray) {
        if (item.selected != null && item.selected == true) {
          selectedLabels.push(item.label);
        }
      }

      if (selectedLabels.length == eligibleItems.length) {
        displayValue = this.allItemsText();
      } else {
        displayValue = selectedLabels.join(', ').trim();
      }
    } else if (valueAsSingular != null) {
      if (valueAsSingular.label.trim() == '') {
        displayValue = currentPlaceHolder;
      } else {
        displayValue = valueAsSingular.label.trim();
      }
    }

    return displayValue;
  });

  allSelected = computed(() => {
    let allItems = this.filteredItems();
    let currentValue = this.value();
    let allEnabledItems = allItems.filter((x) => x.disabled == null || x.disabled == false);

    // Only count the enabled items since those are the only ones which can actually be selected in the first place.
    if (
      currentValue != null &&
      Array.isArray(currentValue) &&
      (currentValue as DropdownItem[]).length == allEnabledItems.length
    ) {
      return true;
    }

    return false;
  });

  /**
   * Consolidate errors from either the 3rd-party Form Control instance
   * OR evaluate manual structural rules if no control is attached.
   */
  protected readonly normalizedErrors = computed<ValidationError[]>(() => {
    const rawErrors = this.errors();
    return Array.isArray(rawErrors) ? [...rawErrors] : [];
  });

  protected readonly shouldShowErrors = computed<boolean>(() => {
    return this.invalid() && this.touched();
  });

  filter = signal('');

  private readonly selectAllKey: string = '7be7aa21-a3da-4cd0-817d-fb59d093c494';

  //#region Interface Methods

  /**
   * Invoked automatically by the form system when programmatically calling `.focus()`
   * on the associated form field tree.
   */
  public focus(options?: FocusOptions): void {
    this.dropDownTrigger().nativeElement.focus(options);
  }

  /**
   * Invoked automatically when the root form executes a `.reset()` routine.
   */
  public reset(): void {
    this.value.set(null);
  }

  //#endregion

  protected toggle(event: PointerEvent) {
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

  protected selectAllChanged(event: Event) {
    const inputElement = event.target as HTMLInputElement;

    if (inputElement == null || this.disabled()) {
      return;
    }

    this.selectAllClicked(inputElement.checked);
  }

  protected selectAllClicked(isSelected: boolean) {
    if (this.disabled()) {
      return;
    }

    let selectedItems = new Array<DropdownItem>();
    let dataItems = this.filteredItems();

    if (dataItems == null || dataItems.length == 0) {
      return;
    }

    for (let item of dataItems) {
      if (item.disabled != null && item.disabled) {
        // Even if it's disabled, make sure to un-select it.
        // This is in-case it was selected programatically in some other way.
        item.selected = false;
        continue;
      }

      item.selected = isSelected;

      if (isSelected) {
        selectedItems.push(item);
      }
    }

    if (isSelected && selectedItems.length > 0) {
      this.value.set(selectedItems);
    } else {
      // The user un-selected the select-all checkbox, set the selected items to null.
      this.value.set(null);
    }

    // Always close the dropdown and emit a touch event.
    this.hidePopover();
    this.touch.emit();
  }

  protected choose(event: PointerEvent, item: DropdownItem) {
    if (this.disabled() || (item.disabled != null && item.disabled)) {
      return;
    }

    if (this.showCheckboxes()) {
      let target = event.target! as HTMLElement;
      if (target != null && target.nodeName == 'INPUT') {
        // The user clicked on a checkbox, don't do this processing.
        return;
      }
    }

    let itemIsSelected = item.selected == null || item.selected == false ? false : true;

    if (item.key == this.selectAllKey) {
      item.selected = !itemIsSelected;
      this.selectAllClicked(!itemIsSelected);
      return;
    }

    item.selected = !itemIsSelected;
    this.updateValue(item);
    this.hidePopover();
    this.touch.emit();
  }

  protected itemCheckboxChanged(event: Event, item: DropdownItem) {
    const inputElement = event.target as HTMLInputElement;

    if (inputElement == null || this.disabled() || (item.disabled != null && item.disabled)) {
      return;
    }

    item.selected = inputElement.checked;
    this.updateValue(item);
    this.touch.emit();
    event.stopPropagation();
  }

  private updateValue(item: DropdownItem) {
    if (this.showCheckboxes()) {
      let currentValue = this.value() as DropdownItem[];

      if (currentValue == null) {
        currentValue = new Array<DropdownItem>();
      } else if (!Array.isArray(currentValue)) {
        // The user set the current value incorrectly to an object instead of an array, we need to fix that.
        let oldvalue = currentValue as DropdownItem;
        currentValue = new Array<DropdownItem>();
        currentValue.push(oldvalue);
      }

      if (item.selected) {
        currentValue.push(item);
      } else {
        let index = currentValue.findIndex((x) => x.key == item.key);
        if (index != -1) {
          currentValue.splice(index, 1);
        }
      }

      currentValue.sort((a, b) => {
        if (a.label == null && b.label != null) {
          return -1;
        } else if (a.label != null && b.label == null) {
          return 1;
        } else if (a.label.toLocaleLowerCase() > b.label.toLocaleLowerCase()) {
          return 1;
        } else if (a.label.toLocaleLowerCase() < b.label.toLocaleLowerCase()) {
          return -1;
        }

        return 0;
      });

      // Always set the value to a new array instance.
      this.value.set([...currentValue]);
    } else {
      this.value.set(item);
    }
  }

  protected clear(event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.disabled()) {
      return;
    }

    for (let item of this.filteredItems()) {
      item.selected = false;
    }

    this.value.set(null);
  }

  hidePopover() {
    const panelEl = this.dropDownMenu();

    if (panelEl) {
      const panel = panelEl.nativeElement;

      if (panel.matches(':popover-open')) {
        panel.hidePopover();
      }
    }
  }
}
