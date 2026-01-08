import { faker } from '@faker-js/faker';

/**
 * Генератор fake данных на основе JSON Schema
 * Использует faker.js для генерации реалистичных данных
 */
export class DataGenerator {
  // Полная спецификация OpenAPI для разрешения $ref ссылок
  private spec: any;

  /**
   * Конструктор генератора данных
   * @param spec - полная спецификация OpenAPI (опционально, для разрешения $ref)
   */
  constructor(spec?: any) {
    this.spec = spec;
  }

  /**
   * Генерирует данные на основе JSON Schema
   * @param schema - JSON Schema объект
   * @param visitedRefs - множество уже посещенных ссылок (для предотвращения циклов)
   * @returns сгенерированные данные
   */
  generateFromSchema(schema: any, visitedRefs: Set<string> = new Set()): any {
    // Если схема не определена, возвращаем null
    if (!schema) {
      return null;
    }

    // Обрабатываем ссылки на другие схемы ($ref)
    if (schema.$ref) {
      // Разрешаем ссылку на схему
      const resolvedSchema = this.resolveRef(schema.$ref, visitedRefs);
      // Если ссылка разрешена, генерируем данные из разрешенной схемы
      if (resolvedSchema) {
        return this.generateFromSchema(resolvedSchema, visitedRefs);
      }
      // Если не удалось разрешить, возвращаем пустой объект
      return {};
    }

    // Обрабатываем одинOf, anyOf, allOf
    if (schema.oneOf && schema.oneOf.length > 0) {
      // Выбираем случайную схему из oneOf
      const selectedSchema = faker.helpers.arrayElement(schema.oneOf);
      return this.generateFromSchema(selectedSchema, visitedRefs);
    }
    if (schema.anyOf && schema.anyOf.length > 0) {
      // Выбираем случайную схему из anyOf
      const selectedSchema = faker.helpers.arrayElement(schema.anyOf);
      return this.generateFromSchema(selectedSchema, visitedRefs);
    }
    if (schema.allOf && schema.allOf.length > 0) {
      // Объединяем все схемы правильно (с разрешением $ref)
      const resolvedSchemas = schema.allOf.map((s: any) => {
        if (s.$ref) {
          return this.resolveRef(s.$ref, visitedRefs) || s;
        }
        return s;
      });
      // Объединяем все свойства схем
      const merged = this.mergeSchemas(resolvedSchemas);
      return this.generateFromSchema(merged, visitedRefs);
    }

    // Обрабатываем типы данных
    const type = schema.type || this.inferType(schema);

    switch (type) {
      case 'string':
        return this.generateString(schema);
      case 'number':
      case 'integer':
        return this.generateNumber(schema);
      case 'boolean':
        return this.generateBoolean(schema);
      case 'array':
        return this.generateArray(schema, visitedRefs);
      case 'object':
        return this.generateObject(schema, visitedRefs);
      case 'null':
        return null;
      default:
        return null;
    }
  }

  /**
   * Разрешает $ref ссылку на схему
   * @param ref - строка ссылки (например, "#/components/schemas/User")
   * @param visitedRefs - множество уже посещенных ссылок
   * @returns разрешенная схема или null
   */
  private resolveRef(ref: string, visitedRefs: Set<string>): any {
    // Проверяем на циклические ссылки
    if (visitedRefs.has(ref)) {
      // Если ссылка уже посещена, возвращаем null чтобы избежать бесконечной рекурсии
      return null;
    }

    // Если нет спецификации, не можем разрешить ссылку
    if (!this.spec) {
      return null;
    }

    // Добавляем ссылку в посещенные
    visitedRefs.add(ref);

    try {
      // Убираем префикс # если есть
      const cleanRef = ref.startsWith('#') ? ref.slice(1) : ref;
      // Разбиваем путь на части
      const parts = cleanRef.split('/').filter((p) => p);

      // Начинаем с корня спецификации
      let current: any = this.spec;

      // Проходим по пути
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          // Если путь не найден, возвращаем null
          visitedRefs.delete(ref);
          return null;
        }
      }

      // Если нашли схему, но она тоже содержит $ref, разрешаем рекурсивно
      if (current && current.$ref) {
        const resolved = this.resolveRef(current.$ref, visitedRefs);
        visitedRefs.delete(ref);
        return resolved;
      }

