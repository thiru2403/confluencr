import { BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { DbService } from './db.service';
import { TransactionDto } from './transaction.dto';

@Controller()
export class AppController {
  constructor(private readonly db: DbService) {}

  @Get()
  health() {
    return { status: 'HEALTHY', current_time: new Date().toISOString() };
  }

  @Post('v1/webhooks/transactions')
  @HttpCode(202)
  async webhook(@Body() t: TransactionDto) {
    const res = await this.db.pool.query(
      `INSERT INTO transactions
       (transaction_id, source_account, destination_account, amount, currency)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (transaction_id) DO NOTHING`,
      [t.transaction_id, t.source_account, t.destination_account, t.amount, t.currency],
    );

    if (res.rowCount === 0) {
      return { status: 'duplicate_ignored', transaction_id: t.transaction_id };
    }
    return { status: 'accepted', transaction_id: t.transaction_id };
  }

  @Get('v1/transactions/:id')
  async getTransaction(@Param('id') id: string) {
    const { rows } = await this.db.pool.query(
      `SELECT transaction_id, source_account, destination_account,
              amount::float8 AS amount, currency, status, created_at, processed_at
       FROM transactions WHERE transaction_id = $1`,
      [id],
    );
    if (!rows.length) throw new NotFoundException('Transaction not found');
    return rows;
  }
}
