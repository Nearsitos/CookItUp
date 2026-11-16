# API contract

The inventory API is implemented by the Express server. All routes are
same-origin under `/api`; the API currently uses the single prototype account
configured by `DEFAULT_USER_ID` and has no user authentication.

## Inventory item shape

```json
{
  "id": "101",
  "name": "Avocado",
  "category": "Produce",
  "storage": "fridge",
  "quantity": 2,
  "unit": "piece",
  "calories": 160,
  "servingSize": 100,
  "expiryDate": "2026-11-20"
}
```

`id` identifies an inventory batch. `storage` is `fridge`, `freezer`, `pantry`,
or `other`. `expiryDate` and `calories` may be `null`. Quantity must be
non-negative; serving size must be positive.

## Routes

| Method | Route | Behavior |
| --- | --- | --- |
| `GET` | `/api/inventory` | Return active inventory batches for the prototype user. |
| `POST` | `/api/inventory` | Create a food item and a batch; returns `201` and the created item. |
| `PUT` | `/api/inventory/:id` | Update provided fields; omitted fields keep their current values. |
| `DELETE` | `/api/inventory/:id` | Soft-delete the batch; returns `204`. |
| `GET` | `/api/health` | Return API and database status. |

Invalid bodies return `400` with a `details` array. Missing or already deleted
items return `404`. Calories are stored in the schema's `nutrition_value` table
using the seeded `Calories` nutrient. Batch deletion sets a deletion timestamp
so existing consumption records remain intact.

The frontend currently reads inventory from local starter data and browser
storage. Connecting that UI to these routes is a separate step.
