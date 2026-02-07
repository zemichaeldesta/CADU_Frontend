/**
 * Category tree building utilities
 * Used for building hierarchical category structures from flat category lists
 */

export interface CategoryNode<T = any> {
  id: number;
  name_en?: string;
  name_am?: string;
  parent?: number | null;
  order?: number;
  children: CategoryNode<T>[];
  [key: string]: any;
}

/**
 * Builds a hierarchical category tree from a flat list of categories
 * @param items - Flat list of categories
 * @param sortByOrder - Whether to sort by order field (default: false, sorts by name)
 * @returns Array of root category nodes with children populated
 */
export const buildCategoryTree = <T extends { id: number; parent?: number | null; order?: number; name_en?: string }>(
  items: T[],
  sortByOrder: boolean = false
): CategoryNode<T>[] => {
  const lookup = new Map<number, CategoryNode<T>>();
  
  // Create nodes
  items.forEach((cat) => {
    lookup.set(cat.id, { ...cat, children: [] } as CategoryNode<T>);
  });

  const roots: CategoryNode<T>[] = [];

  // Build parent-child relationships
  lookup.forEach((node) => {
    const parentId = typeof node.parent === 'number' ? node.parent : null;
    if (parentId !== null && lookup.has(parentId)) {
      lookup.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort nodes
  const sortNodes = (nodes: CategoryNode<T>[]) => {
    nodes.sort((a, b) => {
      if (sortByOrder) {
        const aOrder = a.order ?? 0;
        const bOrder = b.order ?? 0;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
      } else {
        // Folders with subcategories come first, then regular folders
        const aHasChildren = a.children.length > 0;
        const bHasChildren = b.children.length > 0;
        if (aHasChildren !== bHasChildren) {
          return aHasChildren ? -1 : 1;
        }
      }
      
      return (a.name_en || '').localeCompare(b.name_en || '');
    });
    nodes.forEach((child) => sortNodes(child.children));
  };

  sortNodes(roots);
  return roots;
};

