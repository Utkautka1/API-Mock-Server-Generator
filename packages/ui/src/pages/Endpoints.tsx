import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './Endpoints.css';

// Интерфейс для настроек эндпоинта
interface EndpointSettings {
  delay?: number;
  statusCode?: number;
  customResponse?: any;
}

// Интерфейс для результата тестирования
interface TestResult {
  status: number;
  statusText: string;
  data: any;
  duration: number;
  error?: string;
}

/**
 * Компонент для управления эндпоинтами
 */
function Endpoints() {
  // Состояние для развернутого эндпоинта
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [settings, setSettings] = useState<EndpointSettings>({});
  const [customResponseText, setCustomResponseText] = useState<string>('');
  // Состояние для результата тестирования
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const queryClient = useQueryClient();

  // Загружаем список эндпоинтов
  const { data: endpoints } = useQuery({
    queryKey: ['endpoints'],
    queryFn: async () => {
      const response = await fetch('/api/endpoints');
      if (!response.ok) throw new Error('Failed to fetch endpoints');
      return response.json();
    },
  });

  // Мутация для сохранения настроек эндпоинта
  const saveSettingsMutation = useMutation({
    mutationFn: async ({ method, path, settings }: { method: string; path: string; settings: EndpointSettings }) => {
      const encodedPath = encodeURIComponent(path);
      const response = await fetch(`/api/endpoints/${method}/${encodedPath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      // Обновляем список эндпоинтов
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      // Закрываем модальное окно
      setShowModal(false);
      setSelectedEndpoint(null);
    },
  });

  // Переключаем развернутое состояние эндпоинта
  const handleToggleEndpoint = (endpoint: any) => {
    const endpointKey = `${endpoint.method}-${endpoint.path}`;
    
    if (expandedEndpoint === endpointKey) {
      // Закрываем если уже открыт
      setExpandedEndpoint(null);
      setTestResult(null);
    } else {
      // Открываем новый
      setExpandedEndpoint(endpointKey);
      setSettings({
        delay: endpoint.delay || 0,
        statusCode: endpoint.statusCode || 200,
      });
      // Формируем пример тела запроса
      const exampleBody = generateExampleRequestBody(endpoint.method);
      setCustomResponseText(JSON.stringify(exampleBody, null, 2));
      setTestResult(null);
    }
  };

  // Генерируем пример тела запроса
  const generateExampleRequestBody = (method: string) => {
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      return {
        name: "John Doe",
        email: "john@example.com",
        age: 30
      };
    }
    return {};
  };

  // Сохраняем настройки эндпоинта
  const handleSaveSettings = (endpoint: any) => {
    // Парсим customResponse если он задан
    let parsedCustomResponse;
    try {
      if (customResponseText.trim()) {
        parsedCustomResponse = JSON.parse(customResponseText);
      }
    } catch (e) {
      alert('Ошибка в JSON тела запроса. Пожалуйста, исправьте синтаксис.');
      return;
    }

    const settingsToSave = {
      ...settings,
      ...(parsedCustomResponse ? { customResponse: parsedCustomResponse } : {}),
    };

    saveSettingsMutation.mutate({
      method: endpoint.method,
      path: endpoint.path,
      settings: settingsToSave,
    });
  };

  // Тестируем эндпоинт
  const handleTestEndpoint = async (endpoint: any) => {
    setIsTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    
    try {
      // Формируем URL эндпоинта
      const url = endpoint.path;
      
      // Определяем параметры запроса в зависимости от метода
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Для POST/PUT/PATCH добавляем тело запроса из textarea
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        try {
          const body = customResponseText.trim() ? JSON.parse(customResponseText) : {};
          options.body = JSON.stringify(body);
        } catch (e) {
          alert('Ошибка в JSON тела запроса');
          setIsTesting(false);
          return;
        }
      }

      // Отправляем запрос
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      // Пытаемся распарсить JSON ответ
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Сохраняем результат
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Обрабатываем ошибку
      setTestResult({
        status: 0,
        statusText: 'Network Error',
        data: null,
        duration,
        error: error.message || 'Failed to fetch',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container">
      <h1>Эндпоинты</h1>
      <div className="endpoints-list">
        {endpoints?.map((endpoint: any) => {
          const endpointKey = `${endpoint.method}-${endpoint.path}`;
          const isExpanded = expandedEndpoint === endpointKey;
          
          return (
            <div key={endpointKey} className="endpoint-item">
              {/* Заголовок эндпоинта */}
              <div 
                className={`endpoint-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => handleToggleEndpoint(endpoint)}
              >
                <div className="endpoint-header">
                  <span className={`endpoint-method method-${endpoint.method.toLowerCase()}`}>
                    {endpoint.method}
                  </span>
                  <span className="endpoint-path">{endpoint.path}</span>
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </div>

              {/* Развернутая панель настроек */}
              {isExpanded && (
                <div className="endpoint-details">
                  <div className="details-columns">
                    {/* Левая колонка - тело запроса */}
                    <div className="details-left">
                      <div className="section-header">
                        <h3>📤 Тело запроса</h3>
                        <small>JSON который будет отправлен</small>
                      </div>
                      <textarea
                        className="request-body-editor"
                        value={customResponseText}
                        onChange={(e) => setCustomResponseText(e.target.value)}
                        placeholder={['POST', 'PUT', 'PATCH'].includes(endpoint.method) 
                          ? '{\n  "name": "John",\n  "email": "john@example.com"\n}'
                          : 'Нет тела запроса для GET/DELETE'}
                        disabled={!['POST', 'PUT', 'PATCH'].includes(endpoint.method)}
                      />
                    </div>

                    {/* Правая колонка - ответ и кнопка тестирования */}
                    <div className="details-right">
                      <div className="section-header">
                        <h3>📥 Ответ</h3>
                        <button 
                          className="btn-test-inline" 
                          onClick={() => handleTestEndpoint(endpoint)}
                          disabled={isTesting}
                        >
                          {isTesting ? '⏳ Отправка...' : '🚀 Протестировать'}
                        </button>
                      </div>

                      {/* Результат тестирования */}
                      {testResult ? (
                        <div className={`test-result-inline ${testResult.error ? 'error' : 'success'}`}>
                          <div className="test-result-header-inline">
                            <span className={`status-badge status-${Math.floor(testResult.status / 100)}xx`}>
                              {testResult.status || 'ERROR'}
                            </span>
                            <span className="status-text">{testResult.statusText}</span>
                            <span className="duration">⚡ {testResult.duration}ms</span>
                          </div>
                          
                          {testResult.error ? (
                            <div className="error-message-inline">
                              <strong>❌ Ошибка:</strong> {testResult.error}
                            </div>
                          ) : (
                            <pre className="result-json-inline">
                              {typeof testResult.data === 'string' 
                                ? testResult.data 
                                : JSON.stringify(testResult.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <div className="no-result-placeholder">
                          <p>Нажмите "Протестировать" чтобы увидеть ответ</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Нижняя секция - настройки */}
                  <div className="details-bottom">
                    <div className="section-header">
                      <h3>⚙️ Настройки эндпоинта</h3>
                    </div>
                    
                    <div className="settings-row">
                      <div className="setting-group">
                        <label htmlFor={`delay-${endpointKey}`}>Задержка ответа (мс):</label>
                        <input
                          id={`delay-${endpointKey}`}
                          type="number"
                          min="0"
                          max="60000"
                          value={settings.delay || 0}
                          onChange={(e) => setSettings({ ...settings, delay: parseInt(e.target.value) || 0 })}
                          className="setting-input"
                        />
                      </div>

                      <div className="setting-group">
                        <label htmlFor={`status-${endpointKey}`}>HTTP статус код:</label>
                        <input
                          id={`status-${endpointKey}`}
                          type="number"
                          min="100"
                          max="599"
                          value={settings.statusCode || 200}
                          onChange={(e) => setSettings({ ...settings, statusCode: parseInt(e.target.value) || 200 })}
                          className="setting-input"
                        />
                      </div>

                      <button 
                        className="btn-save-settings" 
                        onClick={() => handleSaveSettings(endpoint)}
                        disabled={saveSettingsMutation.isPending}
                      >
                        {saveSettingsMutation.isPending ? '💾 Сохранение...' : '💾 Сохранить настройки'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Endpoints;
