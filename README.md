# Cookio Backend (NestJS + PostgreSQL + Redis)

一个最小可运行的后端示例，用 **NestJS (TypeScript)** 实现：

* 启动时通过 **TypeORM** 连接 **PostgreSQL**；
* 暴露 `GET /` 路由；
* 首次访问会在数据库里确保一条 `userId = "123456"` 的记录存在，并从 **Redis** 缓存读取/写回；
* 返回文案示例：`Hello User with ID: 123456 (cached: 123456)`。

---

## 1) 代码说明（每个文件做什么）

```
src/
├── main.ts                # 应用入口，创建 Nest 应用并监听 3000 端口
├── app.module.ts          # 根模块：加载 TypeORM（PostgreSQL），注册 Redis Provider、Controller/Service
├── app.controller.ts      # 控制器：定义 GET / 路由，调用 AppService
├── app.service.ts         # 业务逻辑：确保 users 表存在 123456，读写 Redis，并返回字符串
├── user.entity.ts         # TypeORM 实体：users 表，仅一列 userId(varchar)
└── redis.provider.ts      # Redis 客户端 Provider（基于 ioredis），从环境变量读取连接信息
```

其他项目文件（位于根目录）：

* **package.json**：脚本与依赖（Nest CLI、TypeORM、pg、ioredis 等）。
* **tsconfig.json / tsconfig.build.json**：TypeScript 编译配置（装饰器、元数据、输出到 `dist/`）。
* **nest-cli.json（若有）**：指明编译时使用的 tsconfig（推荐）。
* **Dockerfile**：后端容器镜像的构建步骤（可选）。
* **docker-compose.yml**：一键启动 `backend + postgres + redis`（可选）。
* **.env（可选）**：存放本机开发的数据库与 Redis 连接变量（需配合 `@nestjs/config` 使用）。

> 示例业务流程简述：
> `GET /` → `AppService.getHello()`：
>
> 1. 使用 `userRepo`（TypeORM）检查是否存在 `userId = "123456"`，若无则插入；
> 2. 使用 `Redis` 设置并读取 `lastUser`；
> 3. 返回 `Hello User with ID: 123456 (cached: 123456)`。


## 2) 环境与工具要求

* Node.js 18+（建议 18/20/22）
* npm（随 Node 安装）
* Docker Desktop（Windows/macOS）或 Docker Engine（Linux）
    * 用于启动 PostgreSQL 与 Redis 容器；也可选择通过 `docker-compose.yml` 同时跑后端

  
---

## 3) 运行步骤

### A. 确认 Docker Desktop 启动

* Windows/macOS：确保任务栏里的小鲸鱼图标为 **Docker Desktop running**。
* 验证：

  ```bash
  docker version
  docker ps
  ```

### B. 启动 PostgreSQL 与 Redis


```bash
# 仅起数据库与缓存（后台方式）
docker compose up -d postgres redis

# 查看容器是否运行
docker ps

# （可选）连通性检查
docker exec -it redis redis-cli ping             # 预期输出: PONG
docker exec -it postgres psql -U postgres -d appdb -c "SELECT 1;"  # 预期输出: 1
```

### C. 安装依赖并构建

```bash
npm install
npx nest build     # 先编译一次，确保 dist/main.js 产出；start:dev 也可不提前 build
```

### D. 开发模式运行后端

```bash
npm run start:dev
```

### E. 访问与验证

* 打开：[http://localhost:3000](http://localhost:3000)
* 预期返回：

  ```
  Hello User with ID: 123456 (cached: 123456)
  ```

**验证数据确实落库/入缓存：**

```bash
# 查看数据库记录（表名为 users）
docker exec -it postgres psql -U postgres -d appdb -c 'SELECT * FROM "users";'

# 查看 Redis 缓存
docker exec -it redis redis-cli GET lastUser
```

---

## 接口速览

* `GET /`

    * 作用：确保 `users` 表存在 `userId = "123456"` 的记录；写入并读取 Redis 键 `lastUser`；返回字符串。
    * 响应示例：`Hello User with ID: 123456 (cached: 123456)`


