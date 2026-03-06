import fs from "fs";
import path from "path";
import { Pool } from "pg";

export function createQueueStore({ baseDir = process.cwd() } = {}) {
  const databaseUrl = String(process.env.DATABASE_URL || "").trim();
  if (databaseUrl) {
    return new PostgresQueueStore(databaseUrl);
  }

  const queuePath = process.env.VERCEL
    ? path.join("/tmp", "dm-eligible-queue.json")
    : path.join(baseDir, "data", "dm-eligible-queue.json");

  return new FileQueueStore(queuePath);
}

class PostgresQueueStore {
  constructor(connectionString) {
    const sslRequired =
      connectionString.includes("sslmode=require") || String(process.env.DATABASE_SSL || "").toLowerCase() === "true";

    this.pool = new Pool({
      connectionString,
      ssl: sslRequired ? { rejectUnauthorized: false } : undefined
    });
    this.ready = false;
  }

  async init() {
    if (this.ready) return;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS dm_eligible_queue (
        person_id BIGINT PRIMARY KEY,
        eligible BOOLEAN NOT NULL DEFAULT TRUE,
        source TEXT NOT NULL,
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        payload_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
        raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);
    this.ready = true;
  }

  async get(personId) {
    const response = await this.pool.query(
      `SELECT person_id, eligible, source, received_at, payload_summary
       FROM dm_eligible_queue
       WHERE person_id = $1
       LIMIT 1`,
      [Number(personId)]
    );
    return response.rows[0] || null;
  }

  async upsertEligible(personId, payloadSummary, rawPayload) {
    await this.pool.query(
      `INSERT INTO dm_eligible_queue (person_id, eligible, source, received_at, payload_summary, raw_payload)
       VALUES ($1, TRUE, 'pipedrive_webhook', NOW(), $2::jsonb, $3::jsonb)
       ON CONFLICT (person_id)
       DO UPDATE SET
         eligible = EXCLUDED.eligible,
         source = EXCLUDED.source,
         received_at = EXCLUDED.received_at,
         payload_summary = EXCLUDED.payload_summary,
         raw_payload = EXCLUDED.raw_payload`,
      [Number(personId), JSON.stringify(payloadSummary || {}), JSON.stringify(rawPayload || {})]
    );
  }
}

class FileQueueStore {
  constructor(queuePath) {
    this.queuePath = queuePath;
  }

  async init() {
    const existing = this.readJson({ items: {} });
    if (!existing || typeof existing !== "object") {
      this.writeJson({ items: {} });
    }
  }

  async get(personId) {
    const queue = this.readJson({ items: {} });
    return queue.items?.[String(personId)] || null;
  }

  async upsertEligible(personId, payloadSummary) {
    const queue = this.readJson({ items: {} });
    queue.items = queue.items || {};
    queue.items[String(personId)] = {
      eligible: true,
      source: "pipedrive_webhook",
      received_at: new Date().toISOString(),
      payload_summary: payloadSummary || {}
    };
    this.writeJson(queue);
  }

  readJson(fallback) {
    try {
      return JSON.parse(fs.readFileSync(this.queuePath, "utf8"));
    } catch (_error) {
      return fallback;
    }
  }

  writeJson(data) {
    fs.mkdirSync(path.dirname(this.queuePath), { recursive: true });
    fs.writeFileSync(this.queuePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}
