'use client';

import { FormEvent, useEffect, useState } from 'react';

type Task = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
};

const STORAGE_KEY = 'azure-mini-tasks-api-url';
const PAGE_VERSION = 'Phiên bản 1.0'; // LAB: đổi thành 'Phiên bản 2.0' rồi git push.

function normaliseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

export default function HomePage() {
  const [apiInput, setApiInput] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('Nhập địa chỉ Backend API rồi bấm Kết nối.');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const defaultUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:4000'
      : '';
    const selected = normaliseUrl(saved || defaultUrl);
    setApiInput(selected);
    setApiUrl(selected);
  }, []);

  useEffect(() => {
    if (!apiUrl) return;
    void loadTasks(apiUrl);
  }, [apiUrl]);

  async function loadTasks(url = apiUrl) {
    setBusy(true);
    try {
      const response = await fetch(`${url}/api/tasks`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const list: Task[] = await response.json();
      setTasks(list);
      setMessage(`Đã kết nối Backend. Hiện có ${list.length} công việc.`);
    } catch (err) {
      setMessage(`Không thể gọi Backend: ${err instanceof Error ? err.message : 'Lỗi không xác định'}. Kiểm tra URL, CORS, MySQL và Backend.`);
    } finally {
      setBusy(false);
    }
  }

  function connect() {
    const nextUrl = normaliseUrl(apiInput);
    if (!/^https?:\/\//i.test(nextUrl)) {
      setMessage('Địa chỉ phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, nextUrl);
    if (nextUrl === apiUrl) {
      void loadTasks(nextUrl);
    } else {
      setApiUrl(nextUrl);
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiUrl || !title.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setTitle('');
      await loadTasks();
    } catch (err) {
      setMessage(`Thêm công việc thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    } finally {
      setBusy(false);
    }
  }

  async function modifyTask(id: number, method: 'PATCH' | 'DELETE') {
    if (!apiUrl) return;
    setBusy(true);
    try {
      const suffix = method === 'PATCH' ? '/toggle' : '';
      const response = await fetch(`${apiUrl}/api/tasks/${id}${suffix}`, { method });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await loadTasks();
    } catch (err) {
      setMessage(`Cập nhật thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    } finally {
      setBusy(false);
    }
  }

  const completed = tasks.filter(task => task.completed).length;

  return (
    <main className="shell">
      <div className="topbar">
        <div className="logo"><span className="logo-mark">A</span> Azure Deployment Lab</div>
        <span className="version">{PAGE_VERSION}</span>
      </div>

      <section className="hero">
        <div className="eyebrow">NEXT.JS · NESTJS · PRISMA · MYSQL</div>
        <h1>Đưa website từ <span>Local lên Azure</span></h1>
        <p>Một dự án nhỏ để thực hành GitHub, Azure Cloud và CI/CD. Khi thêm công việc, dữ liệu được lưu trong MySQL, không phải trong trình duyệt.</p>
      </section>

      <div className="main-grid">
        <section className="panel connection-panel">
          <div className="panel-top"><h2>01 · Kết nối Backend API</h2><span className="chip">Cấu hình một lần</span></div>
          <p className="helper">Ở máy local dùng <code>http://localhost:4000</code>. Sau khi deploy, điền URL công khai của Azure App Service.</p>
          <div className="api-form">
            <label className="sr-only" htmlFor="api-url">Địa chỉ Backend</label>
            <input id="api-url" aria-label="Địa chỉ Backend" value={apiInput} onChange={event => setApiInput(event.target.value)} placeholder="https://ten-backend.azurewebsites.net" />
            <button className="btn btn-secondary" onClick={connect} type="button" disabled={busy}>Kết nối</button>
          </div>
          <p className="status" role="status">{message}</p>
          <p className="note">Địa chỉ API chỉ được lưu trên trình duyệt hiện tại. Đây là ứng dụng demo không có đăng nhập.</p>
        </section>

        <section className="panel tasks-panel">
          <div className="panel-top"><h2>02 · Danh sách công việc</h2><span className="chip">{completed}/{tasks.length} đã xong</span></div>
          <form className="task-form" onSubmit={createTask}>
            <label className="sr-only" htmlFor="task-title">Tên công việc</label>
            <input id="task-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Ví dụ: Deploy website lên Azure" maxLength={150} />
            <button className="btn btn-primary" disabled={busy || !apiUrl || !title.trim()}>+ Thêm</button>
          </form>
          {tasks.length === 0 ? (
            <div className="empty">Chưa có công việc. Hãy kết nối API và thêm công việc đầu tiên.</div>
          ) : (
            <ul className="tasks">
              {tasks.map(task => (
                <li key={task.id} className={task.completed ? 'task completed' : 'task'}>
                  <button className="check" title="Đổi trạng thái" aria-label={`Đổi trạng thái ${task.title}`} disabled={busy} onClick={() => void modifyTask(task.id, 'PATCH')}>{task.completed ? '✓' : '○'}</button>
                  <span className="task-title">{task.title}</span>
                  <button className="remove" title="Xóa công việc" aria-label={`Xóa ${task.title}`} disabled={busy} onClick={() => void modifyTask(task.id, 'DELETE')}>Xóa</button>
                </li>
              ))}
            </ul>
          )}
          <button className="refresh" onClick={() => void loadTasks()} disabled={!apiUrl || busy}>↻ Tải lại dữ liệu từ MySQL</button>
        </section>
      </div>

      <footer>Local → GitHub → GitHub Actions → Azure · Dự án thực hành, không dùng để lưu dữ liệu nhạy cảm</footer>
    </main>
  );
}
