// src/components/Login.js
import React, { useState } from 'react';
import './Login.css';
import { endpoints } from '../config/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import loginBg from '../assets/images/login.jpeg';
import logoImg from '../assets/images/icono.jpeg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

// pequeña ayuda para decodificar un JWT si lo necesitas como fallback
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

function getHomeRouteByRoles(roles = []) {
  const r = roles.map((x) => String(x).toLowerCase());

  if (r.includes('admin')) {
    return '/dashboard';
  }

  if (r.includes('vendedor') || r.includes('cajero')) {
    return '/pos/apertura-caja';
  }

  return '/inicio';
}





function Login({ setAuthInfo }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(endpoints.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // Manejo de errores HTTP
      if (!response.ok) {
        let errorMsg = 'Nombre de usuario o contraseña incorrectos';
        try {
          const errorData = await response.json();
          errorMsg = errorData.msg || errorData.message || errorMsg;
        } catch (_) { }
        Swal.fire({
          icon: 'error',
          title: 'Error de autenticación',
          text: errorMsg,
          confirmButtonText: 'Cerrar',
          position: 'top',
        });
        return;
      }

      const data = await response.json();
      
      // Guarda tokens y datos de sesión
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_roles', JSON.stringify(data.user_roles || []));
      localStorage.setItem('user_permissions', JSON.stringify(data.user_permissions || []));
      localStorage.setItem('username', data.username || username);
      localStorage.setItem('user_id', String(data.user_id));
      localStorage.setItem('id_empresa', String(data.id_empresa));
      localStorage.setItem('empresa_nombre', data.empresa_nombre || '');

      // Actualiza el estado global
      setAuthInfo({
        isAuthenticated: true,
        token: data.access_token,
        username: data.username || username,
        userId: data.user_id,
        id_empresa: data.id_empresa,
        empresa_nombre: data.empresa_nombre,
        userRoles: data.user_roles || [],
        userPermissions: data.user_permissions || [],
      });

      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Has ingresado a ${data.empresa_nombre || 'el sistema'}.`,
        timer: 1500,
        showConfirmButton: false,
        position: 'top',
      });
      const roles = data.user_roles || [];
      const homeRoute = getHomeRouteByRoles(roles);

      // Redirigimos a la ruta inicial según el rol
      setTimeout(() => navigate(homeRoute, { replace: true }), 900);
      // setTimeout(() => navigate('/'), 900);
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo y la URL sea correcta.',
        confirmButtonText: 'Cerrar',
      });
    }
  };

  return (
    <div className="login-container">
      {/* Left Side: Brand & Image */}
      <div className="login-left" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="login-overlay"></div>
        <div className="login-brand-content">
          <p className="login-brand-subtitle">Bienvenido al sistema</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-logo-container">
            <img src={logoImg} alt="Logo" className="login-logo" />
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Iniciar Sesión</h2>

            <div className="form-group">
              <label htmlFor="username">Usuario:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 10
                  }}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">Ingresar</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
