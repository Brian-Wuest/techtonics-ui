export interface TreeNode<T = any> {
  id: string | number;
  label: string;
  data?: T;
  children?: TreeNode<T>[];
}
