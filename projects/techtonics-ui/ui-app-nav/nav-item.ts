export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  disabled?: boolean;
  children?: NavItem[];
  mega?: boolean;
  data?: any;
}
