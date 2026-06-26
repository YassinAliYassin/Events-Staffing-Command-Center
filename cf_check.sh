#!/bin/bash
CF_TOKEN="cfat...echo "=== Checking zone status ==="
ZONE_RESP=$(curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json")
echo "$ZONE_RESP"

STATUS=$(echo "$ZONE_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',{}).get('status','unknown'))" 2>/dev/null)
echo "Status: $STATUS"

if [ "$STATUS" = "active" ]; then
  echo "=== Zone is active, purging cache ==="
  PURGE_RESP=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer *** \
    -H "Content-Type: application/json" \
    --data '{"purge_everything": true}')
  echo "$PURGE_RESP"
  
  echo "=== Verifying site keywords ==="
  curl -s https://fresh-people.co.za | grep -i "keywords" | head -20
else
  echo "Zone status is '${STATUS}', not 'active'. Skipping cache purge."
fi
