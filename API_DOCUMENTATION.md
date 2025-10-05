# Cookio Backend API 文档

## 📋 基本信息

- **项目名称**: Cookio Backend
- **版本**: 0.1.0
- **基础 URL**: `http://localhost:8080`
- **Swagger 文档**: `http://localhost:8080/docs`
- **技术栈**: NestJS + PostgreSQL + Redis

## 🔧 通用信息

### 响应格式

所有 API 响应都使用 JSON 格式。

### 错误处理

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 分页参数

- `page`: 页码，默认为 1
- `pageSize`: 每页数量，默认为 20

---

## 🏠 根接口

### GET /

获取应用状态信息

**响应示例**:

```json
"Hello User with ID: 123456 (cached: 123456)"
```

---

## 🔐 认证管理 (Authentication)

### 1. 用户注册

```http
POST /auth/register
```

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "张三",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**字段说明**:

- `email` (string, required): 用户邮箱，必须唯一
- `password` (string, required): 密码，至少 6 个字符
- `display_name` (string, optional): 显示名称
- `avatar_url` (string, optional): 头像 URL

**响应示例**:

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "display_name": "张三",
    "avatar_url": "https://example.com/avatar.jpg",
    "created_at": "2025-10-02T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. 用户登录

```http
POST /auth/login
```

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**字段说明**:

- `email` (string, required): 用户邮箱
- `password` (string, required): 密码

**响应示例**:

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "display_name": "张三",
    "avatar_url": "https://example.com/avatar.jpg",
    "created_at": "2025-10-02T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. 获取当前用户信息

```http
GET /auth/profile
```

**请求头**:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "display_name": "张三",
  "avatar_url": "https://example.com/avatar.jpg",
  "created_at": "2025-10-02T10:30:00.000Z"
}
```

---

## 👥 用户管理 (Users)

### 1. 获取所有用户

```http
GET /users
```

**响应示例**:

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "display_name": "张三",
    "avatar_url": "https://example.com/avatar.jpg",
    "created_at": "2025-10-02T10:30:00.000Z"
  }
]
```

### 2. 获取单个用户

```http
GET /users/{id}
```

**路径参数**:

- `id` (string, required): 用户 UUID

**响应示例**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "display_name": "张三",
  "avatar_url": "https://example.com/avatar.jpg",
  "created_at": "2025-10-02T10:30:00.000Z"
}
```

### 3. 创建用户

```http
POST /users
```

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "张三",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**字段说明**:

- `email` (string, required): 用户邮箱，必须唯一
- `password` (string, required): 密码，至少 6 个字符
- `display_name` (string, optional): 显示名称
- `avatar_url` (string, optional): 头像 URL

**响应示例**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "display_name": "张三",
  "avatar_url": "https://example.com/avatar.jpg",
  "created_at": "2025-10-02T10:30:00.000Z"
}
```

### 4. 更新用户

```http
PUT /users/{id}
```

**路径参数**:

- `id` (string, required): 用户 UUID

**请求体**:

