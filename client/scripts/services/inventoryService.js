// client/js/services/inventoryService.js
const USE_MOCK = true; // flip to false when the backend exists

export async function getInventory() {
  if (USE_MOCK) {
    const res = await fetch('./mock-data/inventory.json');
    return res.json();
  }
  const res = await fetch('/api/inventory');
  return res.json();
}

export async function addItem(item) {
  if (USE_MOCK) {
    // update in-memory state only
    return { ...item, id: crypto.randomUUID() };
  }
  const res = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}