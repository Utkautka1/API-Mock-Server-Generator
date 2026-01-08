/**
 * Валидаторы для проверки входных данных
 */

/**
 * Валидирует порт сервера
 * @param port - порт для проверки
 * @returns true если порт валиден
 */
export function isValidPort(port: number): boolean {
  // Порт должен быть в диапазоне 1-65535
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * Валидирует хост сервера
 * @param host - хост для проверки
 * @returns true если хост валиден
 */
export function isValidHost(host: string): boolean {
  // Проверяем что хост не пустой и не содержит опасных символов
  if (!host || typeof host !== 'string') {
    return false;
  }
  // Проверяем на наличие опасных символов
  if (/[<>'"&]/.test(host)) {
    return false;
  }
  // Проверяем длину
  if (host.length > 253) {
    return false;
  }
  return true;
}

/**
 * Валидирует путь к файлу (защита от Path Traversal)
 * @param filePath - путь к файлу
 * @param basePath - базовый путь (опционально)
 * @returns true если путь безопасен
 */
export function isValidFilePath(filePath: string, basePath?: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  // Проверяем на наличие опасных паттернов
  const dangerousPatterns = [
    /\.\./, // Path traversal
    /\/\//, // Double slash
    /\\\\/, // Double backslash
    /[<>:"|?*]/, // Недопустимые символы в Windows
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(filePath)) {
      return false;
    }
  }

  // Если указан базовый путь, проверяем что файл находится внутри него
  if (basePath) {
    const path = require('path');
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(basePath);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return false;
    }
  }

  return true;
}

/**
 * Валидирует HTTP метод
 * @param method - метод для проверки
 * @returns true если метод валиден
 */
export function isValidHttpMethod(method: string): boolean {
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  return validMethods.includes(method.toUpperCase());
}

/**
 * Валидирует путь эндпоинта
 * @param endpointPath - путь эндпоинта
 * @returns true если путь валиден
 */
export function isValidEndpointPath(endpointPath: string): boolean {
  if (!endpointPath || typeof endpointPath !== 'string') {
    return false;
  }
  // Проверяем что путь начинается с /
  if (!endpointPath.startsWith('/')) {
    return false;
  }
  // Проверяем на наличие опасных символов
  if (/[<>'"&]/.test(endpointPath)) {
    return false;
  }
  // Проверяем длину
  if (endpointPath.length > 2048) {
    return false;
  }
  return true;
}

/**
 * Санитизирует строку (удаляет опасные символы)
 * @param str - строка для санитизации
 * @returns санитизированная строка
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  // Удаляем опасные символы
  return str.replace(/[<>'"&]/g, '').trim();
}

/**
 * Валидирует задержку ответа
 * @param delay - задержка в миллисекундах
 * @returns true если задержка валидна
 */
export function isValidDelay(delay: number): boolean {
  // Задержка должна быть неотрицательным числом и не более 60 секунд
  return Number.isFinite(delay) && delay >= 0 && delay <= 60000;
}

/**
 * Валидирует HTTP статус код
 * @param statusCode - статус код
 * @returns true если статус код валиден
 */
export function isValidStatusCode(statusCode: number): boolean {
  // Статус код должен быть в диапазоне 100-599
  return Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599;
}
