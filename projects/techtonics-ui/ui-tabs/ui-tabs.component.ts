import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, InputSignal, OnInit, output, signal } from '@angular/core';
import { UIIconInterceptorDirective } from 'techtonics-ui/directives';

export interface TabItem {
  key: string;
  label: string;
  data?: any;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'ui-tabs',
  standalone: true,
  imports: [NgClass, UIIconInterceptorDirective],
  templateUrl: './ui-tabs.component.html',
  styleUrls: ['./ui-tabs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UITabsComponent implements OnInit {
  readonly tabs: InputSignal<TabItem[]> = input.required<TabItem[]>();
  readonly defaultActiveKey: InputSignal<string | undefined> = input<string | undefined>();
  readonly componentClass = input<string>();
  readonly visible = input<boolean>(true);

  tabClick = output<TabItem>();

  activeTabKey = signal<string | undefined>(undefined);

  ngOnInit() {
    // Set initial active tab if provided, otherwise default to first non-disabled tab
    let activeKey = this.defaultActiveKey();
    let innerTabs = this.tabs();

    if (activeKey) {
      this.activeTabKey.set(activeKey);
    } else if (innerTabs.length > 0) {
      const firstEnabled = innerTabs.find((t) => !t.disabled);
      this.activeTabKey.set(firstEnabled ? firstEnabled.key : innerTabs[0].key);

      if (firstEnabled) {
        this.tabClick.emit(firstEnabled);
      }
    }
  }

  selectTab(tab: TabItem) {
    if (tab.disabled) {
      return;
    }

    this.activeTabKey.set(tab.key);
    this.tabClick.emit(tab);
  }
}
