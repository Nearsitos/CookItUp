import { randomUUID } from 'node:crypto';

const seedInventory = [
  {
    id: 'food-1',
    name: 'Avocado',
    quantity: 2,
    unit: 'piece',
    expiry_date: '2026-11-05',
    category: 'produce',
    barcode: null,
  },
  {
    id: 'food-2',
    name: 'Baby spinach',
    quantity: 1,
    unit: 'bag',
    expiry_date: '2026-11-04',
    category: 'produce',
    barcode: null,
  },
  {
    id: 'food-3',
    name: 'Eggs',
    quantity: 6,
    unit: 'piece',
    expiry_date: '2026-11-20',
    category: 'dairy',
    barcode: null,
  },
];

export function createInventoryStore(initialItems = seedInventory) {
  const items = structuredClone(initialItems);

  return {
    list() {
      return structuredClone(items);
    },

    findById(id) {
      const item = items.find((candidate) => candidate.id === id);
      return item ? structuredClone(item) : undefined;
    },

    create(item) {
      const created = { id: randomUUID(), ...item };
      items.push(created);
      return structuredClone(created);
    },

    update(id, changes) {
      const index = items.findIndex((candidate) => candidate.id === id);
      if (index === -1) return undefined;

      items[index] = { ...items[index], ...changes, id };
      return structuredClone(items[index]);
    },

    remove(id) {
      const index = items.findIndex((candidate) => candidate.id === id);
      if (index === -1) return false;

      items.splice(index, 1);
      return true;
    },
  };
}
