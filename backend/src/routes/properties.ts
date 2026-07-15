import { Express, Request, Response } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export function setupPropertyRoutes(app: Express) {
  // GET all properties
  app.get('/api/properties', async (req: Request, res: Response) => {
    try {
      const result = await query(
        'SELECT * FROM properties ORDER BY created_at DESC'
      );
      res.json({ properties: result.rows });
    } catch (error: any) {
      console.error('FETCH PROPERTIES ERROR:', error);
      res.status(500).json({ error: 'Failed to fetch properties', details: error.message });
    }
  });

  // GET single property
  app.get('/api/properties/:id', async (req: Request, res: Response) => {
    try {
      const result = await query('SELECT * FROM properties WHERE id = $1', [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('FETCH PROPERTY ERROR:', error);
      res.status(500).json({ error: 'Failed to fetch property', details: error.message });
    }
  });

  // POST create property
  app.post('/api/properties', async (req: Request, res: Response) => {
    try {
      const {
        contactId,
        address,
        city,
        province,
        postalCode,
        notes,
      } = req.body;

      if (!contactId || !address || !city) {
        return res.status(400).json({
          error: 'Missing required fields: contactId, address, city',
        });
      }

      const propertyId = uuidv4();
      const result = await query(
        `INSERT INTO properties (id, contact_id, address, city, province, postal_code, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          propertyId,
          contactId,
          address,
          city,
          province || null,
          postalCode || null,
          notes || '',
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('CREATE PROPERTY ERROR:', error);
      res.status(500).json({ error: 'Failed to create property', details: error.message });
    }
  });

  // PUT update property
  app.put('/api/properties/:id', async (req: Request, res: Response) => {
    try {
      const {
        address,
        city,
        province,
        postalCode,
        notes,
      } = req.body;

      const result = await query(
        `UPDATE properties 
         SET address = COALESCE($1, address),
             city = COALESCE($2, city),
             province = COALESCE($3, province),
             postal_code = COALESCE($4, postal_code),
             notes = COALESCE($5, notes),
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [address, city, province, postalCode, notes, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('UPDATE PROPERTY ERROR:', error);
      res.status(500).json({ error: 'Failed to update property', details: error.message });
    }
  });

  // DELETE property
  app.delete('/api/properties/:id', async (req: Request, res: Response) => {
    try {
      const result = await query(
        'DELETE FROM properties WHERE id = $1 RETURNING *',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }

      res.json({ message: 'Property deleted', property: result.rows[0] });
    } catch (error: any) {
      console.error('DELETE PROPERTY ERROR:', error);
      res.status(500).json({ error: 'Failed to delete property', details: error.message });
    }
  });
}