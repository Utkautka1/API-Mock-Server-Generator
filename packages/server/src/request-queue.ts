import { Request, Response, NextFunction } from 'express';

/**
 * Очередь запросов для тестирования race conditions
 * Позволяет контролировать порядок обработки запросов
 */
export class RequestQueue {
  // Очередь запросов
  private queue: Array<{
    req: Request;
    res: Response;
    next: NextFunction;
    handler: (req: Request, res: Response, next: NextFunction) => void;
  }> = [];
  // Флаг активности обработки
  private processing = false;
  // Максимальный размер очереди
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  /**
   * Добавляет запрос в очередь
   * @param req - объект запроса Express
   * @param res - объект ответа Express
   * @param next - функция next Express
   * @param handler - обработчик запроса
   */
  enqueue(
    req: Request,
    res: Response,
    next: NextFunction,
    handler: (req: Request, res: Response, next: NextFunction) => void
  ): void {
    // Проверяем размер очереди
    if (this.queue.length >= this.maxSize) {
      // Если очередь переполнена, отправляем ошибку
      res.status(503).json({ error: 'Request queue is full' });
      return;
    }

    // Добавляем запрос в очередь
    this.queue.push({ req, res, next, handler });
    // Запускаем обработку если еще не запущена
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Обрабатывает очередь запросов последовательно
   */
  private async processQueue(): Promise<void> {
    this.processing = true;

    // Обрабатываем запросы пока очередь не пуста
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        // Вызываем обработчик запроса
        try {
          await new Promise<void>((resolve) => {
            // Оборачиваем обработчик в Promise для контроля завершения
            const originalEnd = item.res.end.bind(item.res);
            item.res.end = function (chunk?: any, encoding?: any, cb?: any) {
              const result = originalEnd(chunk, encoding, cb);
              resolve();
              return result;
            };
            // Вызываем обработчик
            item.handler(item.req, item.res, item.next);
          });
        } catch (error) {
          // Обрабатываем ошибки
          // eslint-disable-next-line no-console
          console.error('Error processing queued request:', error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Очищает очередь
   */
  clear(): void {
    // Отправляем ошибку всем ожидающим запросам
    this.queue.forEach((item) => {
      item.res.status(503).json({ error: 'Request queue cleared' });
    });
    // Очищаем очередь
    this.queue = [];
  }

  /**
   * Получает текущий размер очереди
   * @returns размер очереди
   */
  getSize(): number {
    return this.queue.length;
  }
}
