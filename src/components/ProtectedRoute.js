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
  requiredPermissions = [],
  id_empresa = null
}) => {
  // 1. Detección de Roles Elevados (Pase Maestro)
  const isAdmin = userRoles.some(r => {
    const rName = typeof r === 'string' ? r : (r.nombre || r.name || r.nombre_rol || '');
    const upper = rName.toUpperCase().trim();
    return upper === 'ADMIN' || upper === 'SUPERADMIN';
  });

  // 2. Detección específica de SuperAdmin Global (Master maestro)
  const isSuperAdminGlobal = isAdmin && userRoles.some(r => {
    const rName = typeof r === 'string' ? r : (r.nombre || r.name || r.nombre_rol || '');
    return rName.toUpperCase().trim() === 'SUPERADMIN';
  }) && (
    id_empresa === null || 
    id_empresa === undefined || 
    id_empresa === 'null' || 
    id_empresa === 'undefined' ||
    String(id_empresa) === 'null' ||
    isNaN(id_empresa)
  );

  console.log("🛡️ [DEBUG ProtectedRoute]", {
    path: window.location.pathname,
    isAuthenticated,
    isAdmin,
    isSuperAdminGlobal,
    id_empresa,
    userRoles,
    requiredPermissions,
    decision: isAdmin ? "BYPASS ROLE" : "VAL_RESTRICCION"
  });

  if (!isAuthenticated || !token) {
    console.warn("❌ ProtectedRoute: Usuario no autenticado.");
    return <Navigate to="/login" replace />;
  }

  // Si tiene un rol administrativo (Admin o SuperAdmin), le otorgamos paso libre a la ruta. 
  // El aislamiento de datos se maneja internamente en cada componente.
  if (isAdmin) {
    return children;
  }

  // Solo permitimos el paso si el usuario posee los roles o permisos requeridos explícitamente en el App.js.
  // Ya no hay bypass automático compartido para evitar mezclar ADMIN local con SUPERADMIN global.

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
