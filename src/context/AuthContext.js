// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Inicializa estado si ya hay token en localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('user_id');
    const idEmpresaRaw = localStorage.getItem('id_empresa');
    const idEmpresa = (idEmpresaRaw === 'null' || idEmpresaRaw === 'undefined' || !idEmpresaRaw) 
                      ? null 
                      : parseInt(idEmpresaRaw, 10);
    const empresaNombre = localStorage.getItem('empresa_nombre');
    const roles = JSON.parse(localStorage.getItem('user_roles') || '[]');
    const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');

    if (token) {
      setUser({
        token,
        username: username || '',
        userId: userId ? parseInt(userId, 10) : null,
        id_empresa: idEmpresa,
        empresa_nombre: empresaNombre || '',
        roles: roles,
        permissions: permissions,
      });
    }
  }, []);

  // Login: postea al backend, guarda todo en localStorage y setUser
  const login = async (nombreUsuario, contrasena) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario, contrasena }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    const accessToken = data.access_token ?? data.accessToken;
    
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('user_id', String(data.user_id));
    if (data.id_empresa !== null && data.id_empresa !== undefined) {
      localStorage.setItem('id_empresa', String(data.id_empresa));
    } else {
      localStorage.setItem('id_empresa', 'null');
    }
    localStorage.setItem('empresa_nombre', data.empresa_nombre || '');
    localStorage.setItem('user_roles', JSON.stringify(data.user_roles || []));
    localStorage.setItem('user_permissions', JSON.stringify(data.user_permissions || []));

    setUser({
      token: accessToken,
      username: data.username,
      userId: data.user_id,
      id_empresa: data.id_empresa,
      empresa_nombre: data.empresa_nombre,
      roles: data.user_roles || [],
      permissions: data.user_permissions || [],
    });

    return true;
  };

  const logout = () => {
    localStorage.clear(); // Limpieza total de residuos
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
