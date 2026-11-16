import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();
const userId = Number(process.env.DEFAULT_USER_ID || 1);
const storageLocations = new Set(['fridge', 'freezer', 'pantry', 'other']);

const itemQuery = `
  SELECT b.inventory_batch_id AS id,
         f.name,
         f.food_item_type AS category,
         b.storage_location AS storage,
         b.remaining_servings AS quantity,
         f.serving_unit AS unit,
         f.serving_quantity AS servingSize,
         b.expiration_date AS expiryDate,
         nv.amount AS calories
  FROM inventory_batch b
  JOIN food_item f ON f.food_item_id = b.food_item_id
  LEFT JOIN nutrient n ON n.name = 'Calories'
  LEFT JOIN nutrition_value nv ON nv.food_item_id = f.food_item_id AND nv.nutrient_id = n.nutrient_id
  WHERE b.user_id = ? AND b.deleted_at IS NULL`;

function present(row) {
  return {
    ...row,
    id: String(row.id),
    quantity: Number(row.quantity),
    servingSize: Number(row.servingSize),
    calories: row.calories === null ? null : Number(row.calories),
    expiryDate: row.expiryDate || null,
  };
}

function validDate(value) {
  if (value === null || value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validate(body) {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const storage = body.storage || 'other';
  const quantity = Number(body.quantity);
  const servingSize = body.servingSize == null || body.servingSize === '' ? 1 : Number(body.servingSize);
  const calories = body.calories == null || body.calories === '' ? null : Number(body.calories);
  const unit = typeof body.unit === 'string' && body.unit.trim() ? body.unit.trim() : 'qty';
  const expiryDate = body.expiryDate || null;

  if (!name || name.length > 255) errors.push('name must contain 1 to 255 characters');
  if (category.length > 50) errors.push('category must be at most 50 characters');
  if (!storageLocations.has(storage)) errors.push('storage must be fridge, freezer, pantry, or other');
  if (!Number.isFinite(quantity) || quantity < 0) errors.push('quantity must be a non-negative number');
  if (!Number.isFinite(servingSize) || servingSize <= 0) errors.push('servingSize must be a positive number');
  if (calories !== null && (!Number.isFinite(calories) || calories < 0)) errors.push('calories must be a non-negative number');
  if (unit.length > 50) errors.push('unit must be at most 50 characters');
  if (!validDate(expiryDate)) errors.push('expiryDate must be a valid YYYY-MM-DD date or null');

  return {
    errors,
    value: {
      name,
      category: category || 'Other',
      storage,
      quantity,
      servingSize,
      calories,
      unit,
      expiryDate,
      servingDescription: `${servingSize} ${unit}`,
    },
  };
}

async function setCalories(connection, foodItemId, calories) {
  if (calories === null) {
    await connection.execute(
      `DELETE nv FROM nutrition_value nv
       JOIN nutrient n ON n.nutrient_id = nv.nutrient_id
       WHERE nv.food_item_id = ? AND n.name = 'Calories'`,
      [foodItemId],
    );
    return;
  }

  await connection.execute(
    `INSERT INTO nutrition_value (food_item_id, nutrient_id, amount)
     SELECT ?, nutrient_id, ? FROM nutrient WHERE name = 'Calories'
     ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
    [foodItemId, calories],
  );
}

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`${itemQuery} ORDER BY b.expiration_date IS NULL, b.expiration_date, f.name`, [userId]);
    res.json(rows.map(present));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const { errors, value } = validate(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Invalid inventory item', details: errors });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [foodResult] = await connection.execute(
      `INSERT INTO food_item
         (name, food_item_type, creator_user_id, visibility, serving_description,
          serving_quantity, serving_unit, standardized_quantity, standardized_unit)
       VALUES (?, ?, ?, 'Private', ?, ?, ?, ?, ?)`,
      [value.name, value.category, userId, value.servingDescription, value.servingSize, value.unit, value.servingSize, value.unit],
    );
    const foodItemId = foodResult.insertId;
    await setCalories(connection, foodItemId, value.calories);
    const [batchResult] = await connection.execute(
      `INSERT INTO inventory_batch
         (user_id, food_item_id, container_quantity, original_servings, remaining_servings,
          expiration_date, source_type, storage_location)
       VALUES (?, ?, ?, ?, ?, ?, 'manual', ?)`,
      [userId, foodItemId, value.quantity, value.quantity, value.quantity, value.expiryDate, value.storage],
    );
    await connection.commit();
    const [rows] = await pool.execute(`${itemQuery} AND b.inventory_batch_id = ?`, [userId, batchResult.insertId]);
    res.status(201).json(present(rows[0]));
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.put('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'id must be a positive integer' });

  const connection = await pool.getConnection();
  try {
    const [currentRows] = await connection.execute(
      `SELECT f.food_item_id, f.name, f.food_item_type AS category, b.storage_location AS storage,
              b.remaining_servings AS quantity, f.serving_unit AS unit,
              f.serving_quantity AS servingSize, b.expiration_date AS expiryDate,
              nv.amount AS calories
       FROM inventory_batch b
       JOIN food_item f ON f.food_item_id = b.food_item_id
       LEFT JOIN nutrient n ON n.name = 'Calories'
       LEFT JOIN nutrition_value nv ON nv.food_item_id = f.food_item_id AND nv.nutrient_id = n.nutrient_id
       WHERE b.user_id = ? AND b.inventory_batch_id = ? AND b.deleted_at IS NULL`,
      [userId, id],
    );
    if (!currentRows.length) return res.status(404).json({ error: 'Inventory item not found' });

    const current = currentRows[0];
    const body = req.body || {};
    const merged = {
      name: body.name ?? current.name,
      category: body.category ?? current.category,
      storage: body.storage ?? current.storage,
      quantity: body.quantity ?? current.quantity,
      servingSize: body.servingSize ?? current.servingSize,
      calories: Object.hasOwn(body, 'calories') ? body.calories : current.calories,
      unit: body.unit ?? current.unit,
      expiryDate: Object.hasOwn(body, 'expiryDate') ? body.expiryDate : current.expiryDate,
    };
    const { errors, value } = validate(merged);
    if (errors.length) return res.status(400).json({ error: 'Invalid inventory item', details: errors });

    await connection.beginTransaction();
    await connection.execute(
      `UPDATE food_item
       SET name = ?, food_item_type = ?, serving_description = ?, serving_quantity = ?,
           serving_unit = ?, standardized_quantity = ?, standardized_unit = ?
       WHERE food_item_id = ?`,
      [value.name, value.category, value.servingDescription, value.servingSize, value.unit, value.servingSize, value.unit, current.food_item_id],
    );
    await setCalories(connection, current.food_item_id, value.calories);
    await connection.execute(
      `UPDATE inventory_batch
       SET remaining_servings = ?, expiration_date = ?, storage_location = ?
       WHERE inventory_batch_id = ? AND user_id = ?`,
      [value.quantity, value.expiryDate, value.storage, id, userId],
    );
    await connection.commit();
    const [rows] = await pool.execute(`${itemQuery} AND b.inventory_batch_id = ?`, [userId, id]);
    res.json(present(rows[0]));
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'id must be a positive integer' });

  try {
    const [result] = await pool.execute(
      `UPDATE inventory_batch
       SET deleted_at = CURRENT_TIMESTAMP, remaining_servings = 0
       WHERE inventory_batch_id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Inventory item not found' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
