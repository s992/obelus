#!/bin/sh
set -eu

escape_js_string() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

API_BASE_URL_ESCAPED=$(escape_js_string "${API_BASE_URL:-}")

cat > /usr/share/nginx/html/config.js <<EOC
window.__OBELUS_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL_ESCAPED}",
};
EOC

exec "$@"