```json
{
  "display_name": "李四",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

### 5. 删除用户

```http
DELETE /users/{id}
```

**路径参数**:

- `id` (string, required): 用户 UUID

**响应示例**:

```json
{
  "deleted": true
}
```

### 6. 获取用户的食谱列表

```http
GET /users/{id}/recipes
```

**路径参数**:

- `id` (string, required): 用户 UUID

**查询参数**:

- `q` (string, optional): 搜索关键词
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 20

**响应示例**:

```json
{
  "items": [
    {
      "id": "recipe-uuid",
      "title": "红烧肉",
      "description": "经典家常菜",
      "category": "中式",
      "difficulty": "中等",
      "cook_time": "1小时",
      "servings": 4,
      "is_published": true,
      "created_at": "2025-10-02T10:30:00.000Z",
      "owner": {
        "id": "user-uuid",
        "email": "user@example.com",
        "display_name": "张三"
      },
      "ingredients": ["500 g 五花肉", "2 勺 生抽"],
      "steps": ["将五花肉切块", "热锅下油，煎至两面金黄"]
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

---

## 🍳 食谱管理 (Recipes)

### 1. 获取食谱列表

```http
GET /recipes
```

**查询参数**:

- `q` (string, optional): 搜索关键词（标题）
- `category` (string, optional): 分类筛选
- `difficulty` (string, optional): 难度筛选
- `ownerId` (string, optional): 按作者筛选
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 20

**响应示例**:

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "红烧肉",
      "description": "经典家常菜",
      "image_url": "https://example.com/recipe.jpg",
      "category": "中式",
      "difficulty": "中等",
      "cook_time": "1小时",
      "servings": 4,
      "is_published": true,
      "created_at": "2025-10-02T10:30:00.000Z",
      "owner": {
        "id": "user-uuid",
        "email": "user@example.com",
        "display_name": "张三"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

### 2. 获取单个食谱详情

```http
GET /recipes/{id}
```

**路径参数**:

- `id` (string, required): 食谱 UUID

**响应示例**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "红烧肉",
  "description": "经典家常菜",
  "image_url": "https://example.com/recipe.jpg",
  "category": "中式",
  "difficulty": "中等",
  "cook_time": "1小时",
  "servings": 4,
  "is_published": true,
  "created_at": "2025-10-02T10:30:00.000Z",
  "owner": {
    "id": "user-uuid",
    "email": "user@example.com",
    "display_name": "张三"
  },
  "ingredients": [
    {
      "id": "ingredient-uuid",
      "name": "五花肉",
      "quantity": "500",
      "unit": "克",
      "position": 0
    }
  ],
  "steps": [
    {
      "id": "step-uuid",
      "step_no": 1,
      "content": "将五花肉切块",
      "image_url": "https://example.com/step1.jpg"
    }
  ]
}
```

### 3. 创建食谱

```http
POST /recipes
```

**请求体**:

```json
{
  "owner_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "红烧肉",
  "description": "经典家常菜",
  "image_url": "https://example.com/recipe.jpg",
  "category": "中式",
  "difficulty": "中等",
  "cook_time": "1小时",
  "servings": 4,
  "is_published": true,
  "ingredients": [
    {
      "name": "五花肉",
      "quantity": "500",
      "unit": "克",
      "position": 0
    },
    {
      "name": "生抽",
      "quantity": "2",
      "unit": "勺",
      "position": 1
    }
  ],
  "steps": [
    {
      "step_no": 1,
      "content": "将五花肉切块",
      "image_url": "https://example.com/step1.jpg"
    },
    {
      "step_no": 2,
      "content": "热锅下油，放入肉块煎至两面金黄"
    }
  ]
}
```

**字段说明**:

- `owner_id` (string, required): 食谱作者 UUID
- `title` (string, required): 食谱标题
- `description` (string, optional): 食谱描述
- `image_url` (string, optional): 食谱图片 URL
- `category` (string, optional): 分类
- `difficulty` (string, optional): 难度
- `cook_time` (string, optional): 烹饪时间
- `servings` (number, optional): 份数
- `is_published` (boolean, optional): 是否发布，默认 false
- `ingredients` (array, required): 配料列表
  - `name` (string, required): 配料名称
  - `quantity` (string, optional): 用量
  - `unit` (string, optional): 单位
  - `position` (number, optional): 排序位置
- `steps` (array, required): 制作步骤
  - `step_no` (number, required): 步骤编号
  - `content` (string, required): 步骤内容
  - `image_url` (string, optional): 步骤图片 URL

### 4. 更新食谱

```http
PUT /recipes/{id}
```

**路径参数**:

- `id` (string, required): 食谱 UUID

**请求体**: 与创建食谱相同，但所有字段都是可选的

### 5. 删除食谱

```http
DELETE /recipes/{id}
```

**路径参数**:

- `id` (string, required): 食谱 UUID

**响应示例**:

```json
{
  "deleted": true
}
```

---

## 🌍 公共菜谱 (Public Recipe)

### 搜索公共菜谱

```http
GET /publicRecipe
```

从 Edamam API 搜索公共菜谱，支持多种筛选条件。

**查询参数**:

- `q` (string, optional): 搜索关键词，例如 "chicken"、"pasta"
- `mealType` (string, optional): 菜肴类型
  - 可选值: `Breakfast`, `Lunch`, `Dinner`, `Snack`, `Teatime`
- `cuisineType` (string, optional): 菜系类型
  - 可选值: `American`, `Asian`, `British`, `Chinese`, `French`, `Indian`, `Italian`, `Japanese`, `Korean`, `Mediterranean`, `Mexican`
- `dishType` (string, optional): 料理类型
  - 可选值: `Main course`, `Side dish`, `Desserts`, `Soup`, `Salad`, `Bread`, `Drinks`
- `health` (string, optional): 健康标签
  - 可选值: `vegan`, `vegetarian`, `gluten-free`, `dairy-free`, `low-carb`, `low-fat`
- `diet` (string, optional): 饮食标签
  - 可选值: `balanced`, `high-fiber`, `high-protein`, `low-carb`, `low-fat`, `low-sodium`
- `page` (number, optional): 页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 20

**请求示例**:

```bash
# 搜索鸡肉菜谱
GET /publicRecipe?q=chicken

# 搜索中式午餐
GET /publicRecipe?cuisineType=Chinese&mealType=Lunch

# 搜索素食主菜
GET /publicRecipe?health=vegan&dishType=Main%20course

# 搜索低碳水化合物早餐
GET /publicRecipe?diet=low-carb&mealType=Breakfast

# 分页查询
GET /publicRecipe?q=pasta&page=2&pageSize=10
```

**响应示例**:

```json
{
  "items": [
    {
      "id": "b79327d05b8e5b838ad6cfd9576b30b6",
      "title": "Chicken Vesuvio",
      "description": "Recipe from Serious Eats",
      "image_url": "https://edamam-product-images.s3.amazonaws.com/web-img/e42/e42f9119813e890af34c259785ae1cfb.jpg",
      "category": "Italian",
      "difficulty": "Medium",
      "cook_time": "1h",
      "servings": 4,
      "is_published": true,
      "created_at": "2025-10-04T10:30:00.000Z",
      "owner": {
        "id": "edamam-public",
        "email": "public@edamam.com",
        "display_name": "Serious Eats"
      },
      "ingredients": [
        {
          "id": "b79327d05b8e5b838ad6cfd9576b30b6-ing-0",
          "name": "chicken",
          "quantity": "4.0",
          "unit": "pound",
          "position": 0
        },
        {
          "id": "b79327d05b8e5b838ad6cfd9576b30b6-ing-1",
          "name": "potato",
          "quantity": "5.0",
          "unit": "large",
          "position": 1
        },
        {
          "id": "b79327d05b8e5b838ad6cfd9576b30b6-ing-2",
          "name": "olive oil",
          "quantity": "0.5",
          "unit": "cup",
          "position": 2
        },
        {
          "id": "b79327d05b8e5b838ad6cfd9576b30b6-ing-3",
          "name": "garlic",
          "quantity": "5.0",
          "unit": "clove",
          "position": 3
        }
      ],
      "steps": [
        {
          "id": "b79327d05b8e5b838ad6cfd9576b30b6-step-0",
          "step_no": 1,
          "content": "1/2 cup olive oil",
          "image_url": null
        },
        {
          "id": "b79327d05b8e5b838ad6cfd9576b30b6-step-1",
          "step_no": 2,
          "content": "5 cloves garlic, peeled",
          "image_url": null
        },
        {
          "id": "b79327d05b8e5b838ad6cfd9576b30b6-step-2",
          "step_no": 3,
          "content": "4 chicken leg quarters, split into drumsticks and thighs",
          "image_url": null
        },
        {
          "id": "b79327d05b8e5b838ad6cfd9576b30b6-step-3",
          "step_no": 4,
          "content": "5 large potatoes, peeled and cut into wedges",
          "image_url": null
        }
      ],
      "external_url": "http://www.seriouseats.com/recipes/2011/12/chicken-vesuvio-recipe.html",
      "calories": 4228,
      "totalWeight": 2976,
      "dietLabels": ["Low-Carb"],
      "healthLabels": ["Sugar-Conscious", "Peanut-Free", "Tree-Nut-Free"]
    }
  ],
  "total": 10000,
  "page": 1,
  "pageSize": 20,
  "from": 0,
  "to": 20
}
```

**响应字段说明**:

- `items` (array): 菜谱列表
  - `id` (string): 菜谱唯一标识
  - `title` (string): 菜谱标题
  - `description` (string): 菜谱描述
  - `image_url` (string): 菜谱图片 URL
  - `category` (string): 菜系分类 (English: Italian, Chinese, Japanese, etc.)
  - `difficulty` (string): 难度评估 (Easy/Medium/Hard)
  - `cook_time` (string): 烹饪时间 (e.g., "1h", "30 min", "1h 30min")
  - `servings` (number): 份数
  - `is_published` (boolean): 是否已发布（公共菜谱始终为 true）
  - `created_at` (string): 创建时间
  - `owner` (object): 菜谱来源信息
    - `id` (string): 固定为 "edamam-public"
    - `email` (string): 固定为 "public@edamam.com"
    - `display_name` (string): 菜谱来源网站名称
  - `ingredients` (array): 食材列表
    - `id` (string): 食材唯一标识
    - `name` (string): 食材名称
    - `quantity` (string): 用量
    - `unit` (string): 单位
    - `position` (number): 排序位置
  - `steps` (array): 制作步骤列表
    - `id` (string): 步骤唯一标识
    - `step_no` (number): 步骤编号
    - `content` (string): 步骤内容
    - `image_url` (string|null): 步骤图片 URL
  - `external_url` (string): 原始菜谱链接
  - `calories` (number): 总卡路里
  - `totalWeight` (number): 总重量（克）
  - `dietLabels` (array): 饮食标签
  - `healthLabels` (array): 健康标签
- `total` (number): 总记录数
- `page` (number): 当前页码
- `pageSize` (number): 每页数量
- `from` (number): 起始索引
- `to` (number): 结束索引

**使用场景**:

1. **搜索菜谱**: 前端可以根据用户输入的关键词搜索菜谱
2. **分类浏览**: 按照菜系、菜肴类型、料理类型等进行分类浏览
3. **健康筛选**: 为有特殊饮食需求的用户提供筛选（素食、无麸质等）
4. **菜谱推荐**: 可以随机获取不同类型的菜谱进行推荐

**注意事项**:

- 所有查询参数都是可选的，但建议至少提供一个参数以获得更精准的结果
- 返回的菜谱数据格式已经过转换，与本地菜谱格式保持一致
- **所有字段均为英文**，包括 category (Italian, Chinese, etc.)、difficulty (Easy/Medium/Hard)、cook_time (1h, 30 min, etc.)
- **返回所有 ingredients 和 steps**，不会限制数量
- `external_url` 字段提供了原始菜谱的链接，可以引导用户查看完整内容
- API 使用 Edamam Recipe Search API，每分钟有请求限制

**错误响应**:

```json
{
  "statusCode": 500,
  "message": "外部 API 调用失败: timeout of 10000ms exceeded"
}
```

---

## 🔧 数据模型

### User (用户)

```typescript
{
  id: string;           // UUID
  email: string;        // 邮箱，唯一
  display_name?: string; // 显示名称
  avatar_url?: string;   // 头像URL
  created_at: Date;     // 创建时间
}
```

### Recipe (食谱)

```typescript
{
  id: string;           // UUID
  title: string;        // 标题
  description?: string; // 描述
  image_url?: string;   // 图片URL
  category?: string;    // 分类
  difficulty?: string;  // 难度
  cook_time?: string;   // 烹饪时间
  servings?: number;    // 份数
  is_published: boolean; // 是否发布
  created_at: Date;     // 创建时间
  owner: User;          // 作者
}
```

### RecipeIngredient (食谱配料)

```typescript
{
  id: string;           // UUID
  name: string;         // 配料名称
  quantity?: string;    // 用量
  unit?: string;        // 单位
  position: number;     // 排序位置
  recipe: Recipe;       // 所属食谱
}
```

### RecipeStep (食谱步骤)

```typescript
{
  id: string;           // UUID
  step_no: number;      // 步骤编号
  content: string;      // 步骤内容
  image_url?: string;   // 步骤图片URL
  recipe: Recipe;       // 所属食谱
}
```

---

## 🚀 快速开始

### 1. 启动服务

```bash
# 启动数据库和缓存
docker compose up -d postgres redis

# 启动应用
npm run start:dev
```

### 2. 访问文档

- API 文档: http://localhost:8080/docs
- 应用状态: http://localhost:8080

### 3. 示例请求

```bash
# 用户注册
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","display_name":"测试用户"}'

# 用户登录
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 获取当前用户信息（需要 JWT token）
curl -X GET http://localhost:8080/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 获取用户列表
curl http://localhost:8080/users

# 搜索食谱
curl "http://localhost:8080/recipes?q=红烧&category=中式&page=1&pageSize=10"
```

---

## 📝 注意事项

1. **UUID 格式**: 所有 ID 都使用 UUID v4 格式
2. **邮箱唯一性**: 用户邮箱必须唯一
3. **密码安全**: 密码使用 bcrypt 加密存储，至少 6 个字符
4. **JWT 认证**: Token 有效期为 24 小时，需要在请求头中携带
5. **分页**: 默认每页 20 条记录，最大 100 条
6. **图片 URL**: 支持 HTTP/HTTPS 链接
7. **时间格式**: 使用 ISO 8601 格式 (YYYY-MM-DDTHH:mm:ss.sssZ)

### JWT 认证使用方式

1. **注册或登录**获取 access_token
2. **在请求头中添加**：`Authorization: Bearer YOUR_TOKEN`
3. **受保护的接口**需要有效的 JWT token
4. **Token 过期**后需要重新登录获取新 token

---

## 🔍 错误码说明

| 状态码 | 说明                     |
| ------ | ------------------------ |
| 200    | 请求成功                 |
| 201    | 创建成功                 |
| 400    | 请求参数错误             |
| 404    | 资源不存在               |
| 409    | 资源冲突（如邮箱已存在） |
| 500    | 服务器内部错误           |

---

_最后更新: 2025 年 10 月 2 日_
