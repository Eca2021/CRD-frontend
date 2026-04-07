import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import Swal from 'sweetalert2';

// Usaremos la misma estructura visual "Premium" de la app
import './UserManagement.css'; // Para contenedores, tarjetas y tablas
import '../styles/buttons.css';

function CancelledCreditManagement() {
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadCredits = async () => {
        setLoading(true);
        try {
            // Nuevo endpoint creado en el backend
            const data = await api.get('/api/creditos/anulados');
            setCredits(Array.isArray(data) ? data : []);
        } catch (e) {
            Swal.fire('Error', 'No se pudieron cargar los créditos anulados', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCredits();
    }, []);

    const filtered = (credits || []).filter(c => {
        const q = (search || '').toLowerCase();
        return (
            String(c.id_credito).includes(q) ||
            (c.cliente_nombre || '').toLowerCase().includes(q) ||
            (c.documento_cliente || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="user-mgmt">
            <div className="um-header">
                <h2>Historial de Créditos Anulados</h2>
                <div className="um-actions">
                   <span className="badge badge-danger" style={{ padding: '10px 20px', fontSize: '0.8rem' }}>
                       <i className="fas fa-archive"></i> ARCHIVO DE AUDITORÍA
                   </span>
                </div>
            </div>

            <div className="um-card">
                <div className="search-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por ID, Cliente o Documento..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p className="muted animate-pulse">Cargando archivo histórico...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <i className="fas fa-folder-open" style={{ fontSize: '3rem', color: '#e2e8f0', marginBottom: '20px' }}></i>
                        <p className="muted">No hay créditos anulados registrados.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="role-table table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Socio / Cliente</th>
                                    <th>Documento</th>
                                    <th>Monto Solicitado</th>
                                    <th>Cuotas</th>
                                    <th>Fecha Desembolso</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => (
                                    <tr key={c.id_credito}>
                                        <td data-label="ID" style={{ fontWeight: '800', color: '#64748b' }}>#{c.id_credito}</td>
                                        <td data-label="Cliente">
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '700' }}>{c.cliente_nombre}</span>
                                                <small style={{ color: '#94a3b8' }}>ID Cliente: {c.id_cliente}</small>
                                            </div>
                                        </td>
                                        <td data-label="Documento">{c.documento_cliente}</td>
                                        <td data-label="Monto" style={{ fontWeight: '800', color: '#1e293b' }}>
                                            {Number(c.monto_solicitado).toLocaleString()} <small>Gs.</small>
                                        </td>
                                        <td data-label="Cuotas">{c.cantidad_cuotas}</td>
                                        <td data-label="Fecha">{c.fecha_desembolso}</td>
                                        <td data-label="Estado">
                                            <span className="badge badge-danger">ANULADO</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <i className="fas fa-info-circle" style={{ color: '#d97706' }}></i>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', fontWeight: '500' }}>
                    Esta sección es solo para fines de auditoría. Los créditos aquí listados no afectan los balances activos de los clientes.
                </p>
            </div>
        </div>
    );
}

export default CancelledCreditManagement;
