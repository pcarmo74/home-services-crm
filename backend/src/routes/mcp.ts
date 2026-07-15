import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';

const router = Router();

// ============================================================================
// HELPER: Log agent action to audit_log
// ============================================================================

async function logAgentAction(
  agentName: string,
  action: string,
  recordId: string,
  newValues: any
) {
  try {
    await query(
      `INSERT INTO audit_log (id, agent_name, action, record_id, new_values, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), agentName, action, recordId, JSON.stringify(newValues)]
    );
  } catch (error) {
    logger.error('Failed to log agent action:', error);
  }
}

// ============================================================================
// READ TOOLS (6)
// ============================================================================

/**
 * TOOL 1: list-jobs
 * Get jobs filtered by stage, crew, unassigned, priority
 */
router.post('/list-jobs', async (req: Request, res: Response) => {
  try {
    const { stage, crewId, unassignedOnly, priority, limit } = req.body;

    let sql = 'SELECT * FROM jobs WHERE 1=1';
    const params: any[] = [];

    if (stage) {
      sql += ` AND stage = $${params.length + 1}`;
      params.push(stage);
    }
    if (crewId) {
      sql += ` AND crew_id = $${params.length + 1}`;
      params.push(crewId);
    }
    if (unassignedOnly) {
      sql += ` AND crew_id IS NULL`;
    }
    if (priority) {
      sql += ` AND priority = $${params.length + 1}`;
      params.push(priority);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit || 50);

    const result = await query(sql, params);
    res.json({ jobs: result.rows, count: result.rows.length });
  } catch (error) {
    throw new AppError(500, 'Failed to list jobs', error);
  }
});

/**
 * TOOL 2: get-crew-availability
 * Get crew utilization (jobs today vs capacity)
 */
router.post('/get-crew-availability', async (req: Request, res: Response) => {
  try {
    const { crewId } = req.body;

    const result = await query(
      `SELECT 
        c.id, 
        c.name, 
        c.capacity,
        COUNT(j.id) as jobs_today,
        (c.capacity - COUNT(j.id)) as available_slots
       FROM crews c
       LEFT JOIN jobs j ON c.id = j.crew_id AND DATE(j.scheduled_date) = CURRENT_DATE
       ${crewId ? 'WHERE c.id = $1' : ''}
       GROUP BY c.id, c.name, c.capacity
       ORDER BY c.name`,
      crewId ? [crewId] : []
    );

    res.json({ crews: result.rows });
  } catch (error) {
    throw new AppError(500, 'Failed to get crew availability', error);
  }
});

/**
 * TOOL 3: get-incomplete-jobs
 * Get jobs that are complete but not invoiced
 */
router.post('/get-incomplete-jobs', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT j.*, c.name as contact_name, c.email, c.phone
       FROM jobs j
       LEFT JOIN contacts c ON j.contact_id = c.id
       WHERE j.stage IN ('complete', 'in_progress')
       AND j.invoice_id IS NULL
       ORDER BY j.completed_date DESC`
    );

    res.json({ jobs: result.rows, count: result.rows.length });
  } catch (error) {
    throw new AppError(500, 'Failed to get incomplete jobs', error);
  }
});

/**
 * TOOL 4: get-recently-completed-jobs
 * Get jobs completed in last N hours
 */
router.post('/get-recently-completed-jobs', async (req: Request, res: Response) => {
  try {
    const { hoursBack } = req.body;

    const result = await query(
      `SELECT j.*, c.name as contact_name
       FROM jobs j
       LEFT JOIN contacts c ON j.contact_id = c.id
       WHERE j.stage = 'complete'
       AND j.completed_date > NOW() - INTERVAL '1 hour' * $1
       ORDER BY j.completed_date DESC`,
      [hoursBack || 2]
    );

    res.json({ jobs: result.rows, count: result.rows.length });
  } catch (error) {
    throw new AppError(500, 'Failed to get recently completed jobs', error);
  }
});

/**
 * TOOL 5: get-crew-performance
 * Get crew metrics over date range
 */
