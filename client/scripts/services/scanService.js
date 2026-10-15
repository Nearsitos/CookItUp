// client/js/services/scanService.js
const USE_MOCK = true; // flip to false when the backend exists

export async function getscan() {
  if (USE_MOCK) {
    const res = await fetch('./mock-data/scan.json');
    return res.json();
  }
  const res = await fetch('/api/scan');
  return res.json();
}

export async function addItem(item) {
  if (USE_MOCK) {
    // update in-memory state only
    return { ...item, id: crypto.randomUUID() };
  }
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}