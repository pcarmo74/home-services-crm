import { Express, Request, Response } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export function setupInvoiceRoutes(app: Express) {
  // GET all invoices
  app.get('/api/invoices', async (req: Request, res: Response) => {
    try {
      const result = await query(
        'SELECT * FROM invoices ORDER BY created_at DESC'
      );
      res.json({ invoices: result.rows });
    } catch (error) {
      throw new AppError(500, 'Failed to fetch invoices', error);
    }
  });

  // GET single invoice
  app.get('/api/invoices/:id', async (req: Request, res: Response) => {
    try {
      const result = await query('SELECT * FROM invoices WHERE id = $1', [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        throw new AppError(404, 'Invoice not found');
      }
      res.json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to fetch invoice', error);
    }
  });

  // POST create invoice
  app.post('/api/invoices', async (req: Request, res: Response) => {
    try {
      const { jobId, contactId, amount, itemized, dueDate, notes } = req.body;

      if (!jobId || !contactId || !amount) {
        throw new AppError(
          400,
          'Missing required fields: jobId, contactId, amount'
        );
      }

      const invoiceId = uuidv4();
      const result = await query(
        `INSERT INTO invoices (id, job_id, contact_id, amount, itemized, status, due_date, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          invoiceId,
          jobId,
          contactId,
          amount,
          itemized || [],
          'draft',
          dueDate || null,
          notes || '',
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to create invoice', error);
    }
  });

  // PUT update invoice
  app.put('/api/invoices/:id', async (req: Request, res: Response) => {
    try {
      const { amount, status, dueDate, notes, paidDate } = req.body;

      const result = await query(
        `UPDATE invoices 
         SET amount = COALESCE($1, amount),
             status = COALESCE($2, status),
             due_date = COALESCE($3, due_date),
             paid_date = COALESCE($4, paid_date),
             notes = COALESCE($5, notes),
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [amount, status, dueDate, paidDate, notes, req.params.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Invoice not found');
      }

      res.json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to update invoice', error);
    }
  });

  // DELETE invoice
  app.delete('/api/invoices/:id', async (req: Request, res: Response) => {
    try {
      const result = await query(
        'DELETE FROM invoices WHERE id = $1 RETURNING *',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Invoice not found');
      }

      res.json({ message: 'Invoice deleted', invoice: result.rows[0] });
    } catch (error) {
      throw new AppError(500, 'Failed to delete invoice', error);
    }
  });
}