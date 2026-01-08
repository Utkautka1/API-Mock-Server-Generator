import { ParsedEndpoint, ServerConfig } from '@api-mock-generator/shared';

/**
 * Экспортирует коллекцию для Postman
 * @param endpoints - массив эндпоинтов
 * @param config - конфигурация сервера
 * @returns объект коллекции Postman
 */
export function exportPostmanCollection(
  endpoints: ParsedEndpoint[],
  config: ServerConfig
): any {
  // Создаем базовую структуру коллекции Postman
  const collection = {
    info: {
      name: 'API Mock Server Collection',
      description: 'Автоматически сгенерированная коллекция из OpenAPI спецификации',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [] as any[],
  };

  // Группируем эндпоинты по тегам
  const endpointsByTag: Record<string, ParsedEndpoint[]> = {};
  const untagged: ParsedEndpoint[] = [];

  for (const endpoint of endpoints) {
    const tags = endpoint.operation.tags || [];
    if (tags.length > 0) {
      const tag = tags[0];
      if (!endpointsByTag[tag]) {
        endpointsByTag[tag] = [];
      }
      endpointsByTag[tag].push(endpoint);
    } else {
      untagged.push(endpoint);
    }
  }

  // Создаем папки по тегам
  for (const [tag, tagEndpoints] of Object.entries(endpointsByTag)) {
    const folder = {
      name: tag,
      item: tagEndpoints.map((endpoint) => createPostmanItem(endpoint, config)),
    };
    collection.item.push(folder);
  }

  // Добавляем эндпоинты без тегов
  for (const endpoint of untagged) {
    collection.item.push(createPostmanItem(endpoint, config));
  }

  return collection;
}

/**
 * Создает элемент Postman из эндпоинта
 * @param endpoint - распарсенный эндпоинт
 * @param config - конфигурация сервера
 * @returns элемент Postman
 */
function createPostmanItem(endpoint: ParsedEndpoint, config: ServerConfig): any {
  // Создаем базовый URL
  const baseUrl = `http://${config.host || 'localhost'}:${config.port}`;
  // Преобразуем Express путь в обычный URL
  const url = baseUrl + endpoint.path.replace(/:\w+/g, (match: string) => `{{${match.slice(1)}}}`);

  // Создаем запрос Postman
  const item: any = {
    name: endpoint.operation.operationId || `${endpoint.method} ${endpoint.path}`,
    request: {
      method: endpoint.method,
      header: [],
      url: {
        raw: url,
        host: [config.host || 'localhost'],
        port: config.port.toString(),
        path: endpoint.path.split('/').filter((p: string) => p),
      },
    },
  };

  // Добавляем описание если есть
  if (endpoint.operation.description) {
    item.request.description = endpoint.operation.description;
  }

  // Добавляем параметры запроса
  if (endpoint.operation.parameters) {
    const queryParams: any[] = [];
    const pathParams: any[] = [];
    const headers: any[] = [];

    for (const param of endpoint.operation.parameters) {
      const paramItem = {
        key: param.name,
        value: '',
        description: param.description || '',
      };

      if (param.in === 'query') {
        queryParams.push(paramItem);
      } else if (param.in === 'path') {
        pathParams.push(paramItem);
      } else if (param.in === 'header') {
        headers.push(paramItem);
      }
    }

    if (queryParams.length > 0) {
      item.request.url.query = queryParams;
    }
    if (headers.length > 0) {
      item.request.header = headers;
    }
  }

  // Добавляем тело запроса если есть
  if (endpoint.operation.requestBody) {
    item.request.body = {
      mode: 'raw',
      raw: '{}',
      options: {
        raw: {
          language: 'json',
        },
      },
    };
  }

  return item;
}

/**
 * Экспортирует коллекцию для Insomnia
 * @param endpoints - массив эндпоинтов
 * @param config - конфигурация сервера
 * @returns объект коллекции Insomnia
 */
export function exportInsomniaCollection(
  endpoints: ParsedEndpoint[],
  config: ServerConfig
): any {
  // Создаем базовую структуру коллекции Insomnia
  const collection = {
    _type: 'export',
    __export_format: 4,
    __export_date: new Date().toISOString(),
    __export_source: 'api-mock-generator',
    resources: [] as any[],
  };

  // Создаем ресурсы для каждого эндпоинта
  for (const endpoint of endpoints) {
    const resource = createInsomniaResource(endpoint, config);
    collection.resources.push(resource);
  }

  return collection;
}

/**
 * Создает ресурс Insomnia из эндпоинта
 * @param endpoint - распарсенный эндпоинт
 * @param config - конфигурация сервера
 * @returns ресурс Insomnia
 */
function createInsomniaResource(endpoint: ParsedEndpoint, config: ServerConfig): any {
  // Создаем базовый URL
  const baseUrl = `http://${config.host || 'localhost'}:${config.port}`;
  const url = baseUrl + endpoint.path;

  // Создаем ресурс Insomnia
  const resource: any = {
    _id: `req_${endpoint.method}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
    _type: 'request',
    _parentId: null,
    name: endpoint.operation.operationId || `${endpoint.method} ${endpoint.path}`,
    description: endpoint.operation.description || '',
    url: url,
    method: endpoint.method,
    headers: [],
    body: {},
    parameters: [],
  };

  // Добавляем параметры запроса
  if (endpoint.operation.parameters) {
    for (const param of endpoint.operation.parameters) {
      if (param.in === 'query' || param.in === 'path') {
        resource.parameters.push({
          name: param.name,
          value: '',
          description: param.description || '',
        });
      } else if (param.in === 'header') {
        resource.headers.push({
          name: param.name,
          value: '',
        });
      }
    }
  }

  return resource;
}
