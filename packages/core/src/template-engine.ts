import { TemplateValue, TemplateObject, TemplateArray } from '@api-mock-generator/shared';
import { faker } from '@faker-js/faker';

/**
 * Движок для обработки шаблонов в ответах
 * Поддерживает шаблоны вида {{uuid}}, {{date}}, {{random}}
 */
export class TemplateEngine {
  /**
   * Обрабатывает шаблоны в данных
   * @param data - данные с шаблонами
   * @returns данные с замененными шаблонами
   */
  process(data: TemplateValue): TemplateValue {
    // Если это строка, обрабатываем шаблоны
    if (typeof data === 'string') {
      return this.processString(data);
    }
    // Если это объект, рекурсивно обрабатываем свойства
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return this.processObject(data as TemplateObject);
    }
    // Если это массив, рекурсивно обрабатываем элементы
    if (Array.isArray(data)) {
      return this.processArray(data as TemplateArray);
    }
    // Для остальных типов возвращаем как есть
    return data;
  }

  /**
   * Обрабатывает строку с шаблонами
   * @param str - строка с шаблонами
   * @returns обработанная строка
   */
  private processString(str: string): string {
    // Регулярное выражение для поиска шаблонов {{...}}
    const templateRegex = /\{\{([^}]+)\}\}/g;
    // Заменяем все шаблоны на значения
    return str.replace(templateRegex, (_match, template) => {
      // Убираем пробелы
      const trimmed = template.trim();
      // Обрабатываем шаблон
      return this.processTemplate(trimmed);
    });
  }

  /**
   * Обрабатывает один шаблон
   * @param template - название шаблона
   * @returns значение шаблона
   */
  private processTemplate(template: string): string {
    // Разделяем на название и параметры
    const [name, ...params] = template.split(':');
    const trimmedName = name.trim().toLowerCase();

    // Обрабатываем различные типы шаблонов
    switch (trimmedName) {
      case 'uuid':
        return faker.string.uuid();
      case 'date':
      case 'datetime':
        return faker.date.anytime().toISOString();
      case 'date-past':
        return faker.date.past().toISOString();
      case 'date-future':
        return faker.date.future().toISOString();
      case 'date-birthdate':
        return faker.date.birthdate().toISOString();
      case 'email':
        return faker.internet.email();
      case 'name':
      case 'fullname':
        return faker.person.fullName();
      case 'firstname':
        return faker.person.firstName();
      case 'lastname':
        return faker.person.lastName();
      case 'username':
        return faker.internet.userName();
      case 'nickname':
      case 'nick':
        return faker.internet.userName() + faker.number.int({ min: 1, max: 9999 }).toString();
      case 'password':
        return faker.internet.password();
      case 'url':
        return faker.internet.url();
      case 'ip':
        return faker.internet.ip();
      case 'ipv6':
        return faker.internet.ipv6();
      case 'phone':
        return faker.phone.number();
      case 'address':
        return faker.location.streetAddress();
      case 'city':
        return faker.location.city();
      case 'country':
        return faker.location.country();
      case 'zipcode':
        return faker.location.zipCode();
      case 'latitude':
        return faker.location.latitude().toString();
      case 'longitude':
        return faker.location.longitude().toString();
      case 'int':
      case 'integer': {
        // Парсим параметры для диапазона с валидацией
        const min = params[0] ? parseInt(params[0], 10) : 0;
        const max = params[1] ? parseInt(params[1], 10) : 1000;
        // Валидируем диапазон (защита от переполнения)
        const safeMin = Number.isFinite(min) ? Math.max(-2147483648, Math.min(2147483647, min)) : 0;
        const safeMax = Number.isFinite(max) ? Math.max(-2147483648, Math.min(2147483647, max)) : 1000;
        // Убеждаемся что min <= max
        const finalMin = Math.min(safeMin, safeMax);
        const finalMax = Math.max(safeMin, safeMax);
        return faker.number.int({ min: finalMin, max: finalMax }).toString();
      }
      case 'float': {
        // Парсим параметры для диапазона с валидацией
        const min = params[0] ? parseFloat(params[0]) : 0;
        const max = params[1] ? parseFloat(params[1]) : 1000;
        // Валидируем диапазон
        const safeMin = Number.isFinite(min) ? min : 0;
        const safeMax = Number.isFinite(max) ? max : 1000;
        // Убеждаемся что min <= max
        const finalMin = Math.min(safeMin, safeMax);
        const finalMax = Math.max(safeMin, safeMax);
        return faker.number.float({ min: finalMin, max: finalMax }).toString();
      }
      case 'string': {
        // Генерируем строку заданной длины с валидацией
        const length = params[0] ? parseInt(params[0], 10) : 10;
        // Ограничиваем длину (максимум 10000 символов для защиты от DoS)
        const safeLength = Number.isFinite(length)
          ? Math.max(1, Math.min(10000, length))
          : 10;
        return faker.string.alphanumeric(safeLength);
      }
      case 'random':
        // Случайное значение из параметров
        if (params.length > 0) {
          return faker.helpers.arrayElement(params);
        }
        return faker.string.alphanumeric(10);
      case 'timestamp':
        return Date.now().toString();
      case 'timestamp-ms':
        return Date.now().toString();
      case 'timestamp-s':
        return Math.floor(Date.now() / 1000).toString();
      // Финансовые шаблоны
      case 'creditcard':
      case 'credit-card':
        return faker.finance.creditCardNumber();
      case 'cvv':
        return faker.finance.creditCardCVV();
      case 'iban':
        return faker.finance.iban();
      case 'bic':
        return faker.finance.bic();
      case 'account-number': {
        // Поддерживаем параметр длины
        const length = params[0] ? parseInt(params[0], 10) : undefined;
        const safeLength = length && Number.isFinite(length) ? Math.max(4, Math.min(20, length)) : undefined;
        return faker.finance.accountNumber(safeLength ? { length: safeLength } : undefined);
      }
      case 'amount':
      case 'price': {
        // Поддерживаем параметры: min, max, decimals, symbol
        const min = params[0] ? parseFloat(params[0]) : 0;
        const max = params[1] ? parseFloat(params[1]) : 1000;
        const dec = params[2] ? parseInt(params[2], 10) : 2;
        const symbol = params[3] || '';
        const safeMin = Number.isFinite(min) ? min : 0;
        const safeMax = Number.isFinite(max) ? max : 1000;
        const safeDec = Number.isFinite(dec) ? Math.max(0, Math.min(10, dec)) : 2;
        return faker.finance.amount({
          min: safeMin,
          max: safeMax,
          dec: safeDec,
          symbol: symbol || undefined,
        });
      }
      case 'currency-code':
        return faker.finance.currencyCode();
      case 'currency-name':
        return faker.finance.currencyName();
      case 'currency-symbol':
        return faker.finance.currencySymbol();
      case 'bitcoin-address':
        return faker.finance.bitcoinAddress();
      case 'ethereum-address':
        return faker.finance.ethereumAddress();
      // Коммерческие шаблоны
      case 'product-name':
        return faker.commerce.productName();
      case 'product-description':
        return faker.commerce.productDescription();
      case 'product-material':
        return faker.commerce.productMaterial();
      case 'product-adjective':
        return faker.commerce.productAdjective();
      case 'department':
        return faker.commerce.department();
      case 'isbn-10':
        return faker.commerce.isbn({ variant: 10 });
      case 'isbn-13':
        return faker.commerce.isbn({ variant: 13 });
      // Компании
      case 'company-name':
      case 'company':
        return faker.company.name();
      case 'company-catchphrase':
        return faker.company.catchPhrase();
      case 'company-buzzphrase':
        return faker.company.buzzPhrase();
      // Текст
      case 'word':
        return faker.lorem.word();
      case 'words': {
        // Поддерживаем параметр количества слов
        const count = params[0] ? parseInt(params[0], 10) : 3;
        const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(100, count)) : 3;
        return faker.lorem.words(safeCount);
      }
      case 'sentence':
        return faker.lorem.sentence();
      case 'sentences': {
        // Поддерживаем параметр количества предложений
        const count = params[0] ? parseInt(params[0], 10) : 3;
        const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(20, count)) : 3;
        return faker.lorem.sentences(safeCount);
      }
      case 'paragraph':
        return faker.lorem.paragraph();
      case 'paragraphs': {
        // Поддерживаем параметр количества параграфов
        const count = params[0] ? parseInt(params[0], 10) : 3;
        const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(10, count)) : 3;
        return faker.lorem.paragraphs(safeCount);
      }
      case 'text':
      case 'lorem':
        return faker.lorem.text();
      // Изображения
      case 'image-url':
      case 'image':
        return faker.image.url();
      case 'avatar':
        return faker.image.avatar();
      // Цвета
      case 'color':
        return faker.color.human();
      case 'color-hex':
        return faker.color.rgb();
      case 'color-rgb': {
        const rgb = faker.color.rgb();
        // Преобразуем hex в RGB числа
        const r = parseInt(rgb.substring(1, 3), 16);
        const g = parseInt(rgb.substring(3, 5), 16);
        const b = parseInt(rgb.substring(5, 7), 16);
        return `${r},${g},${b}`;
      }
      // Дополнительные локационные данные
      case 'state':
        return faker.location.state();
      case 'state-abbr':
        return faker.location.state({ abbreviated: true });
      case 'street-name':
        return faker.location.streetName();
      case 'building-number':
        return faker.location.buildingNumber();
      case 'timezone':
        return faker.location.timeZone();
      case 'country-code':
        return faker.location.countryCode();
      // Дополнительные персональные данные
      case 'job-title':
      case 'job':
        return faker.person.jobTitle();
      case 'job-type':
        return faker.person.jobType();
      case 'bio':
        return faker.person.bio();
      case 'gender':
        return faker.person.gender();
      case 'sex':
        return faker.person.sex();
      case 'age': {
        // Поддерживаем параметры: min, max
        const min = params[0] ? parseInt(params[0], 10) : 18;
        const max = params[1] ? parseInt(params[1], 10) : 65;
        const safeMin = Number.isFinite(min) ? Math.max(0, Math.min(120, min)) : 18;
        const safeMax = Number.isFinite(max) ? Math.max(0, Math.min(120, max)) : 65;
        const finalMin = Math.min(safeMin, safeMax);
        const finalMax = Math.max(safeMin, safeMax);
        return faker.number.int({ min: finalMin, max: finalMax }).toString();
      }
      case 'middle-name':
        return faker.person.middleName();
      case 'prefix':
        return faker.person.prefix();
      case 'suffix':
        return faker.person.suffix();
      // Интернет и технологии
      case 'domain':
        return faker.internet.domainName();
      case 'domain-word':
        return faker.internet.domainWord();
      case 'user-agent':
        return faker.internet.userAgent();
      case 'mac-address':
        return faker.internet.mac();
      case 'port':
        return faker.internet.port().toString();
      // Животные
      case 'animal-type':
        return faker.animal.type();
      case 'animal-dog':
        return faker.animal.dog();
      case 'animal-cat':
        return faker.animal.cat();
      case 'animal-bird':
        return faker.animal.bird();
      // Хакерские фразы
      case 'hacker-phrase':
        return faker.hacker.phrase();
      case 'hacker-verb':
        return faker.hacker.verb();
      case 'hacker-noun':
        return faker.hacker.noun();
      case 'hacker-adjective':
        return faker.hacker.adjective();
      case 'hacker-abbreviation':
        return faker.hacker.abbreviation();
      // Роли и права доступа
      case 'role':
        return faker.helpers.arrayElement([
          'admin',
          'user',
          'moderator',
          'editor',
          'viewer',
          'guest',
          'manager',
          'developer',
          'tester',
          'analyst',
        ]);
      case 'permission':
        return faker.helpers.arrayElement([
          'read',
          'write',
          'delete',
          'update',
          'create',
          'execute',
          'manage',
          'view',
        ]);
      // Идентификаторы и номера
      case 'order-id':
      case 'order_id':
      case 'order-number':
        return `ORD-${faker.string.alphanumeric(8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      case 'order':
        return faker.number.int({ min: 1000, max: 999999 }).toString();
      case 'invoice-id':
      case 'invoice_id':
      case 'invoice-number':
        return `INV-${faker.string.alphanumeric(8).toUpperCase()}-${faker.date.recent().getFullYear()}`;
      case 'transaction-id':
      case 'transaction_id':
      case 'txn-id':
        return `TXN-${faker.string.uuid().substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      case 'payment-id':
      case 'payment_id':
        return `PAY-${faker.string.alphanumeric(10).toUpperCase()}`;
      case 'refund-id':
      case 'refund_id':
        return `REF-${faker.string.alphanumeric(10).toUpperCase()}`;
      case 'ticket-id':
      case 'ticket_id':
      case 'ticket-number':
        return `TKT-${faker.string.alphanumeric(8).toUpperCase()}`;
      case 'booking-id':
      case 'booking_id':
        return `BK-${faker.string.alphanumeric(10).toUpperCase()}`;
      case 'reservation-id':
      case 'reservation_id':
        return `RSV-${faker.string.alphanumeric(10).toUpperCase()}`;
      case 'subscription-id':
      case 'subscription_id':
        return `SUB-${faker.string.alphanumeric(10).toUpperCase()}`;
      case 'session-id':
      case 'session_id':
        return faker.string.uuid();
      case 'token':
        return faker.string.alphanumeric(32);
      case 'api-key':
      case 'api_key':
        return `sk-${faker.string.alphanumeric(32)}`;
      case 'secret-key':
      case 'secret_key':
        return faker.string.alphanumeric(64);
      case 'access-token':
      case 'access_token':
        return faker.string.alphanumeric(40);
      case 'refresh-token':
      case 'refresh_token':
        return faker.string.alphanumeric(40);
      // Слаги и URL-friendly строки
      case 'slug': {
        // Генерируем slug из слов
        const words = faker.lorem.words(3).split(' ');
        return words.join('-').toLowerCase();
      }
      case 'url-slug': {
        // Более короткий slug для URL
        const word = faker.lorem.word();
        return word.toLowerCase();
      }
      case 'hash':
      case 'md5-hash':
        // Имитация MD5 хеша
        return faker.string.hexadecimal({ length: 32, prefix: '' });
      case 'sha256-hash':
        // Имитация SHA256 хеша
        return faker.string.hexadecimal({ length: 64, prefix: '' });
      // Статусы
      case 'status':
        return faker.helpers.arrayElement(['active', 'inactive', 'pending', 'completed', 'cancelled', 'failed']);
      case 'order-status':
        return faker.helpers.arrayElement([
          'pending',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
          'refunded',
        ]);
      case 'payment-status':
        return faker.helpers.arrayElement(['pending', 'paid', 'failed', 'refunded', 'cancelled']);
      case 'user-status':
        return faker.helpers.arrayElement(['active', 'inactive', 'suspended', 'banned', 'pending']);
      // Версии и релизы
      case 'version':
        return `${faker.number.int({ min: 0, max: 10 })}.${faker.number.int({ min: 0, max: 99 })}.${faker.number.int({ min: 0, max: 99 })}`;
      case 'semver':
        return `${faker.number.int({ min: 1, max: 10 })}.${faker.number.int({ min: 0, max: 99 })}.${faker.number.int({ min: 0, max: 99 })}`;
      // Категории и теги
      case 'category':
        return faker.helpers.arrayElement([
          'electronics',
          'clothing',
          'food',
          'books',
          'toys',
          'sports',
          'home',
          'automotive',
          'health',
          'beauty',
        ]);
      case 'tag': {
        // Генерируем случайный тег
        const tags = ['new', 'popular', 'featured', 'sale', 'hot', 'trending', 'limited', 'exclusive'];
        return faker.helpers.arrayElement(tags);
      }
      case 'tags': {
        // Несколько тегов через запятую
        const tags = ['new', 'popular', 'featured', 'sale', 'hot', 'trending', 'limited', 'exclusive'];
        const count = params[0] ? parseInt(params[0], 10) : 3;
        const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(10, count)) : 3;
        return faker.helpers.arrayElements(tags, { min: 1, max: safeCount }).join(', ');
      }
      // Рейтинги и оценки
      case 'rating': {
        // Рейтинг от 1 до 5
        const max = params[0] ? parseInt(params[0], 10) : 5;
        const safeMax = Number.isFinite(max) ? Math.max(1, Math.min(10, max)) : 5;
        return faker.number.float({ min: 1, max: safeMax, fractionDigits: 1 }).toString();
      }
      case 'score':
        return faker.number.int({ min: 0, max: 100 }).toString();
      case 'percentage':
        return faker.number.float({ min: 0, max: 100, fractionDigits: 2 }).toString();
      // Коды и промокоды
      case 'promo-code':
      case 'promocode':
      case 'coupon-code':
        return faker.string.alphanumeric(8).toUpperCase();
      case 'discount-code':
        return `DISCOUNT${faker.string.alphanumeric(6).toUpperCase()}`;
      case 'referral-code':
        return faker.string.alphanumeric(10).toUpperCase();
      // Приоритеты
      case 'priority':
        return faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent', 'critical']);
      // Типы файлов
      case 'file-extension':
        return faker.helpers.arrayElement(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png', 'gif', 'mp4', 'zip']);
      case 'mime-type':
        return faker.helpers.arrayElement([
          'application/json',
          'application/pdf',
          'image/jpeg',
          'image/png',
          'text/plain',
          'video/mp4',
        ]);
      // Дополнительные даты
      case 'date-recent':
        return faker.date.recent().toISOString();
      case 'date-soon':
        return faker.date.soon().toISOString();
      case 'date-month':
        return faker.date.month();
      case 'date-weekday':
        return faker.date.weekday();
      // Дополнительные строки
      case 'alpha':
      case 'alphabetic': {
        // Поддерживаем параметр длины
        const length = params[0] ? parseInt(params[0], 10) : 10;
        const safeLength = Number.isFinite(length) ? Math.max(1, Math.min(10000, length)) : 10;
        return faker.string.alpha(safeLength);
      }
      case 'numeric': {
        // Поддерживаем параметр длины
        const length = params[0] ? parseInt(params[0], 10) : 10;
        const safeLength = Number.isFinite(length) ? Math.max(1, Math.min(10000, length)) : 10;
        return faker.string.numeric(safeLength);
      }
      case 'hex': {
        // Поддерживаем параметр длины
        const length = params[0] ? parseInt(params[0], 10) : 32;
        const safeLength = Number.isFinite(length) ? Math.max(1, Math.min(10000, length)) : 32;
        return faker.string.hexadecimal({ length: safeLength });
      }
      case 'base64': {
        // Генерируем base64 из случайной строки
        const randomString = faker.string.alphanumeric(20);
        return Buffer.from(randomString).toString('base64');
      }
      case 'nanoid': {
        // Поддерживаем параметр длины
        const length = params[0] ? parseInt(params[0], 10) : 21;
        const safeLength = Number.isFinite(length) ? Math.max(1, Math.min(100, length)) : 21;
        return faker.string.nanoid(safeLength);
      }
      // Булевы значения
      case 'boolean':
      case 'bool':
        return faker.datatype.boolean().toString();
      default:
        // Если шаблон не распознан, возвращаем как есть
        return `{{${template}}}`;
    }
  }

  /**
   * Обрабатывает объект рекурсивно
   * @param obj - объект с шаблонами
   * @returns обработанный объект
   */
  private processObject(obj: TemplateObject): TemplateObject {
    const result: TemplateObject = {};
    // Обрабатываем каждое свойство объекта
    for (const [key, value] of Object.entries(obj)) {
      // Обрабатываем ключ (может содержать шаблоны)
      const processedKey = this.processString(key);
      // Обрабатываем значение
      result[processedKey] = this.process(value);
    }
    return result;
  }

  /**
   * Обрабатывает массив рекурсивно
   * @param arr - массив с шаблонами
   * @returns обработанный массив
   */
  private processArray(arr: TemplateArray): TemplateArray {
    // Обрабатываем каждый элемент массива
    return arr.map((item: TemplateValue) => this.process(item));
  }
}