router.post('/get-crew-performance', async (req: Request, res: Response) => {
  try {
    const { crewId, fromDate, toDate } = req.body;

    const result = await query(
      `SELECT 
        c.id,
        c.name,
        COUNT(j.id) as total_jobs,
        AVG(j.value) as avg_job_value,
        SUM(j.value) as total_revenue,
        c.avg_rating,
        COUNT(DISTINCT j.contact_id) as unique_customers
       FROM crews c
       LEFT JOIN jobs j ON c.id = j.crew_id 
         AND j.completed_date >= $1
         AND j.completed_date <= $2
       ${crewId ? 'WHERE c.id = $3' : ''}
       GROUP BY c.id, c.name, c.avg_rating`,
      crewId ? [fromDate, toDate, crewId] : [fromDate, toDate]
    );

    res.json({ performance: result.rows });
  } catch (error) {
    throw new AppError(500, 'Failed to get crew performance', error);
  }
});

/**
 * TOOL 6: get-invoicing-status
 * Get overdue/unpaid invoice summary
 */
router.post('/get-invoicing-status', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
       FROM invoices
       GROUP BY status
       ORDER BY status`
    );

    // Also get overdue
    const overdue = await query(
      `SELECT COUNT(*) as count, SUM(amount) as total
       FROM invoices
       WHERE status IN ('sent', 'unpaid')
       AND due_date < CURRENT_DATE`
    );

    res.json({
      invoicing: result.rows,
      overdue: overdue.rows[0],
    });
  } catch (error) {
    throw new AppError(500, 'Failed to get invoicing status', error);
  }
});

// ============================================================================
// WRITE TOOLS (9)
// ============================================================================

/**
 * TOOL 7: assign-crew
 * Assign crew to job, update stage to 'scheduled'
 */
router.post('/assign-crew', async (req: Request, res: Response) => {
  try {
    const { jobId, crewId, agentName } = req.body;

    if (!jobId || !crewId) {
      throw new AppError(400, 'Missing jobId or crewId');
    }

    const result = await query(
      `UPDATE jobs 
       SET crew_id = $1, stage = 'scheduled', updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [crewId, jobId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Job not found');
    }

    await logAgentAction(agentName || 'assign-crew', 'assign_crew', jobId, {
      crewId,
      stage: 'scheduled',
    });

    res.json({ job: result.rows[0], success: true });
  } catch (error) {
    throw new AppError(500, 'Failed to assign crew', error);
  }
});

/**
 * TOOL 8: update-job-stage
 * Move job through pipeline
 */
