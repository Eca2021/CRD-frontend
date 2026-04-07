// src/components/UserRegistration.js
import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL, endpoints } from '../config/api';
import { useAuth } from '../context/AuthContext';


const ensureOk = async (response, fallbackMsg) => {
  if (response.status === 401) {
    throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
  }
  if (!response.ok) {
    let msg = fallbackMsg || `Error ${response.status}`;
    try {
      const err = await response.json();
      if (err && (err.msg || err.message || err.error)) {
        msg = err.msg || err.message || err.error;
      }
    } catch { }
    throw new Error(msg);
  }
  if (response.status === 204) return null;
  return response.json();
};

// ---- Util: bloquea navegación/recurso a /seguridad/undefined o /seguridad/null
function useBlockBadSecurityUrls() {
  useEffect(() => {
    const badPath = (url) =>
      typeof url === 'string' && /\/seguridad\/(undefined|null)(\/)?$/i.test(url);

    const onClickCapture = (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (a && badPath(a.getAttribute('href'))) {
        e.preventDefault();
        e.stopPropagation();
        console.warn('Bloqueado link roto:', a.getAttribute('href'));
      }
    };
    document.addEventListener('click', onClickCapture, true);

    const fixImages = () => {
      document.querySelectorAll('img[src]').forEach((img) => {
        const src = img.getAttribute('src');
        if (badPath(src)) {
          console.warn('Reemplazando img rota:', src);
          img.setAttribute(
            'src',
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="96"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2399a" font-size="12">sin imagen</text></svg>'
          );
        }
      });
    };
    fixImages();

    // Use window.history to avoid ESLint Restricted Globals warning
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (st, title, url) {
      if (badPath(url)) {
        console.warn('pushState corregido de', url, 'a /seguridad');
        return origPush.call(this, st, title, '/seguridad');
      }
      return origPush.call(this, st, title, url);
    };
    window.history.replaceState = function (st, title, url) {
      if (badPath(url)) {
        console.warn('replaceState corregido de', url, 'a /seguridad');
        return origReplace.call(this, st, title, '/seguridad');
      }
      return origReplace.call(this, st, title, url);
    };

    return () => {
      document.removeEventListener('click', onClickCapture, true);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);
}

// Asegúrate de que UserRegistration reciba el authToken como prop
function UserRegistration({ token }) {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Multi-tenant:
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [availableEmpresas, setAvailableEmpresas] = useState([]);
  const isSuperAdmin = useMemo(() => {
    const roles = user?.roles || [];
    const hasSuperRole = roles.some(r => {
      const rName = typeof r === 'string' ? r : (r.nombre || r.name || '');
      return rName.toUpperCase() === 'SUPERADMIN';
    });
    
    // REGLA DE ORO: Si tiene id_empresa, NO ES SUPERADMIN GLOBAL
    const isGlobal = (!user?.id_empresa || user?.id_empresa === 'null' || user?.id_empresa === 'undefined');
    
    console.log("🛡️ Seguridad UserRegistration (Contexto):", { 
      username: user?.username, 
      id_empresa: user?.id_empresa, 
      hasSuperRole, 
      isGlobal,
      finalResult: hasSuperRole && isGlobal 
    });

    return hasSuperRole && isGlobal;
  }, [user]);

  // IDs de roles:
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);  // [number, ...]
  const [availableRoles, setAvailableRoles] = useState([]);  // [{ id_rol, nombre_rol }, ...]

  const filteredRoles = useMemo(() => {
    if (isSuperAdmin) return availableRoles;
    return (availableRoles || []).filter(r => (r.nombre || '').toUpperCase() !== 'SUPERADMIN');
  }, [availableRoles, isSuperAdmin]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isSuperAdmin) return;
      setLoadingEmpresas(true);
      try {
        const resp = await fetch(endpoints.empresas, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await ensureOk(resp, 'Error al cargar empresas');
        setAvailableEmpresas(data);
        if (data.length > 0) setSelectedEmpresaId(data[0].id_empresa);
      } catch (err) {
        console.error('Error al cargar empresas:', err);
      } finally {
        setLoadingEmpresas(false);
      }
    };

    if (token && isSuperAdmin) {
      fetchCompanies();
    }
  }, [token, isSuperAdmin]);

  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      setError('');
      try {
        const resp = await fetch(`${API_BASE_URL}/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await ensureOk(resp, 'Error al cargar roles');
        setAvailableRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al obtener roles:', err);
        setError(`Error al cargar roles: ${err.message}.`);
        setAvailableRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };

    if (token) {
      fetchRoles();
    } else {
      setAvailableRoles([]);
      setLoadingRoles(false);
      setError('No hay token de autenticación para cargar los roles.');
    }
  }, [token]);

  const handleRoleChange = (event) => {
    const roleId = parseInt(event.target.value, 10);
    if (event.target.checked) {
      setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev : [...prev, roleId]));
    } else {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') setUsername(value);
    else if (name === 'email') setEmail(value);
    else if (name === 'password') setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    const userData = {
      nombre_usuario: username,
      nombre: username,
      email: email,
      password: password,
      estado: 'ACTIVO',
      roles: selectedRoleIds,
      id_empresa: isSuperAdmin ? selectedEmpresaId : undefined
    };

    try {
      const resp = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const result = await ensureOk(resp, 'Error al registrar usuario');
      setMessage(result?.msg || 'Usuario registrado exitosamente.');

      setUsername('');
      setEmail('');
      setPassword('');
      setSelectedRoleIds([]);
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      setError(`Error de registro: ${err.message}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Registrar Nuevo Usuario
        </h2>

        {message && <p className="text-center text-green-600 mb-4">{message}</p>}
        {error && <p className="text-center text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSuperAdmin && (
            <div>
              <label htmlFor="id_empresa" className="block text-sm font-medium text-gray-700">
                Seleccionar Empresa:
              </label>
              <select
                id="id_empresa"
                value={selectedEmpresaId}
                onChange={(e) => setSelectedEmpresaId(e.target.value)}
                disabled={saving || loadingEmpresas}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {availableEmpresas.map(emp => (
                  <option key={emp.id_empresa} value={emp.id_empresa}>
                    {emp.nombre} ({emp.ruc})
                  </option>
                ))}
              </select>
              {loadingEmpresas && <p className="text-xs text-blue-500 mt-1">Cargando empresas...</p>}
            </div>
          )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Usuario:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={handleChange}
              required
              disabled={saving}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
              disabled={saving}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
              disabled={saving}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Selección de Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asignar Roles:
            </label>
            {loadingRoles ? (
              <p className="text-gray-500 text-sm">Cargando roles...</p>
            ) : error && !availableRoles.length ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : availableRoles.length > 0 ? (
              <div className="flex flex-wrap gap-4 mt-2">
                {filteredRoles
                  .map((role) => (
                    <div key={role.id_rol} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`role-${role.id_rol}`}
                      name={`role-${role.id_rol}`}
                      value={role.id_rol}
                      checked={selectedRoleIds.includes(role.id_rol)}
                      onChange={handleRoleChange}
                      disabled={saving}
                      className="h-4 w-4 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`role-${role.id_rol}`} className="ml-2 text-sm text-gray-900">
                      {role.nombre}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hay roles disponibles.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {saving ? 'Registrando…' : 'Registrar Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserRegistration;
