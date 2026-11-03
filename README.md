# Transaction Webhook Service

NestJS + Postgres (Supabase) service that accepts payment-processor webhooks, acknowledges them
immediately with `202`, and processes them reliably in the background.

**Live URL:** `https://<your-app>.onrender.com`

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check: `{"status":"HEALTHY","current_time":"..."}` |
| POST | `/v1/webhooks/transactions` | Accepts a transaction, returns `202` |
| GET | `/v1/transactions/:transaction_id` | Returns the transaction as a list (`PROCESSING` / `PROCESSED`), 404 if unknown |

Webhook body:

```json
{"transaction_id":"txn_abc123def456","source_account":"acc_user_789","destination_account":"acc_merchant_456","amount":1500,"currency":"INR"}
```

## Run locally

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL
npm run start:dev
```

The `transactions` table is created automatically on startup.

## Test

```bash
./test.sh                              # local
./test.sh https://<your-app>.onrender.com   # deployed
```

It sends the same webhook 3 times (all return 202), shows one `PROCESSING` record, then
after ~30s shows it as `PROCESSED`.

## Technical choices

- **NestJS**: structure, DI, and built-in validation (invalid payloads get 400).
- **Idempotency**: `transaction_id` is the Postgres primary key and inserts use
  `ON CONFLICT DO NOTHING`, so duplicates (even simultaneous ones) are processed once and still return 202.
- **Reliability**: Postgres is also the queue. A restart or crash loses nothing; pending rows are picked up on boot.
- **30-second delay**: modelled as "finish a row once `created_at` is 30s old" rather than blocking code or in-memory timers.
- **Concurrency**: `FOR UPDATE SKIP LOCKED` prevents two instances from processing the same row.
- **Speed**: the webhook handler does a single insert and returns; processing never blocks the request.
- **Money**: stored as `NUMERIC`, never float.
- **Timestamps**: `TIMESTAMPTZ`, returned as UTC ISO 8601.
