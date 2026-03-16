import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SidebarMenu.css';
import menuIcon from '../assets/images/icono.jpeg';

import Swal from 'sweetalert2';

function SidebarMenu({
  userRoles,
  username,
  onLogout,
  userId,
  apiBaseUrl = '/api',
  authToken,
  isOpen, // Prop for mobile visibility
  onClose // Prop to close sidebar
}) {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSubmenu = (menuName) => {
    setActiveSubmenu(activeSubmenu === menuName ? null : menuName);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    if (onClose) onClose(); // Close sidebar on mobile when item clicked
  };

  const handleLogout = (e) => {
    e.preventDefault();
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Quieres cerrar sesión?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
        navigate('/login');
        if (onClose) onClose();
      }
    });
  };

  const hasRole = (role) => (userRoles || []).some(r => {
    const rName = typeof r === 'string' ? r : (r.nombre || r.name || '');
    return rName.toUpperCase() === role.toUpperCase();
  });

  const isActive = (path) => location.pathname === path;

  // Derive display role safely
  const firstRole = userRoles?.[0];
  const displayRole = String(typeof firstRole === 'string' ? firstRole : (firstRole?.nombre || firstRole?.name || 'Rol'));

  return (
    <div className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Mobile Close Button */}
      <button className="sidebar-close-button" onClick={onClose}>
        <i className="fas fa-times"></i>
      </button>

      {/* Brand/Logo Section */}
      <div className="sidebar-brand">
        <img src={menuIcon} alt="Logo" className="sidebar-logo-img" />
        <h3 className="sidebar-brand-text">Sistema de Crédito</h3>
      </div>

      {/* Profile Section */}
      <div className="sidebar-profile">
        <div className="profile-avatar">
          <span>{username ? username.charAt(0).toUpperCase() : 'U'}</span>
        </div>

        <div className="profile-info">
          <h4 className="profile-name">{username || 'Usuario'}</h4>
          <span className="profile-role">{displayRole}</span>
        </div>
      </div>

      <div className="sidebar-content">
        {/* GRUPO: PRINCIPAL */}
        <div className="menu-group">
          <h5 className="group-title">Principal</h5>
          <ul className="menu-list">
            <li className={`menu-item ${isActive('/inicio') ? 'active' : ''}`}>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); handleMenuItemClick('/inicio'); }}>
                <i className="fas fa-home menu-icon"></i>
                <span>Inicio</span>
              </a>
            </li>
          </ul>
        </div>

        {/* GRUPO: GESTIÓN */}
        <div className="menu-group">
          <h5 className="group-title">Gestión</h5>
          <ul className="menu-list">
            <li className={`menu-item ${isActive('/seguridad/clientes') ? 'active' : ''}`}>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); handleMenuItemClick('/seguridad/clientes'); }}>
                <i className="fas fa-users menu-icon"></i>
                <span>Clientes</span>
              </a>
            </li>
            <li className={`menu-item ${isActive('/seguridad/tasas') ? 'active' : ''}`}>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); handleMenuItemClick('/seguridad/tasas'); }}>
                <i className="fas fa-percentage menu-icon"></i>
                <span>Tasas Interés</span>
              </a>
            </li>
            <li className={`menu-item ${isActive('/seguridad/creditos') ? 'active' : ''}`}>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); handleMenuItemClick('/seguridad/creditos'); }}>
                <i className="fas fa-money-bill-wave menu-icon"></i>
                <span>Créditos</span>
              </a>
            </li>
            <li className={`menu-item ${isActive('/contabilidad') ? 'active' : ''}`}>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); handleMenuItemClick('/contabilidad'); }}>
                <i className="fas fa-chart-line menu-icon"></i>
                <span>Contabilidad</span>
              </a>
            </li>
          </ul>
        </div>

        {/* GRUPO: OPERACIONES */}
        <div className="menu-group">
          <h5 className="group-title">Operaciones</h5>
          <ul className="menu-list">
            <li className={`menu-item ${isActive('/caja') ? 'active' : ''}`}>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); handleMenuItemClick('/caja'); }}>
                <i className="fas fa-cash-register menu-icon"></i>
                <span>Caja</span>
              </a>
            </li>
            <li className={`menu-item ${isActive('/auditoria-pagos') ? 'active' : ''}`}>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); handleMenuItemClick('/auditoria-pagos'); }}>
                <i className="fas fa-history menu-icon"></i>
                <span>Historial Pagos</span>
              </a>
            </li>
          </ul>
        </div>

        {/* GRUPO: ADMINISTRACIÓN */}
        {hasRole('Admin') && (
          <div className="menu-group">
            <h5 className="group-title">Administración</h5>
            <ul className="menu-list">
              <li className={`menu-item has-submenu ${activeSubmenu === 'seguridad' ? 'open' : ''}`}>
                <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); toggleSubmenu('seguridad'); }}>
                  <div className="link-content">
                    <i className="fas fa-shield-alt menu-icon"></i>
                    <span>Seguridad</span>
                  </div>
                  <i className={`fas fa-chevron-${activeSubmenu === 'seguridad' ? 'up' : 'down'} submenu-arrow`}></i>
                </a>
                <ul className={`submenu ${activeSubmenu === 'seguridad' ? 'active' : ''}`}>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); handleMenuItemClick('/seguridad/usuarios'); }}>Usuarios</a></li>
                  <li><a href="#" onClick={(e) => { e.preventDefault(); handleMenuItemClick('/seguridad/roles'); }}>Roles y Permisos</a></li>
                </ul>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Footer / System */}
      <div className="sidebar-footer">
        <ul className="menu-list">
          <li className="menu-item logout-item">
            <a href="#" className="menu-link" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt menu-icon"></i>
              <span>Cerrar Sesión</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default SidebarMenu;
