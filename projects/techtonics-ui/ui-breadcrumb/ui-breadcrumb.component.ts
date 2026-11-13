import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  contentChild,
  input,
  output,
} from '@angular/core';

export interface BreadcrumbItem {
  id: string | number;
  label: string;
  data?: any;
}

@Component({
  selector: 'ui-breadcrumb',
  standalone: true,
  imports: [NgTemplateOutlet, NgClass],
  templateUrl: './ui-breadcrumb.component.html',
  styleUrls: ['./ui-breadcrumb.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UIBreadcrumbComponent {
  readonly items = input<BreadcrumbItem[]>([]);
  readonly itemTemplate = contentChild<TemplateRef<any> | null>('item');
  readonly separatorTemplate = contentChild<TemplateRef<any> | null>('separator');
  readonly componentClass = input<string>();
  readonly ariaLabel = input<string>('Breadcrumb');
  readonly visible = input<boolean>(true);

  readonly itemClick = output<BreadcrumbItem>();

  onItemClick(item: BreadcrumbItem) {
    this.itemClick.emit(item);
  }
}
