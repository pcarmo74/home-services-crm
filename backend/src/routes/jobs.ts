import { Express, Request, Response } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export function setupJobRoutes(app: Express) {
  // GET all jobs
  app.get('/api/jobs', async (req: Request, res: Response) => {
    try {
      const result = await query('SELECT * FROM jobs ORDER BY created_at DESC');
      res.json({ jobs: result.rows });
    } catch (error) {
      throw new AppError(500, 'Failed to fetch jobs', error);
    }
  });

  // GET single job
  app.get('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const result = await query('SELECT * FROM jobs WHERE id = $1', [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        throw new AppError(404, 'Job not found');
      }
      res.json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to fetch job', error);
    }
  });

  // POST create job
  app.post('/api/jobs', async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        serviceType,
        value,
        contactId,
        propertyId,
        priority,
      } = req.body;

      if (!title || !serviceType || !contactId || !propertyId) {
        throw new AppError(400, 'Missing required fields');
      }

      const jobId = uuidv4();
      const result = await query(
        `INSERT INTO jobs (id, title, description, service_type, value, stage, contact_id, property_id, priority, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [
          jobId,
          title,
          description || null,
          serviceType,
          value || 0,
          'new',
          contactId,
          propertyId,
          priority || 'routine',
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to create job', error);
    }
  });

  // PUT update job
  app.put('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const { title, description, serviceType, value, stage, priority } =
        req.body;

      const result = await query(
        `UPDATE jobs 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             service_type = COALESCE($3, service_type),
             value = COALESCE($4, value),
             stage = COALESCE($5, stage),
             priority = COALESCE($6, priority),
             updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [title, description, serviceType, value, stage, priority, req.params.id]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Job not found');
      }

      res.json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to update job', error);
    }
  });

  // DELETE job
  app.delete('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const result = await query('DELETE FROM jobs WHERE id = $1 RETURNING *', [
        req.params.id,
      ]);

      if (result.rows.length === 0) {
        throw new AppError(404, 'Job not found');
      }

      res.json({ message: 'Job deleted', job: result.rows[0] });
    } catch (error) {
      throw new AppError(500, 'Failed to delete job', error);
    }
  });
}