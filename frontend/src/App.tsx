import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import api, { authApi } from './api';
import './App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authApi.post('/login', { email, password });
      const { token, role, tenantId, permissions } = response.data;
      login(token, { role, tenantId, permissions });
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Wazeefa Login</h2>
      {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          className="input" 
          type="email" 
          placeholder="Email address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          className="input" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button className="btn btn-primary" type="submit">Sign In</button>
      </form>
    </div>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, hasPermission, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '250px', background: 'rgba(30, 41, 59, 0.7)', padding: '1.5rem', borderRight: '1px solid var(--border)' }}>
        <h2>Wazeefa</h2>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>Role: {user?.role}</span>
          {user?.email && <span style={{ wordBreak: 'break-all' }}>{user.email}</span>}
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <a href="/projects">Projects</a>
          {hasPermission('users.read') && <a href="/users">Users</a>}
          {user?.role === 'SUPER_ADMIN' && <a href="/permissions">Permissions</a>}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => { logout(); navigate('/login'); }}>
            Log Out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '2rem', position: 'relative' }}>
        {children}
      </main>
    </div>
  );
};

const Projects = () => {
  const { hasPermission, user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [useCase, setUseCase] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setAddress('');
    setUseCase('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (project: any) => {
    setEditingProject(project.id);
    setName(project.name);
    setAddress(project.address);
    setUseCase(project.useCase);
    setStatus(project.status);
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject}`, { name, address, useCase, status });
      } else {
        await api.post('/projects', { name, address, useCase, status });
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error('Failed to save project', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Projects</h1>
        {hasPermission('projects.create') && (
          <button className="btn btn-primary" onClick={openCreateModal}>Create Project</button>
        )}
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Use Case</th>
              <th>Status</th>
              {user?.role === 'SUPER_ADMIN' && <th>Tenant ID</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={user?.role === 'SUPER_ADMIN' ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No projects found.</td>
              </tr>
            ) : (
              projects.map(project => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.address}</td>
                  <td>{project.useCase}</td>
                  <td><span style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.8rem' }}>{project.status}</span></td>
                  {user?.role === 'SUPER_ADMIN' && (
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{project.tenantId || 'N/A'}</td>
                  )}
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {hasPermission('projects.update') && <button className="btn" style={{ background: 'var(--border)', color: 'white' }} onClick={() => openEditModal(project)}>Edit</button>}
                      {hasPermission('projects.delete') && <button className="btn btn-danger" onClick={() => handleDelete(project.id)}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '400px', position: 'relative' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
            <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="input" placeholder="Project Name" value={name} onChange={e => setName(e.target.value)} required />
              <input className="input" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} required />
              <textarea className="input" placeholder="Use Case" value={useCase} onChange={e => setUseCase(e.target.value)} required style={{ minHeight: '100px', resize: 'vertical' }} />
              {editingProject && (
                <select className="input" value={status} onChange={e => setStatus(e.target.value)} required style={{ WebkitAppearance: 'none', background: 'var(--bg-dark)' }}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'var(--border)', color: 'white' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingProject ? 'Update' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const Users = () => {
  const { hasPermission, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [assignedRole, setAssignedRole] = useState('AGENT');
  const [permissions, setPermissions] = useState<string[]>(['projects.read']);

  const availablePermissions = ['projects.create', 'projects.read', 'projects.update', 'projects.delete'];

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const togglePermission = (perm: string) => {
    setPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', { email, password, assignedRole, permissions });
      setIsModalOpen(false);
      setEmail('');
      setPassword('');
      setPermissions(['projects.read']);
      fetchUsers();
    } catch (err) {
      console.error('Failed to create user', err);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Users</h1>
        {hasPermission('users.create') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Create User</button>
        )}
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Tenant ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td><span style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.8rem' }}>{u.role}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{u.tenantId || 'N/A'}</td>
                  <td>
                    <span style={{ color: u.isActive ? 'var(--primary)' : 'var(--danger)' }}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    {/* Admins can disable agents. Super Admins can disable anyone except themselves. */}
                    {u.role !== 'SUPER_ADMIN' && user?.role !== 'AGENT' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {hasPermission('users.update') && (
                          <button 
                            className={`btn ${u.isActive ? 'btn-danger' : 'btn-primary'}`} 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => toggleUserStatus(u.id, u.isActive)}
                          >
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '450px', position: 'relative' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New User</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              
              {user?.role === 'SUPER_ADMIN' && (
                <select className="input" value={assignedRole} onChange={e => setAssignedRole(e.target.value)} style={{ WebkitAppearance: 'none', background: 'var(--bg-dark)' }}>
                  <option value="AGENT">AGENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              )}

              {assignedRole === 'AGENT' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Assign Permissions:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {availablePermissions.map(perm => (
                      <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <input type="checkbox" checked={permissions.includes(perm)} onChange={() => togglePermission(perm)} />
                        {perm}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'var(--border)', color: 'white' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const Permissions = () => {
  const { hasPermission } = useAuth();
  const [adminPerms, setAdminPerms] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const availablePermissions = ['projects.create', 'projects.read', 'projects.update', 'projects.delete', 'users.create', 'users.read', 'users.update', 'users.delete'];

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const res = await api.get('/permissions/admin');
        setAdminPerms(res.data);
      } catch (err) {
        console.error('Failed to fetch admin perms', err);
      }
    };
    fetchPerms();
  }, []);

  const togglePermission = (perm: string) => {
    setSaved(false);
    setAdminPerms(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    try {
      await api.post('/permissions/admin', { permissions: adminPerms });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save perms', err);
    }
  };

  if (!hasPermission('permissions.manage')) {
    return <DashboardLayout><h1>Forbidden</h1></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Global Admin Permissions</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure what permissions all ADMIN roles inherently possess across their tenants.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Allowed Permissions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {availablePermissions.map(perm => (
            <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
              <input type="checkbox" checked={adminPerms.includes(perm)} onChange={() => togglePermission(perm)} style={{ width: '18px', height: '18px' }} />
              {perm}
            </label>
          ))}
        </div>
        
        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSave}>Save Configuration</button>
          {saved && <span style={{ color: 'var(--success)' }}>Saved successfully!</span>}
        </div>
      </div>
    </DashboardLayout>
  );
};

const AppRoutes = () => {
  const { token } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      {token ? (
        <>
          <Route path="/projects" element={<Projects />} />
          <Route path="/users" element={<Users />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/" element={<Navigate to="/projects" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