      // Удаляем ссылку из посещенных после обработки
      visitedRefs.delete(ref);
      return current;
    } catch (error) {
      // В случае ошибки удаляем ссылку и возвращаем null
      visitedRefs.delete(ref);
      return null;
    }
  }

  /**
   * Объединяет несколько схем в одну
   * @param schemas - массив схем для объединения
   * @returns объединенная схема
   */
  private mergeSchemas(schemas: any[]): any {
    if (schemas.length === 0) {
      return {};
    }
    if (schemas.length === 1) {
      return schemas[0];
    }

    // Начинаем с первой схемы
    let merged = { ...schemas[0] };

    // Объединяем остальные схемы
    for (let i = 1; i < schemas.length; i++) {
      const currentSchema = schemas[i];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // Объединяем свойства
      if (currentSchema.properties) {
        merged.properties = { ...merged.properties, ...currentSchema.properties };
      }
      // Объединяем required поля
      if (currentSchema.required) {
        const existingRequired = merged.required || [];
        merged.required = [...new Set([...existingRequired, ...currentSchema.required])];
      }
      // Объединяем другие свойства (приоритет у последующих схем)
      merged = { ...merged, ...currentSchema };
      // Но сохраняем объединенные properties и required
      if (merged.properties && currentSchema.properties) {
        merged.properties = { ...merged.properties, ...currentSchema.properties };
      }
      if (currentSchema.required) {
        const existingRequired = merged.required || [];
        merged.required = [...new Set([...existingRequired, ...currentSchema.required])];
      }
    }

    return merged;
  }

  /**
   * Генерирует строку на основе схемы
   * @param schema - схема строки
   * @returns сгенерированная строка
   */
  private generateString(schema: any): string {
    // Проверяем формат строки
    const format = schema.format || '';
    const enumValues = schema.enum;

    // Если есть enum, выбираем случайное значение
    if (enumValues && enumValues.length > 0) {
      return faker.helpers.arrayElement(enumValues);
    }

    // Генерируем в зависимости от формата
    switch (format) {
      case 'uuid':
      case 'uuid4':
        return faker.string.uuid();
      case 'email':
        return faker.internet.email();
      case 'date-time':
      case 'datetime':
        return faker.date.anytime().toISOString();
      case 'date':
        return faker.date.past().toISOString().split('T')[0];
      case 'uri':
      case 'url':
        return faker.internet.url();
      case 'hostname':
        return faker.internet.domainName();
      case 'ipv4':
        return faker.internet.ip();
      case 'ipv6':
        return faker.internet.ipv6();
      case 'password':
        return faker.internet.password();
      default:
        // Генерируем строку нужной длины
        const minLength = schema.minLength || 1;
        const maxLength = schema.maxLength || 50;
        const length = faker.number.int({ min: minLength, max: maxLength });
        return faker.string.alphanumeric(length);
    }
  }

  /**
   * Генерирует число на основе схемы
   * @param schema - схема числа
   * @returns сгенерированное число
   */
  private generateNumber(schema: any): number {
    const isInteger = schema.type === 'integer';
    const minimum = schema.minimum !== undefined ? schema.minimum : (isInteger ? 0 : 0.0);
    const maximum = schema.maximum !== undefined ? schema.maximum : (isInteger ? 1000 : 1000.0);
    const multipleOf = schema.multipleOf;

    if (isInteger) {
      // Генерируем целое число
      let value = faker.number.int({ min: minimum, max: maximum });
      // Применяем multipleOf если указан
      if (multipleOf) {
        value = Math.floor(value / multipleOf) * multipleOf;
      }
      return value;
    } else {
      // Генерируем дробное число
      let value = faker.number.float({ min: minimum, max: maximum });
      // Применяем multipleOf если указан
      if (multipleOf) {
        value = Math.floor(value / multipleOf) * multipleOf;
      }
      return value;
    }
  }

  /**
   * Генерирует булево значение
   * @param schema - схема булева значения
   * @returns случайное булево значение
   */
  private generateBoolean(_schema: any): boolean {
    return faker.datatype.boolean();
  }

  /**
   * Генерирует массив на основе схемы
   * @param schema - схема массива
   * @param visitedRefs - множество уже посещенных ссылок
   * @returns сгенерированный массив
   */
  private generateArray(schema: any, visitedRefs: Set<string>): any[] {
    // Определяем размер массива
    const minItems = schema.minItems || 1;
    const maxItems = schema.maxItems || 5;
    const length = faker.number.int({ min: minItems, max: maxItems });

    // Получаем схему элементов
    const itemsSchema = schema.items || { type: 'string' };

    // Генерируем элементы массива
    const array: any[] = [];
    for (let i = 0; i < length; i++) {
      array.push(this.generateFromSchema(itemsSchema, visitedRefs));
    }

    return array;
  }

  /**
   * Генерирует объект на основе схемы
   * @param schema - схема объекта
   * @param visitedRefs - множество уже посещенных ссылок
   * @returns сгенерированный объект
   */
  private generateObject(schema: any, visitedRefs: Set<string>): any {
    const obj: any = {};
    const properties = schema.properties || {};

    // Генерируем каждое свойство объекта
    for (const [key, propSchema] of Object.entries(properties)) {
      // Проверяем required поля
      const isRequired = schema.required?.includes(key) || false;
      // Генерируем значение только если поле обязательное или случайно
      if (isRequired || faker.datatype.boolean()) {
        obj[key] = this.generateFromSchema(propSchema as any, visitedRefs);
      }
    }

    // Обрабатываем additionalProperties если указаны
    if (schema.additionalProperties) {
      // Генерируем дополнительные свойства
      const additionalCount = faker.number.int({ min: 0, max: 3 });
      for (let i = 0; i < additionalCount; i++) {
        const key = `additional_${faker.string.alphanumeric(8)}`;
        if (typeof schema.additionalProperties === 'object') {
          obj[key] = this.generateFromSchema(schema.additionalProperties, visitedRefs);
        } else if (schema.additionalProperties === true) {
          // Если true, генерируем произвольное значение
          obj[key] = faker.helpers.arrayElement([
            faker.string.alphanumeric(10),
            faker.number.int(),
            faker.datatype.boolean(),
          ]);
        }
      }
    }

    return obj;
  }

  /**
   * Определяет тип данных из схемы, если тип не указан явно
   * @param schema - схема
   * @returns предполагаемый тип
   */
  private inferType(schema: any): string {
    // Если есть format, пытаемся определить тип
    if (schema.format) {
      if (['uuid', 'email', 'date-time', 'date', 'uri', 'url'].includes(schema.format)) {
        return 'string';
      }
    }
    // По умолчанию возвращаем string
    return 'string';
  }
}
