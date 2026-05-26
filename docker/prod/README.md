# NexusReserve Production Compose

This profile builds optimized containers for a small production-like deployment:

- Angular is compiled once and served by Nginx.
- Laravel runs behind PHP-FPM.
- A separate Nginx container terminates HTTP for the API and forwards PHP requests to FPM.
- Horizon and Reverb run as isolated processes.
- MySQL and Redis use named volumes.

Required variables are intentionally not committed with secrets. Use a deployment secret store or a local `.env` file excluded from Git.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Before first use, run migrations and seed only when intentionally bootstrapping a demo environment:

```bash
docker compose -f docker-compose.prod.yml exec backend php artisan migrate --force
docker compose -f docker-compose.prod.yml exec backend php artisan db:seed --force
```
