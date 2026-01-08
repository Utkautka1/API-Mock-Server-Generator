<p align="center">
  <img src="https://raw.githubusercontent.com/swagger-api/swagger.io/wordpress/images/assets/SW-logo-clr.png" width="200" alt="OpenAPI Logo" />
</p>

<p align="center">
  <strong>API Mock Server Generator</strong> - Production-ready mock server generator from OpenAPI/Swagger specifications
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/api-mock-generator" target="_blank"><img src="https://img.shields.io/npm/v/api-mock-generator.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/api-mock-generator" target="_blank"><img src="https://img.shields.io/npm/l/api-mock-generator.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/api-mock-generator" target="_blank"><img src="https://img.shields.io/npm/dm/api-mock-generator.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/yourusername/api-mock-generator" target="_blank"><img src="https://img.shields.io/github/stars/yourusername/api-mock-generator?style=social" alt="GitHub Stars" /></a>
  <a href="https://nodejs.org" target="_blank"><img src="https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg" alt="Node.js" /></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-5.3-blue.svg" alt="TypeScript" /></a>
</p>

---

## 📖 Description

**API Mock Server Generator** - это мощный инструмент для автоматической генерации мок-серверов из OpenAPI 3.0/Swagger 2.0 спецификаций. Идеально подходит для разработки фронтенда без готового бэкенда, тестирования API и демонстрации проектов.

### Ключевые особенности

- 🚀 **Быстрый старт** - запуск мок-сервера одной командой
- 🎭 **150+ динамических шаблонов** - генерация реалистичных данных
- 🎨 **React UI панель** - удобное управление эндпоинтами
- 📡 **Real-time мониторинг** - отслеживание запросов через WebSocket
- 🔒 **Production-ready** - защита от уязвимостей и DoS атак
- 🌍 **Кроссплатформенность** - Windows, Linux, macOS, Docker
- 📦 **Экспорт коллекций** - Postman и Insomnia

---

## 🔧 Технологии

### Core Technologies

<table>
  <tr>
    <td align="center" width="120">
      <img src="https://nodejs.org/static/images/logo.svg" width="48" height="48" alt="Node.js" />
      <br>Node.js
    </td>
    <td align="center" width="120">
      <img src="https://raw.githubusercontent.com/github/explore/main/topics/typescript/typescript.png" width="48" height="48" alt="TypeScript" />
      <br>TypeScript
    </td>
    <td align="center" width="120">
      <img src="https://expressjs.com/images/favicon.png" width="48" height="48" alt="Express.js" />
      <br>Express.js
    </td>
    <td align="center" width="120">
      <img src="https://raw.githubusercontent.com/github/explore/main/topics/react/react.png" width="48" height="48" alt="React" />
      <br>React
    </td>
    <td align="center" width="120">
      <img src="https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png" width="48" height="48" alt="Docker" />
      <br>Docker
    </td>
  </tr>
</table>

