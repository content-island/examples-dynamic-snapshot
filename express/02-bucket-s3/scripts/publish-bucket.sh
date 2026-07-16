#!/usr/bin/env bash
set -euo pipefail
export AWS_ACCESS_KEY_ID=minioadmin
export AWS_SECRET_ACCESS_KEY=minioadmin
export AWS_DEFAULT_REGION=us-east-1
# Load CONTENT_ISLAND_TOKEN and REFRESH_SECRET from .env
set -a; source "$(dirname "$0")/../.env"; set +a
# 1) Export the snapshot from Content Island
npx content-island export \
--access-token "$CONTENT_ISLAND_TOKEN" \
--snapshot-path ./content-island-snapshot.json

# 2) Upload it to the bucket (MinIO speaks S3; just change --endpoint-url)
aws --endpoint-url http://localhost:9000 s3 cp \
./content-island-snapshot.json \
s3://content-island/content-island-snapshot.json

# 3) Tell the app to reload the snapshot into memory
curl -fsS -X POST http://localhost:3000/api/content-island/refresh \
-H "x-refresh-secret: $REFRESH_SECRET"
echo "✅ snapshot published and app notified"
