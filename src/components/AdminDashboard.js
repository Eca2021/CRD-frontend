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

  const { capital_operativo, cartera_activa, mora_vencida, recaudacion_mensual, cash_flow_chart, portfolio_status } = dashboardData || {};

  // Colores para gráficos
  const COLORS_PIE = ['#10b981', '#ef4444']; // Verde (Al día), Rojo (Mora)

  return (
    <div className="admin-dashboard-container" style={{ padding: '20px' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Panel Financiero</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Visión general del estado del negocio</p>
        </div>
        <button className="btn btn-primary" onClick={handleAperturaCaja}>
          <FontAwesomeIcon icon={faPlusCircle} style={{ marginRight: '8px' }} />
          Apertura de Caja
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {/* Capital Operativo */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Capital Disponible</span>
            <h3 className="kpi-value">Gs. {formatMoney(capital_operativo)}</h3>
            <span className="kpi-subtext">En Caja Operativa</span>
          </div>
        </div>

        {/* Cartera Activa */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="kpi-icon" style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
            <FontAwesomeIcon icon={faHandHoldingUsd} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Cartera Activa</span>
            <h3 className="kpi-value">Gs. {formatMoney(cartera_activa)}</h3>
            <span className="kpi-subtext">Total Colocado (Pendiente)</span>
          </div>
        </div>

        {/* Mora Vencida */}
        <div className="kpi-card" style={{ borderLeft: `4px solid ${mora_vencida > 0 ? '#ef4444' : '#10b981'}` }}>
          <div className="kpi-icon" style={{ backgroundColor: mora_vencida > 0 ? '#fef2f2' : '#ecfdf5', color: mora_vencida > 0 ? '#ef4444' : '#10b981' }}>
            <FontAwesomeIcon icon={faExclamationCircle} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Mora Vencida</span>
            <h3 className="kpi-value" style={{ color: mora_vencida > 0 ? '#dc2626' : undefined }}>
              Gs. {formatMoney(mora_vencida)}
            </h3>
            <span className="kpi-subtext">
              {mora_vencida > 0 ? '¡Atención Requerida!' : 'Sin Mora'}
            </span>
          </div>
        </div>

        {/* Recaudación Mensual */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <FontAwesomeIcon icon={faCalendarCheck} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Recaudado (Mes)</span>
            <h3 className="kpi-value">Gs. {formatMoney(recaudacion_mensual)}</h3>
            <span className="kpi-subtext">Liquidez generada</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Flujo de Dinero (Area Chart) */}
        <div className="chart-card full-width" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#334155' }}>Flujo de Dinero Real (30 Días)</h3>
          <div style={{ width: '100%', height: 300 }}>
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
                <Area type="monotone" dataKey="ingresos" name="Ingresos (Caja)" stroke="#10b981" fillOpacity={1} fill="url(#colorIngreso)" />
                <Area type="monotone" dataKey="egresos" name="Egresos (Caja)" stroke="#ef4444" fillOpacity={1} fill="url(#colorEgreso)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado de Cartera (Pie Chart) */}
        <div className="chart-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#334155' }}>Estado de Cartera</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={portfolio_status}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {portfolio_status && portfolio_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
