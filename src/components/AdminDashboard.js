// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './AdminDashboard.css'; // Mantenemos el CSS, lo ajustaremos si hace falta
import { api, endpoints } from '../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave, faHandHoldingUsd, faExclamationCircle, faCalendarCheck, faPlusCircle
} from '@fortawesome/free-solid-svg-icons';

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del dashboard
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.get(endpoints.dashboard.summary);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos del dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Función para Apertura de Caja
  const handleAperturaCaja = () => {
    Swal.fire({
      title: 'Apertura de Caja',
      text: 'Ingresa el monto inicial de capital operativo',
      input: 'number',
      inputAttributes: {
        min: 0,
        step: 0.01
      },
      showCancelButton: true,
      confirmButtonText: 'Abrir Caja',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: (monto) => {
        if (!monto || monto <= 0) {
          Swal.showValidationMessage('Por favor ingresa un monto válido');
          return false;
        }
        return api.post(endpoints.accounting.apertura, { monto })
          .then(response => {
            return response;
          })
          .catch(error => {
            Swal.showValidationMessage(`Error: ${error.message}`);
          });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: '¡Caja Abierta!',
          text: 'El capital operativo ha sido registrado correctamente.',
        });
        loadDashboard(); // Recargar datos para ver el nuevo capital
      }
    });
  };

  const formatMoney = (amount) => {
    return Number(amount).toLocaleString('es-PY', { minimumFractionDigits: 0 });
  };

  if (loading) {
    return <div className="loading-state"><div className="spinner"></div><p>Cargando finanzas...</p></div>;
  }

  const { 
    capital_disponible, 
    caja_total, 
    por_cobrar_capital, 
    ganancia_pendiente, 
    ganancia_realizada, 
    cash_flow_chart 
  } = dashboardData || {};

  // Colores para gráficos (si se usaran)
  const COLORS_PIE = ['#10b981', '#ef4444'];

  return (
    <div className="admin-dashboard-container" style={{ padding: '20px' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Panel Financiero Informativo</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Estado real del negocio</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Capital Disponible */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #3b82f6', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}>
          <div className="kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontSize: '1.2rem' }}>
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label" style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Capital Disponible</span>
            <h3 className="kpi-value" style={{ margin: '4px 0', color: '#1e293b', fontSize: '1.25rem' }}>Gs. {formatMoney(capital_disponible)}</h3>
          </div>
        </div>

        {/* Caja Total Actual */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}>
          <div className="kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontSize: '1.2rem' }}>
            <FontAwesomeIcon icon={faPlusCircle} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label" style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Caja Total Actual</span>
            <h3 className="kpi-value" style={{ margin: '4px 0', color: '#1e293b', fontSize: '1.25rem' }}>Gs. {formatMoney(caja_total)}</h3>
          </div>
        </div>

        {/* Por Cobrar (Capital) */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}>
          <div className="kpi-icon" style={{ backgroundColor: '#fffbe3', color: '#f59e0b', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontSize: '1.2rem' }}>
            <FontAwesomeIcon icon={faHandHoldingUsd} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label" style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Por Cobrar (Capital)</span>
            <h3 className="kpi-value" style={{ margin: '4px 0', color: '#1e293b', fontSize: '1.25rem' }}>Gs. {formatMoney(por_cobrar_capital)}</h3>
          </div>
        </div>

        {/* Ganancia Pendiente */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}>
          <div className="kpi-icon" style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontSize: '1.2rem' }}>
            <FontAwesomeIcon icon={faExclamationCircle} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label" style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Ganancia Pendiente</span>
            <h3 className="kpi-value" style={{ margin: '4px 0', color: '#1e293b', fontSize: '1.25rem' }}>Gs. {formatMoney(ganancia_pendiente)}</h3>
          </div>
        </div>

        {/* Ganancia Realizada */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #ec4899', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}>
          <div className="kpi-icon" style={{ backgroundColor: '#fdf2f8', color: '#ec4899', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontSize: '1.2rem' }}>
            <FontAwesomeIcon icon={faCalendarCheck} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label" style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Ganancia Realizada</span>
            <h3 className="kpi-value" style={{ margin: '4px 0', color: '#1e293b', fontSize: '1.25rem' }}>Gs. {formatMoney(ganancia_realizada)}</h3>
          </div>
        </div>
      </div>

      {/* Flujo de Dinero (Mantenemos el gráfico original porque es valioso) */}
      <div className="charts-grid" style={{ marginTop: '20px' }}>
        <div className="chart-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#334155' }}>Flujo de Caja (Últimos 30 días)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={cash_flow_chart}>
                <defs>
                  <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEgreso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Legend />
                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIngreso)" />
                <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#ef4444" fillOpacity={1} fill="url(#colorEgreso)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
