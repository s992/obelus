#!/bin/sh
envsubst '${OBELUS_API_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
nginx
exec node /app/api/dist/server.cjs
