import express, { Express, Request, Response } from 'express';
import { RequestMonitor } from './request-monitor';
import { SettingsManager } from './settings-manager';
import {
  ServerConfig,
  EndpointConfig,
  isValidDelay,
  isValidStatusCode,
  isValidHttpMethod,
  isValidEndpointPath,
  sanitizeString,
} from '@api-mock-generator/shared';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Настраивает маршруты для UI и API
 * @param app - Express приложение
 * @param config - конфигурация сервера
 * @param requestMonitor - монитор запросов
 * @param settingsManager - менеджер настроек
 */
export function setupUIRoutes(
  app: Express,
  config: ServerConfig,
  requestMonitor: RequestMonitor,
  settingsManager?: SettingsManager
): void {
  // API маршрут для получения статистики
  app.get('/api/stats', (_req, res) => {
    const history = requestMonitor.getHistory();
    const stats = {
      totalRequests: history.length,
      activeEndpoints: config.endpoints.size,
      avgResponseTime:
        history.length > 0
          ? Math.round(history.reduce((sum, log) => sum + (log.responseTime || 0), 0) / history.length)
          : 0,
    };
    res.json(stats);
  });

  // API маршрут для получения списка эндпоинтов
  app.get('/api/endpoints', (_req: Request, res: Response) => {
    const endpoints: any[] = [];
    config.endpoints.forEach((endpointConfig: EndpointConfig, key: string) => {
      const [method, path] = key.split(':');
      endpoints.push({
        method,
        path,
        delay: endpointConfig.delay,
        statusCode: endpointConfig.statusCode,
      });
    });
    res.json(endpoints);
  });

  // API маршрут для получения истории запросов
  app.get('/api/history', (req: Request, res: Response) => {
    try {
      // Ограничиваем количество возвращаемых записей (защита от перегрузки)
      const limit = parseInt(req.query.limit as string, 10) || 1000;
      const safeLimit = Math.min(Math.max(1, limit), 1000); // От 1 до 1000

      const history = requestMonitor.getHistory();
      // Возвращаем только последние N записей
      const limitedHistory = history.slice(0, safeLimit);
      res.json(limitedHistory);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading history:', error);
      res.status(500).json({ error: 'Failed to load history' });
    }
  });

  // API маршрут для очистки истории
  app.post('/api/history/clear', (_req, res) => {
    requestMonitor.clearHistory();
    res.json({ success: true });
  });

  // API маршрут для сохранения настроек
  app.post('/api/settings', (req: Request, res: Response) => {
    try {
      if (!settingsManager) {
        res.status(500).json({ error: 'Settings manager not available' });
        return;
      }

      // Валидируем входные данные
      const { defaultDelay, defaultStatusCode } = req.body;

      // Валидируем задержку если указана
      if (defaultDelay !== undefined) {
        if (!isValidDelay(defaultDelay)) {
          res.status(400).json({ error: 'Недопустимая задержка (0-60000 мс)' });
          return;
        }
      }

      // Валидируем статус код если указан
      if (defaultStatusCode !== undefined) {
        if (!isValidStatusCode(defaultStatusCode)) {
          res.status(400).json({ error: 'Недопустимый статус код (100-599)' });
          return;
        }
      }

      // Сохраняем общие настройки сервера (только валидные поля)
      const validSettings: Record<string, any> = {};
      if (defaultDelay !== undefined) {
        validSettings.defaultDelay = defaultDelay;
      }
      if (defaultStatusCode !== undefined) {
        validSettings.defaultStatusCode = defaultStatusCode;
      }

      settingsManager.saveServerSettings(validSettings);
      res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // API маршрут для получения настроек
  app.get('/api/settings', (_req: Request, res: Response) => {
    try {
      if (settingsManager) {
        const settings = settingsManager.getServerSettings();
        res.json(settings);
      } else {
        res.json({});
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to load settings' });
    }
  });

  // API маршрут для сохранения настроек эндпоинта
  app.put('/api/endpoints/:method/:path', (req: Request, res: Response) => {
    try {
      if (!settingsManager) {
        res.status(500).json({ error: 'Settings manager not available' });
        return;
      }

      // Валидируем параметры пути
      const method = sanitizeString(req.params.method);
      const endpointPath = decodeURIComponent(req.params.path);

      if (!isValidHttpMethod(method)) {
        res.status(400).json({ error: 'Недопустимый HTTP метод' });
        return;
      }

      if (!isValidEndpointPath(endpointPath)) {
        res.status(400).json({ error: 'Недопустимый путь эндпоинта' });
        return;
      }

      // Валидируем тело запроса
      const { delay, statusCode, customResponse, queueEnabled, queueSize } = req.body;

      // Создаем валидную конфигурацию эндпоинта
      const endpointConfig: Partial<EndpointConfig> = {};

      // Валидируем и добавляем задержку
      if (delay !== undefined) {
        if (!isValidDelay(delay)) {
          res.status(400).json({ error: 'Недопустимая задержка (0-60000 мс)' });
          return;
        }
        endpointConfig.delay = delay;
      }

      // Валидируем и добавляем статус код
      if (statusCode !== undefined) {
        if (!isValidStatusCode(statusCode)) {
          res.status(400).json({ error: 'Недопустимый статус код (100-599)' });
          return;
        }
        endpointConfig.statusCode = statusCode;
      }

      // Валидируем кастомный ответ (должен быть объектом или массивом)
      if (customResponse !== undefined) {
        if (typeof customResponse !== 'object' || customResponse === null) {
          res.status(400).json({ error: 'Кастомный ответ должен быть объектом или массивом' });
          return;
        }
        // Ограничиваем размер кастомного ответа (максимум 1MB при сериализации)
        const serialized = JSON.stringify(customResponse);
        if (serialized.length > 1024 * 1024) {
          res.status(400).json({ error: 'Кастомный ответ слишком большой (максимум 1MB)' });
          return;
        }
        endpointConfig.customResponse = customResponse;
      }

      // Валидируем очередь
      if (queueEnabled !== undefined) {
        if (typeof queueEnabled !== 'boolean') {
          res.status(400).json({ error: 'queueEnabled должен быть булевым значением' });
          return;
        }
        endpointConfig.queueEnabled = queueEnabled;
      }

      if (queueSize !== undefined) {
        if (!Number.isInteger(queueSize) || queueSize < 1 || queueSize > 100) {
          res.status(400).json({ error: 'Размер очереди должен быть от 1 до 100' });
          return;
        }
        endpointConfig.queueSize = queueSize;
      }

      const endpointKey = `${method.toUpperCase()}:${endpointPath}`;
      // Сохраняем настройки эндпоинта
      settingsManager.saveEndpointConfig(endpointKey, endpointConfig as EndpointConfig);
      res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving endpoint settings:', error);
      res.status(500).json({ error: 'Failed to save endpoint settings' });
    }
  });

  // API маршрут для получения настроек эндпоинта
  app.get('/api/endpoints/:method/:path', (req: Request, res: Response) => {
    try {
      if (!settingsManager) {
        res.json({});
        return;
      }

      // Валидируем параметры пути
      const method = sanitizeString(req.params.method);
      const endpointPath = decodeURIComponent(req.params.path);

      if (!isValidHttpMethod(method)) {
        res.status(400).json({ error: 'Недопустимый HTTP метод' });
        return;
      }

      if (!isValidEndpointPath(endpointPath)) {
        res.status(400).json({ error: 'Недопустимый путь эндпоинта' });
        return;
      }

      const endpointKey = `${method.toUpperCase()}:${endpointPath}`;
      const endpointConfig = settingsManager.getEndpointConfig(endpointKey);
      res.json(endpointConfig || ({} as EndpointConfig));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading endpoint settings:', error);
      res.status(500).json({ error: 'Failed to load endpoint settings' });
    }
  });

  // Статические файлы UI (в продакшене должны быть собраны)
  const uiPath = config.uiPath || '/_ui';
  const uiDistPath = path.join(__dirname, '../../ui/dist');
  
  // Раздача статических файлов UI
  app.use(uiPath, express.static(uiDistPath, { fallthrough: true }));
  
  // ВАЖНО: Fallback для всех маршрутов SPA (включая вложенные)
  // Добавляем * чтобы перехватывать /_ui/endpoints, /_ui/settings и т.д.
  app.get([`${uiPath}`, `${uiPath}/*`], (_req: Request, res: Response) => {
    const indexPath = path.join(uiDistPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback для разработки
      res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Mock Server - UI Panel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 600px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: bold;
            margin: 1rem 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .info {
            background: rgba(255, 255, 255, 0.2);
            padding: 1.5rem;
            border-radius: 10px;
            margin: 2rem 0;
            text-align: left;
        }
        .info-item {
            margin: 0.5rem 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .label { opacity: 0.9; }
        .value {
            font-weight: bold;
            font-family: 'Courier New', monospace;
            background: rgba(0,0,0,0.2);
            padding: 0.3rem 0.6rem;
            border-radius: 5px;
        }
        .endpoints {
            background: rgba(255, 255, 255, 0.2);
            padding: 1.5rem;
            border-radius: 10px;
            margin: 2rem 0;
        }
        .endpoint {
            background: rgba(255, 255, 255, 0.3);
            padding: 0.8rem;
            margin: 0.5rem 0;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .method {
            display: inline-block;
            padding: 0.3rem 0.8rem;
            border-radius: 5px;
            font-weight: bold;
            font-size: 0.85rem;
            min-width: 60px;
            text-align: center;
        }
        .method.get { background: #10b981; }
        .method.post { background: #3b82f6; }
        .method.put { background: #f59e0b; }
        .method.delete { background: #ef4444; }
        .path {
            font-family: 'Courier New', monospace;
            flex: 1;
            margin-left: 1rem;
            text-align: left;
        }
        .api-link {
            color: #fff;
            text-decoration: none;
            background: rgba(255,255,255,0.2);
            padding: 0.3rem 0.6rem;
            border-radius: 5px;
            font-size: 0.85rem;
            transition: background 0.3s;
        }
        .api-link:hover {
            background: rgba(255,255,255,0.3);
        }
        .note {
            margin-top: 2rem;
            opacity: 0.8;
            font-size: 0.9rem;
        }
        .emoji { font-size: 3rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">🚀</div>
        <h1>API Mock Server</h1>
        <div class="status">● Server Running</div>
        
        <div class="info">
            <div class="info-item">
                <span class="label">Server Address:</span>
                <span class="value">http://localhost:${config.port}</span>
            </div>
            <div class="info-item">
                <span class="label">Endpoints:</span>
                <span class="value">${config.endpoints.size} endpoints</span>
            </div>
            <div class="info-item">
                <span class="label">Status:</span>
                <span class="value" style="color: #10b981;">✓ Active</span>
            </div>
        </div>

        <div class="endpoints">
            <h3 style="margin-bottom: 1rem;">📡 Available Endpoints</h3>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/users</span>
                <a href="http://localhost:${config.port}/users" class="api-link" target="_blank">Try →</a>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/users/{id}</span>
                <a href="http://localhost:${config.port}/users/550e8400-e29b-41d4-a716-446655440000" class="api-link" target="_blank">Try →</a>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/users</span>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/orders</span>
                <a href="http://localhost:${config.port}/orders" class="api-link" target="_blank">Try →</a>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/orders</span>
            </div>
        </div>

        <div style="margin-top: 2rem;">
            <a href="http://localhost:${config.port}/api/export/postman" style="color: #fff; text-decoration: underline; margin: 0 1rem;">📥 Export Postman</a>
            <a href="http://localhost:${config.port}/api/export/insomnia" style="color: #fff; text-decoration: underline; margin: 0 1rem;">📥 Export Insomnia</a>
        </div>

        <p class="note">
            💡 This is a temporary UI. Full React UI panel coming soon!<br>
            Try the endpoints above to see the mock server in action.
        </p>
    </div>
</body>
</html>
      `);
    }
  });
}
