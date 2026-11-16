import { CommonModule, NgClass } from '@angular/common';
import { Component, ElementRef, computed, effect, input, model, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DisabledReason, FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { UIIconInterceptorDirective } from 'techtonics-ui/directives';
import { UIFormErrorComponent } from 'techtonics-ui/ui-form-error';

export type PickerMode = 'date' | 'time' | 'datetime';
export type TimeFormat = '12h' | '24h';

@Component({
  selector: 'ui-custom-date-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, UIFormErrorComponent, UIIconInterceptorDirective],
  templateUrl: './ui-date-time-picker.component.html',
  styleUrls: ['./ui-date-time-picker.component.css'],
})
export class UIDateTimePickerComponent implements FormValueControl<Date | null> {
  // Custom id every time a new dropdown is created.
  private static nextId = 0;

  dateTimeId = `custom-datetime-${UIDateTimePickerComponent.nextId++}`;

  // Inputs
  readonly mode = input<PickerMode>('datetime');

  // Developer choice: '12h' or '24h'
  readonly timeFormat = input<TimeFormat>('12h');

  readonly placeholder = input<string>('Select date/time');
  readonly showClear = input<boolean>(true);
  readonly componentClass = input<string>();
  readonly amButtonText = input<string>('AM');
  readonly pmButtonText = input<string>('PM');
  readonly selectButtonText = input<string>('Select');
  readonly clearAriaLabel = input<string>('Clear value');

  readonly min = input<Date | undefined>(undefined);
  readonly max = input<Date | undefined>(undefined);

  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);

  readonly touched = model<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');

  // Validation Inputs
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly errors = input<readonly ValidationError[]>([]);

  // Input for externally set disabled state (e.g. via [disabled] attribute).
  value = model<Date | null>(null);

  // Element reference to pass focus commands cleanly down to the true DOM node
  private inputElement = viewChild.required<ElementRef<HTMLInputElement>>('dropDownTrigger');

  readonly touch = output();

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

  // Component State Signals
  //protected isOpen = signal<boolean>(false);
  protected inputValue = signal<string>(''); // For raw typing tracking

  // Calendar Navigation State
  protected currentYear = signal<number>(new Date().getFullYear());
  protected currentMonth = signal<number>(new Date().getMonth()); // 0-indexed
  protected todaysDate = signal<Date>(new Date());

  // Timepicker State
  protected selectedHour = signal<number>(0);
  protected selectedMinute = signal<number>(0);
  protected selectedPeriod = signal<'AM' | 'PM'>('AM');

  protected triggerIcon = computed(() => {
    let currentMode = this.mode();

    let icon = 'ti ti-calendar';

    if (currentMode == 'time') {
      icon = 'ti ti-clock';
    } else if (currentMode == 'datetime') {
      icon = 'ti ti-calendar-clock';
    }

    return icon;
  });

  dropDownMenu = viewChild<ElementRef<HTMLDivElement>>('dropDownMenu');
  dropDownTrigger = viewChild<ElementRef<HTMLButtonElement>>('dropDownTrigger');

  // Static Configuration
  protected months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  protected weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  constructor() {
    // Sync time signals and string input text when selectedValue updates programmatically
    effect(() => {
      const val = this.value();
      if (val) {
        const hours = val.getHours();
        this.selectedMinute.set(val.getMinutes());

        if (this.timeFormat() === '12h') {
          this.selectedPeriod.set(hours >= 12 ? 'PM' : 'AM');
          const h12 = hours % 12;
          this.selectedHour.set(h12 === 0 ? 12 : h12);
        } else {
          this.selectedHour.set(hours);
        }
        this.inputValue.set(this.formatDateToString(val));
      } else {
        this.inputValue.set('');
      }
    });
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

  // Lists used to render the scrollable hour/minute rows
  get hoursList(): number[] {
    if (this.timeFormat() === '12h') {
      return Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
    }
    return Array.from({ length: 24 }, (_, i) => i); // 0 to 23
  }

  get minutesList(): number[] {
    return Array.from({ length: 60 }, (_, i) => i); // 0 to 59
  }

  // Computed Grid representation for the calendar matrix
  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; isDisabled: boolean }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({ date: d, isCurrentMonth: false, isDisabled: this.isDateDisabled(d) });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true, isDisabled: this.isDateDisabled(d) });
    }

    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, isDisabled: this.isDateDisabled(d) });
    }

    return days;
  });

  protected toggleDropdown(event: UIEvent) {
    if (this.disabled()) {
      return;
    }

    const panelEl = this.dropDownMenu();

    if (panelEl) {
      const panel = panelEl.nativeElement;
      const panelWasOpen = panel.matches(':popover-open');
      panel.togglePopover();
      event.stopPropagation();
      event.preventDefault();

      let innerValue = this.value();

      if (panelWasOpen && innerValue) {
        this.todaysDate.set(new Date());
        this.currentYear.set(innerValue!.getFullYear());
        this.currentMonth.set(innerValue!.getMonth());
      }
    }
  }

  protected isDateDisabled(date: Date): boolean {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let innerMin = this.min();
    let innerMax = this.max();

    if (innerMin && this.isValidDate(innerMin)) {
      const minDate = new Date(innerMin.getFullYear(), innerMin.getMonth(), innerMin.getDate());

      if (checkDate < minDate) {
        return true;
      }
    }

    if (innerMax && this.isValidDate(innerMax)) {
      const maxDate = new Date(innerMax.getFullYear(), innerMax.getMonth(), innerMax.getDate());
      if (checkDate > maxDate) {
        return true;
      }
    }

    return false;
  }

  protected prevMonth() {
    if (this.disabled()) {
      return;
    }

    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update((y) => y - 1);
    } else {
      this.currentMonth.update((m) => m - 1);
    }

    this.touch.emit();
  }

  protected nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update((y) => y + 1);
    } else {
      this.currentMonth.update((m) => m + 1);
    }
  }

  protected selectDate(date: Date) {
    if (this.disabled() || this.isDateDisabled(date)) {
      return;
    }

    let innerMode = this.mode();

    let targetDate = new Date(date);
    if (innerMode === 'datetime' || innerMode === 'time') {
      const hours24 = this.getMilitaryHours(this.selectedHour(), this.selectedPeriod());
      targetDate.setHours(hours24, this.selectedMinute(), 0, 0);
    }

    this.value.set(targetDate);

    if (innerMode === 'date') {
      this.hidePopover();
    }
  }

  protected selectHour(hour: number) {
    if (this.disabled()) {
      return;
    }

    this.selectedHour.set(hour);
    this.updateTimeInSelectedValue();
  }

  protected selectMinute(minute: number) {
    if (this.disabled()) {
      return;
    }

    this.selectedMinute.set(minute);
    this.updateTimeInSelectedValue();
  }

  protected setPeriod(period: 'AM' | 'PM') {
    if (this.disabled()) {
      return;
    }

    this.selectedPeriod.set(period);
    this.updateTimeInSelectedValue();
  }

  protected onSelectTimeClicked(event: PointerEvent) {
    event.stopPropagation();
    event.preventDefault();

    // Whatever the date/time value is in the currently opened dropdown is what we use.
    // The values would already have been set by previous events, so we just have to close the dropdown.
    this.hidePopover();
  }

  // --- Keyboard Input Entry Validation Logic ---
  protected onUserInput(event: Event) {
    if (this.disabled()) {
      return;
    }

    const rawText = (event.target as HTMLInputElement).value;
    this.inputValue.set(rawText);

    if (!rawText.trim()) {
      this.value.set(null);
      return;
    }

    const parsedDate = new Date(rawText);

    // Check if JS engine can interpret it and it fits restrictions
    if (!isNaN(parsedDate.getTime()) && !this.isDateDisabled(parsedDate)) {
      // Validate string mapping matches current configuration options roughly
      if (this.mode() === 'date' && rawText.includes(':')) {
        return;
      }

      this.value.set(parsedDate);
      this.touch.emit();
      this.touched.set(true);
    }
  }

  protected clear(click: PointerEvent): void {
    click.preventDefault();
    click.stopPropagation();

    if (this.disabled()) {
      return;
    }

    this.value.set(null);
  }

  protected onBlur(): void {
    if (this.disabled()) {
      return;
    }

    // 💡 Automatically marks the parent form as TOUCHED!
    this.touch.emit();
    this.touched.set(true);
  }

  private formatDateToString(val: Date): string {
    if (this.mode() === 'date') {
      return val.toLocaleDateString();
    }

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: this.timeFormat() === '12h',
    };

    if (this.mode() === 'time') {
      return val.toLocaleTimeString([], options);
    }

    return `${val.toLocaleDateString()}, ${val.toLocaleTimeString([], options)}`;
  }

  private updateTimeInSelectedValue() {
    let innerValue = this.value();
    let baseDate = innerValue ? new Date(innerValue!) : new Date();
    const hours24 = this.getMilitaryHours(this.selectedHour(), this.selectedPeriod());
    baseDate.setHours(hours24, this.selectedMinute(), 0, 0);

    if (!this.isDateDisabled(baseDate)) {
      this.value.set(baseDate);
    }
  }

  private getMilitaryHours(hour: number, period: 'AM' | 'PM'): number {
    if (this.timeFormat() === '24h') {
      return hour;
    }

    if (period === 'PM' && hour !== 12) {
      return hour + 12;
    }

    if (period === 'AM' && hour === 12) {
      return 0;
    }

    return hour;
  }

  isValidDate(value: any): value is Date {
    return value instanceof Date && !isNaN(value as any);
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
