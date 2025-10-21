# Cookio Backend (NestJS + PostgreSQL + Redis)

## 1) Environment Overview

* Node.js 18+ (recommended versions: 18 / 20 / 22)
* npm (installed with Node.js)
* Docker Desktop (Windows/macOS) or Docker Engine (Linux)

  * Used to start PostgreSQL and Redis containers; alternatively, you can run both the backend and services together via `docker-compose.yml`.


## 2) Run Steps

### A. Make sure Docker Desktop is running

* On Windows/macOS: ensure the whale icon in the taskbar shows **Docker Desktop running**.
* Verify with:

  ```bash
  docker version
  docker ps
  ```

### B. Start PostgreSQL and Redis

```bash
# Start database and cache containers (in background mode)
docker compose up -d postgres redis

# Check if containers are running
docker ps

# (Optional) Connectivity test
docker exec -it redis redis-cli ping             # Expected output: PONG
docker exec -it postgres psql -U postgres -d appdb -c "SELECT 1;"  # Expected output: 1
```

### C. Install dependencies and build

```bash
npm install
npx nest build     # Compile once to generate dist/main.js; optional before start:dev
```

### D. Run backend in development mode

```bash
npm run start:dev
```

### E. Access

* 🚀 Server: [http://localhost:8080](http://localhost:8080)
* 📚 Swagger: [http://localhost:8080/docs](http://localhost:8080/docs)
