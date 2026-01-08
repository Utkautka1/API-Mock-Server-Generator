import { Express } from 'express';
import { exportPostmanCollection, exportInsomniaCollection } from './export-collection';
import { ParsedEndpoint } from '@api-mock-generator/shared';
import { ServerConfig } from '@api-mock-generator/shared';

/**
 * Настраивает API маршруты для экспорта коллекций
 * @param app - Express приложение
 * @param endpoints - массив эндпоинтов
 * @param config - конфигурация сервера
 */
export function setupAPIRoutes(
  app: Express,
  endpoints: ParsedEndpoint[],
  config: ServerConfig
): void {
  // Экспорт коллекции Postman
  app.get('/api/export/postman', (_req, res) => {
    const collection = exportPostmanCollection(endpoints, config);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="postman-collection.json"');
    res.json(collection);
  });

  // Экспорт коллекции Insomnia
  app.get('/api/export/insomnia', (_req, res) => {
    const collection = exportInsomniaCollection(endpoints, config);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="insomnia-collection.json"');
    res.json(collection);
  });
}
