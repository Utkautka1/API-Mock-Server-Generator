#!/usr/bin/env node

import { Command } from 'commander';
import { OpenAPIParser } from '@api-mock-generator/core';
import { MockServer } from '@api-mock-generator/server';
import {
  ServerConfig,
  EndpointConfig,
  isValidPort,
  isValidHost,
  isValidEndpointPath,
} from '@api-mock-generator/shared';

/**
 * CLI инструмент для генерации и запуска мок-сервера
 */
class CLI {
  private program: Command;

  constructor() {
    // Создаем Commander программу
    this.program = new Command();
    // Настраиваем программу
    this.setupProgram();
  }

  /**
   * Настраивает CLI программу
   */
  private setupProgram(): void {
    // Основная информация о программе
    this.program
      .name('api-mock')
      .description('Генератор мок-сервера из OpenAPI/Swagger спецификации')
      .version('1.0.0');

    // Команда generate для генерации и запуска сервера
    this.program
      .command('generate')
      .description('Генерирует и запускает мок-сервер из OpenAPI спецификации')
      .argument('<spec>', 'Путь к файлу OpenAPI спецификации (YAML или JSON)')
      .option('-p, --port <number>', 'Порт сервера', '3000')
      .option('-h, --host <string>', 'Хост сервера', 'localhost')
      .option('--ui-path <string>', 'Путь к UI панели управления', '/_ui')
      .action(async (specPath: string, options: any) => {
        await this.generateServer(specPath, options);
      });

    // Парсим аргументы командной строки
    this.program.parse();
  }

  /**
   * Генерирует и запускает мок-сервер
   * @param specPath - путь к файлу OpenAPI спецификации
   * @param options - опции командной строки
   */
  private async generateServer(specPath: string, options: any): Promise<void> {
    try {
      // Валидируем и нормализуем путь к файлу
      if (!specPath || typeof specPath !== 'string') {
        console.error('Путь к файлу не указан');
        process.exit(1);
      }

      // Парсим OpenAPI спецификацию (валидация пути внутри)
      console.log(`Загрузка OpenAPI спецификации: ${specPath}`);
      const parser = new OpenAPIParser();
      await parser.loadSpec(specPath);
      const endpoints = parser.parseEndpoints();
      // Получаем полную спецификацию для разрешения $ref
      const spec = parser.getSpec();

      console.log(`Найдено эндпоинтов: ${endpoints.length}`);

      // Валидируем порт
      const port = parseInt(options.port, 10);
      if (!isValidPort(port)) {
        console.error(`Недопустимый порт: ${port}. Порт должен быть в диапазоне 1-65535`);
        process.exit(1);
      }

      // Валидируем хост
      const host = options.host || 'localhost';
      if (!isValidHost(host)) {
        console.error(`Недопустимый хост: ${host}`);
        process.exit(1);
      }

      // Валидируем путь UI
      const uiPath = options.uiPath || '/_ui';
      if (!isValidEndpointPath(uiPath)) {
        console.error(`Недопустимый путь UI: ${uiPath}`);
        process.exit(1);
      }

      // Создаем конфигурацию сервера
      const config: ServerConfig = {
        port,
        host,
        uiPath,
        endpoints: new Map<string, EndpointConfig>(),
      };

      // Создаем и запускаем сервер с передачей спецификации
      const server = new MockServer(config, spec);
      server.registerEndpoints(endpoints);

      // Запускаем сервер
      await server.start();

      console.log(`\nМок-сервер запущен:`);
      console.log(`  API: http://${config.host}:${config.port}`);
      console.log(`  UI:  http://${config.host}:${config.port}${config.uiPath}`);
      console.log(`\nНажмите Ctrl+C для остановки сервера`);
    } catch (error) {
      console.error('Ошибка при генерации сервера:', error);
      process.exit(1);
    }
  }
}

// Запускаем CLI
new CLI();
