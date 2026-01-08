import { useEffect, useState } from 'react';
import { RequestLog } from '@api-mock-generator/shared';
import './Monitor.css';

/**
 * Компонент мониторинга запросов в реальном времени
 */
function Monitor() {
  // Состояние для логов запросов
  const [logs, setLogs] = useState<RequestLog[]>([]);
  // Состояние подключения WebSocket
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Подключаемся к WebSocket
    const ws = new WebSocket(`ws://${window.location.hostname}:3000/_ws`);

    // Обработчик открытия соединения
    ws.onopen = () => {
      setConnected(true);
    };

    // Обработчик получения сообщений
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'request') {
        // Добавляем новый лог в начало списка
        setLogs((prev) => [message.data, ...prev].slice(0, 1000));
      } else if (message.type === 'history') {
        // Загружаем историю
        setLogs(message.data);
      }
    };

    // Обработчик закрытия соединения
    ws.onclose = () => {
      setConnected(false);
    };

    // Обработчик ошибок
    ws.onerror = () => {
      setConnected(false);
    };

    // Очистка при размонтировании
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="container">
      <div className="monitor-header">
        <h1>Мониторинг запросов</h1>
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Подключено' : 'Отключено'}
        </div>
      </div>
      <div className="logs-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Время</th>
              <th>Метод</th>
              <th>Путь</th>
              <th>Статус</th>
              <th>Время ответа</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td>
                  <span className={`method-badge method-${log.method.toLowerCase()}`}>
                    {log.method}
                  </span>
                </td>
                <td className="path-cell">{log.path}</td>
                <td>
                  <span className={`status-badge status-${log.statusCode}`}>
                    {log.statusCode}
                  </span>
                </td>
                <td>{log.responseTime}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="empty-state">Нет запросов для отображения</div>
        )}
      </div>
    </div>
  );
}

export default Monitor;
