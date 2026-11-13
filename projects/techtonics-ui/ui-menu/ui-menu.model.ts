export type MenuItem = StandardMenuItem | SeparatorMenuItem;

export interface BaseMenuItem {
  id: string;
  data?: any;
}

export interface StandardMenuItem extends BaseMenuItem {
  type?: 'item'; // Default implicit type
  label: string;
  icon?: string;
  disabled: boolean;
  children?: MenuItem[];
  checked?: boolean;
}

export interface SeparatorMenuItem extends BaseMenuItem {
  type: 'separator';
}
