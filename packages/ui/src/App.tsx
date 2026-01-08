import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Endpoints from './pages/Endpoints';
import Monitor from './pages/Monitor';
import Settings from './pages/Settings';
import './App.css';

/**
 * Главный компонент приложения
 */
function App() {
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/': return 'Дашборд';
      case '/endpoints': return 'Управление API';
      case '/monitor': return 'Мониторинг запросов';
      case '/settings': return 'Настройки сервера';
      default: return 'API Mock Server';
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-icon">⚡</span>
            API Mock
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>
            Дашборд
          </Link>
          <Link to="/endpoints" className={`nav-item ${location.pathname === '/endpoints' ? 'active' : ''}`}>
            <span className="nav-icon">🔌</span>
            Эндпоинты
          </Link>
          <Link to="/monitor" className={`nav-item ${location.pathname === '/monitor' ? 'active' : ''}`}>
            <span className="nav-icon">📡</span>
            Мониторинг
          </Link>
          <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
            <span className="nav-icon">⚙️</span>
            Настройки
          </Link>
        </nav>

        <div className="sidebar-footer">
          v1.0.0 • Production Ready
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="top-bar">
          <h1 className="page-title">{getPageTitle(location.pathname)}</h1>
          <div className="status-indicator">
            <div className="status-dot"></div>
            Server Online
          </div>
        </header>

        <main className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/endpoints" element={<Endpoints />} />
            <Route path="/monitor" element={<Monitor />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
