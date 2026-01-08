import * as fs from 'fs';
import * as path from 'path';
import { ServerConfig, EndpointConfig, isValidFilePath } from '@api-mock-generator/shared';

/**
 * Менеджер настроек сервера
 * Управляет сохранением и загрузкой настроек эндпоинтов
 */
export class SettingsManager {
  // Конфигурация сервера
  private config: ServerConfig;
  // Путь к файлу настроек (опционально)
  private settingsPath?: string;

  constructor(config: ServerConfig, settingsPath?: string) {
    this.config = config;
    this.settingsPath = settingsPath;
  }

  /**
   * Сохраняет настройки эндпоинта
   * @param endpointKey - ключ эндпоинта (метод:путь)
   * @param endpointConfig - конфигурация эндпоинта
   */
  saveEndpointConfig(endpointKey: string, endpointConfig: EndpointConfig): void {
    // Сохраняем в конфигурацию
    this.config.endpoints.set(endpointKey, endpointConfig);
    // Если указан путь к файлу, сохраняем на диск
    if (this.settingsPath) {
      this.saveToFile();
    }
  }

  /**
   * Получает настройки эндпоинта
   * @param endpointKey - ключ эндпоинта (метод:путь)
   * @returns конфигурация эндпоинта или undefined
   */
  getEndpointConfig(endpointKey: string): EndpointConfig | undefined {
    return this.config.endpoints.get(endpointKey);
  }

  /**
   * Удаляет настройки эндпоинта
   * @param endpointKey - ключ эндпоинта (метод:путь)
   */
  deleteEndpointConfig(endpointKey: string): void {
    this.config.endpoints.delete(endpointKey);
    // Если указан путь к файлу, сохраняем на диск
    if (this.settingsPath) {
      this.saveToFile();
    }
  }

  /**
   * Сохраняет общие настройки сервера
   * @param settings - объект с настройками
   */
  saveServerSettings(settings: {
    defaultDelay?: number;
    defaultStatusCode?: number;
    [key: string]: any;
  }): void {
    // Сохраняем в конфигурацию (можно расширить ServerConfig для общих настроек)
    // Пока сохраняем в памяти, можно добавить поле в ServerConfig
    (this.config as any).serverSettings = settings;
    // Если указан путь к файлу, сохраняем на диск
    if (this.settingsPath) {
      this.saveToFile();
    }
  }

  /**
   * Получает общие настройки сервера
   * @returns объект с настройками
   */
  getServerSettings(): any {
    return (this.config as any).serverSettings || {};
  }

  /**
   * Сохраняет настройки в файл
   */
  private saveToFile(): void {
    if (!this.settingsPath) {
      return;
    }

    try {
      // Валидируем путь к файлу (защита от Path Traversal)
      if (!isValidFilePath(this.settingsPath)) {
        // eslint-disable-next-line no-console
        console.error('Недопустимый путь к файлу настроек');
        return;
      }

      // Создаем директорию если не существует
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
      }

      // Создаем объект для сохранения
      const endpointsObj: Record<string, EndpointConfig> = {};
      for (const [key, value] of this.config.endpoints.entries()) {
        endpointsObj[key] = value;
      }
      const settings = {
        endpoints: endpointsObj,
        serverSettings: this.getServerSettings(),
      };

      // Ограничиваем размер данных (максимум 10MB)
      const serialized = JSON.stringify(settings);
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (serialized.length > MAX_SIZE) {
        // eslint-disable-next-line no-console
        console.error('Настройки слишком большие для сохранения');
        return;
      }

      // Сохраняем в JSON файл атомарно (через временный файл)
      const tempPath = `${this.settingsPath}.tmp`;
      fs.writeFileSync(tempPath, serialized, 'utf-8');
      // Переименовываем атомарно
      fs.renameSync(tempPath, this.settingsPath);
      // Устанавливаем безопасные права доступа (только для владельца)
      fs.chmodSync(this.settingsPath, 0o600);
    } catch (error) {
      // В случае ошибки просто логируем (не критично)
      // eslint-disable-next-line no-console
      console.error('Ошибка при сохранении настроек:', error);
    }
  }

  /**
   * Загружает настройки из файла
   */
  loadFromFile(): void {
    if (!this.settingsPath) {
      return;
    }

    try {
      // Валидируем путь к файлу (защита от Path Traversal)
      if (!isValidFilePath(this.settingsPath)) {
        // eslint-disable-next-line no-console
        console.error('Недопустимый путь к файлу настроек');
        return;
      }

      // Проверяем существование файла
      if (!fs.existsSync(this.settingsPath)) {
        return;
      }

      // Проверяем что это файл, а не директория
      const stats = fs.statSync(this.settingsPath);
      if (!stats.isFile()) {
        // eslint-disable-next-line no-console
        console.error('Указанный путь не является файлом');
        return;
      }

      // Проверяем размер файла (максимум 10MB)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (stats.size > MAX_SIZE) {
        // eslint-disable-next-line no-console
        console.error('Файл настроек слишком большой');
        return;
      }

      // Читаем файл
      const fileContent = fs.readFileSync(this.settingsPath, 'utf-8');

      // Проверяем размер содержимого
      if (fileContent.length > MAX_SIZE) {
        // eslint-disable-next-line no-console
        console.error('Содержимое файла настроек слишком большое');
        return;
      }

      // Парсим JSON с обработкой ошибок
      let settings: any;
      try {
        settings = JSON.parse(fileContent);
      } catch (parseError) {
        // eslint-disable-next-line no-console
        console.error('Ошибка при парсинге файла настроек:', parseError);
        return;
      }

      // Валидируем структуру данных
      if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
        // eslint-disable-next-line no-console
        console.error('Неверный формат файла настроек');
        return;
      }

      // Загружаем настройки эндпоинтов с валидацией
      if (settings.endpoints && typeof settings.endpoints === 'object') {
        for (const [key, value] of Object.entries(settings.endpoints)) {
          // Валидируем ключ и значение
          if (typeof key === 'string' && typeof value === 'object' && value !== null) {
            this.config.endpoints.set(key, value as EndpointConfig);
          }
        }
      }

      // Загружаем общие настройки
      if (settings.serverSettings && typeof settings.serverSettings === 'object') {
        (this.config as any).serverSettings = settings.serverSettings;
      }
    } catch (error) {
      // В случае ошибки просто логируем (не критично)
      // eslint-disable-next-line no-console
      console.error('Ошибка при загрузке настроек:', error);
    }
  }
}
