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
    const roles = JSON.parse(localStorage.getItem('user_roles') || '[]');
    const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');

    if (token) {
      setUser({
        token,
        username: username || '',
        userId: userId ? parseInt(userId, 10) : null,
        roles,
        permissions,
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
    // Ajusta estos campos a lo que devuelve tu backend:
    // data.accessToken, data.username, data.userId, data.roles, data.permissions
    //localStorage.setItem('access_token', data.accessToken);
    const accessToken = data.access_token ?? data.accessToken;
    localStorage.setItem('access_token', accessToken);

    localStorage.setItem('username', data.username);
    localStorage.setItem('user_id', String(data.userId));
    localStorage.setItem('user_roles', JSON.stringify(data.roles || []));
    localStorage.setItem('user_permissions', JSON.stringify(data.permissions || []));

    setUser({
      token: data.accessToken,
      username: data.username,
      userId: data.userId,
      roles: data.roles || [],
      permissions: data.permissions || [],
    });

    return true;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_permissions');
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
