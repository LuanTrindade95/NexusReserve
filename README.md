# NexusReserve

NexusReserve é uma plataforma corporativa de gestão de reservas de recursos internos, desenhada como um projeto de portfólio senior: backend Laravel, frontend Angular, realtime com Reverb, filas com Redis/Horizon, RBAC, auditoria e uma fundação dockerizada para evoluir regras de negócio com rastreabilidade.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Laravel 12, PHP 8.3, Sanctum, Horizon, Reverb, Pest |
| Frontend | Angular 19 standalone, TailwindCSS, Jest, lucide-angular |
| Dados | MySQL 8, Redis 7 |
| Infra | Docker Compose |
| CI | GitHub Actions |

## Setup com Docker

```bash
docker compose up --build
```

Serviços principais:

| Serviço | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend | http://localhost:8000 |
| Reverb | ws://localhost:8080 |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

## Setup local

Backend:

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan serve
```

Frontend:

```bash
cd frontend
npm ci
npm start
```

## Qualidade

Backend:

```bash
cd backend
./vendor/bin/pint --test
./vendor/bin/pest
```

Frontend:

```bash
cd frontend
npm run lint
npm run test
npm run build
```
