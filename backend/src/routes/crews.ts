import { Express, Request, Response } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export function setupCrewRoutes(app: Express) {
  // GET all crews
  app.get('/api/crews', async (req: Request, res: Response) => {
    try {
      const result = await query('SELECT * FROM crews ORDER BY created_at DESC');
      res.json({ crews: result.rows });
    } catch (error) {
      throw new AppError(500, 'Failed to fetch crews', error);
    }
  });

  // GET single crew
  app.get('/api/crews/:id', async (req: Request, res: Response) => {
    try {
      const result = await query('SELECT * FROM crews WHERE id = $1', [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        throw new AppError(404, 'Crew not found');
      }
      res.json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to fetch crew', error);
    }
  });

  // POST create crew
  app.post('/api/crews', async (req: Request, res: Response) => {
    try {
      const {
        name,
        leadPerson,
        skills,
        serviceAreas,
        capacity,
        phone,
        email,
      } = req.body;

      if (!name || !leadPerson || !phone) {
        throw new AppError(
          400,
          'Missing required fields: name, leadPerson, phone'
        );
      }

      const crewId = uuidv4();
      const result = await query(
        `INSERT INTO crews (id, name, lead_person, skills, service_areas, capacity, phone, email, avg_rating, jobs_completed_this_month, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING *`,
        [
          crewId,
          name,
          leadPerson,
          skills || [],
          serviceAreas || [],
          capacity || 5,
          phone,
          email || null,
          0,
          0,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to create crew', error);
    }
  });

  // PUT update crew
  app.put('/api/crews/:id', async (req: Request, res: Response) => {
    try {
      const {
        name,
        leadPerson,
        skills,
        serviceAreas,
        capacity,
        phone,
        email,
        avgRating,
      } = req.body;

      const result = await query(
        `UPDATE crews 
         SET name = COALESCE($1, name),
             lead_person = COALESCE($2, lead_person),
             skills = COALESCE($3, skills),
             service_areas = COALESCE($4, service_areas),
             capacity = COALESCE($5, capacity),
             phone = COALESCE($6, phone),
             email = COALESCE($7, email),
             avg_rating = COALESCE($8, avg_rating),
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          name,
          leadPerson,
          skills,
          serviceAreas,
          capacity,
          phone,
          email,
          avgRating,
          req.params.id,
        ]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'Crew not found');
      }

      res.json(result.rows[0]);
    } catch (error) {
      throw new AppError(500, 'Failed to update crew', error);
    }
  });

  // DELETE crew
  app.delete('/api/crews/:id', async (req: Request, res: Response) => {
    try {
      const result = await query('DELETE FROM crews WHERE id = $1 RETURNING *', [
        req.params.id,
      ]);

      if (result.rows.length === 0) {
        throw new AppError(404, 'Crew not found');
      }

      res.json({ message: 'Crew deleted', crew: result.rows[0] });
    } catch (error) {
      throw new AppError(500, 'Failed to delete crew', error);
    }
  });
}