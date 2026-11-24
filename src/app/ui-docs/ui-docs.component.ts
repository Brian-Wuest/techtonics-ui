import { JsonPipe, NgClass, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { UIIconInterceptorDirective } from 'techtonics-ui/directives/iconInterceptor.directive';
import { LoaderService, ThemeService, ToastService } from 'techtonics-ui/services';
import { AccordionModel, UIAccordionComponent } from 'techtonics-ui/ui-accordion';
import { NavItem, UIAppNavComponent } from 'techtonics-ui/ui-app-nav';
import { UIBadgeComponent } from 'techtonics-ui/ui-badge';
import { BreadcrumbItem, UIBreadcrumbComponent } from 'techtonics-ui/ui-breadcrumb';
import { UIButtonComponent } from 'techtonics-ui/ui-button';
import { UICardComponent } from 'techtonics-ui/ui-card';
import { UICheckboxComponent } from 'techtonics-ui/ui-checkbox';
import {
  reactiveFormsContrastValidator,
  signalFormsContrastValidator,
  UIColorPickerComponent,
} from 'techtonics-ui/ui-color-picker';
import { UICurrencyInputComponent } from 'techtonics-ui/ui-currency-input';
import { UIDataGridComponent, UIGridColumnComponent } from 'techtonics-ui/ui-data-grid';
import { UIDateTimePickerComponent } from 'techtonics-ui/ui-date-time-picker';
import { UIDrawerComponent } from 'techtonics-ui/ui-drawer';
import { DropdownItem, UIDropdownComponent } from 'techtonics-ui/ui-dropdown';
import { UIInputComponent } from 'techtonics-ui/ui-input';
import { ListItem, UIListBoxComponent } from 'techtonics-ui/ui-listbox';
import { UILoadingIndicatorComponent } from 'techtonics-ui/ui-loading-indicator';
import { MenuItem, StandardMenuItem, UIMenuComponent } from 'techtonics-ui/ui-menu';
import { UIModalComponent } from 'techtonics-ui/ui-modal';
import { UINumberSpinnerComponent } from 'techtonics-ui/ui-number-spinner';
import { UIPaginationComponent } from 'techtonics-ui/ui-pagination';
import { UIPanelComponent } from 'techtonics-ui/ui-panel';
import { UIPopoverComponent, UIPopoverTriggerDirective } from 'techtonics-ui/ui-popover';
import { UIRadioButtonComponent, UIRadioGroupComponent } from 'techtonics-ui/ui-radio-button';
import { UISkeletonComponent } from 'techtonics-ui/ui-skeleton';
import { TimelineEvent, UIStepperComponent } from 'techtonics-ui/ui-stepper';
import { UITableComponent } from 'techtonics-ui/ui-table';
import { TabItem, UITabsComponent } from 'techtonics-ui/ui-tabs';
import { UIThemeToggleComponent } from 'techtonics-ui/ui-theme-toggle';
import { UIToastContainerComponent } from 'techtonics-ui/ui-toast-container';
import { UIToggleComponent } from 'techtonics-ui/ui-toggle';
import { TooltipDirective } from 'techtonics-ui/ui-tooltip';
import { TreeNode, UITreeViewComponent } from 'techtonics-ui/ui-tree-view';
import { UIVerticalNavComponent } from 'techtonics-ui/ui-vertical-nav';
import { UIConfirmationComponent, ConfirmService } from 'techtonics-ui/ui-confirmation';
import { firstValueFrom, of } from 'rxjs';

interface FormPayload {
  lastUpdated: Date;
  formData: any;
}

interface IconData {
  randomOtherString: string;
  iconClass: string;
}

interface Project {
  name: string;
  dateEnd: Date;
  budget: number;
  id: string;
}

enum NotificationPreference {
  Email = 0,
  SMS = 1,
  SnailMai = 2,
  PhoneCall = 3,
}

//#region Accordion Data

interface MyCustomAccordionData {
  id: number;
  category: string;
}

//#endregion

@Component({
  selector: 'app-ui-docs',
  standalone: true,
  imports: [
    FormsModule,
    UIButtonComponent,
    UIInputComponent,
    UICardComponent,
    UIBadgeComponent,
    UITableComponent,
    UIModalComponent,
    UITabsComponent,
    UIDropdownComponent,
    UIToastContainerComponent,
    UISkeletonComponent,
    UIPaginationComponent,
    UIListBoxComponent,
    UIBreadcrumbComponent,
    UIToggleComponent,
    UINumberSpinnerComponent,
    UICurrencyInputComponent,
    TooltipDirective,
    UITreeViewComponent,
    UIStepperComponent,
    UIAppNavComponent,
    UIVerticalNavComponent,
    UIDateTimePickerComponent,
    JsonPipe,
    UIPanelComponent,
    UIRadioButtonComponent,
    UIRadioGroupComponent,
    UIDataGridComponent,
    UIGridColumnComponent,
    NgClass,
    UpperCasePipe,
    UICheckboxComponent,
    UILoadingIndicatorComponent,
    ReactiveFormsModule,
    FormField,
    FormRoot,
    UIAccordionComponent,
    UIMenuComponent,
    UIDrawerComponent,
    UIPopoverComponent,
    UIPopoverTriggerDirective,
    UIIconInterceptorDirective,
    UIColorPickerComponent,
    UIThemeToggleComponent,
    UIConfirmationComponent,
  ],
  templateUrl: './ui-docs.component.html',
  styleUrls: ['./ui-docs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UIDocsComponent implements OnInit {
  toast: ToastService = inject(ToastService);
  theme: ThemeService = inject(ThemeService);
  loadingService: LoaderService = inject(LoaderService);

  modalOpen = false;
  modalOpen2 = false;
  dropdownValue: DropdownItem | null = null;
  dropdownValue2: DropdownItem<IconData> | null = null;
  dropdownValue3: DropdownItem | null = null;
  dropdownValues: DropdownItem[] | null = null;
  dropdownValues2: DropdownItem[] | null = null;
  dateValue: Date | null = null;
  toggleValue = signal<boolean>(false);
  numberSpinnerValue = signal<number | null>(1);
  numberSpinnerValue2 = signal<number | null>(15);
  currencyValue = signal<number | null>(1);
  currentPage = signal<number>(1);
  projectTree = [
    {
      id: '1',
      label: 'My Root',
      data: { count: 1, info: 'abc' },
      children: [
        {
          id: '2',
          label: 'Child 1',
          data: { count: 42, info: 'asdfal' },
        },
        {
          id: '3',
          label: 'Child 3',
          data: { count: 132, info: '9873' },
          children: [
            {
              id: '7',
              label: 'Grand Child 1',
              data: { count: 4, info: '9876' },
            },
            {
              id: '8',
              label: 'Grand Child 2',
              data: { count: 26, info: '9877' },
            },
            {
              id: '9',
              label: 'Grand Child 3',
              data: { count: 7, info: '9878' },
            },
          ],
        },
        {
          id: '4',
          label: 'Child 4',
          data: { count: 9, info: '9874' },
        },
        {
          id: '5',
          label: 'Child 5',
          data: { count: 56, info: '9875' },
        },
        {
          id: '6',
          label: 'Child 6',
          data: { count: 56, info: '9875' },
        },
        {
          id: '10',
          label: 'Child 7',
          data: { count: 56, info: '9875' },
        },
        {
          id: '11',
          label: 'Child 8',
          data: { count: 56, info: '9875' },
        },
        {
          id: '12',
          label: 'Child 9',
          data: { count: 56, info: '9875' },
        },
        {
          id: '13',
          label: 'Child 10',
          data: { count: 56, info: '9875' },
        },
        {
          id: '14',
          label: 'Child 11',
          data: { count: 56, info: '9875' },
        },
        {
          id: '15',
          label: 'Child 12',
          data: { count: 56, info: '9875' },
        },
        {
          id: '16',
          label: 'Child 13',
          data: { count: 56, info: '9875' },
        },
        {
          id: '17',
          label: 'Child 14',
          data: { count: 56, info: '9875' },
        },
        {
          id: '18',
          label: 'Child 15',
          data: { count: 56, info: '9875' },
        },
        {
          id: '19',
          label: 'Child 16',
          data: { count: 56, info: '9875' },
        },
        {
          id: '20',
          label: 'Child 17',
          data: { count: 56, info: '9875' },
        },
        {
          id: '21',
          label: 'Child 18',
          data: { count: 56, info: '9875' },
        },
        {
          id: '22',
          label: 'Child 19',
          data: { count: 56, info: '9875' },
        },
        {
          id: '23',
          label: 'Child 20',
          data: { count: 56, info: '9875' },
        },
        {
          id: '24',
          label: 'Child 21',
          data: { count: 56, info: '9875' },
        },
      ],
    } as TreeNode<{ count: number; info: string }>,
  ] as Array<TreeNode<{ count: number; info: string }>>;
  selectedNodes1 = signal<Array<TreeNode<{ count: number; info: string }>>>([]);
  selectedNodes2 = signal<Array<TreeNode<{ count: number; info: string }>>>([]);

  tabs = signal<Array<TabItem>>([
    {
      key: '1',
      label: 'Tab 1',
      icon: 'ti ti-clock',
    } as TabItem,
    {
      key: '2',
      label: 'Tab 2',
      icon: 'ti ti-trash',
    } as TabItem,
    {
      key: '3',
      label: 'Tab 3',
      icon: 'ti ti-send',
    } as TabItem,
    {
      key: '4',
      label: 'Tab 4',
      icon: 'ti ti-building-store',
      disabled: true,
    } as TabItem,
  ]);

  selectedTab = signal<TabItem | undefined>(undefined);

  breadCrumbItems: BreadcrumbItem[] = [
    { id: 1, label: 'Home' },
    { id: 2, label: 'Library' },
    { id: 3, label: 'Data' },
  ];

  user = {
    name: 'John',
    lastLogin: new Date(2025, 8, 25),
  };

  readonly checkoutSteps = signal<TimelineEvent<FormPayload>[]>([
    {
      key: 'cart_review',
      label: 'Cart',
      description: 'Review your items',
      data: { lastUpdated: new Date(), formData: {} },
    },
    {
      key: 'shipping_address',
      label: 'Shipping',
      description: 'Delivery address',
      data: undefined,
    },
    {
      key: 'billing_payment',
      label: 'Payment',
      description: 'Credit card options',
      data: undefined,
    },
  ]);

  myTimelineIndex = signal(0);

  readonly checkoutSteps2 = signal<TimelineEvent<FormPayload>[]>([
    {
      key: 'cart_review',
      label: 'Cart',
      description: 'Review your items',
      data: { lastUpdated: new Date(), formData: {} },
    },
    {
      key: 'shipping_address',
      label: 'Shipping',
      description: 'Delivery address',
      data: undefined,
    },
    {
      key: 'billing_payment',
      label: 'Payment',
      description: 'Credit card options',
      data: undefined,
    },
  ]);

  myTimelineIndex2 = signal(0);

  readonly checkoutSteps3 = signal<TimelineEvent<FormPayload>[]>([
    {
      key: 'cart_review',
      label: 'Cart',
      description: 'Review your items',
      data: { lastUpdated: new Date(), formData: {} },
    },
    {
      key: 'shipping_address',
      label: 'Shipping',
      description: 'Delivery address',
      data: undefined,
    },
    {
      key: 'billing_payment',
      label: 'Payment',
      description: 'Credit card options',
      data: undefined,
    },
  ]);

  myTimelineIndex3 = signal(0);

  timelineEvents: TimelineEvent[] = [
    { key: '1', label: 'Step 1' },
    { key: '2', label: 'Step 2' },
    { key: '3', label: 'Step 3' },
    { key: '4', label: 'Step 4' },
  ];

  mainNav = [
    { id: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: 'ti ti-hammer' },
    {
      id: 'admin',
      label: 'Admin',
      children: [
        { id: 'users', label: 'Users', route: '/admin/users', icon: 'ti ti-ironing' },
        { id: 'roles', label: 'Roles', route: '/admin/roles', icon: 'ti ti-user' },
      ],
    },
    { id: 'reports', label: 'Reports', route: '/reports' },
  ] as Array<NavItem>;

  profileNav = [
    { id: 'account', label: 'My Account', route: '/my-account' },
    { id: 'logout', label: 'Logout', route: '/logout' },
  ];

  megaMainNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    {
      id: 'admin',
      label: 'Admin',
      children: [
        { id: 'users', label: 'Users', route: '/admin/users' },
        { id: 'roles', label: 'Roles', route: '/admin/roles' },
      ],
    },
    {
      id: 'products',
      label: 'Products',
      mega: true,
      children: [
        {
          id: 'catalog',
          label: 'Catalog',
          children: [
            { id: 'all-products', label: 'All Products' },
            { id: 'categories', label: 'Categories' },
          ],
          icon: 'ti ti-ironing',
        },
        {
          id: 'pricing',
          label: 'Pricing',
          children: [
            { id: 'plans', label: 'Plans' },
            { id: 'discounts', label: 'Discounts', icon: 'ti ti-user' },
          ],
        },
      ],
    },
  ] as Array<NavItem>;

  sidebarNav: NavItem[] = [
    { id: 'home', label: 'Home', icon: 'ti ti-home-2', route: '/home' },
    {
      id: 'admin',
      label: 'Admin',
      icon: 'ti ti-settings',
      children: [
        { id: 'users', label: 'Users', route: '/admin/users' },
        { id: 'roles', label: 'Roles', route: '/admin/roles' },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'ti ti-chart-bar',
      children: [
        { id: 'sales', label: 'Sales', route: '/reports/sales' },
        { id: 'inventory', label: 'Inventory', route: '/reports/inventory' },
      ],
    },
  ];

  dropdownItems: DropdownItem[] = [
    {
      key: '1',
      label: 'Option 1',
      data: 'Some Data for option 1',
      disabled: false,
    },
    {
      key: '2',
      label: 'Option 2',
      data: 'Some Data for option 2',
      disabled: false,
    },
    {
      key: '3',
      label: 'Option 3',
      data: 'Some Data for option 3',
      disabled: false,
    },
    {
      key: '4',
      label: 'Option 4',
      data: 'Some Data for option 4',
      disabled: true,
    },
    {
      key: '5',
      label: 'Option 5',
      data: 'Some Data for option 5',
      disabled: false,
    },
  ];

  dropdownItems2: DropdownItem[] = [
    {
      key: '1',
      label: 'Option 1',
      data: 'Some Data for option 1',
      disabled: false,
    },
    {
      key: '2',
      label: 'Option 2',
      data: 'Some Data for option 2',
      disabled: false,
    },
    {
      key: '3',
      label: 'Option 3',
      data: 'Some Data for option 3',
      disabled: false,
    },
    {
      key: '4',
      label: 'Option 4',
      data: 'Some Data for option 4',
      disabled: true,
    },
    {
      key: '5',
      label: 'Option 5',
      data: 'Some Data for option 5',
      disabled: false,
    },
  ];

  dropdownItems3: DropdownItem<IconData>[] = [
    {
      key: '1',
      label: 'Option 1',
      data: { iconClass: 'primary-light-color ti ti-hammer' } as IconData,
      disabled: false,
    },
    {
      key: '2',
      label: 'Option 2',
      data: { iconClass: 'secondary-color ti ti-alarm' } as IconData,
      disabled: false,
    },
    {
      key: '3',
      label: 'Option 3',
      data: { iconClass: 'success-color ti ti-device-ipad-bolt' } as IconData,
      disabled: false,
    },
    {
      key: '4',
      label: 'Option 4',
      data: { iconClass: 'warning-color ti ti-device-imac-question' } as IconData,
      disabled: true,
    },
    {
      key: '5',
      label: 'Option 5',
      data: { iconClass: 'error-color ti ti-door-exit' } as IconData,
      disabled: false,
    },
    {
      key: '6',
      label: 'Option 6',
      data: { iconClass: 'info-color ti ti-door' } as IconData,
      disabled: false,
    },
  ];

  currentRoute = '/admin/users';

  myEventDateTime: Date | null = new Date();
  myEventDateTime2: Date | null = new Date();

  myEventTime: Date | null = new Date();
  myEventDate: Date | null = new Date();

  // Set constraints (e.g., bounds around current date)
  minLimit = new Date(new Date().setDate(new Date().getDate() - 5));
  maxLimit = new Date(new Date().setDate(new Date().getDate() + 14));

  radioButtonPreference = NotificationPreference.Email;

  products = signal([
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'A102', name: 'Wireless Mouse 2', inventory: 50 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
    { code: 'C309', name: '4K Gaming Monitor', inventory: 12 },
    { code: 'D401', name: 'USB-C Docking Hub', inventory: 22 },
    { code: 'E112', name: 'Ergonomic Office Chair', inventory: 8 },
    { code: 'F702', name: 'Super Computer', inventory: 2 },
    { code: 'G812', name: 'Qwen AI Assistant', inventory: 5 },
    { code: 'H923', name: 'Wired Mouse', inventory: 10 },
    { code: 'I134', name: 'Stool', inventory: 12 },
    { code: 'J245', name: '2k Television', inventory: 15 },
    { code: 'K356', name: 'Television Wall Mount', inventory: 61 },
    { code: 'L467', name: '4-Tier Book Case', inventory: 5 },
    { code: 'M578', name: '8-Tier Book Case', inventory: 9 },
    { code: 'N689', name: 'Regular Office Chair', inventory: 65 },
    { code: 'O790', name: 'Players Handbook (3.5)', inventory: 3 },
    { code: 'P801', name: 'Monster Manual (3.5)', inventory: 5 },
    { code: 'Q912', name: "Dungeon Master's Guide (3.5)", inventory: 2 },
  ]);

  showTableSku = true;
  showTableCost = true;
  products2 = signal([
    { code: 'A102', name: 'Wireless Mouse', inventory: 40 },
    { code: 'B501', name: 'Mechanical Keyboard', inventory: 5 },
  ]);

  products3 = signal([
    { sku: 'EUR-90', title: 'Industrial Hand Truck', warehouse: 'Zone A-4' },
    { sku: 'USA-12', title: 'Heavy Duty Cargo Straps', warehouse: 'Zone B-1' },
    { sku: 'GBL-44', title: 'Micro-Fiber Protective Wrap', warehouse: 'Zone A-2' },
    { sku: 'XLI-09', title: 'Steel Strapping Dispenser', warehouse: 'Zone C-5' },
  ]);

  showCost = true;
  products4 = signal([
    { sku: 'SKU-001', title: 'Ergonomic Task Chair', cost: 199.99 },
    { sku: 'SKU-002', title: 'Mechanical Keyboard (Red Switches)', cost: 89.5 },
    { sku: 'SKU-003', title: 'UltraWide 34" Monitor', cost: 449.0 },
    { sku: 'SKU-004', title: 'USB-C Universal Docking Hub', cost: 129.0 },
    { sku: 'SKU-005', title: 'Noise Cancelling Headphones', cost: 250.0 },
  ]);

  users = [
    { id: 101, name: 'Alice Vance', role: 'admin' },
    { id: 102, name: 'Bob Jenkins', role: 'user' },
    { id: 103, name: 'Charlie Smith', role: 'user' },
  ];

  selectedItems: any[] = [];

  savedColumnSequence: string[] = [];

  inventory = [
    { sku: 'EUR-90', title: 'Industrial Hand Truck', warehouse: 'Zone A-4' },
    { sku: 'USA-12', title: 'Heavy Duty Cargo Straps', warehouse: 'Zone B-1' },
    { sku: 'GBL-44', title: 'Micro-Fiber Protective Wrap', warehouse: 'Zone A-2' },
  ];

  inventory2 = [
    { sku: 'EUR-90', title: 'Industrial Hand Truck', stock: '40' },
    { sku: 'USA-12', title: 'Heavy Duty Cargo Straps', stock: '5' },
  ];

  inventory3 = [
    { sku: 'EUR-90', title: 'Industrial Hand Truck', stock: '40' },
    { sku: 'USA-12', title: 'Heavy Duty Cargo Straps', stock: '5' },
  ];

  //#region Reactive Forms

  minLengthInputformGroup = new FormGroup<{ something: FormControl<string> }>({
    something: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(4), Validators.required],
    }),
  });

  requiredInputformGroup = new FormGroup<{ something: FormControl<string> }>({
    something: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  //#endregion

  //#region Signal Forms

  inputSignalModel = signal({
    personName: '',
  });

  inputSignalForm = form(this.inputSignalModel, (path) => {
    required(path.personName);
    minLength(path.personName, 4);
  });

  //#endregion

  isActive = (item: NavItem) => !!item.route && this.currentRoute.startsWith(item.route);

  ngOnInit(): void {
    this.loadColumnLayout();

    this.requiredInputformGroup.controls.something.disable();
  }

  setDropdown(value: DropdownItem | null) {
    console.log('Dropdown item selected', value);
    this.dropdownValue = value;
  }

  setDropdown2(value: DropdownItem<IconData> | null) {
    console.log('Dropdown item <icondata> selected', value);
    this.dropdownValue2 = value;
  }

  setDropdown3(value: DropdownItem | null) {
    console.log('Dropdown3 item selected', value);
    this.dropdownValue3 = value;
  }

  setDropdownValues(values: DropdownItem[] | null) {
    console.log('Dropdown items selected', values);
    this.dropdownValues = values;
  }

  setDropdownValues2(values: DropdownItem[] | null) {
    console.log('Dropdown items selected', values);
    this.dropdownValues2 = values;
  }

  toggleTheme() {
    this.theme.toggle();
  }

  onCrumbClick(item: BreadcrumbItem) {
    console.log('Breadcrumb clicked:', item);
  }

  onToggleChanged(value: boolean) {
    this.toggleValue.set(value);
    console.log('value of toggle', value);
  }

  onNumberSpinnerChanged(value: number | null) {
    // Note: Allows for null since it can be cleared out!
    this.numberSpinnerValue.set(value);
    console.log('value of number spinner!', value);
  }

  onNumberSpinnerChanged2(value: number | null) {
    // Note: Allows for null since it can be cleared out!
    this.numberSpinnerValue2.set(value);
    console.log('value of number spinner 2!', value);
  }

  onCurrencyChanged(value: number | null) {
    // Note: Allows for null since it can be cleared out!
    this.currencyValue.set(value);
    console.log('value of currency value', value);
  }

  onPageChanged(value: number) {
    this.currentPage.set(value);
  }

  onSelected1Changed(value: Array<TreeNode<{ count: number; info: string }>>) {
    this.selectedNodes1.set(value);
  }

  onSelected2Changed(value: Array<TreeNode<{ count: number; info: string }>>) {
    this.selectedNodes2.set(value);
  }

  handleStepChange(event: { step: TimelineEvent<FormPayload>; index: number }): void {
    console.log(`Navigating from step key: ${event.step.key}`);

    // Example: Save or inspect the generic component metadata bound inside data configuration
    if (event.step.data) {
      console.log('Saved model parameters for this step instance:', event.step.data.formData);
    }

    this.myTimelineIndex.set(event.index);
  }

  handleStepChange2(event: { step: TimelineEvent<FormPayload>; index: number }): void {
    console.log(`Navigating from step key: ${event.step.key}`);

    // Example: Save or inspect the generic component metadata bound inside data configuration
    if (event.step.data) {
      console.log('Saved model parameters for this step instance:', event.step.data.formData);
    }

    this.myTimelineIndex2.set(event.index);
  }

  handleStepChange3(event: { step: TimelineEvent<FormPayload>; index: number }): void {
    console.log(`Navigating from step key: ${event.step.key}`);

    // Example: Save or inspect the generic component metadata bound inside data configuration
    if (event.step.data) {
      console.log('Saved model parameters for this step instance:', event.step.data.formData);
    }

    this.myTimelineIndex3.set(event.index);
  }

  disabledTimelinePreviousClick() {
    let currentValue = this.myTimelineIndex3();
    console.warn('Current Value', currentValue);
    currentValue = currentValue - 1;
    console.warn('New Value', currentValue);
    this.myTimelineIndex3.set(currentValue);
  }

  disabledTimelineNextClick() {
    let currentValue = this.myTimelineIndex3();
    console.warn('Current Value', currentValue);

    currentValue = currentValue + 1;

    console.warn('New Value', currentValue);
    this.myTimelineIndex3.set(currentValue);
  }

  // Example handler function showing how a consumer page can update a specific step's model data
  saveStepFormData(stepKey: string, rawFormValues: any): void {
    this.checkoutSteps.update((steps) =>
      steps.map((s) => (s.key === stepKey ? { ...s, data: { lastUpdated: new Date(), formData: rawFormValues } } : s)),
    );
  }

  onTimelineEventSelect(ev: TimelineEvent) {
    console.log('Timeline selected:', ev);
  }

  onNavClick(ev: NavItem) {
    console.log('Navigation Item', ev);
    this.currentRoute = ev.route ?? this.currentRoute;
  }

  onSideBarItemClick(ev: NavItem) {
    console.log('Sidebar nav clicked:', ev);
    this.currentRoute = ev.route ?? this.currentRoute;
  }

  onTabClick(ev: TabItem) {
    console.log('Tab Item Clicked');
    this.selectedTab.set(ev);
  }

  //#region Listbox Data

  listItems = signal<Array<ListItem<string>>>([
    {
      key: '1',
      label: 'Apple',
      data: 'abc',
    },
    {
      key: '2',
      label: 'Orange',
      data: '9872',
    },
    {
      key: '3',
      label: 'Banana',
      data: '9873',
    },
    {
      key: '4',
      label: 'Pineapple',
      data: '9874',
    },
    {
      key: '5',
      label: 'Grape',
      data: '9875',
    },
    {
      key: '6',
      label: 'Kiwi',
      data: '9876',
    },
    {
      key: '7',
      label: 'Strawberry',
      data: '9877',
    },
    {
      key: '8',
      label: 'Plum',
      data: '9878',
    },
    {
      key: '9',
      label: 'Peach',
      data: '9879',
    },
    {
      key: '10',
      label: 'Nectarine',
      data: '9880',
    },
  ]);

  listBoxItemsChanged(items: ListItem<any>[] | null) {
    console.log('List Box Items', items);
  }

  listItems2 = signal<Array<ListItem<{ group: string; misc: string }>>>([
    {
      key: '1',
      label: 'Apple',
      data: { group: '123', misc: 'abc' },
    },
    {
      key: '2',
      label: 'Orange',
      data: { group: '123', misc: '9873' },
    },
    {
      key: '3',
      label: 'Banana',
      data: { group: '123', misc: '9874' },
    },
    {
      key: '4',
      label: 'Pineapple',
      data: { group: '123', misc: '9875' },
    },
    {
      key: '5',
      label: 'Grape',
      data: { group: '456', misc: '9876' },
    },
    {
      key: '6',
      label: 'Kiwi',
      data: { group: '456', misc: '9877' },
    },
    {
      key: '7',
      label: 'Strawberry',
      data: { group: '456', misc: '9878' },
    },
    {
      key: '8',
      label: 'Plum',
      data: { group: '456', misc: '9879' },
    },
    {
      key: '9',
      label: 'Peach',
      data: { group: '456', misc: '9880' },
    },
    {
      key: '10',
      label: 'Nectarine',
      data: { group: '789', misc: '9881' },
    },
  ]);

  groupByListItem2(item: ListItem<any>) {
    return item.data.group;
  }

  listBoxItemsChanged2(items: ListItem<any>[] | null) {
    console.log('List Box Items2', items);
  }

  //#endregion

  radioButtonGroupChanged(item: NotificationPreference) {
    console.warn('New value for radio group', item);
  }

  handleEdit(event: any) {
    console.log('Cell modified successfully:', event);
  }

  handleSelection(selected: any[]) {
    this.selectedItems = selected;
  }

  deleteSelected() {
    // Correctly purges selected elements matching items inside the array tracking references
    this.products.set(this.products().filter((p) => !this.selectedItems.includes(p)));
    this.selectedItems = [];

    // Safety fallback: Reset page index backwards if item deletions cause current page to be empty
    /* const maxPages = this.dataTableTotalPages();
    if (this.currentPage() > maxPages && maxPages > 0) {
      this.currentPage.set(maxPages);
    } */

    /* this.products = this.products.filter((p) => !this.selectedItems.includes(p));
    this.selectedItems = []; // Clear current selections hook */
  }

  exportToCSV() {
    console.log('Exporting processing payload execution...', this.products());
  }

  clearAllTableData() {
    this.products2.set([]);
  }

  openModal(rowData: any) {
    // Developers can hook up modal windows or execution parameters here
    alert(`Initiating detail modal display context for asset: ${rowData.title} [${rowData.sku}]`);
  }

  editUser(user: any) {
    console.log('Targeting user entity data for modification:', user);
    alert(`Opening editing profile context window for: ${user.name}`);
  }

  deleteUser(user: any) {
    console.log('Purging record entry reference from matrix:', user);
    this.users = this.users.filter((u) => u.id !== user.id);
  }

  loadColumnLayout() {
    // 1. Fetch layout sequence on startup (e.g., from localStorage or a remote API database endpoint)
    const storedLayout = localStorage.getItem('PREFERENCE_GRID_COLUMN_ORDER');
    if (storedLayout) {
      this.savedColumnSequence = JSON.parse(storedLayout);
    }
  }

  persistColumnLayout(orderedFields: string[]) {
    // 2. Save updates when a column is dropped
    this.savedColumnSequence = orderedFields;
    localStorage.setItem('PREFERENCE_GRID_COLUMN_ORDER', JSON.stringify(orderedFields));

    // Optional placeholder hook for cloud sync setups:
    // this.http.post('/api/user/preferences/grid', { layout: orderedFields }).subscribe();
    console.log('Persistent sequence saved successfully:', orderedFields);
  }

  validateCellInput(row: any, field: string, value: any): string | null {
    const textValue = String(value).trim();

    if (field === 'title') {
      if (!textValue) return 'The label name field cannot be empty.';
      if (textValue.length < 3) return 'Label must be at least 3 characters long.';
    }

    if (field === 'stock') {
      const parsedNumber = Number(textValue);
      if (isNaN(parsedNumber) || textValue === '') return 'Stock count must be a valid number.';
      if (parsedNumber < 0) return 'Stock cannot be a negative value.';
    }

    return null; // Return null if validation passes
  }

  handleSave(event: any) {
    console.log('Value passed verification and saved successfully:', event);
  }

  validateCellInput2(row: any, field: string, value: any): string | null {
    const textValue = String(value).trim();
    if (field === 'title' && !textValue) return 'The label name field cannot be empty.';
    if (field === 'stock' && (isNaN(Number(textValue)) || textValue === '')) return 'Must be a valid integer.';
    return null;
  }

  syncToCloudDB() {
    alert('Validation checks passed. Syncing database records to cloud cluster server.');
  }

  setupLoading() {
    this.loadingService.show();

    setTimeout(() => {
      this.loadingService.hide();
    }, 6000);
  }

  //#region Accordion Data

  accordionData: AccordionModel<MyCustomAccordionData>[] = [
    {
      key: 'item-1',
      header: 'First Item',
      body: 'This is the body content of item 1.',
      disabled: false,
      expanded: false,
      data: { id: 101, category: 'Billing' },
    },
    {
      key: 'item-2',
      header: 'Second Item',
      body: 'This is the body content of item 2.',
      disabled: false,
      expanded: false, // starts open
      data: { id: 102, category: 'Security' },
    },
    {
      key: 'item-3',
      header: 'Disabled Row',
      body: 'Cannot toggle this.',
      disabled: true,
      expanded: false,
      data: { id: 103, category: 'System' },
    },
  ];

  accordionData2 = [...this.accordionData];

  accordionData3 = [...this.accordionData];

  onItemToggled(event: { item: AccordionModel<MyCustomAccordionData>; expanded: boolean }) {
    console.log(`Item ${event.item.key} state changed to: ${event.expanded}`);
  }

  onItemToggled2(event: { item: AccordionModel<MyCustomAccordionData>; expanded: boolean }) {
    console.log(`Item ${event.item.key} state changed to: ${event.expanded}`);
  }

  onItemToggled3(event: { item: AccordionModel<MyCustomAccordionData>; expanded: boolean }) {
    console.log(`Item ${event.item.key} state changed to: ${event.expanded}`);
  }

  //#endregion

  //#region Menu Data

  isMenuOpen = signal(false);

  myMenuData: MenuItem[] = [
    { id: '1', label: 'View Profile', disabled: false },
    {
      id: '2',
      label: 'Edit Permissions',
      disabled: false,
      children: [
        { id: '2-1', label: 'Make Admin', disabled: false },
        { id: '2-2', label: 'Revoke Write Access', disabled: true },
        { id: '2-3', label: 'Make Supervisor', disabled: false },
      ],
    },
    { id: 'sep-1', type: 'separator' },
    { id: '3', label: 'Delete Account', disabled: false },
  ];

  handleMenuAction(output: { menuItem: MenuItem; hostElement: HTMLElement; event: MouseEvent }): void {
    console.log('Menu Action Triggered for ID:', output.menuItem.id);
    this.isMenuOpen.set(false); // Close menu
  }

  //#endregion

  //#region Menu Data (For Modal)

  isMenuOpen2 = signal(false);
  menuX2 = signal(0);
  menuY2 = signal(0);

  myMenuData2: MenuItem[] = [
    { id: '1', label: 'View Profile', disabled: false },
    {
      id: '2',
      label: 'Edit Permissions',
      disabled: false,
      children: [
        { id: '2-1', label: 'Make Admin', disabled: false },
        { id: '2-2', label: 'Revoke Write Access', disabled: true },
        { id: '2-3', label: 'Make Supervisor', disabled: false },
      ],
    },
    { id: 'sep-1', type: 'separator' },
    { id: '3', label: 'Delete Account', disabled: false },
  ];

  toggleMenu() {
    let isMenuOpen = this.isMenuOpen();

    this.isMenuOpen.set(isMenuOpen);
  }

  toggleMenu2() {
    let isMenuOpen = this.isMenuOpen2();

    this.isMenuOpen2.set(!isMenuOpen);
  }

  handleMenuAction2(output: { menuItem: MenuItem; hostElement: HTMLElement; event: MouseEvent }): void {
    console.log('Menu Action Triggered for ID:', output.menuItem.id);
    if (output.menuItem.type == 'item' || output.menuItem.type == undefined) {
      const standardItem = output.menuItem as StandardMenuItem;
      if (standardItem.checked != true) {
        standardItem.checked = true;
      } else {
        standardItem.checked = false;
      }
    }

    this.isMenuOpen2.set(false); // Close menu
  }

  //#endregion

  //#region Drawer Data

  isDrawerVisible = signal<boolean>(false);

  isDrawer2Visible = signal<boolean>(false);

  isDrawer3Visible = signal<boolean>(false);

  isDrawer4Visible = signal<boolean>(false);

  //#endregion

  //#region Popover Data

  isPopoverMenuOpen = signal<boolean>(false);
  isPopoverMenuOpen2 = signal<boolean>(false);

  writeToControlInPopover() {
    console.log('Did an export from a popover!');
  }

  //#endregion

  //#region Color picker data
  selectedColor1 = signal<string>('#3b82f6');
  selectedColor2 = signal<string>('#ec4899');
  selectedColor3 = signal<string>('#f59e0b');

  private colorFormBuilder = inject(FormBuilder);

  inputSignalColorModel = signal({
    selectedColor: '',
  });

  inputSignalColorForm = form(this.inputSignalColorModel, (path) => {
    required(path.selectedColor);
  });

  themeSettings = signal({
    primaryColor: '#3b82f6',

    // Poor contrast if evaluated against a light backdrop (#ffffff)
    textColor: '#e5e7eb',
  });

  themeForm = form(this.themeSettings, (schema) => {
    // Hooks the accessibility audit rules directly to the signal forms compiler tree
    signalFormsContrastValidator(schema.textColor, schema.primaryColor, 4.5);
  });

  colorThemeForm = this.colorFormBuilder.group(
    {
      textColor: ['#6b7280'],
      primaryColor: ['#f97316'],
    },
    {
      // Attached at the group level to cleanly evaluate both control variables in parallel
      validators: [reactiveFormsContrastValidator('textColor', 'primaryColor', 4.5)],
    },
  );

  //#endregion

  //#region Confirmation Modal

  confirmService = inject(ConfirmService);

  primaryProject = {
    budget: 50_233_231,
    dateEnd: new Date('05/17/2027'),
    id: 'abc123',
    name: 'The Ultimate Project',
  } as Project;

  async deleteItem(item: Project): Promise<void> {
    const confirmed = await this.confirmService.open({
      title: 'Delete Project',
      message: `Delete <strong>${item.name}</strong>? This cannot be undone.`,
      buttons: [
        { label: 'Keep', value: false, variant: 'secondary' },
        { label: 'Delete', value: true, variant: 'error' },
      ],
    });

    if (confirmed) {
      console.warn('Deleting project', item);
      await firstValueFrom(of(item.id));
    }
  }

  //#endregion
}
