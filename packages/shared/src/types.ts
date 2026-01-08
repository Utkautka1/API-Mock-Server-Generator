// Типы для конфигурации эндпоинта
export interface EndpointConfig {
  // Путь эндпоинта
  path?: string;
  // HTTP метод
  method?: string;
  // Задержка ответа в миллисекундах
  delay?: number;
  // HTTP статус код ответа
  statusCode?: number;
  // Кастомный ответ (может содержать шаблоны)
  customResponse?: any;
  // Включена ли очередь запросов
  queueEnabled?: boolean;
  // Размер очереди
  queueSize?: number;
}

// Типы для мониторинга запросов
export interface RequestLog {
  // ID запроса
  id: string;
  // Метод HTTP
  method: string;
  // Путь запроса
  path: string;
  // Время запроса
  timestamp: Date;
  // Заголовки запроса
  headers: Record<string, string>;
  // Тело запроса
  body?: any;
  // Параметры запроса
  query?: Record<string, any>;
  // Параметры пути
  params?: Record<string, any>;
  // Статус код ответа
  statusCode?: number;
  // Время ответа в миллисекундах
  responseTime?: number;
  // Тело ответа
  responseBody?: any;
}

// Типы для OpenAPI операции
export interface OpenAPIOperation {
  // ID операции
  operationId?: string;
  // Описание операции
  description?: string;
  // Параметры операции
  parameters?: any[];
  // Тело запроса
  requestBody?: any;
  // Ответы операции
  responses?: Record<string, any>;
  // Теги операции
  tags?: string[];
}

// Типы для парсинга OpenAPI
export interface ParsedEndpoint {
  // Путь эндпоинта
  path: string;
  // HTTP метод
  method: string;
  // Операция OpenAPI
  operation: OpenAPIOperation;
  // Схема ответа
  responseSchema?: any;
}

// Типы для конфигурации сервера
export interface ServerConfig {
  // Порт сервера
  port: number;
  // Хост сервера
  host?: string;
  // Базовый путь для UI
  uiPath?: string;
  // Конфигурация эндпоинтов
  endpoints: Map<string, EndpointConfig>;
}

// Типы для шаблонов в ответах
export type TemplateValue = string | number | boolean | null | TemplateObject | TemplateArray;

export interface TemplateObject {
  [key: string]: TemplateValue;
}

export interface TemplateArray extends Array<TemplateValue> {}
