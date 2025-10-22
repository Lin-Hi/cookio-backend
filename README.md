# Cookio Backend (NestJS + PostgreSQL + Redis

A mminimal runnable backend eexample implemented with**NestJS (TypeScript)** :

* Connects to **PostgreSQL** via **TypeORM** on startup;
* Exposes a `GET /` route;
* On first access, ensure a record with `userId = "123456"` exisit in the database, and reads from/wites back to **Redis** cache;
* Example response test`Hello User with ID: 123456 (cached: 123456)`.

---

## 1) Code Explanation(What eeach file does)

```
src/
├── main.ts                # Application entry point, creates Nest app and listens on port 8080
├── app.module.ts          # Root module: loads TypeORM（PostgreSQL）, registers Redis Provider、Controller/Service
├── app.controller.ts      # Controller:defines GET / route, call AppService
├── app.service.ts         # Business logic: ensures users "123456" exists in users table, reads/writes Redis, return string
├── user.entity.ts         # TypeORM entity: users table, only one column userId(varchar)
└── redis.provider.ts      # Redis client Provider（based on ioredis）, reads connection info from enviroment variables
```

Other project files (located in root directory):

* **package.json**: Scripts & dependencies (Nest CLI, TypeORM, pg, ioredis, etc.).
* **tsconfig.json / tsconfig.build.json**: TypeScript compilation config (decorators, metadata, output to `dist/`）.
* **nest-cli.json（if present）**: Specifies which tsconfig to use during compilation (recommended).
* **Dockerfile**：Build steps for the backend container image (optional).
* **docker-compose.yml**：One-click startup for `backend + postgres + redis`(Optional).
* **.env（optional）**：Stores database and Redis connection variables for local development (requires `@nestjs/config` ).

> Example business flow summary
> `GET /` → `AppService.getHello()`:
>
> 1. Use `userRepo`（TypeORM）to check if `userId = "123456"`exists, insert if not;
> 2. Use `Redis` to set and read `lastUser`;
> 3. Return `Hello User with ID: 123456 (cached: 123456)`.


## 2) Environment & Tool Requirements

* Node.js 18+(recommended 18/20/22)
* npm (installed with Node)
* Docker Desktop（Windows/macOS）或 Docker Engine（Linux）
    * For starting PostgreSQL and Redis containers; optionally use `docker-compose.yml` to run backend simultaneously

  
---

## 3) Running Steps

### A. Confirm Docker Desktop is Running

* Windows/macOS: Ensure the whale icon in the taskbar shows **Docker Desktop running**.
* Verify:

  ```bash
  docker version
  docker ps
  ```

### B. Start PostgreSQL and Redis


```bash
# Start only database and cache (in background)
docker compose up -d postgres redis

# Check if containers are running行
docker ps

# (Optional) Connectivity check
docker exec -it redis redis-cli ping           # Expected output: PONG
docker exec -it postgres psql -U postgres -d appdb -c "SELECT 1;"   # Expected output: 1
```

### C. Install Dependencies and Build

```bash
npm install
npx nest build     # Compile first to ensure dist/main.js is generated; start:dev can run without pre-build
```

### D. Run Backend in Development Mode

```bash
npm run start:dev
```

### E. Access and Verify

* Open: [http://localhost:8080](http://localhost:8080)
* Expected response:

  ```
  Hello User with ID: 123456 (cached: 123456)
  ```

**Verify data is actually stored in DB/cache:**

```bash
# Check database records (table name: users)
docker exec -it postgres psql -U postgres -d appdb -c 'SELECT * FROM "users";'

# Check Redis cache
docker exec -it redis redis-cli GET lastUser
```

---

## API Overview

* `GET /`

    * Purpose: Ensures a record with `userId = "123456"`exists in the `users` table; writes and reads Redis key`lastUser`; returns a string.
    * Response example: `Hello User with ID: 123456 (cached: 123456)`


