import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import './App.css';

// Placeholder components
const Login = () => <div className="card" style={{ maxWidth: '400px', margin: '100px auto' }}><h2>Login</h2><p>Authentication coming soon.</p></div>;
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <aside style={{ width: '250px', background: 'rgba(30, 41, 59, 0.7)', padding: '1.5rem', borderRight: '1px solid var(--border)' }}>
      <h2>Wazeefa</h2>
      <nav style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <a href="/projects">Projects</a>
        <a href="/users">Users</a>
        <a href="/permissions">Permissions</a>
      </nav>
    </aside>
    <main style={{ flex: 1, padding: '2rem' }}>
      {children}
    </main>
  </div>
);

const Projects = () => (
  <DashboardLayout>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <h1>Projects</h1>
      <button className="btn btn-primary">Create Project</button>
    </div>
    <div className="card table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No projects found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </DashboardLayout>
);

function App() {
  const [isAuthenticated] = useState(true); // Mock for now

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        {isAuthenticated ? (
          <>
            <Route path="/projects" element={<Projects />} />
            <Route path="/users" element={<DashboardLayout><h1>Users</h1></DashboardLayout>} />
            <Route path="/permissions" element={<DashboardLayout><h1>Permissions</h1></DashboardLayout>} />
            <Route path="/" element={<Navigate to="/projects" replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
