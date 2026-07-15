import { Express, Request, Response } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export function setupContactRoutes(app: Express) {
  // GET all contacts
  app.get('/api/contacts', async (req: Request, res: Response) => {
    try {
      const result = await query(
        'SELECT * FROM contacts ORDER BY created_at DESC'
      );
      res.json({ contacts: result.rows });
    } catch (error) {
      throw new AppError(500, 'Failed to fetch contacts', error);
    }
  });

  // GET single contact
  app.get('/api/contacts/:id', async (req: Request, res: Response) => {
    try {
      const result = await query('SELECT * FROM contacts WHERE id = $1', [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        throw new AppError(404, 'Contact not found');
      }
      res.json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to fetch contact', error);
    }
  });

  // POST create contact
  app.post('/api/contacts', async (req: Request, res: Response) => {
    try {
      const { name, email, phone, company, source, tags, notes } = req.body;

      if (!name || !email || !phone) {
        throw new AppError(400, 'Missing required fields: name, email, phone');
      }

      const contactId = uuidv4();
      const result = await query(
        `INSERT INTO contacts (id, name, email, phone, company, source, tags, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          contactId,
          name,
          email,
          phone,
          company || null,
          source || 'other',
          tags || [],
          notes || '',
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to create contact', error);
    }
  });

  // PUT update contact
  app.put('/api/contacts/:id', async (req: Request, res: Response) => {
    try {
      const { name, email, phone, company, source, tags, notes } = req.body;

      const result = await query(
        `UPDATE contacts 
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             phone = COALESCE($3, phone),
             company = COALESCE($4, company),
             source = COALESCE($5, source),
             tags = COALESCE($6, tags),
             notes = COALESCE($7, notes),
             updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [name, email, phone, company, source, tags, notes, req.params.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Contact not found');
      }

      res.json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to update contact', error);
    }
  });

  // DELETE contact
  app.delete('/api/contacts/:id', async (req: Request, res: Response) => {
    try {
      const result = await query(
        'DELETE FROM contacts WHERE id = $1 RETURNING *',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Contact not found');
      }

      res.json({ message: 'Contact deleted', contact: result.rows[0] });
    } catch (error) {
      throw new AppError(500, 'Failed to delete contact', error);
    }
  });
}