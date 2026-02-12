import React, { useEffect, useState } from 'react';
import { api, endpoints } from '../config/api';
import Swal from 'sweetalert2';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister, faFileInvoiceDollar, faChartLine, faPlusCircle, faSearch, faFilter, faTimes, faEye } from '@fortawesome/free-solid-svg-icons';

function AccountingModule() {
    const [dashboardData, setDashboardData] = useState(null);
    const [asientos, setAsientos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterGlosa, setFilterGlosa] = useState('');

    // Estado Modal Detalles
    const [selectedAsiento, setSelectedAsiento] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const loadDashboard = async () => {
        try {
            const data = await api.get(endpoints.accounting.dashboard);
            setDashboardData(data);
        } catch (e) {
            console.error("Error loading dashboard", e);
        }
    };

    const loadAsientos = async () => {
        try {
            let url = endpoints.accounting.entries + '?';
            if (filterDateStart) url += `fecha_inicio=${filterDateStart}&`;
            if (filterDateEnd) url += `fecha_fin=${filterDateEnd}&`;
            if (filterGlosa) url += `glosa=${filterGlosa}&`;

            const data = await api.get(url);
            setAsientos(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error loading asientos", e);
        }
    };

    const refreshAll = async () => {
        setLoading(true);
        await Promise.all([loadDashboard(), loadAsientos()]);
        setLoading(false);
    };

    useEffect(() => {
        refreshAll();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        loadAsientos();
    };

    const handleViewDetails = (asiento) => {
        setSelectedAsiento(asiento);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedAsiento(null);
    };

    const openManualEntryModal = () => {
        Swal.fire({
            title: 'Registrar Movimiento Manual',
            html: `
                <select id="swal-tipo" class="swal2-input">
                    <option value="INGRESO">INGRESO a Caja</option>
                    <option value="EGRESO">EGRESO de Caja</option>
                </select>
                <input id="swal-monto" type="number" step="0.01" class="swal2-input" placeholder="Monto">
                <input id="swal-glosa" type="text" class="swal2-input" placeholder="Descripción (Glosa)">
                <input id="swal-cuenta" type="text" class="swal2-input" placeholder="Cuenta Contrapartida (ej: Luz, Capital)">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Registrar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    tipo: document.getElementById('swal-tipo').value,
                    monto: document.getElementById('swal-monto').value,
                    glosa: document.getElementById('swal-glosa').value,
                    otra_cuenta: document.getElementById('swal-cuenta').value
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { tipo, monto, glosa, otra_cuenta } = result.value;
                if (!monto || !glosa || !otra_cuenta) {
                    Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
                    return;
                }
                try {
                    await api.post(endpoints.accounting.entries, {
                        tipo, monto, glosa, otra_cuenta
                    });
                    Swal.fire('Éxito', 'Movimiento registrado', 'success');
                    refreshAll();
                } catch (e) {
                    Swal.fire('Error', e.message || 'No se pudo registrar', 'error');
                }
            }
        });
    };

    const formatMoney = (amount) => {
        return amount.toLocaleString('es-PY', { minimumFractionDigits: 0 }); // Ajustar locale si es necesario
    };

    if (loading && !dashboardData) return <div className="p-4">Cargando contabilidad...</div>;

    return (
        <div className="accounting-module" style={{ padding: '20px', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1e293b', margin: 0 }}>Módulo Contable</h2>
                <button className="btn btn-accent" onClick={openManualEntryModal}>
                    <FontAwesomeIcon icon={faPlusCircle} style={{ marginRight: '5px' }} />
                    Registrar Movimiento Manual
                </button>
            </div>

            {/* DASHBOARD CARDS */}
            {dashboardData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div className="card-stat" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>Capital Operativo (Caja)</p>
                                <h3 style={{ margin: '5px 0', fontSize: '1.8rem' }}>{formatMoney(dashboardData.capital_operativo)}</h3>
                            </div>
                            <FontAwesomeIcon icon={faCashRegister} size="2x" style={{ opacity: 0.8 }} />
                        </div>
                    </div>

                    <div className="card-stat" style={{ background: 'white', borderLeft: '5px solid #f59e0b', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Cuentas por Cobrar</p>
                                <h3 style={{ margin: '5px 0', fontSize: '1.8rem', color: '#1e293b' }}>{formatMoney(dashboardData.cuentas_por_cobrar)}</h3>
                            </div>
                            <FontAwesomeIcon icon={faFileInvoiceDollar} size="2x" style={{ color: '#f59e0b' }} />
                        </div>
                    </div>

                    <div className="card-stat" style={{ background: 'white', borderLeft: '5px solid #10b981', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Ganancias Reales</p>
                                <h3 style={{ margin: '5px 0', fontSize: '1.8rem', color: '#1e293b' }}>{formatMoney(dashboardData.ganancias_reales)}</h3>
                            </div>
                            <FontAwesomeIcon icon={faChartLine} size="2x" style={{ color: '#10b981' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* CHART */}
            {dashboardData && dashboardData.chart_data && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '30px' }}>
                    <h4 style={{ color: '#334155', marginBottom: '15px' }}>Flujo de Caja (Últimos 7 Días)</h4>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData.chart_data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="fecha" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatMoney(value)} />
                                <Legend />
                                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* LIBRO DIARIO TOOLBAR */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 style={{ margin: 0, color: '#334155' }}>Libro Diario</h4>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <FontAwesomeIcon icon={faFilter} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="date"
                                value={filterDateStart}
                                onChange={e => setFilterDateStart(e.target.value)}
                                style={{ padding: '8px 8px 8px 30px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                        <span style={{ color: '#64748b' }}>a</span>
                        <input
                            type="date"
                            value={filterDateEnd}
                            onChange={e => setFilterDateEnd(e.target.value)}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <div style={{ position: 'relative' }}>
                            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Buscar glosa..."
                                value={filterGlosa}
                                onChange={e => setFilterGlosa(e.target.value)}
                                style={{ padding: '8px 8px 8px 30px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary">Filtrar</button>
                    </form>
                </div>

                {/* TABLE */}
                <div className="table-responsive">
                    <table className="role-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Descripción (Glosa)</th>
                                <th style={{ textAlign: 'right' }}>Total Movimiento</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {asientos.map(asiento => {
                                const totalDebe = asiento.movimientos.reduce((acc, m) => acc + m.debe, 0);
                                return (
                                    <tr
                                        key={asiento.id_asiento}
                                        onClick={() => handleViewDetails(asiento)}
                                        style={{ cursor: 'pointer', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                                        className="hover-row"
                                    >
                                        <td style={{ fontWeight: 'bold' }}>#{asiento.id_asiento}</td>
                                        <td>{new Date(asiento.fecha).toLocaleString()}</td>
                                        <td>{asiento.glosa}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(totalDebe)}</td>
                                        <td style={{ textAlign: 'center', color: '#64748b' }}><FontAwesomeIcon icon={faEye} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {asientos.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No hay movimientos registrados en este período.</p>}
                </div>
            </div>

            {/* MODAL PARA DETALLES */}
            {showModal && selectedAsiento && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '600px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>Detalle Asiento #{selectedAsiento.id_asiento}</h3>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#64748b' }}>Fecha</p>
                                <p style={{ margin: 0, fontWeight: '500' }}>{new Date(selectedAsiento.fecha).toLocaleString()}</p>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#64748b' }}>Glosa</p>
                                <p style={{ margin: 0, fontWeight: '500' }}>{selectedAsiento.glosa}</p>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ textAlign: 'left', padding: '10px', color: '#475569' }}>Cuenta</th>
                                        <th style={{ textAlign: 'right', padding: '10px', color: '#475569' }}>Debe</th>
                                        <th style={{ textAlign: 'right', padding: '10px', color: '#475569' }}>Haber</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedAsiento.movimientos.map((mov) => (
                                        <tr key={mov.id_movimiento} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px', color: '#334155' }}>{mov.cuenta}</td>
                                            <td style={{ textAlign: 'right', padding: '10px', color: mov.debe > 0 ? '#10b981' : '#cbd5e1', fontWeight: mov.debe > 0 ? '600' : 'normal' }}>
                                                {mov.debe > 0 ? formatMoney(mov.debe) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '10px', color: mov.haber > 0 ? '#ef4444' : '#cbd5e1', fontWeight: mov.haber > 0 ? '600' : 'normal' }}>
                                                {mov.haber > 0 ? formatMoney(mov.haber) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>Totales</td>
                                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>
                                            {formatMoney(selectedAsiento.movimientos.reduce((acc, m) => acc + m.debe, 0))}
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>
                                            {formatMoney(selectedAsiento.movimientos.reduce((acc, m) => acc + m.haber, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div style={{ padding: '15px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={closeModal}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AccountingModule;
