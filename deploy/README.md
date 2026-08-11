# VPS deployment

The production frontend runs as the dedicated `xantara-web` system user on
`127.0.0.1:4020`. aaPanel's Nginx proxies `xantarapos.com` and
`www.xantarapos.com` to that loopback listener.

Build with `NEXT_PUBLIC_API_URL=https://xantarapos.com` so browser API calls use
the same origin. Nginx proxies `/api/` to the loopback-only Django backend on
port `4021`, while `/media/` is served from `/opt/xantarapos/media/`.

DNS is managed by Hostinger. Both the apex `A` record and the `www` record must
resolve to `72.60.210.231` before requesting the Let's Encrypt certificate.

Install `letsencrypt-reload-nginx.sh` under
`/etc/letsencrypt/renewal-hooks/deploy/` with mode `0755`. It validates and
reloads aaPanel's custom Nginx binary after a successful certificate renewal.
