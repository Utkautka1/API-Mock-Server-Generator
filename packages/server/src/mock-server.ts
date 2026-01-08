import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import expressWs from 'express-ws';
import { ParsedEndpoint, EndpointConfig, ServerConfig } from '@api-mock-generator/shared';
import { DataGenerator, TemplateEngine } from '@api-mock-generator/core';
import { RequestQueue } from './request-queue';
import { RequestMonitor } from './request-monitor';
import { setupUIRoutes } from './ui-routes';
import { setupAPIRoutes } from './api-routes';
import { SettingsManager } from './settings-manager';

/**
 * Мок-сервер на основе Express
 * Генерирует эндпоинты из OpenAPI спецификации
 */
export class MockServer {
  // Express приложение
  private app: Express;
  // Конфигурация сервера
  private config: ServerConfig;
  // Генератор данных
  private dataGenerator: DataGenerator;
  // Движок шаблонов
  private templateEngine: TemplateEngine;
  // Очередь запросов
  private requestQueue: RequestQueue;
  // Монитор запросов
  private requestMonitor: RequestMonitor;
  // Менеджер настроек
  private settingsManager: SettingsManager;
  // Зарегистрированные эндпоинты
  private endpoints: ParsedEndpoint[] = [];

  constructor(config: ServerConfig, spec?: any) {
    // Создаем Express приложение
    this.app = express();
    // Настраиваем WebSocket поддержку
    expressWs(this.app);
    // Сохраняем конфигурацию
    this.config = config;
    // Инициализируем генератор данных с спецификацией для разрешения $ref
    this.dataGenerator = new DataGenerator(spec);
    // Инициализируем движок шаблонов
    this.templateEngine = new TemplateEngine();
    // Инициализируем очередь запросов
    this.requestQueue = new RequestQueue();
    // Инициализируем монитор запросов
    this.requestMonitor = new RequestMonitor();
    // Инициализируем менеджер настроек
    this.settingsManager = new SettingsManager(config);

    // Настраиваем middleware
    this.setupMiddleware();
    // Настраиваем WebSocket для мониторинга
    this.setupWebSocket();
    // Настраиваем UI маршруты
    setupUIRoutes(this.app, this.config, this.requestMonitor, this.settingsManager);
  }

  /**
   * Настраивает middleware Express
   */
  private setupMiddleware(): void {
    // Включаем CORS с безопасными настройками
    this.app.use(
      cors({
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // В продакшене нужно указать конкретные домены
          // Для разработки разрешаем все (можно настроить через переменные окружения)
          const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['*'];
          if (allowedOrigins.includes('*') || !origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: false, // Отключаем credentials для безопасности
        maxAge: 86400, // Кешируем на 24 часа
      })
    );

    // Устанавливаем лимиты на размер тела запроса (защита от DoS)
    const MAX_REQUEST_SIZE = '10mb';
    // Парсим JSON тела запросов с лимитом
    this.app.use(bodyParser.json({ limit: MAX_REQUEST_SIZE }));
    // Парсим URL-encoded тела запросов с лимитом
    this.app.use(bodyParser.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }));
    // Middleware для логирования запросов
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      // Логируем после отправки ответа
      res.on('finish', () => {
        this.requestMonitor.logRequest(req, res, startTime);
      });
      next();
    });
  }

  /**
   * Настраивает WebSocket для мониторинга
   */
  private setupWebSocket(): void {
    // Эндпоинт WebSocket для мониторинга
    (this.app as any).ws('/_ws', (ws: any) => {
      this.requestMonitor.addClient(ws);
    });
  }

  /**
   * Регистрирует эндпоинты из OpenAPI спецификации
   * @param endpoints - массив распарсенных эндпоинтов
   */
  registerEndpoints(endpoints: ParsedEndpoint[]): void {
    // Сохраняем эндпоинты
    this.endpoints = endpoints;
    // Регистрируем каждый эндпоинт
    for (const endpoint of endpoints) {
      this.registerEndpoint(endpoint);
    }
    // Настраиваем API маршруты для экспорта
    setupAPIRoutes(this.app, this.endpoints, this.config);
  }

  /**
   * Регистрирует один эндпоинт
   * @param endpoint - распарсенный эндпоинт
   */
  private registerEndpoint(endpoint: ParsedEndpoint): void {
    // Получаем конфигурацию эндпоинта (если есть)
    const endpointKey = `${endpoint.method}:${endpoint.path}`;
    
    // Если эндпоинт еще не в конфигурации, добавляем его с настройками по умолчанию
    if (!this.config.endpoints.has(endpointKey)) {
      this.config.endpoints.set(endpointKey, {
        path: endpoint.path,
        method: endpoint.method,
        delay: 0,
        statusCode: 200,
      });
    }
    
    const config = this.config.endpoints.get(endpointKey);

    // Создаем обработчик запроса
    const handler = async (_req: Request, res: Response, _next: NextFunction) => {
      try {
        // Применяем задержку если указана
        if (config?.delay) {
          await this.delay(config.delay);
        }

        // Генерируем ответ
        const response = await this.generateResponse(endpoint, config);

        // Устанавливаем статус код
        const statusCode = config?.statusCode || 200;
        res.status(statusCode);

        // Отправляем ответ
        res.json(response);
      } catch (error) {
        // Обрабатываем ошибки
        // eslint-disable-next-line no-console
        console.error(`Error handling ${endpoint.method} ${endpoint.path}:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };

    // Регистрируем маршрут в зависимости от метода
    const method = endpoint.method.toLowerCase() as keyof Express;
    if (config?.queueEnabled) {
      // Если включена очередь, добавляем в очередь
      this.app[method](endpoint.path, (req: Request, res: Response, next: NextFunction) => {
        this.requestQueue.enqueue(req, res, next, handler);
      });
    } else {
      // Иначе обрабатываем напрямую
      this.app[method](endpoint.path, handler);
    }
  }

  /**
   * Генерирует ответ для эндпоинта
   * @param endpoint - распарсенный эндпоинт
   * @param config - конфигурация эндпоинта
   * @returns сгенерированный ответ
   */
  private async generateResponse(
    endpoint: ParsedEndpoint,
    config?: EndpointConfig
  ): Promise<any> {
    // Если есть кастомный ответ, используем его
    if (config?.customResponse) {
      // Обрабатываем шаблоны в кастомном ответе
      return this.templateEngine.process(config.customResponse);
    }

    // Иначе генерируем на основе схемы
    if (endpoint.responseSchema) {
      return this.dataGenerator.generateFromSchema(endpoint.responseSchema);
    }

    // Если схемы нет, возвращаем пустой объект
    return {};
  }

  /**
   * Задержка выполнения
   * @param ms - миллисекунды задержки
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Запускает сервер
   * @returns Promise с запущенным сервером
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      const port = this.config.port;
      const host = this.config.host || 'localhost';

      // Запускаем сервер
      this.app.listen(port, host, () => {
        // eslint-disable-next-line no-console
        console.log(`Mock server started on http://${host}:${port}`);
        resolve();
      });
    });
  }

  /**
   * Получает Express приложение (для интеграции с UI)
   * @returns Express приложение
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Получает монитор запросов
   * @returns монитор запросов
   */
  getRequestMonitor(): RequestMonitor {
    return this.requestMonitor;
  }

  /**
   * Получает менеджер настроек
   * @returns менеджер настроек
   */
  getSettingsManager(): SettingsManager {
    return this.settingsManager;
  }
}
