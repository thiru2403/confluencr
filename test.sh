#!/usr/bin/env bash
# Usage: ./test.sh https://your-app.onrender.com   (default http://localhost:3000)
URL=${1:-https://confluencr.onrender.com}
ID="txn_$(date +%s)"
BODY="{\"transaction_id\":\"$ID\",\"source_account\":\"acc_user_789\",\"destination_account\":\"acc_merchant_456\",\"amount\":1500,\"currency\":\"INR\"}"

echo "== Health"; curl -s $URL/; echo
echo "== Sending same webhook 3 times"
for i in 1 2 3; do
  curl -s -o /dev/null -w "status=%{http_code} time=%{time_total}s\n" -X POST $URL/v1/webhooks/transactions \
    -H "Content-Type: application/json" -d "$BODY"
done
echo "== Immediately after (expect 1 record, PROCESSING)"; curl -s $URL/v1/transactions/$ID; echo
echo "== Waiting 32s..."; sleep 32
echo "== After 32s (expect PROCESSED)"; curl -s $URL/v1/transactions/$ID; echo