### Backend Stack
- **[Node.js](https://nodejs.org/)** - JavaScript runtime environment
- **[TypeScript](https://www.typescriptlang.org/)** - Strongly typed programming language
- **[Express.js](https://expressjs.com/)** - Fast, minimalist web framework
- **[express-ws](https://github.com/HenningM/express-ws)** - WebSocket support for Express
- **[Commander.js](https://github.com/tj/commander.js)** - Complete CLI solution
- **[swagger-client](https://github.com/swagger-api/swagger-js)** - OpenAPI/Swagger parser
- **[js-yaml](https://github.com/nodeca/js-yaml)** - YAML 1.2 parser and serializer
- **[@faker-js/faker](https://fakerjs.dev/)** - Generate massive amounts of fake data
- **[cors](https://github.com/expressjs/cors)** - CORS middleware
- **[body-parser](https://github.com/expressjs/body-parser)** - Request body parsing middleware

### Frontend Stack
- **[React](https://react.dev/)** - JavaScript library for building user interfaces
- **[React Router](https://reactrouter.com/)** - Declarative routing for React
- **[Vite](https://vitejs.dev/)** - Next generation frontend tooling

### Development Tools
- **[ESLint](https://eslint.org/)** - Pluggable JavaScript linter
- **[Prettier](https://prettier.io/)** - Opinionated code formatter

---

## 📦 Installation

```bash
# Global installation
npm install -g api-mock-generator

# Or use with npx (no installation required)
npx api-mock-generator generate openapi.yaml
```

**Requirements:**
- Node.js >= 16.x
- npm >= 7.x

---

## 🚀 Quick Start

```bash
# Generate mock server from OpenAPI specification
api-mock generate openapi.yaml --port=3000

# Open UI panel in browser
# http://localhost:3000/_ui
```

### Example OpenAPI Specification

Create `api.yaml`:

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                      format: uuid
                    name:
                      type: string
                    email:
                      type: string
                      format: email
```

Run:

```bash
api-mock generate api.yaml
```

Result:

```bash
Mock server started on http://localhost:3000

GET http://localhost:3000/users
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
]
```

---

## 📚 Usage

### CLI Options

```bash
api-mock generate <spec-file> [options]
```

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--port` | `-p` | Server port | `3000` |
| `--host` | `-h` | Server host | `localhost` |
| `--ui-path` | | UI panel path | `/_ui` |

### Examples

```bash
# Start on custom port
api-mock generate api.yaml --port=8080

# Listen on all interfaces
api-mock generate api.yaml --host=0.0.0.0

# Custom UI path
api-mock generate api.yaml --ui-path=/_admin
```

---

## 🎨 UI Panel

The web interface provides complete control over your mock server:

- **📊 Dashboard** - Server statistics and quick actions
- **🔌 Endpoints** - Manage endpoints and configure responses
- **📡 Monitor** - Real-time request logging via WebSocket
- **⚙️ Settings** - Server configuration

**Access:** `http://localhost:3000/_ui`

![UI Screenshot](https://via.placeholder.com/800x450?text=API+Mock+Server+UI)

---

## 🎭 Dynamic Templates

Generate realistic data using 150+ built-in templates:

```json
{
  "id": "{{uuid}}",
  "orderId": "{{order-id}}",
  "user": {
    "email": "{{email}}",
    "name": "{{fullname}}",
    "nickname": "{{nickname}}",
    "role": "{{role}}",
    "age": {{int:18:65}}
  },
  "order": {
    "total": {{amount:10:1000:2:$}},
    "status": "{{order-status}}",
    "items": [
      {
        "product": "{{product-name}}",
        "quantity": {{int:1:10}}
      }
    ]
  },
  "payment": {
    "method": "{{payment-status}}",
    "transactionId": "{{transaction-id}}",
    "cardNumber": "{{creditcard}}"
  },
  "timestamps": {
    "createdAt": "{{date}}",
    "updatedAt": "{{datetime}}"
  }
}
```

### Template Categories

<details>
<summary><strong>👤 Personal Data</strong></summary>

- `{{uuid}}` - UUID v4
- `{{fullname}}`, `{{name}}` - Full name
- `{{firstname}}` - First name
- `{{lastname}}` - Last name
- `{{nickname}}`, `{{nick}}` - Username with number
- `{{email}}` - Email address
- `{{phone}}` - Phone number
- `{{age:min:max}}` - Age (default 18-65)
- `{{gender}}` - Gender
- `{{bio}}` - Biography

</details>

<details>
<summary><strong>🔐 Roles & Permissions</strong></summary>

- `{{role}}` - User role (admin, user, moderator, etc.)
- `{{permission}}` - Permission (read, write, delete, etc.)

</details>

<details>
<summary><strong>🛒 Orders & Transactions</strong></summary>

- `{{order-id}}`, `{{order_id}}` - Order number (ORD-XXXXXXXX-XXXXXX)
- `{{invoice-id}}` - Invoice number
- `{{transaction-id}}`, `{{txn-id}}` - Transaction ID
- `{{payment-id}}` - Payment ID
- `{{ticket-id}}` - Ticket number
- `{{booking-id}}` - Booking ID
- `{{subscription-id}}` - Subscription ID
- `{{session-id}}` - Session ID

</details>

<details>
<summary><strong>🔑 Tokens & Keys</strong></summary>

- `{{token}}` - Token (32 chars)
- `{{api-key}}` - API key (sk-XXXXXXXX)
- `{{secret-key}}` - Secret key (64 chars)
- `{{access-token}}` - Access token
- `{{refresh-token}}` - Refresh token

</details>

<details>
<summary><strong>📅 Dates & Time</strong></summary>

- `{{date}}`, `{{datetime}}` - ISO date/time
- `{{date-past}}` - Past date
- `{{date-future}}` - Future date
- `{{timestamp}}` - Current timestamp (ms)
- `{{timestamp-s}}` - Current timestamp (seconds)

</details>

<details>
<summary><strong>💰 Finance</strong></summary>

- `{{amount:min:max:decimals:symbol}}` - Money amount
- `{{price:min:max:decimals:symbol}}` - Product price
- `{{creditcard}}` - Credit card number
- `{{iban}}` - IBAN
- `{{currency-code}}` - Currency code (USD, EUR)
- `{{bitcoin-address}}` - Bitcoin address

</details>

<details>
<summary><strong>🛍️ Commerce</strong></summary>

- `{{product-name}}` - Product name
- `{{product-description}}` - Product description
- `{{category}}` - Product category
- `{{sku}}` - Stock keeping unit
- `{{barcode}}` - Barcode

</details>

<details>
<summary><strong>📊 Status & States</strong></summary>

- `{{status}}` - General status (active, inactive, pending)
- `{{order-status}}` - Order status (pending, shipped, delivered)
- `{{payment-status}}` - Payment status (paid, failed, refunded)
- `{{user-status}}` - User status (active, suspended, banned)

</details>

[**View all 150+ templates →**](https://github.com/yourusername/api-mock-generator/wiki/Templates)

---

## 🐳 Docker

### Using Docker Compose

```bash
docker-compose up -d
```

### Build Custom Image

```bash
docker build -t api-mock-generator .

docker run -d \
  -p 3000:3000 \
  -v $(pwd)/openapi.yaml:/app/openapi.yaml \
  api-mock-generator \
  generate /app/openapi.yaml --host=0.0.0.0
```

---

## 🛠️ Development

### Project Structure (Monorepo)

```
api-mock-generator/
├── packages/
│   ├── shared/       # Common types and utilities
│   ├── core/         # OpenAPI parser and data generator
│   ├── server/       # Express server
│   ├── ui/           # React UI panel
│   └── cli/          # CLI tool
├── example-api.yaml  # Example OpenAPI specification
└── README.md
```

### Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev

# Run linter
npm run lint

# Test with example
node packages/cli/dist/cli.js generate example-api.yaml
```

---

## 🔒 Security

Built-in protection against:

- ✅ **Path Traversal** - File path validation
- ✅ **YAML Injection** - Safe YAML parsing
- ✅ **DoS Attacks** - Request size limits
- ✅ **XSS** - Input sanitization
- ✅ **CORS** - Configurable CORS rules

---

## 🌍 Platform Support

- ✅ Windows 10/11
- ✅ Linux (Ubuntu, Debian, CentOS, Fedora, etc.)
- ✅ macOS (Intel & Apple Silicon)
- ✅ Docker (any platform)

---

## 📝 Use Cases

### 1. Frontend Development Without Backend

```bash
# Create OpenAPI spec
# Start mock server
api-mock generate api.yaml

# Frontend connects to http://localhost:3000
```

### 2. API Documentation & Demos

```bash
# Run on public host
api-mock generate api.yaml --host=0.0.0.0 --port=80

# Share Postman collection with clients
# Available at http://your-server/_ui
```

### 3. Testing Race Conditions

Enable request queue in UI panel to test concurrent requests handling.

### 4. Contract Testing

Validate your API contracts before backend implementation.

---

## 🔗 Resources

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)
- [Swagger Editor](https://editor.swagger.io/)
- [Faker.js Documentation](https://fakerjs.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

## 🤝 Support

If you find this project useful, please consider giving it a ⭐️ on [GitHub](https://github.com/yourusername/api-mock-generator)!

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourusername](https://twitter.com/yourusername)
- Website: [yourwebsite.com](https://yourwebsite.com)

---

## 📄 License

This project is [MIT licensed](LICENSE).

---

<p align="center">
  Made with ❤️ for developers
</p>
