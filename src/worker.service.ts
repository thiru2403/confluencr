import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DbService } from './db.service';


@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(WorkerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly db: DbService) {}

  onModuleInit() {
    this.timer = setInterval(() => this.tick(), 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const res = await this.db.pool.query(`
        UPDATE transactions
        SET status = 'PROCESSED', processed_at = now()
        WHERE transaction_id IN (
          SELECT transaction_id FROM transactions
          WHERE status = 'PROCESSING'
            AND created_at <= now() - interval '30 seconds'
          FOR UPDATE SKIP LOCKED
          LIMIT 50
        )`);
      if (res.rowCount) this.log.log(`Processed ${res.rowCount} transaction(s)`);
    } catch (e) {
      this.log.error('Worker tick failed', e as Error);
    } finally {
      this.running = false;
    }
  }
}
