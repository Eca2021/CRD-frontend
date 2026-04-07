import React, { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SidebarMenu from './components/SidebarMenu';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './components/UserManagement';
import UserRegistration from './components/UserRegistration';
import RoleManagement from './components/RoleManagement';
import ClientManagement from './components/ClientManagement';
import RateManagement from './components/RateManagement';
import CreditManagement from './components/CreditManagement';
import CancelledCreditManagement from './components/CancelledCreditManagement';
import Cashier from './components/Cashier';
import AccountingModule from './components/AccountingModule';
import AdminDashboard from './components/AdminDashboard';
import PaymentAudit from './components/PaymentAudit';
import EmpresaManagement from './components/EmpresaManagement';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authInfo, setAuthInfo] = useState({
    isAuthenticated: false,
    userRoles: [],
    username: '',
    token: '',
    userId: null,
    id_empresa: null,
    empresa_nombre: '',
    userPermissions: []
  });
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const roles = JSON.parse(localStorage.getItem('user_roles') || '[]');
    const username = localStorage.getItem('username') || '';
    const userId = parseInt(localStorage.getItem('user_id'), 10);
    const idEmpresaRaw = localStorage.getItem('id_empresa');
    const idEmpresa = (idEmpresaRaw === 'null' || idEmpresaRaw === 'undefined' || !idEmpresaRaw) 
                      ? null 
                      : parseInt(idEmpresaRaw, 10);
    const empresaNombre = localStorage.getItem('empresa_nombre') || '';
    const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');

    if (token) {
      setAuthInfo({
        isAuthenticated: true,
        userRoles: roles,
        username,
        token,
        userId,
        id_empresa: idEmpresa,
        empresa_nombre: empresaNombre,
        userPermissions: permissions
      });
    }
    setLoadingAuth(false);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Guard de sanidad en el cliente (si algo intenta empujar rutas rotas)
  useEffect(() => {
    const p = location.pathname;
    const isBad =
      /^\/seguridad\/(undefined|null)\/?$/i.test(p) ||
      /^\/seguridad\/usuarios\/(undefined|null)\/?$/i.test(p);
    if (isBad) {
      navigate('/seguridad/usuarios', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    setAuthInfo({
      isAuthenticated: false,
      userRoles: [],
      username: '',
      token: '',
      userId: null,
      id_empresa: null,
      empresa_nombre: '',
      userPermissions: []
    });
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loadingAuth) return <div>Cargando sesión...</div>;

  return (
    <Routes>
      {/* Login público */}
      <Route path="/login" element={<Login setAuthInfo={setAuthInfo} />} />

      {/* Todo lo demás requiere estar autenticado */}
      <Route
        path="/*"
        element={
          authInfo.isAuthenticated ? (
            <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
              {/* Mobile Sidebar Toggle Button */}
              <button className="sidebar-toggle-button" onClick={toggleSidebar}>
                <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>

              {/* Overlay for mobile when sidebar is open */}
              {sidebarOpen && (
                <div
                  className="sidebar-overlay"
                  onClick={() => setSidebarOpen(false)}
                ></div>
              )}

              <SidebarMenu
                onLogout={handleLogout}
                username={authInfo.username}
                userRoles={authInfo.userRoles}
                userPermissions={authInfo.userPermissions}
                empresaNombre={authInfo.empresa_nombre}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />

              <div className="main-content">
                <Routes>
                  {/* Página de inicio con Dashboard para todos los usuarios */}
                  <Route
                    path="/inicio"
                    element={
                      <ProtectedRoute {...authInfo}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Operaciones */}
                  <Route
                    path="/caja"
                    element={
                      <ProtectedRoute {...authInfo}>
                        <Cashier />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/auditoria-pagos"
                    element={
                      <ProtectedRoute {...authInfo}>
                        <PaymentAudit />
                      </ProtectedRoute>
                    }
                  />

                  {/* Gestión Global de Empresas (SuperAdmin) */}
                  <Route
                    path="/empresas"
                    element={
                      <ProtectedRoute {...authInfo} requiredRoles={['SuperAdmin']}>
                        <EmpresaManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* Seguridad */}
                  <Route
                    path="/seguridad/usuarios"
                    element={
                      <ProtectedRoute {...authInfo} requiredPermissions={['usuarios.gestionar']}>
                        <UserManagement token={authInfo.token} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seguridad/registrar-usuario"
                    element={
                      <ProtectedRoute {...authInfo} requiredPermissions={['usuarios.crear']}>
                        <UserRegistration token={authInfo.token} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seguridad/roles"
                    element={
                      <ProtectedRoute {...authInfo} requiredPermissions={['roles.gestionar']}>
                        <>
                          <h2>Gestión de Roles</h2>
                          <RoleManagement token={authInfo.token} />
                        </>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seguridad/usuarios/:id"
                    element={
                      <ProtectedRoute {...authInfo} requiredPermissions={['usuarios.modificar']}>
                        <UserRegistration token={authInfo.token} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seguridad/clientes"
                    element={
                      <ProtectedRoute {...authInfo} requiredPermissions={['cliente.gestionar']}>
                        <ClientManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seguridad/tasas"
                    element={
                      <ProtectedRoute {...authInfo} requiredPermissions={['tasa.gestionar']}>
                        <RateManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seguridad/creditos"
                    element={
                      <ProtectedRoute {...authInfo} requiredPermissions={['credito.gestionar']}>
                        <CreditManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seguridad/creditos-anulados"
                    element={
                      <ProtectedRoute {...authInfo} requiredPermissions={['credito.gestionar']}>
                        <CancelledCreditManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contabilidad"
                    element={
                      <ProtectedRoute {...authInfo}>
                        <AccountingModule />
                      </ProtectedRoute>
                    }
                  />

                  {/* Redirecciones sanitizadoras específicas */}
                  <Route
                    path="/seguridad/undefined"
                    element={<Navigate to="/seguridad/usuarios" replace />}
                  />
                  <Route
                    path="/seguridad/null"
                    element={<Navigate to="/seguridad/usuarios" replace />}
                  />
                  <Route
                    path="/seguridad/usuarios/undefined"
                    element={<Navigate to="/seguridad/usuarios" replace />}
                  />
                  <Route
                    path="/seguridad/usuarios/null"
                    element={<Navigate to="/seguridad/usuarios" replace />}
                  />

                  {/* Catch-all dentro de /seguridad */}
                  <Route
                    path="/seguridad/*"
                    element={<Navigate to="/seguridad/usuarios" replace />}
                  />

                  {/* Root dentro de la app autenticada: siempre a /inicio */}
                  <Route path="/" element={<Navigate to="/inicio" replace />} />

                  {/* Fallback global dentro de la app autenticada */}
                  <Route path="*" element={<Navigate to="/inicio" replace />} />
                </Routes>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
