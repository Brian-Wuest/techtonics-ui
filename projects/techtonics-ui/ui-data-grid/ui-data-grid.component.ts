import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  effect,
  EffectRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { UICheckboxComponent } from 'techtonics-ui/ui-checkbox';
import { UIPaginationComponent } from 'techtonics-ui/ui-pagination';
import { UIRadioButtonComponent } from 'techtonics-ui/ui-radio-button';
import { UIGridColumnComponent } from './ui-grid-col/ui-grid-col.component';

export interface ISortMeta {
  field: string;
  order: 1 | -1;
}

export interface IValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface ICellEditCompleteEvent {
  row: any;
  field: string;
  value: any;
}

export interface IPageChangedEvent {
  page: number;
  rowsPerPage: number;
}

export interface IRowClickEvent {
  row: any;
  originalEvent: MouseEvent;
}

@Component({
  selector: 'ui-data-grid',
  standalone: true,
  imports: [CommonModule, UIRadioButtonComponent, UIPaginationComponent, UICheckboxComponent],
  templateUrl: './ui-data-grid.component.html',
  styleUrls: ['./ui-data-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UIDataGridComponent implements AfterContentInit {
  private injector = inject(Injector);

  // Core Angular sub-systems for effect tracking cleanup
  private destroyer = inject(DestroyRef);
  private statusChangeEffect?: EffectRef;

  // --- Core Inputs ---
  readonly data = input.required<any[]>();
  readonly selectionMode = input<'single' | 'multiple' | 'none'>('none');
  readonly reorderableColumns = input(false);
  readonly usePaginator = input(false);
  readonly ariaLabel = input<string>('');
  readonly rowSelectionTextForScreenReader = input<string>('Row Selection');
  readonly validationErrorIconClass = input<string>('ti ti-alert-triangle');
  readonly defaultEmptyMessage = input<string>('No available records found.');
  readonly visible = input<boolean>(true);

  // Accepts a callback function from the parent: (row, field, value) => string | null
  // Returns a string error message if invalid, or null if valid.
  readonly validationRules = input<(row: any, field: string, value: any) => string | null>();

  // Accepts a custom ordered list of string field identifiers (e.g. ['warehouse', 'sku', 'title'])
  columnOrder = model<string[]>([]);

  // --- Dynamic Column Template Lookups ---
  readonly columns = contentChildren(UIGridColumnComponent);

  // --- Header/Title Custom Area Lookups ---
  readonly titleBarTemplate = contentChild<TemplateRef<any>>('titleBar');
  readonly emptyStateTemplate = contentChild<TemplateRef<any>>('emptyState');
  readonly gridPaginationControl = viewChild<UIPaginationComponent>('gridPaginator');

  // --- Core Action Outputs ---
  readonly onCellEditComplete = output<ICellEditCompleteEvent>();
  readonly selectionChange = output<any[]>();

  // Informational callback
  readonly onPage = output<IPageChangedEvent>();

  private rowClick$ = new Subject<IRowClickEvent>();
  readonly onRowClick = outputFromObservable(this.rowClick$);

  readonly onColumnOrderChange = output<string[]>();
  readonly onValidationStatusChange = output<boolean>();

  // Items allowed per view block
  rowsPerPage = signal(10);

  // --- Core Reactive Engine State ---
  sortMetaState = signal<ISortMeta[]>([]);
  editingCell = signal<{ rowIndex: number; field: string } | null>(null);
  selectedRows = signal<Set<any>>(new Set());
  currentPage = signal<number>(1);
  globalSearchFilter = signal<string>('');

  // Tracks visible column array changes reactively
  visibleColumns = signal<UIGridColumnComponent[]>([]);

  draggedColumnIndex = signal<number | null>(null);
  activeDropTargetIndex = signal<number | null>(null);
  dropSide = signal<'left' | 'right' | null>(null);

  // Key format: "rowIndex-field" -> message string
  validationErrors = signal<Map<string, string>>(new Map());

  // Key format: "rowIndex-field" -> raw text string typed by the user
  invalidCellValues = signal<Map<string, string>>(new Map());

  // Returns true if there is at least one active validation error in the grid.
  hasErrors = computed(() => this.validationErrors().size > 0);
  isClickable = computed(() => this.rowClick$.observed);

  // Internal tracking of last time a user clicked to change a page.
  private lastPageClickTime = 0;
  private initialColumnOrder: string[] = [];

  constructor() {
    effect(() => {
      const usingPagination = this.usePaginator();
      const paginationControl = this.gridPaginationControl();

      if (usingPagination && paginationControl) {
        this.syncAndBindPaginator(paginationControl);
      }
    });

    effect(() => {
      const paginationControl = this.gridPaginationControl();

      if (paginationControl == null) {
        return;
      }

      const targetTotal = this.calculatedTotalPages();
      const targetPage = this.effectiveCurrentPage();

      paginationControl.totalPages.set(targetTotal);
      paginationControl.page.set(targetPage);
    });

    effect(() => {
      let currentColumns = this.columns();
      {
        if (currentColumns != null) {
          this.applyColumnOrdering();
        }
      }
    });
  }

  ngAfterContentInit() {
    // Take a snapshot of the declaration order from the HTML template before applying inputs
    this.initialColumnOrder = this.columns().map((c) => c.field());

    this.syncVisibleColumns();
    this.trackValidationStatusChanges();
  }

  getCellErrorKey(rowIndex: number, field: string): string {
    return `${rowIndex}-${field}`;
  }

  getCellErrorMessage(rowIndex: number, field: string): string | undefined {
    return this.validationErrors().get(this.getCellErrorKey(rowIndex, field));
  }

  hasCellValidationError(rowIndex: number, field: string): boolean {
    return this.validationErrors().has(this.getCellErrorKey(rowIndex, field));
  }

  private syncVisibleColumns() {
    this.applyColumnOrdering();

    // This adds a listener for each of the columns to ensure that when a column programatically changes it's visibility
    // that we update it automatically.
    for (let column of this.columns()) {
      column.visibleChange.subscribe(() => {
        this.updateColumnVisibility();
      });
    }
  }

  private applyColumnOrdering() {
    const rawVisible = this.columns().filter((c) => c.visible());

    const currentColumnOrder = this.columnOrder();

    // Choose active order state array priority: custom state input -> initial template order
    const activeOrder =
      currentColumnOrder && currentColumnOrder.length > 0 ? currentColumnOrder : this.initialColumnOrder;

    if (activeOrder.length > 0) {
      // Sort the column fields based on the custom configuration array passed from the parent component
      const sorted = [...rawVisible].sort((a, b) => {
        let idxA = activeOrder.indexOf(a.field());
        let idxB = activeOrder.indexOf(b.field());

        // Fallback for fields not specified in the persistent storage config
        if (idxA === -1) idxA = 999;
        if (idxB === -1) idxB = 999;
        return idxA - idxB;
      });
      this.visibleColumns.set(sorted);
    } else {
      this.visibleColumns.set(rawVisible);
    }
  }

  private trackValidationStatusChanges() {
    this.statusChangeEffect = effect(
      () => {
        const activeErrorState = this.hasErrors();
        // Emits true if errors exist, false if the table is completely clean
        this.onValidationStatusChange.emit(activeErrorState);
      },
      { injector: this.injector },
    );

    this.destroyer.onDestroy(() => this.statusChangeEffect?.destroy());
  }

  // Fallback programmatic method developers can fire manually if desired
  updateColumnVisibility() {
    this.applyColumnOrdering();
  }

  resetLayout() {
    // Clear active column sorting states
    this.sortMetaState.set([]);

    // Clear validation errors on layout reset
    this.validationErrors.set(new Map());

    // Clear invalid values on layout reset
    this.invalidCellValues.set(new Map());

    // Clear out parent state track parameters
    this.columnOrder.set([]);

    // Re-evaluate visibility mappings using the initial baseline sequence
    this.applyColumnOrdering();

    // Fire the event up to notify the host to clear its external databases/caches
    this.onColumnOrderChange.emit(this.initialColumnOrder);
  }

  // --- Column Reordering ---
  onDragStart(index: number) {
    if (!this.reorderableColumns) return;
    this.draggedColumnIndex.set(index);
  }

  onDragOver(index: number, event: DragEvent) {
    if (!this.reorderableColumns || this.draggedColumnIndex() === null) return;
    event.preventDefault();

    const currentDragIdx = this.draggedColumnIndex();
    if (currentDragIdx === index) {
      this.clearDragIndicators();
      return;
    }

    const thElement = event.currentTarget as HTMLElement;
    const rect = thElement.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;

    // Determine whether the cursor is closer to the left or right side of the target header
    const side = relativeX < rect.width / 2 ? 'left' : 'right';

    this.activeDropTargetIndex.set(index);
    this.dropSide.set(side);
  }

  onDragLeave() {
    this.clearDragIndicators();
  }

  onDrop(dropIndex: number) {
    const dragIndex = this.draggedColumnIndex();
    const side = this.dropSide();

    this.clearDragIndicators();
    this.draggedColumnIndex.set(null);

    if (!this.reorderableColumns || dragIndex === null || side === null) return;

    let adjustedDropIndex = dropIndex;

    // Shift target drop boundaries accurately based on left/right side drop modifiers
    if (dragIndex < dropIndex && side === 'left') adjustedDropIndex = dropIndex - 1;
    if (dragIndex > dropIndex && side === 'right') adjustedDropIndex = dropIndex + 1;

    if (dragIndex === adjustedDropIndex) return;

    const currentCols = [...this.visibleColumns()];
    const [removedColumn] = currentCols.splice(dragIndex, 1);
    currentCols.splice(adjustedDropIndex, 0, removedColumn);

    this.visibleColumns.set(currentCols);

    // Extract the string field keys to emit for state persistence
    const fieldOrderSequence = currentCols.map((c) => c.field());
    this.onColumnOrderChange.emit(fieldOrderSequence);
  }

  private clearDragIndicators() {
    this.activeDropTargetIndex.set(null);
    this.dropSide.set(null);
  }

  // --- Calculated Data Pipeline ---
  // --- Step 1: Global Keyword Data Filtering ---
  filteredData = computed(() => {
    const rawData = this.data();
    const filterText = this.globalSearchFilter().toLowerCase().trim();

    if (!filterText) return rawData;

    // Scan matching columns currently present on the architecture layout definitions
    const columns = this.columns();
    const fieldsToScan = columns ? columns.map((c) => c.field()) : [];
    if (fieldsToScan.length === 0) return rawData;

    return rawData.filter((row) => {
      return fieldsToScan.some((field) => {
        const val = row[field];
        return val != null ? String(val).toLowerCase().includes(filterText) : false;
      });
    });
  });

  getSortMeta(field: string): ISortMeta | undefined {
    return this.sortMetaState().find((meta) => meta.field === field);
  }

  // Step 2: Handle Sort State tracking updates globally
  sortedData = computed(() => {
    const rawData = this.filteredData();
    const metas = this.sortMetaState();

    if (metas.length === 0) {
      return rawData;
    }

    let results = [...rawData].sort((a, b) => {
      for (const meta of metas) {
        const valA = a[meta.field];
        const valB = b[meta.field];

        if (valA !== valB) {
          if (valA == null) return 1;
          if (valB == null) return -1;
          return (valA > valB ? 1 : -1) * meta.order;
        }
        // If values match, loop falls back to check subsequent meta definitions
      }
      return 0;
    });

    return results;
  });

  // Step 3: Extract current slice based on dynamic Paginator boundaries
  paginatedData = computed(() => {
    const sorted = this.sortedData();

    if (!this.usePaginator()) {
      // No pagination requested: render full list
      return sorted;
    }

    let currentPage = this.effectiveCurrentPage();

    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * this.rowsPerPage();
    const endIndex = startIndex + this.rowsPerPage();

    return sorted.slice(startIndex, endIndex);
  });

  // Automated internal calculation for the total page count
  calculatedTotalPages = computed(() => {
    let currentRowsPerPage = this.rowsPerPage();
    if (!this.usePaginator() || currentRowsPerPage <= 0) return 1;

    let totalPages = Math.ceil(this.data().length / currentRowsPerPage);

    return totalPages;
  });

  // Automatically safe-guards row limits if rows are dynamically removed
  effectiveCurrentPage = computed(() => {
    const activePage = this.currentPage();
    const maxPages = this.calculatedTotalPages();
    return activePage > maxPages ? Math.max(maxPages, 1) : activePage;
  });

  // --- Handle Row Click Interceptions ---
  handleRowItemClick(row: any, event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Safety check: Avoid firing generic row events if click falls on input cells or check targets
    if (target.tagName === 'INPUT' || target.closest('.checkbox-column') || target.classList.contains('cell-editor')) {
      return;
    }

    this.rowClick$.next({ row, originalEvent: event } as IRowClickEvent);
  }

  // --- Base Framework Orchestrations ---
  private syncAndBindPaginator(paginationControl: UIPaginationComponent) {
    //this.zone.runOutsideAngular(() => {
    if (paginationControl.change && typeof paginationControl.change.subscribe === 'function') {
      paginationControl.change.subscribe((newPageNumber: number) => {
        const now = Date.now();
        const throttleCooldown = 150; // 150ms time window block

        // If the user clicks faster than 150ms, discard the execution to protect the layout cycle
        if (now - this.lastPageClickTime < throttleCooldown) {
          return;
        }

        // Update timestamp and commit change
        this.lastPageClickTime = now;

        this.currentPage.set(newPageNumber);
        this.onPage.emit({
          page: newPageNumber,
          rowsPerPage: this.rowsPerPage(),
        } as IPageChangedEvent);
      });
    }
    //});
  }

  onRowsPerPageChanged(value: number) {
    this.rowsPerPage.set(value);
  }

  // --- Persistent Selection Calculations ---
  isRowSelected(row: any): boolean {
    return this.selectedRows().has(row);
  }

  isAllPageSelected = computed(() => {
    const currentPageItems = this.paginatedData();
    if (currentPageItems.length === 0) return false;
    return currentPageItems.every((row) => this.selectedRows().has(row));
  });

  // --- Selection Implementation Actions ---
  toggleRowSelection(row: any) {
    const currentSelection = new Set(this.selectedRows());
    if (currentSelection.has(row)) {
      currentSelection.delete(row);
    } else {
      if (this.selectionMode() === 'single') {
        currentSelection.clear();
      }
      currentSelection.add(row);
    }
    this.selectedRows.set(currentSelection);
    this.selectionChange.emit(Array.from(currentSelection));
  }

  toggleAllRowsOnPage() {
    const currentPageItems = this.paginatedData();
    const currentSelection = new Set(this.selectedRows());
    const areAllSelectedOnPage = this.isAllPageSelected();

    currentPageItems.forEach((row) => {
      if (areAllSelectedOnPage) {
        currentSelection.delete(row);
      } else {
        currentSelection.add(row);
      }
    });

    this.selectedRows.set(currentSelection);
    this.selectionChange.emit(Array.from(currentSelection));
  }

  // --- Sorting & Drag Mechanics ---
  onSort(column: UIGridColumnComponent, event: Event) {
    const currentSortable = column.sortable();

    if (!currentSortable) {
      return;
    }

    const e = event as any;
    const columnField = column.field();
    const isCtrlKey = e.ctrlKey || e.metaKey; // Handles Windows/Linux Ctrl and Mac Command keys
    const currentMetas = [...this.sortMetaState()];
    const existingIndex = currentMetas.findIndex((meta) => meta.field === columnField);

    if (existingIndex > -1) {
      const meta = currentMetas[existingIndex];
      if (meta.order === 1) {
        // Toggle from ASC to DESC
        currentMetas[existingIndex] = { field: columnField, order: -1 };
      } else {
        // Remove column from sorting list
        currentMetas.splice(existingIndex, 1);
      }
    } else {
      // Add new sort criterion
      const newMeta: ISortMeta = { field: columnField, order: 1 };
      if (isCtrlKey) {
        currentMetas.push(newMeta); // Multi-sort append
      } else {
        currentMetas.length = 0; // Standard click clears other fields
        currentMetas.push(newMeta);
      }
    }

    this.sortMetaState.set(currentMetas);
  }

  onCellClick(rowIndex: number, column: UIGridColumnComponent) {
    const currentEditable = column.editable();

    if (!currentEditable) {
      return;
    }

    const columnField = column.field();

    this.editingCell.set({ rowIndex, field: columnField });
  }

  onEditBlur(row: any, field: string, rowIndex: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;
    const errorKey = this.getCellErrorKey(rowIndex, field);

    const currentErrors = new Map(this.validationErrors());
    const currentInvalidValues = new Map(this.invalidCellValues());

    const currentValidationRules = this.validationRules();

    if (currentValidationRules) {
      const errorMessage = currentValidationRules(row, field, newValue);

      if (errorMessage) {
        // Validation failed: Save BOTH the error message AND what the user typed
        currentErrors.set(errorKey, errorMessage);
        this.validationErrors.set(currentErrors);

        currentInvalidValues.set(errorKey, newValue);
        this.invalidCellValues.set(currentInvalidValues);

        this.editingCell.set(null);
        return;
      }
    }

    // Validation passed: Clear out error logs and transient text references
    if (currentErrors.has(errorKey)) {
      currentErrors.delete(errorKey);
      this.validationErrors.set(currentErrors);
    }
    if (currentInvalidValues.has(errorKey)) {
      currentInvalidValues.delete(errorKey);
      this.invalidCellValues.set(currentInvalidValues);
    }

    // Commit the verified valid data safely to the object reference model
    row[field] = newValue;
    this.editingCell.set(null);
    this.onCellEditComplete.emit({ row, field, value: newValue } as ICellEditCompleteEvent);
  }

  initResize(event: MouseEvent, thElement: HTMLTableHeaderCellElement) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.pageX;
    const startWidth = thElement.offsetWidth;

    const mouseMoveHandler = (moveEvent: MouseEvent) => {
      const currentWidth = startWidth + (moveEvent.pageX - startX);
      thElement.style.width = `${Math.max(currentWidth, 50)}px`;
    };

    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  getAriaSortState(field: string): 'ascending' | 'descending' | 'none' {
    const meta = this.getSortMeta(field);

    if (!meta) {
      return 'none';
    }
    return meta.order === 1 ? 'ascending' : 'descending';
  }

  getColumnHeaderAriaLabel(col: UIGridColumnComponent): string {
    if (!col.sortable()) {
      return '';
    }

    const meta = this.getSortMeta(col.field());
    const columnName = col.header() || col.field();

    if (!meta) {
      return `Sort by ${columnName} ascending`;
    }

    return meta.order === 1
      ? `Change sorting for ${columnName} to descending`
      : `Clear sorting configuration parameters for ${columnName}`;
  }

  exportToCSV(fileName: string = 'grid-export') {
    const currentColumns = this.visibleColumns();
    let currentData = this.data();
    if (currentColumns.length === 0 || currentData.length === 0) return;

    // Determine the rows payload: Use cross-page selections if they exist, fallback to all data
    const selectedSet = this.selectedRows();
    const rowsToExport = selectedSet.size > 0 ? Array.from(selectedSet) : currentData;

    // Build the CSV Header Row based strictly on visible columns
    const headers = currentColumns.map((col) => this.sanitizeCSVCell(col.header() || col.field()));
    const csvLines: string[] = [headers.join(',')];

    // Extract and sanitize values for each data row
    rowsToExport.forEach((row) => {
      const line = currentColumns.map((col) => {
        const value = row[col.field()];
        return this.sanitizeCSVCell(value);
      });
      csvLines.push(line.join(','));
    });

    // Assemble the CSV Blob file payload
    const csvContent = '\uFEFF' + csvLines.join('\n'); // Prepend UTF-8 BOM for Excel compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Trigger a native programmatic browser file download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Private helper to escape quotes, commas, and newlines safely according to standard RFC 4180
  private sanitizeCSVCell(value: any): string {
    if (value == null) return '""';

    let stringValue = String(value);
    // If the cell contains quotes, commas, or newlines, wrap it in quotes and double up internal quotes
    if (
      stringValue.includes('"') ||
      stringValue.includes(',') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      stringValue = stringValue.replace(/"/g, '""');
      return `"${stringValue}"`;
    }

    return `"${stringValue}"`;
  }
}
