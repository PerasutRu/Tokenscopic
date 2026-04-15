# syntax=docker/dockerfile:1
# Static files only — no Node/live-server in the image.
FROM nginx:1.27-alpine

COPY docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf
COPY frontend/ /usr/share/nginx/html/

EXPOSE 3000
