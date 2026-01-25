import { Injectable, MessageEvent } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { Observable } from 'rxjs';
import {
  GenerateCodeDto,
  ExplainCodeDto,
  RefactorCodeDto,
  GenerateTestDto,
  ChatMessageDto,
  FixErrorDto,
} from './dto/ai.dto';

@Injectable()
export class AiService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  private readonly systemPrompt = `You are an expert NestJS developer assistant. You help developers build NestJS applications through a web-based IDE.

Your responsibilities:
1. Generate clean, well-structured NestJS code following best practices
2. Use TypeScript with proper typing
3. Follow NestJS patterns: modules, controllers, services, DTOs, guards, pipes
4. Include proper decorators and validation
5. Generate Swagger documentation when appropriate
6. Write testable code with dependency injection

When generating code:
- Use @nestjs/common, @nestjs/core decorators
- Include class-validator for DTOs
- Use @nestjs/swagger for API documentation
- Follow REST conventions
- Include proper error handling

Always respond with well-formatted code that can be directly used in a NestJS project.`;

  async generateCode(dto: GenerateCodeDto): Promise<{ code: string; explanation: string }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate NestJS code for: ${dto.description}

Type of code: ${dto.type || 'auto-detect'}
${dto.context ? `Context: ${dto.context}` : ''}

Please provide:
1. The complete code
2. A brief explanation of what the code does

Format your response as JSON:
{
  "code": "// your code here",
  "explanation": "explanation here"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    try {
      const parsed = JSON.parse(content.text);
      return parsed;
    } catch {
      // If not valid JSON, extract code from response
      return {
        code: content.text,
        explanation: 'Code generated successfully',
      };
    }
  }

  generateCodeStream(dto: GenerateCodeDto): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      this.anthropic.messages
        .stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: this.systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Generate NestJS code for: ${dto.description}
Type: ${dto.type || 'auto-detect'}
${dto.context ? `Context: ${dto.context}` : ''}`,
            },
          ],
        })
        .on('text', (text) => {
          subscriber.next({ data: { type: 'text', content: text } });
        })
        .on('error', (error) => {
          subscriber.error(error);
        })
        .on('end', () => {
          subscriber.next({ data: { type: 'done' } });
          subscriber.complete();
        });
    });
  }

  async explainCode(dto: ExplainCodeDto): Promise<{ explanation: string }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Explain the following NestJS code in detail:

\`\`\`${dto.language || 'typescript'}
${dto.code}
\`\`\`

Explain:
1. What this code does
2. Key NestJS patterns used
3. How different parts interact
4. Any potential issues or improvements`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return { explanation: content.text };
  }

  async refactorCode(dto: RefactorCodeDto): Promise<{ refactoredCode: string; changes: string[] }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Refactor the following NestJS code:

\`\`\`typescript
${dto.code}
\`\`\`

${dto.instructions ? `Refactoring instructions: ${dto.instructions}` : 'Apply best practices and improve code quality.'}

Respond in JSON format:
{
  "refactoredCode": "// refactored code",
  "changes": ["list of changes made"]
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    try {
      return JSON.parse(content.text);
    } catch {
      return {
        refactoredCode: content.text,
        changes: ['Code refactored'],
      };
    }
  }

  async generateTest(dto: GenerateTestDto): Promise<{ testCode: string }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate Jest unit tests for the following NestJS code:

\`\`\`typescript
${dto.code}
\`\`\`

Test framework: ${dto.framework || 'jest'}

Include:
1. Mock dependencies using @nestjs/testing
2. Test all public methods
3. Include edge cases
4. Use describe/it blocks
5. Include proper assertions`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract code from markdown code blocks if present
    const codeMatch = content.text.match(/```typescript\n([\s\S]*?)```/);
    return {
      testCode: codeMatch ? codeMatch[1] : content.text,
    };
  }

  async fixError(dto: FixErrorDto): Promise<{ fixedCode: string; explanation: string }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Fix the following NestJS code error:

Code:
\`\`\`typescript
${dto.code}
\`\`\`

Error:
${dto.error}

${dto.stackTrace ? `Stack trace:\n${dto.stackTrace}` : ''}

Respond in JSON:
{
  "fixedCode": "// fixed code",
  "explanation": "what was wrong and how it was fixed"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    try {
      return JSON.parse(content.text);
    } catch {
      return {
        fixedCode: content.text,
        explanation: 'Error fixed',
      };
    }
  }

  async chat(dto: ChatMessageDto): Promise<{ response: string }> {
    const messages = dto.history?.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })) || [];

    messages.push({ role: 'user', content: dto.message });

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `${this.systemPrompt}

${dto.projectContext ? `Current project context: ${dto.projectContext}` : ''}`,
      messages,
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return { response: content.text };
  }

  chatStream(dto: ChatMessageDto): Observable<MessageEvent> {
    const messages = dto.history?.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })) || [];

    messages.push({ role: 'user', content: dto.message });

    return new Observable((subscriber) => {
      this.anthropic.messages
        .stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: `${this.systemPrompt}

${dto.projectContext ? `Current project context: ${dto.projectContext}` : ''}`,
          messages,
        })
        .on('text', (text) => {
          subscriber.next({ data: { type: 'text', content: text } });
        })
        .on('error', (error) => {
          subscriber.error(error);
        })
        .on('end', () => {
          subscriber.next({ data: { type: 'done' } });
          subscriber.complete();
        });
    });
  }

  async generateModule(dto: {
    description: string;
    moduleName: string;
    features: string[];
  }): Promise<{ files: Array<{ path: string; content: string }> }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a complete NestJS module with the following specifications:

Module name: ${dto.moduleName}
Description: ${dto.description}
Features: ${dto.features.join(', ')}

Generate all necessary files:
1. ${dto.moduleName}.module.ts
2. ${dto.moduleName}.controller.ts
3. ${dto.moduleName}.service.ts
4. dto/ folder with relevant DTOs
5. entities/ folder if needed

Respond in JSON format:
{
  "files": [
    { "path": "path/to/file.ts", "content": "// file content" }
  ]
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    try {
      return JSON.parse(content.text);
    } catch {
      return { files: [] };
    }
  }

  async generateApi(dto: {
    entityName: string;
    fields: Array<{ name: string; type: string }>;
  }): Promise<{ files: Array<{ path: string; content: string }> }> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: this.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a complete CRUD REST API for the following entity:

Entity: ${dto.entityName}
Fields:
${dto.fields.map((f) => `- ${f.name}: ${f.type}`).join('\n')}

Generate:
1. Module file
2. Controller with full CRUD operations
3. Service with business logic
4. DTOs (Create, Update, Response)
5. Entity class

Include:
- Swagger documentation
- Validation decorators
- Proper typing
- Error handling

Respond in JSON format:
{
  "files": [
    { "path": "path/to/file.ts", "content": "// file content" }
  ]
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    try {
      return JSON.parse(content.text);
    } catch {
      return { files: [] };
    }
  }
}
