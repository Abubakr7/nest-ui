# NestJS Development Studio

Build NestJS projects entirely through UI - no IDE required.

## Features

### Code Editor
- Monaco Editor with full TypeScript IntelliSense
- Syntax highlighting for TypeScript, JSON, Markdown, and more
- File tree navigation
- Multi-tab editing with unsaved changes indicator
- Keyboard shortcuts (Ctrl+S to save)

### AI Assistant (Claude AI)
- **Chat**: Ask questions about NestJS development
- **Generate**: Generate code from natural language descriptions
- **Explain**: Get explanations of your code
- **Test**: Auto-generate Jest unit tests
- **Refactor**: Get code improvement suggestions
- **Fix Error**: Paste error messages and get fixes

### Code Generators
Generate NestJS components with a single click:
- **CRUD Module**: Complete CRUD with entity, DTOs, controller, service
- **Module**: Basic NestJS module structure
- **Controller**: REST controller with endpoints
- **Service**: Business logic service
- **DTO**: Data Transfer Objects with validation
- **Guard**: Authentication/authorization guards
- **Pipe**: Transformation and validation pipes
- **Middleware**: Request middleware
- **Interceptor**: Request/response interceptors

### API Tester
Built-in HTTP client similar to Postman:
- Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Headers and query parameters management
- JSON body editor
- Response viewer with syntax highlighting
- Request history

### Terminal
Integrated terminal with WebSocket connection:
- Full shell access to project directory
- npm/pnpm commands
- Git operations
- Build and test commands

### Project Management
- Create new NestJS projects with configuration options
- Database selection (PostgreSQL, MySQL, MongoDB, SQLite)
- Authentication setup (JWT, Session, OAuth)
- Swagger documentation option
- WebSocket support option
- Start/Stop project server
- Install dependencies
- Build project

## Tech Stack

### Backend (apps/api)
- **NestJS** - Node.js framework
- **Anthropic SDK** - Claude AI integration
- **Socket.IO** - WebSocket for terminal
- **node-pty** - Terminal emulation
- **Swagger** - API documentation

### Frontend (apps/web)
- **Next.js 14** - React framework
- **Monaco Editor** - VS Code editor in browser
- **xterm.js** - Terminal emulator
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Radix UI** - UI components
- **Socket.IO Client** - Terminal connection

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd nest-ui

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Development

```bash
# Start both API and Web
pnpm dev

# Or start individually
pnpm dev:api  # API on http://localhost:4000
pnpm dev:web  # Web on http://localhost:3000
```

### API Documentation
Once the API is running, visit http://localhost:4000/api/docs for Swagger documentation.

## Project Structure

```
nest-ui/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── projects/    # Project management
│   │       │   ├── files/       # File system API
│   │       │   ├── ai/          # Claude AI integration
│   │       │   ├── generator/   # Code generators
│   │       │   ├── terminal/    # Terminal WebSocket
│   │       │   └── api-tester/  # HTTP client API
│   │       └── main.ts
│   └── web/                 # Next.js Frontend
│       └── src/
│           ├── app/
│           ├── components/
│           │   ├── ai-chat/     # AI assistant panel
│           │   ├── api-tester/  # API testing UI
│           │   ├── editor/      # Monaco editor
│           │   ├── project/     # Project management
│           │   ├── sidebar/     # File tree & generators
│           │   ├── terminal/    # Terminal emulator
│           │   └── ui/          # Shared UI components
│           ├── hooks/
│           ├── lib/
│           ├── stores/          # Zustand stores
│           └── types/
├── packages/                # Shared packages
└── projects/               # Generated NestJS projects
```

## Environment Variables

### API (apps/api/.env)
```
ANTHROPIC_API_KEY=your-api-key-here
PORT=4000
```

### Web (apps/web/.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## License

MIT
