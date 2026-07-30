#!/bin/sh
set -eu

cd /opt/free-ai-directory
exec 9>/run/free-ai-directory-daily.lock
flock -n 9 || exit 0

npm run daily:update
npm run opportunities:update
npm run directory:update
PUBLIC_SITE_URL=https://www.qaz5678.xyz npm run build
npm run release:audit
rsync -a --delete dist/ /var/www/free-ai-directory/
PUBLIC_SITE_URL=https://www.qaz5678.xyz npm run indexnow || true