router.post('/update-job-stage', async (req: Request, res: Response) => {
  try {
    const { jobId, stage, agentName } = req.body;

    if (!jobId || !stage) {
      throw new AppError(400, 'Missing jobId or stage');
    }

    const result = await query(
      `UPDATE jobs 
       SET stage = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [stage, jobId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Job not found');
    }

    await logAgentAction(agentName || 'update-job-stage', 'update_stage', jobId, {
      stage,
    });

    res.json({ job: result.rows[0], success: true });
  } catch (error) {
    throw new AppError(500, 'Failed to update job stage', error);
  }
});

/**
 * TOOL 9: send-sms
 * Send SMS via Twilio (mocked for now, logged)
 */
router.post('/send-sms', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, message, agentName, jobId } = req.body;

    if (!phoneNumber || !message) {
      throw new AppError(400, 'Missing phoneNumber or message');
    }

    // TODO: Integrate Twilio here
    logger.info(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);

    await logAgentAction(agentName || 'send-sms', 'send_sms', jobId || 'n/a', {
      phoneNumber,
      messageSent: true,
    });

    res.json({ success: true, message: 'SMS sent (mocked)' });
  } catch (error) {
    throw new AppError(500, 'Failed to send SMS', error);
  }
});

/**
 * TOOL 10: generate-invoice
 * Create invoice for completed job
 */
router.post('/generate-invoice', async (req: Request, res: Response) => {
  try {
    const { jobId, agentName } = req.body;

    if (!jobId) {
      throw new AppError(400, 'Missing jobId');
    }

    // Get job details
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      throw new AppError(404, 'Job not found');
    }

    const job = jobResult.rows[0];
    const invoiceId = uuidv4();

    // Create invoice
    const invoiceResult = await query(
      `INSERT INTO invoices (id, job_id, contact_id, amount, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'draft', NOW(), NOW())
       RETURNING *`,
      [invoiceId, jobId, job.contact_id, job.value]
    );

    // Update job to mark as invoiced
    await query('UPDATE jobs SET invoice_id = $1, stage = $2 WHERE id = $3', [
      invoiceId,
      'invoiced',
      jobId,
    ]);

    await logAgentAction(agentName || 'generate-invoice', 'create_invoice', jobId, {
      invoiceId,
      amount: job.value,
    });

    res.json({ invoice: invoiceResult.rows[0], success: true });
  } catch (error) {
    throw new AppError(500, 'Failed to generate invoice', error);
  }
});

/**
 * TOOL 11: upload-photo
 * Add photo to job
 */
router.post('/upload-photo', async (req: Request, res: Response) => {
  try {
    const { jobId, photoUrl, caption, agentName } = req.body;

    if (!jobId || !photoUrl) {
      throw new AppError(400, 'Missing jobId or photoUrl');
    }

    const photoId = uuidv4();
    const result = await query(
      `INSERT INTO photos (id, job_id, url, caption, uploaded_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [photoId, jobId, photoUrl, caption || null]
    );

    await logAgentAction(agentName || 'upload-photo', 'upload_photo', jobId, {
      photoId,
      photoUrl,
    });

    res.json({ photo: result.rows[0], success: true });
  } catch (error) {
    throw new AppError(500, 'Failed to upload photo', error);
  }
});

/**
 * TOOL 12: create-job
 * Create new service job
 */
router.post('/create-job', async (req: Request, res: Response) => {
  try {
    const {
      title,
      serviceType,
      value,
      contactId,
      propertyId,
      priority,
      agentName,
    } = req.body;

    if (!title || !serviceType || !contactId || !propertyId) {
      throw new AppError(
        400,
        'Missing required: title, serviceType, contactId, propertyId'
      );
    }

    const jobId = uuidv4();
    const result = await query(
      `INSERT INTO jobs (id, title, service_type, value, stage, contact_id, property_id, priority, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'new', $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [jobId, title, serviceType, value || 0, contactId, propertyId, priority || 'routine']
    );

    await logAgentAction(agentName || 'create-job', 'create_job', jobId, {
      title,
      serviceType,
      value,
    });

    res.json({ job: result.rows[0], success: true });
  } catch (error) {
    throw new AppError(500, 'Failed to create job', error);
  }
});

/**
 * TOOL 13: send-customer-followup
 * Send SMS/email after service complete
 */
router.post('/send-customer-followup', async (req: Request, res: Response) => {
  try {
    const { jobId, contactId, message, channel, agentName } = req.body;

    if (!jobId || !contactId) {
      throw new AppError(400, 'Missing jobId or contactId');
    }

    // TODO: Send via SMS or email based on channel
    logger.info(
      `[FOLLOWUP] JobId: ${jobId}, Channel: ${channel}, Message: ${message}`
    );

    await logAgentAction(agentName || 'send-followup', 'send_followup', jobId, {
      contactId,
      channel,
    });

    res.json({ success: true, message: 'Follow-up sent' });
  } catch (error) {
    throw new AppError(500, 'Failed to send follow-up', error);
  }
});

/**
 * TOOL 14: create-escalation
 * Flag issues to audit_log
 */
router.post('/create-escalation', async (req: Request, res: Response) => {
  try {
    const { jobId, reason, severity, agentName } = req.body;

    if (!jobId || !reason) {
      throw new AppError(400, 'Missing jobId or reason');
    }

    await logAgentAction(agentName || 'create-escalation', 'escalation', jobId, {
      reason,
      severity: severity || 'medium',
    });

    res.json({ success: true, message: 'Escalation created' });
  } catch (error) {
    throw new AppError(500, 'Failed to create escalation', error);
  }
});

/**
 * TOOL 15: log-agent-action
 * General audit trail entry
 */
router.post('/log-agent-action', async (req: Request, res: Response) => {
  try {
    const { agentName, action, recordId, newValues } = req.body;

    if (!agentName || !action || !recordId) {
      throw new AppError(400, 'Missing agentName, action, or recordId');
    }

    await logAgentAction(agentName, action, recordId, newValues);

    res.json({ success: true, message: 'Action logged' });
  } catch (error) {
    throw new AppError(500, 'Failed to log action', error);
  }
});

// ============================================================================
// EXPORT
// ============================================================================

export function setupMCPRoutes() {
  return router;
}