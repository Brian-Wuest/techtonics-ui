import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
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

export interface ListItem<T = any> {
  key: string;
  label: string;
  selected?: boolean;
  data?: T;
}

@Component({
  selector: 'ui-listbox',
  standalone: true,
  imports: [NgTemplateOutlet, NgClass, UIFormErrorComponent],
  templateUrl: './ui-listbox.component.html',
  styleUrls: ['./ui-listbox.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UIListBoxComponent<T> implements FormValueControl<ListItem[] | null> {
  private fuzzyMatchingService: FuzzyMatchingService = inject(FuzzyMatchingService);

  readonly items = model<ListItem[]>([]);
  readonly componentClass = input<string>();
  readonly selectionMode = input<'single' | 'multi' | 'checkbox'>('single');
  readonly draggable = input<boolean>(false);
  readonly groupBy = input<((item: ListItem) => string) | null>(null);

  /**
   * The search function used to get the field which will be used for the fuzzy matching of the search box.
   *
   * By default the label of the `ListItem` is used.
   */
  readonly searchKey = input<((item: ListItem) => string) | null>(null);
  readonly selectAllCheckboxLabel = input<string>('Select All');
  readonly filterPlaceholder = input<string>('Search...');

  readonly showSearch = input<boolean>(true);

  readonly disabled = input<boolean>(false);
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);

  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');

  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly errors = input<readonly ValidationError[]>([]);

  /**
   * These are the selected items.
   */
  value = model<ListItem[] | null>(null);

  private inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  readonly dragStart = output<ListItem>();
  readonly dragOver = output<{ target: ListItem; dragged: ListItem; position: 'above' | 'below' }>();
  readonly drop = output<{ target: ListItem; dragged: ListItem; position: 'above' | 'below' }>();

  readonly touch = output();

  // Finds a child template of this component called "item" and uses that.
  // Makes it very easy to pass data to it! Also makes it very easy to identify templates
  // associated with this component.
  readonly itemTemplate = contentChild<TemplateRef<any> | null>('item');

  lastClickedIndex = signal<number | null>(null);
  draggedItem = signal<ListItem | null>(null);
  draggedItemGroupKey = signal<string | null>(null);
  dragOverItem = signal<ListItem | null>(null);
  dragOverPosition = signal<'above' | 'below' | null>(null);
  search = signal('');

  protected filteredItems = computed(() => {
    const q = this.search().trim();

    if (!q) {
      return this.items();
    }

    let searchKeyInput = this.searchKey();

    const keyFn = searchKeyInput ? searchKeyInput : (i: ListItem) => i.label;

    return this.fuzzyMatchingService.matchObjectArray(this.items(), q, keyFn);
  });

  groups = computed(() => {
    // Always return at least 1 group even if not grouping so the template returns something
    // Without this the component won't render ANYTHING!
    let groupByInput = this.groupBy();
    if (!groupByInput) return [{ key: null, items: this.filteredItems() }];

    const map = new Map<string, ListItem[]>();

    for (const item of this.filteredItems()) {
      const key = groupByInput(item);
      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)!.push(item);
    }

    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  });

  protected selection = computed<ListItem[]>(() => {
    let currentValue = this.value();

    if (currentValue != null) {
      return currentValue;
    }

    return [];
  });

  protected allSelected = computed(
    () => this.filteredItems().length > 0 && this.filteredItems().every((i) => this.selection().includes(i)),
  );

  protected someSelected = computed(() => this.filteredItems().some((i) => this.selection().includes(i)));

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

  isSelected(item: ListItem) {
    return this.selection().includes(item);
  }

  toggleSelectAll() {
    if (this.allSelected()) {
      this.value.set([]);
    } else {
      const all = [...this.filteredItems()];
      this.value.set(all);
    }
  }

  onRowClick(item: ListItem, index: number, event: MouseEvent) {
    if (this.disabled()) {
      return;
    }

    const selectionMode = this.selectionMode();
    if (selectionMode === 'single') {
      this.value.set([item]);
      return;
    }

    if (selectionMode === 'checkbox') {
      this.toggleItem(item);
      return;
    }

    // MULTI SELECT MODE
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;

    if (shift && this.lastClickedIndex() !== null) {
      const start = Math.min(this.lastClickedIndex()!, index);
      const end = Math.max(this.lastClickedIndex()!, index);
      const range = this.items().slice(start, end + 1);
      this.value.set(range);
      return;
    }

    if (ctrl) {
      this.toggleItem(item);
      return;
    }

    // Normal click resets selection
    this.value.set([item]);
    this.lastClickedIndex.set(index);
  }

  toggleItem(item: ListItem) {
    if (this.disabled()) {
      return;
    }

    const exists = this.isSelected(item);
    const next = exists ? this.selection().filter((i) => i !== item) : [...this.selection(), item];

    this.value.set(next);
  }

  onDragStart(item: ListItem, event: DragEvent) {
    if (this.disabled()) {
      return;
    }

    if (!this.draggable()) {
      return;
    }

    if (item) {
      this.draggedItemGroupKey.set(this.getItemGroupKey(item));
      event.dataTransfer?.setData('text/plain', String(item.key));
      this.draggedItem.set(item);
      this.dragStart.emit(item);
    }
  }

  onDragOver(item: ListItem, event: DragEvent) {
    if (this.disabled() || !this.draggable()) {
      return;
    }

    event.preventDefault();

    if (!this.draggedItem()) {
      return;
    }

    // Make sure that each item is in the same group.
    let targetItemGroup = this.getItemGroupKey(item);

    if (targetItemGroup != this.draggedItemGroupKey()) {
      // Not in the same item group, items cannot move across groups!
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }

      return;
    }

    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;

    const position = offsetY < rect.height / 2 ? 'above' : 'below';

    if (event.dataTransfer) {
      // Standard cursor indicating a valid move operation
      event.dataTransfer.dropEffect = 'move';
    }

    this.dragOverItem.set(item);
    this.dragOverPosition.set(position);

    if (this.draggedItem()) {
      this.dragOver.emit({ target: item, dragged: this.draggedItem()!, position });
    }
  }

  onDrop(targetItem: ListItem, event: DragEvent) {
    if (this.disabled() || !this.draggable()) {
      return;
    }

    event.preventDefault();

    const dragged = this.draggedItem();
    const position = this.dragOverPosition();

    if (!dragged || !position) {
      this.cleanupDragState();
      return;
    }

    let listCopy = JSON.parse(JSON.stringify(this.items())) as ListItem[];

    // Remove the currently gragged item from the copy list.
    listCopy = listCopy.filter((x) => x.key != dragged.key);

    // Find the target index.
    const targetIndex = listCopy.findIndex((x) => x.key == targetItem.key);

    if (targetIndex == listCopy.length - 1 && position == 'below') {
      // Target is at the end and they want it below that, just tack it on the end.
      listCopy = [...listCopy, dragged];
    } else if (position == 'above') {
      listCopy.splice(targetIndex, 0, dragged);
    } else {
      listCopy.splice(targetIndex + 1, 0, dragged);
    }

    this.items.set(listCopy);
    this.drop.emit({ target: targetItem, dragged, position });

    this.cleanupDragState();
  }

  getItemGroupKey(item: ListItem) {
    let foundItem = false;
    for (let group of this.groups()) {
      for (let groupItem of group.items) {
        if (groupItem.key == item.key) {
          return group.key;
        }
      }
    }

    return null;
  }

  private cleanupDragState() {
    this.draggedItem.set(null);
    this.dragOverItem.set(null);
    this.dragOverPosition.set(null);
    this.draggedItemGroupKey.set(null);
  }

  //#region Interface Methods

  /**
   * Invoked automatically by the form system when programmatically calling `.focus()`
   * on the associated form field tree.
   */
  public focus(options?: FocusOptions): void {
    this.inputElement().nativeElement.focus(options);
  }

  /**
   * Invoked automatically when the root form executes a `.reset()` routine.
   */
  public reset(): void {
    this.value.set(null);
  }

  //#endregion
}
