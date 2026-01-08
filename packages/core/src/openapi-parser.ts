import SwaggerClient from 'swagger-client';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { ParsedEndpoint, OpenAPIOperation, isValidFilePath } from '@api-mock-generator/shared';

/**
 * Парсер OpenAPI спецификации
 * Извлекает эндпоинты, методы, схемы запросов и ответов
 */
export class OpenAPIParser {
  // Загруженная спецификация OpenAPI
  private spec: any;

  /**
   * Загружает и парсит OpenAPI спецификацию из файла
   * @param filePath - путь к файлу OpenAPI (YAML или JSON)
   */
  async loadSpec(filePath: string): Promise<void> {
    // Валидируем путь к файлу (защита от Path Traversal)
    if (!isValidFilePath(filePath)) {
      throw new Error('Недопустимый путь к файлу');
    }

    // Разрешаем путь и проверяем что файл существует
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Файл не найден: ${resolvedPath}`);
    }

    // Проверяем что это файл, а не директория
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      throw new Error('Указанный путь не является файлом');
    }

    // Проверяем размер файла (максимум 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error('Файл слишком большой (максимум 10MB)');
    }

    // Читаем файл
    const fileContent = fs.readFileSync(resolvedPath, 'utf-8');

    // Проверяем размер содержимого
    if (fileContent.length > MAX_FILE_SIZE) {
      throw new Error('Содержимое файла слишком большое');
    }

    // Определяем формат файла по расширению
    const isYaml = resolvedPath.endsWith('.yaml') || resolvedPath.endsWith('.yml');

    try {
      // Парсим в зависимости от формата с безопасными опциями
      if (isYaml) {
        // Безопасная загрузка YAML (защита от YAML injection)
        this.spec = yaml.load(fileContent, {
          schema: yaml.DEFAULT_SCHEMA,
          json: true,
        });
      } else {
        // Парсим JSON с проверкой на циклические ссылки
        this.spec = JSON.parse(fileContent);
      }

      // Валидируем что получили объект
      if (typeof this.spec !== 'object' || this.spec === null || Array.isArray(this.spec)) {
        throw new Error('Спецификация должна быть объектом');
      }

      // Валидируем спецификацию через swagger-client
      await SwaggerClient.resolve({ spec: this.spec });
    } catch (error) {
      // Перехватываем ошибки парсинга
      if (error instanceof Error) {
        throw new Error(`Ошибка при парсинге спецификации: ${error.message}`);
      }
      throw new Error('Неизвестная ошибка при парсинге спецификации');
    }
  }

  /**
   * Загружает спецификацию из объекта
   * @param spec - объект спецификации OpenAPI
   */
  async loadSpecFromObject(spec: any): Promise<void> {
    this.spec = spec;
    // Валидируем спецификацию
    await SwaggerClient.resolve({ spec: this.spec });
  }

  /**
   * Извлекает все эндпоинты из спецификации
   * @returns массив распарсенных эндпоинтов
   */
  parseEndpoints(): ParsedEndpoint[] {
    if (!this.spec) {
      throw new Error('Спецификация не загружена');
    }

    const endpoints: ParsedEndpoint[] = [];
    // Получаем пути из спецификации
    const paths = this.spec.paths || {};

    // Проходим по всем путям
    for (const [path, pathItem] of Object.entries(paths)) {
      // Проходим по всем HTTP методам в пути
      for (const [method, operation] of Object.entries(pathItem as any)) {
        // Пропускаем не-HTTP методы (например, parameters, summary)
        if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
          continue;
        }

        // Получаем схему ответа (приоритет на 200, затем первый доступный)
        const responseSchema = this.extractResponseSchema(operation as OpenAPIOperation);

        // Добавляем эндпоинт в список
        endpoints.push({
          path: this.normalizePath(path),
          method: method.toUpperCase(),
          operation: operation as OpenAPIOperation,
          responseSchema,
        });
      }
    }

    return endpoints;
  }

  /**
   * Извлекает схему ответа из операции
   * @param operation - операция OpenAPI
   * @returns схема ответа или undefined
   */
  private extractResponseSchema(operation: OpenAPIOperation): any {
    // Получаем ответы из операции
    const responses = operation.responses || {};
    // Приоритет на 200 статус код
    const successResponse = responses['200'] || responses['201'] || responses['204'];
    // Если есть успешный ответ, извлекаем схему
    if (successResponse) {
      // Проверяем content для OpenAPI 3.0
      if (successResponse.content) {
        // Приоритет на application/json
        const jsonContent = successResponse.content['application/json'];
        if (jsonContent?.schema) {
          return jsonContent.schema;
        }
        // Если нет JSON, берем первый доступный
        const firstContent = Object.values(successResponse.content)[0] as any;
        return firstContent?.schema;
      }
      // Для OpenAPI 2.0 (Swagger)
      if (successResponse.schema) {
        return successResponse.schema;
      }
    }
    // Возвращаем первый доступный ответ
    const firstResponse = Object.values(responses)[0] as any;
    if (firstResponse?.content) {
      const jsonContent = firstResponse.content['application/json'];
      if (jsonContent?.schema) {
        return jsonContent.schema;
      }
    }
    return firstResponse?.schema;
  }

  /**
   * Нормализует путь эндпоинта (заменяет параметры на Express формат)
   * @param path - путь из OpenAPI
   * @returns нормализованный путь
   */
  private normalizePath(path: string): string {
    // Заменяем {param} на :param для Express
    return path.replace(/\{([^}]+)\}/g, ':$1');
  }

  /**
   * Получает исходную спецификацию
   * @returns объект спецификации OpenAPI
   */
  getSpec(): any {
    return this.spec;
  }
}
