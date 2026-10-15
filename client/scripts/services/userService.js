// client/js/services/userService.js
const USE_MOCK = true; // flip to false when the backend exists

export async function getuser() {
  if (USE_MOCK) {
    const res = await fetch('./mock-data/user.json');
    return res.json();
  }
  const res = await fetch('/api/user');
  return res.json();
}

export async function addItem(item) {
  if (USE_MOCK) {
    // update in-memory state only
    return { ...item, id: crypto.randomUUID() };
  }
  const res = await fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}