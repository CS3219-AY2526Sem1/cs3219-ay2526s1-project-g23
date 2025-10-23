#!/bin/sh
# Dynamically create nginx config using the PORT provided by Cloud Run

cat <<EOF > /etc/nginx/conf.d/default.conf
server {
    listen ${PORT};
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }
}
EOF

# Start nginx in the foreground
nginx -g 'daemon off;'
