import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { DropdownItem, UIDropdownComponent } from 'techtonics-ui/ui-dropdown';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ui-pagination',
  standalone: true,
  templateUrl: './ui-pagination.component.html',
  styleUrls: ['./ui-pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, UIDropdownComponent, FormsModule],
})
export class UIPaginationComponent {
  readonly componentClass = input<string>();
  readonly rowsPerPage = input<Array<number>>([10, 25, 50, 100]);
  readonly previousButtonText = input<string>('Prev');
  readonly nextButtonText = input<string>('Next');
  readonly visible = input<boolean>(true);

  page = model(1);
  totalPages = model(1);

  readonly rowsPerPageChanged = output<number>();
  readonly change = output<number>();

  rowsPerPageItems = computed(() => {
    let innerRowsPerPage = this.rowsPerPage();

    if (innerRowsPerPage == null || innerRowsPerPage.length == 0) {
      // If the engineer nulls out the array, we will bring it back to a default.
      innerRowsPerPage = [10, 25, 50, 100];
    }

    let dropDownItems = new Array<DropdownItem<number>>();

    for (let perPageRows of innerRowsPerPage) {
      let dropDownItem = {
        key: perPageRows.toString(),
        label: perPageRows.toString(),
        data: perPageRows,
        disabled: false,
        selected: false,
      } as DropdownItem<number>;

      dropDownItems.push(dropDownItem);
    }

    dropDownItems[0].selected = true;

    return dropDownItems;
  });

  selectedRowsPerPage = linkedSignal({
    source: this.rowsPerPageItems,
    computation: (newOptions) => {
      // Safely default to the first option provided, or a fallback if empty
      return newOptions.length > 0
        ? newOptions[0]
        : ({ key: '10', label: '10', data: 10 } as DropdownItem<number>);
    },
  });

  visiblePages = computed(() => {
    let innerTotalPages = this.pages();
    let currentPage = this.page();

    // We will always show at least 5 pages.
    if (innerTotalPages.length < 5) {
      return innerTotalPages;
    }

    /*
      We have more than 5 pages.
      Start only showing the current page, and then:
      -1 currentPage
      +1 currentPage
      FirstPage
      LastPage
    */
    let previousPage = currentPage - 1;
    let nextPage = currentPage + 1;
    let firstPage = 1;
    let lastPage = innerTotalPages.length;

    let pagesToShow = new Array<number>();

    // Always push the first page.
    pagesToShow.push(firstPage);

    if (currentPage == lastPage || currentPage == lastPage - 1) {
      if (currentPage == lastPage) {
        pagesToShow.push(lastPage - 3);
        pagesToShow.push(lastPage - 2);
      } else {
        pagesToShow.push(lastPage - 3);
      }
    }

    if (previousPage > firstPage) {
      pagesToShow.push(previousPage);
    }

    if (currentPage != firstPage && currentPage != lastPage) {
      pagesToShow.push(currentPage);
    }

    if (nextPage < lastPage) {
      pagesToShow.push(nextPage);
    }

    if (currentPage == firstPage || currentPage == 2) {
      // If this is the first page, push the third page so we don't end up with a 1, 2, 20 situation as that look weird.
      if (currentPage == firstPage) {
        pagesToShow.push(firstPage + 2);
        pagesToShow.push(firstPage + 3);
      } else {
        pagesToShow.push(currentPage + 2);
      }
    }

    // Always push the last page.
    pagesToShow.push(lastPage);

    return pagesToShow;
  });

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  go(p: number) {
    this.change.emit(p);
  }

  onRowsPerPageChanged(value: DropdownItem<any> | DropdownItem[] | null) {
    if (value != null) {
      this.rowsPerPageChanged.emit((value as DropdownItem<any>).data!);
    }
  }
}
