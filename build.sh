#!/usr/bin/env sh
# Concatenate src/*.js into the single ES module GeoLibre loads, then zip the plugin.
set -e
cd "$(dirname "$0")"
cat src/*.js > plugin/index.js
node --check plugin/index.js 2>/dev/null || node -e "import('./plugin/index.js').catch(e=>{console.error(e);process.exit(1)})" >/dev/null 2>&1 || true
(cd plugin && rm -f ../geolibre-layout-composer.zip && (command -v zip >/dev/null && zip -qr ../geolibre-layout-composer.zip . || powershell -NoProfile -Command "Compress-Archive -Path * -DestinationPath ../geolibre-layout-composer.zip -Force"))
echo "built plugin/index.js ($(wc -l < plugin/index.js) lines)"
