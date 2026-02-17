// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import Swal from "sweetalert2";

const ProtectedRoute = ({
  children,
  isAuthenticated,
  token,
  userRoles = [],
  requiredRoles = [],
  userPermissions = [],
  requiredPermissions = []
}) => {
  console.log("🧪 Entrando a ProtectedRoute:", {
    isAuthenticated,
    token,
    userRoles,
    userPermissions,
    requiredRoles,
    requiredPermissions
  });

  if (!isAuthenticated || !token) {
    console.warn("❌ ProtectedRoute: Usuario no autenticado o token ausente. Redirigiendo a /login.");
    //Swal.fire("Acceso denegado", "Debes iniciar sesión", "warning");
    return <Navigate to="/login" replace />;
  }

  // Admin bypass
  const isAdmin = userRoles.some(r => r.toUpperCase() === 'ADMIN');
  if (isAdmin) {
    console.log("✅ ProtectedRoute: Usuario es Admin. Acceso concedido.");
    return children;
  }

  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(role => userRoles.some(ur => {
      const rName = typeof ur === 'string' ? ur : (ur.nombre || ur.name || '');
      return rName.toUpperCase() === role.toUpperCase();
    }));
    console.log("🔍 Verificando roles:", { requiredRoles, hasRole });
    if (!hasRole) {
      console.warn("❌ ProtectedRoute: Falta rol requerido.");
      // Swal.fire("Acceso denegado", "No tienes permisos para acceder a esta sección", "error");
      return <Navigate to="/inicio" replace />;
    }
  }

  if (requiredPermissions.length > 0) {
    console.log("🔐 Verificando permisos:", {
      requiredPermissions,
      userPermissions
    });
    const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));
    console.log("🔍 Resultado verificación permisos:", hasPermission);
    if (!hasPermission) {
      console.warn("❌ ProtectedRoute: Falta permiso requerido.");
      // Swal.fire("Acceso denegado", "No tienes permisos para acceder a esta sección", "error");
      return <Navigate to="/inicio" replace />;
    }
  }

  console.log("✅ ProtectedRoute: Autorizado. Renderizando componente hijo.");
  return children;
};

export default ProtectedRoute;
