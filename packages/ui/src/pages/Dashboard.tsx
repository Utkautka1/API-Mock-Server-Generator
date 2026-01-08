import { useQuery } from '@tanstack/react-query';
import './Dashboard.css';

/**
 * Компонент дашборда с общей информацией
 */
function Dashboard() {
  // Загружаем статистику сервера
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  return (
    <div className="container">
      <h1>Дашборд</h1>
      <div className="dashboard-grid">
        <div className="card">
          <h2>Статистика</h2>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Всего запросов:</span>
              <span className="stat-value">{stats?.totalRequests || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Активных эндпоинтов:</span>
              <span className="stat-value">{stats?.activeEndpoints || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Среднее время ответа:</span>
              <span className="stat-value">{stats?.avgResponseTime || 0}ms</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h2>Быстрые действия</h2>
          <div className="quick-actions">
            <button className="btn btn-primary">Экспорт коллекции</button>
            <button className="btn btn-secondary">Очистить историю</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
