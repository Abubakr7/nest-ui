import { Injectable, NotFoundException } from '@nestjs/common';
import { SendRequestDto, SaveRequestDto, CreateCollectionDto, RequestCollection, SavedRequest, RequestHistoryItem } from './dto/api-tester.dto';

@Injectable()
export class ApiTesterService {
  private collections: Map<string, RequestCollection> = new Map();
  private history: RequestHistoryItem[] = [];
  private readonly maxHistorySize = 100;

  async sendRequest(dto: SendRequestDto): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    time: number;
    size: number;
  }> {
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {};
      dto.headers?.forEach((h) => {
        if (h.enabled !== false) {
          headers[h.key] = h.value;
        }
      });

      // Build URL with query params
      let url = dto.url;
      if (dto.params?.length) {
        const searchParams = new URLSearchParams();
        dto.params
          .filter((p) => p.enabled !== false)
          .forEach((p) => searchParams.append(p.key, p.value));
        const queryString = searchParams.toString();
        if (queryString) {
          url += (url.includes('?') ? '&' : '?') + queryString;
        }
      }

      const fetchOptions: RequestInit = {
        method: dto.method,
        headers,
      };

      if (dto.body && ['POST', 'PUT', 'PATCH'].includes(dto.method)) {
        if (dto.bodyType === 'json') {
          fetchOptions.body = JSON.stringify(dto.body);
          if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
          }
        } else if (dto.bodyType === 'form-data') {
          const formData = new FormData();
          Object.entries(dto.body).forEach(([key, value]) => {
            formData.append(key, value as string);
          });
          fetchOptions.body = formData as any;
        } else {
          fetchOptions.body = dto.body;
        }
      }

      const response = await fetch(url, fetchOptions);
      const endTime = Date.now();

      let responseBody: any;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: endTime - startTime,
        size: JSON.stringify(responseBody).length,
      };

      // Add to history
      this.addToHistory({
        id: Date.now().toString(),
        request: dto,
        response: result,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error: any) {
      const endTime = Date.now();
      throw {
        status: 0,
        statusText: 'Error',
        headers: {},
        body: { error: error.message },
        time: endTime - startTime,
        size: 0,
      };
    }
  }

  async getCollections(): Promise<RequestCollection[]> {
    return Array.from(this.collections.values());
  }

  async createCollection(dto: CreateCollectionDto): Promise<RequestCollection> {
    const collection: RequestCollection = {
      id: Date.now().toString(),
      name: dto.name,
      description: dto.description,
      requests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.collections.set(collection.id, collection);
    return collection;
  }

  async getCollection(id: string): Promise<RequestCollection> {
    const collection = this.collections.get(id);
    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    return collection;
  }

  async deleteCollection(id: string): Promise<{ success: boolean }> {
    if (!this.collections.has(id)) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    this.collections.delete(id);
    return { success: true };
  }

  async saveRequest(
    collectionId: string,
    dto: SaveRequestDto,
  ): Promise<SavedRequest> {
    const collection = await this.getCollection(collectionId);

    const savedRequest: SavedRequest = {
      id: Date.now().toString(),
      name: dto.name,
      description: dto.description,
      method: dto.method,
      url: dto.url,
      headers: dto.headers,
      params: dto.params,
      body: dto.body,
      bodyType: dto.bodyType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    collection.requests.push(savedRequest);
    collection.updatedAt = new Date().toISOString();

    return savedRequest;
  }

  async deleteRequest(
    collectionId: string,
    requestId: string,
  ): Promise<{ success: boolean }> {
    const collection = await this.getCollection(collectionId);

    const index = collection.requests.findIndex((r) => r.id === requestId);
    if (index === -1) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }

    collection.requests.splice(index, 1);
    collection.updatedAt = new Date().toISOString();

    return { success: true };
  }

  async getHistory(): Promise<RequestHistoryItem[]> {
    return this.history;
  }

  async clearHistory(): Promise<{ success: boolean }> {
    this.history = [];
    return { success: true };
  }

  private addToHistory(item: RequestHistoryItem): void {
    this.history.unshift(item);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }
}
