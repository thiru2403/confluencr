import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import 'dotenv/config';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(DbService.name);

  readonly pool = new Pool({
    connectionString: 'postgresql://postgres:Thiru@240300@db.orwnxwioypdnrqlflkll.supabase.co:5432/postgres',
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 10,
  });

  async onModuleInit() {
    // if (!process.env.DATABASE_URL) {
    //   console.log(process.env.DATABASE_URL)
    //   throw new Error('DATABASE_URL is not set. Add it in your .env file or in Render > Environment.');
    // }
    this.pool.on('error', (e) => this.log.error('Idle DB client error', e));
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id TEXT PRIMARY KEY,
        source_account TEXT NOT NULL,
        destination_account TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PROCESSING',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        processed_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_txn_pending
        ON transactions (created_at) WHERE status = 'PROCESSING';
    `);
    this.log.log('Database ready');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}