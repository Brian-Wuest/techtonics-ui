import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  Input,
  input,
  model,
  NgZone,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { TreeNode } from './tree-node.model';

type DropPosition = 'above' | 'inside' | 'below' | null;

interface FlatNode<T = any> {
  id: string | number;
  label: string;
  level: number;
  expandable: boolean;
  isExpanded: boolean;
  parent: TreeNode<T> | null;
  originalNode: TreeNode<T>;
}

interface HighlightPart {
  text: string;
  isMatch: boolean;
}

@Component({
  selector: 'ui-tree-view',
  standalone: true,
  imports: [NgTemplateOutlet, NgClass],
  templateUrl: './ui-tree-view.component.html',
  styleUrls: ['./ui-tree-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UITreeViewComponent<T = any> {
  private readonly zone = inject(NgZone);
  private readonly elementRef = inject(ElementRef);

  public readonly id = input<string>();
  public readonly multi = input(false);
  public readonly itemTemplate = input<TemplateRef<any> | null>(null);
  public readonly componentClass = input<string>();
  public readonly contentTemplate = contentChild<TemplateRef<any> | null>('item');
  public readonly useDragDrop = input(false);
  public readonly visible = input<boolean>(true);
  public readonly showSearch = input<boolean>(false);
  public readonly rowHeight = input<number>(36);
  public readonly searchPlaceholderText = input<string>('Search');

  public nodes = model<TreeNode<T>[]>([]);

  public readonly dragStart = output<TreeNode<T>>();
  public readonly dragOver = output<{
    target: TreeNode<T>;
    dragged: TreeNode<T>;
    position: DropPosition;
  }>();
  public readonly dragLeave = output<TreeNode<T>>();
  public readonly drop = output<{
    target: TreeNode<T>;
    dragged: TreeNode<T>;
    position: DropPosition;
  }>();

  @Input() public set selected(v: TreeNode<T>[] | TreeNode<T> | null) {
    if (Array.isArray(v)) this.selection.set(v);
    else if (v) this.selection.set([v]);
    else this.selection.set([]);
  }

  public readonly selectedChange = output<TreeNode<T>[]>();

  private expandTimeoutId: any = null;
  private draggedNodeId: string | number | null = null;
  private typeBuffer = '';
  private typeTimeout: any;
  private readonly viewport = viewChild<ElementRef<HTMLDivElement>>('viewport');

  protected internalSearchQuery = signal<string>('');
  protected treeInvalidDropTargetId = signal<string | number | null>(null);
  protected expandedNodeIds = signal<Set<string | number>>(new Set());
  protected selection = signal<TreeNode<T>[]>([]);
  protected focusedNodeId = signal<string | number | null>(null);
  protected dragOverNodeId = signal<string | number | null>(null);
  protected dragOverPosition = signal<DropPosition>(null);

  // Custom Virtual Scroll State Trackers
  scrollTop = signal<number>(0);

  // Updated responsively or set as base metric
  calculatedViewportHeight = signal<number>(400);
  viewportHeight = signal<number>(400);
  isFluidLayout = signal<boolean>(false);

  protected visibleFlatNodes = computed(() => {
    const rawSearch = this.internalSearchQuery().trim().toLowerCase();
    const expanded = this.expandedNodeIds();

    // Extract an exhaustive linear representation of the tree data.
    const masterFlatList: FlatNode<T>[] = [];
    const buildMasterList = (items: TreeNode<T>[], level: number, parent: TreeNode<T> | null) => {
      for (const item of items) {
        masterFlatList.push({
          id: item.id,
          label: item.label,
          level,
          expandable: !!(item.children && item.children.length),
          isExpanded: expanded.has(item.id),
          parent,
          originalNode: item,
        });
        if (item.children?.length) {
          buildMasterList(item.children, level + 1, item);
        }
      }
    };
    buildMasterList(this.nodes(), 0, null);

    // If no search filter is active, filter linearly by expansion states
    if (!rawSearch) {
      const activeList: FlatNode<T>[] = [];
      const visibleParentIds = new Set<string | number>();

      for (const node of masterFlatList) {
        // Root items are always visible. Children are visible if their parent is visible and expanded.
        if (node.level === 0 || (node.parent && visibleParentIds.has(node.parent.id) && expanded.has(node.parent.id))) {
          activeList.push(node);
          visibleParentIds.add(node.id);
        }
      }
      return activeList;
    }

    // Fuzzy matching evaluation check function
    const fuzzyMatch = (text: string, query: string): boolean => {
      let queryIdx = 0;
      const cleanText = text.toLowerCase();
      for (let i = 0; i < cleanText.length && queryIdx < query.length; i++) {
        if (cleanText[i] === query[queryIdx]) queryIdx++;
      }
      return queryIdx === query.length;
    };

    // Second Pass: Find explicitly matching items and track their ancestral chains
    const matchingIds = new Set<string | number>();
    const keepIds = new Set<string | number>();

    for (const node of masterFlatList) {
      if (fuzzyMatch(node.label, rawSearch)) {
        matchingIds.add(node.id);
        keepIds.add(node.id);

        // Walk up to preserve parent structures so matches are visible in context
        let currentParent = node.parent;
        while (currentParent) {
          keepIds.add(currentParent.id);
          // Auto-expand ancestral containers to reveal the search hit
          expanded.add(currentParent.id);
          currentParent = masterFlatList.find((f) => f.id === currentParent!.id)?.parent || null;
        }
      }
    }

    // Filter down to rows matching the criteria
    return masterFlatList.filter((node) => keepIds.has(node.id));
  });

  // Native Zero-Dependency Virtual Scroll Recycling Slicer
  protected virtualRenderState = computed(() => {
    const nodes = this.visibleFlatNodes();
    const sTop = this.scrollTop();
    const vHeight = this.isFluidLayout() ? this.calculatedViewportHeight() : this.viewportHeight();

    const rHeight = this.rowHeight();

    const totalCount = nodes.length;
    const totalHeight = totalCount * rHeight;

    // Determine slice range boundaries with padding buffer blocks to prevent white-flash row pops
    const bufferCount = 4;
    const startIndex = Math.max(0, Math.floor(sTop / rHeight) - bufferCount);
    const endIndex = Math.min(totalCount, Math.ceil((sTop + vHeight) / rHeight) + bufferCount);

    // Map each item alongside its index so the loop can set 'top' cleanly
    const renderedNodes = nodes.slice(startIndex, endIndex).map((node, index) => ({
      node,
      virtualIndex: startIndex + index, // ◄ This maps the correct index position multiplier
    }));

    return {
      renderedNodes,
      totalHeight,
    };
  });

  protected templateToRender = computed(() => {
    let result = this.itemTemplate() || this.contentTemplate();

    if (result == undefined) {
      return null;
    }

    return result;
  });

  constructor() {
    effect((onCleanup) => {
      const hostEl = this.elementRef.nativeElement as HTMLElement;
      if (!hostEl) return;

      const runHeightEvaluation = () => {
        const parentEl = hostEl.parentElement;
        if (!parentEl) return;

        const setParentHeight = parentEl.style.height;
        const parentStyle = window.getComputedStyle(parentEl);

        // Use the actual parent height instead of the calculated one
        // Note for Agent: This is the critical fix since using the `computed value`
        // for an element that had a height of '' or 'auto' when computed had a specific
        // height set which brok the below calculations entirely!
        const parentHeight = setParentHeight;
        const isParentFlex = parentStyle.display === 'flex' || parentStyle.display === 'inline-flex';

        const parsedParentHeight = parseFloat(parentHeight || '0');
        // A fixed parent has an explicit height constraint assigned by the application
        const isFixedParent = !parentHeight.includes('auto') && parsedParentHeight > 0;
        const searchOffset = this.showSearch() ? 45 : 0;

        this.zone.run(() => {
          if (isFixedParent) {
            this.isFluidLayout.set(false); // Constrain height to prevent spillover

            if (isParentFlex) {
              // Example 2 (Small Flex Box): Match flexbox layout space
              const viewportEl = this.viewport()?.nativeElement;
              this.calculatedViewportHeight.set(viewportEl?.clientHeight || 200);
            } else {
              // Example 3 (Fixed Block Layout): Calculate space remaining below sibling headers
              const parentRect = parentEl.getBoundingClientRect();
              const hostRect = hostEl.getBoundingClientRect();
              const paddingBottom = parseFloat(parentStyle.paddingBottom || '0');

              const remainingPixels = parentRect.bottom - hostRect.top - paddingBottom - searchOffset;
              this.calculatedViewportHeight.set(Math.max(60, remainingPixels - 2));
            }
          } else {
            // Example 1 (Fluid Block Stream): Parent has no height limits
            this.isFluidLayout.set(true); // Tell template to let CSS height:auto run fluidly

            // Still calculate viewport height so our virtual scrolling window knows how many rows to render on screen
            const viewportCeilingHeight = window.innerHeight * 0.75;
            const totalItemsCount = this.visibleFlatNodes().length;
            const idealContentHeight = totalItemsCount * this.rowHeight();

            this.calculatedViewportHeight.set(Math.min(idealContentHeight, viewportCeilingHeight));
          }
        });
      };

      const parentEl = hostEl.parentElement;
      if (parentEl) {
        const observer = new ResizeObserver(() => runHeightEvaluation());
        observer.observe(parentEl);
        observer.observe(hostEl);

        onCleanup(() => observer.disconnect());
      }

      setTimeout(() => runHeightEvaluation(), 0);
    });
  }

  // Fuzzy Match Highlight Parser
  getHighlightedParts(label: string): HighlightPart[] {
    const query = this.internalSearchQuery().trim().toLowerCase();
    if (!query) return [{ text: label, isMatch: false }];

    const parts: HighlightPart[] = [];
    let queryIdx = 0;
    let currentSegment = '';

    // Walk string character by character to map exactly where letter matches hit sequentially
    for (let i = 0; i < label.length; i++) {
      const char = label[i];
      if (queryIdx < query.length && char.toLowerCase() === query[queryIdx]) {
        if (currentSegment) {
          parts.push({ text: currentSegment, isMatch: false });
          currentSegment = '';
        }
        parts.push({ text: char, isMatch: true });
        queryIdx++;
      } else {
        currentSegment += char;
      }
    }
    if (currentSegment) {
      parts.push({ text: currentSegment, isMatch: false });
    }

    return parts;
  }

  // Scroller monitoring pipeline callback hook
  protected onViewportScroll(event: Event) {
    const target = event.currentTarget as HTMLDivElement;
    this.scrollTop.set(target.scrollTop);
  }

  protected onSearchInput(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    this.internalSearchQuery.set(inputEl.value);

    // Snaps viewport back up to the top row when active dataset query modifications fire
    const viewDiv = this.viewport()?.nativeElement;
    if (viewDiv) viewDiv.scrollTop = 0;
  }

  protected toggleExpand(nodeId: string | number) {
    const set = new Set(this.expandedNodeIds());
    if (set.has(nodeId)) set.delete(nodeId);
    else set.add(nodeId);
    this.expandedNodeIds.set(set);
  }

  protected isExpanded(node: TreeNode<T>) {
    return this.expandedNodeIds().has(node.id);
  }

  protected isSelected(nodeId: string | number) {
    return this.selection().some((n) => n.id === nodeId);
  }

  trackById = (_: number, item: { node: FlatNode<T>; virtualIndex: number }) => item.node.id;

  protected toggleSelect(node: TreeNode<T>) {
    if (this.multi()) {
      const exists = this.isSelected(node.id);
      const next = exists ? this.selection().filter((n) => n.id !== node.id) : [...this.selection(), node];
      this.selection.set(next);
      this.selectedChange.emit(next);
    } else {
      const next = [node];
      this.selection.set(next);
      this.selectedChange.emit(next);
    }
  }

  protected onKeydown(event: KeyboardEvent) {
    const nodes = this.visibleFlatNodes();
    if (!nodes.length) return;

    const currentIndex = nodes.findIndex((n) => n.id === this.focusedNodeId());

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < nodes.length - 1) {
          this.focusNode(nodes[currentIndex + 1]);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          this.focusNode(nodes[currentIndex - 1]);
        }
        break;

      case 'ArrowRight':
        event.preventDefault();
        this.handleArrowRight(nodes[currentIndex]);
        break;

      case 'ArrowLeft':
        event.preventDefault();
        this.handleArrowLeft(nodes[currentIndex]);
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleSelect(nodes[currentIndex]);
        break;

      case 'Home':
        event.preventDefault();
        this.focusNode(nodes[0]);
        break;

      case 'End':
        event.preventDefault();
        this.focusNode(nodes[nodes.length - 1]);
        break;

      default:
        this.handleTypeAhead(event.key);
        break;
    }
  }

  protected focusNode(node: TreeNode<T>) {
    this.focusedNodeId.set(node.id);
    const el = document.getElementById(`tree-node-${node.id}`);
    el?.scrollIntoView({ block: 'nearest' });
  }

  protected handleArrowRight(node: TreeNode<T>) {
    if (node.children?.length && !this.isExpanded(node)) {
      this.toggleExpand(node.id);
    } else if (node.children?.length) {
      // Move to first child
      this.focusNode(node.children[0]);
    }
  }

  protected handleArrowLeft(node: TreeNode<T>) {
    if (node.children?.length && this.isExpanded(node)) {
      this.toggleExpand(node.id);
      return;
    }

    // Move to parent
    const parent = this.findParent(this.nodes(), node);
    if (parent) this.focusNode(parent);
  }

  protected handleTypeAhead(char: string) {
    if (!/^[a-z0-9]$/i.test(char)) return;

    clearTimeout(this.typeTimeout);
    this.typeTimeout = setTimeout(() => (this.typeBuffer = ''), 500);

    this.typeBuffer += char.toLowerCase();

    const match = this.visibleFlatNodes().find((n) => n.label.toLowerCase().startsWith(this.typeBuffer));

    if (match) this.focusNode(match);
  }

  private findParent(nodes: TreeNode<T>[], target: TreeNode<T>): TreeNode<T> | null {
    for (const n of nodes) {
      if (n.children?.some((c) => c.id === target.id)) return n;
      if (n.children) {
        const found = this.findParent(n.children, target);
        if (found) return found;
      }
    }
    return null;
  }

  protected onDragStart(flatNode: FlatNode<T>, event: DragEvent) {
    if (!this.useDragDrop()) return;
    this.draggedNodeId = flatNode.id;
    this.dragStart.emit(flatNode.originalNode);
    event.dataTransfer?.setData('text/plain', String(flatNode.id));
  }

  protected onDragOver(flatNode: FlatNode<T>, event: DragEvent) {
    if (!this.useDragDrop()) return;
    event.preventDefault(); // Required to allow dropping

    if (this.draggedNodeId === flatNode.id) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none'; // Native block cursor
      }

      return;
    }

    // Safety check: Prevent dropping a parent into its own children nested down the line
    if (this.isTargetDescendantOfDragged(this.draggedNodeId, flatNode)) {
      if (event.dataTransfer) {
        // Native block cursor
        event.dataTransfer.dropEffect = 'none';
      }

      // Triggers custom UI warning styles
      this.treeInvalidDropTargetId.set(flatNode.id);
      this.dragOverNodeId.set(null);
      this.dragOverPosition.set(null);

      return;
    }

    // Reset validation tracker if it's a valid target row
    this.treeInvalidDropTargetId.set(null);

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const offsetX = event.clientX - rect.left;

    const third = rect.height / 3;
    let position: DropPosition = 'inside';

    if (offsetY < third) {
      position = 'above';
    } else if (offsetY > third * 2) {
      position = 'below';
    }

    // OUT-DENTING LOGIC: If moving significantly to the left while dragging below,
    // intercept it and treat it as a request to become a sibling of the parent or grandparent.
    if (position === 'below' && offsetX < 10) {
      // Intentionally pass an identifier signal up
      position = 'below';
    }

    if (event.dataTransfer) {
      // Standard cursor indicating a valid move operation
      event.dataTransfer.dropEffect = 'move';
    }

    this.dragOverNodeId.set(flatNode.id);
    this.dragOverPosition.set(position);
    this.dragOver.emit({
      target: flatNode.originalNode,
      dragged: this.getDraggedNodeRef()!,
      position,
    });

    // Auto-expand if hovering "inside"
    if (position === 'inside' && flatNode.expandable && !flatNode.isExpanded) {
      if (!this.expandTimeoutId) {
        this.expandTimeoutId = setTimeout(() => {
          this.zone.run(() => {
            this.toggleExpand(flatNode.id);
            this.expandTimeoutId = null;
          });
        }, 500);
      }
    }
  }

  protected onDragLeave() {
    this.dragOverNodeId.set(null);
    this.treeInvalidDropTargetId.set(null);

    if (this.expandTimeoutId) {
      clearTimeout(this.expandTimeoutId);
      this.expandTimeoutId = null;
    }
  }

  protected onDrop(targetFlatNode: FlatNode<T>, event: DragEvent) {
    if (!this.useDragDrop()) return;
    event.preventDefault();

    const position = this.dragOverPosition();
    if (!this.draggedNodeId || !position || this.draggedNodeId === targetFlatNode.id) {
      this.cleanupDragState();
      return;
    }

    // 1. Working on a cloned copy of the source tree
    const treeCopy = JSON.parse(JSON.stringify(this.nodes())) as TreeNode<T>[];
    let movingNode: TreeNode<T> | null = null;

    // 2. Remove the node from its origin location anywhere in the global structure
    const removeNode = (list: TreeNode<T>[]): boolean => {
      const idx = list.findIndex((n) => String(n.id) === String(this.draggedNodeId));
      if (idx !== -1) {
        movingNode = list.splice(idx, 1)[0];
        return true;
      }
      for (const n of list) {
        if (n.children && removeNode(n.children)) return true;
      }
      return false;
    };

    // 3. Re-inject the node relative to the targeted destination record
    const insertNode = (list: TreeNode<T>[]): boolean => {
      const idx = list.findIndex((n) => String(n.id) === String(targetFlatNode.id));
      if (idx !== -1 && movingNode) {
        if (position === 'above') list.splice(idx, 0, movingNode);
        else if (position === 'below') list.splice(idx + 1, 0, movingNode);
        else if (position === 'inside') {
          list[idx].children = list[idx].children || [];
          list[idx].children!.push(movingNode);
        }
        return true;
      }
      for (const n of list) {
        if (n.children && insertNode(n.children)) return true;
      }
      return false;
    };

    removeNode(treeCopy);
    if (movingNode) {
      insertNode(treeCopy);
      this.nodes.set(treeCopy); // Emits updated data directly back to consumer!
      this.drop.emit({ target: targetFlatNode.originalNode, dragged: movingNode, position });
    }

    this.cleanupDragState();
  }

  private isTargetDescendantOfDragged(draggedId: string | number | null, targetFlat: FlatNode): boolean {
    if (!draggedId) return false;
    let currentParent = targetFlat.parent;
    while (currentParent) {
      if (currentParent.id === draggedId) return true;
      // Trace up the flat node map to look up grandparent links
      const foundParentFlat = this.visibleFlatNodes().find((f) => f.id === currentParent!.id);
      currentParent = foundParentFlat ? foundParentFlat.parent : null;
    }
    return false;
  }

  private getDraggedNodeRef(): TreeNode<T> | null {
    return this.visibleFlatNodes().find((f) => f.id === this.draggedNodeId)?.originalNode || null;
  }

  private cleanupDragState() {
    this.dragOverNodeId.set(null);
    this.dragOverPosition.set(null);
    this.draggedNodeId = null;
    if (this.expandTimeoutId) {
      clearTimeout(this.expandTimeoutId);
      this.expandTimeoutId = null;
    }
  }

  //#region public api

  /**
   * Programmatically selects a node by ID and automatically expands all of its parent chains
   */
  public selectAndRevealNodeById(targetId: string | number) {
    const allFlatNodes = this.visibleFlatNodes();

    // Find the target node in our computed flat layout registry
    const targetFlat = allFlatNodes.find((n) => n.id === targetId);
    if (!targetFlat) return;

    const parentIdsToExpand = new Set<string | number>();
    let currentParent = targetFlat.parent;

    // Climb the ancestor tree ladder to collect parent keys
    while (currentParent) {
      parentIdsToExpand.add(currentParent.id);
      const foundParentFlat = allFlatNodes.find((f) => f.id === currentParent!.id);
      currentParent = foundParentFlat ? foundParentFlat.parent : null;
    }

    // Merge new parent IDs into our active expansion signal layout
    if (parentIdsToExpand.size > 0) {
      const workingSet = new Set(this.expandedNodeIds());
      parentIdsToExpand.forEach((id) => workingSet.add(id));
      this.expandedNodeIds.set(workingSet);
    }

    // Mark the record selected
    this.toggleSelect(targetFlat.originalNode);
  }

  /**
   * Calculates the total count of nested descendants under a given node
   */
  public getDescendantCount(node: TreeNode<T>): number {
    let count = 0;

    const traverse = (items: TreeNode<T>[]) => {
      for (const item of items) {
        count++;
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    };

    if (node.children && node.children.length > 0) {
      traverse(node.children);
    }

    return count;
  }

  //#endregion
}
