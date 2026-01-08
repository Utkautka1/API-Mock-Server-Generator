import { Request, Response } from 'express';
import { RequestLog } from '@api-mock-generator/shared';
import { WebSocket } from 'ws';

/**
 * Монитор запросов для отслеживания в реальном времени
 * Отправляет логи запросов через WebSocket
 */
export class RequestMonitor {
  // Список подключенных WebSocket клиентов
  private clients: Set<WebSocket> = new Set();
  // История запросов (последние 1000)
  private history: RequestLog[] = [];
  // Максимальный размер истории (защита от переполнения памяти)
  private maxHistorySize = 1000;

  /**
   * Добавляет WebSocket клиента для мониторинга
   * @param ws - WebSocket соединение
   */
  addClient(ws: WebSocket): void {
    this.clients.add(ws);
    // Отправляем историю новому клиенту
    ws.send(JSON.stringify({ type: 'history', data: this.history }));

    // Обрабатываем закрытие соединения
    ws.on('close', () => {
      this.clients.delete(ws);
    });
  }

  /**
   * Логирует запрос
   * @param req - объект запроса Express
   * @param res - объект ответа Express
   * @param startTime - время начала обработки запроса
   */
  logRequest(req: Request, res: Response, startTime: number): void {
    try {
      // Вычисляем время ответа
      const responseTime = Date.now() - startTime;

      // Ограничиваем размер пути (защита от переполнения)
      const safePath = req.path.length > 2048 ? req.path.substring(0, 2048) : req.path;

      // Санитизируем заголовки (ограничиваем размер и количество)
      const safeHeaders: Record<string, string> = {};
      let headerCount = 0;
      const MAX_HEADERS = 50;
      const MAX_HEADER_VALUE_LENGTH = 1000;

      for (const [key, value] of Object.entries(req.headers)) {
        if (headerCount >= MAX_HEADERS) {
          break;
        }
        const headerValue = Array.isArray(value) ? value.join(', ') : String(value);
        safeHeaders[key] =
          headerValue.length > MAX_HEADER_VALUE_LENGTH
            ? headerValue.substring(0, MAX_HEADER_VALUE_LENGTH)
            : headerValue;
        headerCount++;
      }

      // Ограничиваем размер query параметров
      const safeQuery: Record<string, any> = {};
      let queryCount = 0;
      const MAX_QUERY_PARAMS = 100;

      for (const [key, value] of Object.entries(req.query)) {
        if (queryCount >= MAX_QUERY_PARAMS) {
          break;
        }
        // Ограничиваем размер значения
        const queryValue = String(value);
        safeQuery[key] =
          queryValue.length > 1000 ? queryValue.substring(0, 1000) : queryValue;
        queryCount++;
      }

      // Ограничиваем размер params
      const safeParams: Record<string, any> = {};
      if (req.params) {
        for (const [key, value] of Object.entries(req.params)) {
          const paramValue = String(value);
          safeParams[key] = paramValue.length > 1000 ? paramValue.substring(0, 1000) : paramValue;
        }
      }

      // Создаем лог запроса
      const log: RequestLog = {
        id: this.generateRequestId(),
        method: req.method,
        path: safePath,
        timestamp: new Date(),
        headers: safeHeaders,
        query: safeQuery,
        params: safeParams,
        statusCode: res.statusCode,
        responseTime,
      };

      // Пытаемся получить тело запроса (если доступно, с ограничением размера)
      if (req.body && typeof req.body === 'object') {
        try {
          const bodyString = JSON.stringify(req.body);
          const MAX_BODY_SIZE = 10000; // 10KB для лога
          if (bodyString.length <= MAX_BODY_SIZE) {
            log.body = req.body;
          } else {
            // Если тело слишком большое, сохраняем только информацию о размере
            log.body = { _truncated: true, _size: bodyString.length };
          }
        } catch {
          // Игнорируем ошибки сериализации
        }
      }

      // Добавляем в историю
      this.addToHistory(log);

      // Отправляем всем подключенным клиентам
      this.broadcast({ type: 'request', data: log });
    } catch (error) {
      // В случае ошибки логирования просто игнорируем (не критично)
      // eslint-disable-next-line no-console
      console.error('Error logging request:', error);
    }
  }

  /**
   * Добавляет лог в историю
   * @param log - лог запроса
   */
  private addToHistory(log: RequestLog): void {
    // Добавляем в начало массива
    this.history.unshift(log);
    // Ограничиваем размер истории
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Отправляет сообщение всем подключенным клиентам
   * @param message - сообщение для отправки
   */
  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    // Отправляем всем клиентам
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (error) {
          // Удаляем клиента при ошибке
          this.clients.delete(client);
        }
      }
    });
  }

  /**
   * Генерирует уникальный ID для запроса
   * @returns уникальный ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получает историю запросов
   * @returns массив логов запросов
   */
  getHistory(): RequestLog[] {
    return [...this.history];
  }

  /**
   * Очищает историю запросов
   */
  clearHistory(): void {
    this.history = [];
    // Уведомляем клиентов об очистке
    this.broadcast({ type: 'history-cleared' });
  }
}
