import { useState } from 'react';
import './Settings.css';

/**
 * Компонент настроек сервера
 */
function Settings() {
  // Состояние для настроек
  const [settings, setSettings] = useState({
    defaultDelay: 0,
    defaultStatusCode: 200,
  });

  // Обработчик изменения настроек
  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Обработчик сохранения настроек
  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      alert('Настройки сохранены');
    } catch (error) {
      alert('Ошибка при сохранении настроек');
    }
  };

  return (
    <div className="container">
      <h1>Настройки</h1>
      <div className="card">
        <h2>Общие настройки</h2>
        <div className="settings-form">
          <div className="form-group">
            <label>Задержка ответа по умолчанию (мс)</label>
            <input
              type="number"
              value={settings.defaultDelay}
              onChange={(e) => handleChange('defaultDelay', parseInt(e.target.value, 10))}
            />
          </div>
          <div className="form-group">
            <label>Статус код по умолчанию</label>
            <input
              type="number"
              value={settings.defaultStatusCode}
              onChange={(e) => handleChange('defaultStatusCode', parseInt(e.target.value, 10))}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
