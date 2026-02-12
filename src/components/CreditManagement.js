import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { api, endpoints } from '../config/api';

Modal.setAppElement('#root');

function CreditManagement() {
    const [creditos, setCreditos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [tasas, setTasas] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [loading, setLoading] = useState(true);

    // Details Modal State
    const [selectedCreditDetails, setSelectedCreditDetails] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Modal Create State
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({
        id_cliente: '',
        id_tasa: '',
        monto: '',
        cuotas: '',
        fecha_primer_pago: ''
    });

    // Search Client State
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedClientObj, setSelectedClientObj] = useState(null);

    // Preview Data
    const [preview, setPreview] = useState(null);

    // Modal Payment
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        id_detalle_credito: '',
        id_forma_pago: '',
        monto_pagado: '',
        comprobante_nro: ''
    });
    const [selectedCuota, setSelectedCuota] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cData, clData, tData, fpData] = await Promise.all([
                api.get(endpoints.credits.base),
                api.get(endpoints.clients),
                api.get(endpoints.rates),
                api.get(endpoints.paymentMethods)
            ]);
            setCreditos(Array.isArray(cData) ? cData : []);
            setClientes(Array.isArray(clData) ? clData : []);
            setTasas(Array.isArray(tData) ? tData : []);
            setFormasPago(Array.isArray(fpData) ? fpData : []);
        } catch (e) {
            Swal.fire('Error', e.message || 'Error cargando datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // --- Create Modal Logic ---

    const openCreate = () => {
        setForm({ id_cliente: '', id_tasa: '', monto: '', cuotas: '', fecha_primer_pago: '' });
        setSearchTerm('');
        setSelectedClientObj(null);
        setPreview(null);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setPreview(null);
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        setPreview(null);
    };

    // Client Search Logic
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setShowSuggestions(true);
        if (value.trim() === '') {
            setFilteredClients([]);
        } else {
            const term = value.toLowerCase();
            const filtered = clientes.filter(c =>
                c.nombre.toLowerCase().includes(term) ||
                c.apellido.toLowerCase().includes(term) ||
                c.documento.includes(term)
            );
            setFilteredClients(filtered);
        }
    };

    const selectClient = (client) => {
        setForm(p => ({ ...p, id_cliente: client.id_cliente }));
        setSelectedClientObj(client);
        setSearchTerm(`${client.nombre} ${client.apellido}`);
        setShowSuggestions(false);
        setPreview(null);
    };

    const clearClient = () => {
        setForm(p => ({ ...p, id_cliente: '' }));
        setSelectedClientObj(null);
        setSearchTerm('');
    };

    const calculate = async () => {
        if (!form.monto || !form.cuotas || !form.id_tasa) {
            Swal.fire('Atención', 'Complete monto, cuotas y tasa para calcular.', 'warning');
            return;
        }

        try {
            const data = await api.post(endpoints.credits.preview, {
                monto: form.monto,
                cuotas: form.cuotas,
                id_tasa: form.id_tasa,
                fecha_primer_pago: form.fecha_primer_pago
            });
            setPreview(data);
        } catch (e) {
            Swal.fire('Error', e.message || 'Error calculando', 'error');
        }
    };

    const save = async () => {
        if (!preview) {
            Swal.fire('Atención', 'Primero debe calcular el plan de pagos.', 'warning');
            return;
        }
        if (!form.id_cliente) {
            Swal.fire('Atención', 'Seleccione un cliente.', 'warning');
            return;
        }

        try {
            await api.post(endpoints.credits.base, form);
            await Swal.fire({ icon: 'success', title: 'Crédito creado', timer: 1500, showConfirmButton: false });
            closeModal();
            await loadData();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo guardar', 'error');
        }
    };

    // --- Details Modal Logic ---
    const openDetails = (credit) => {
        setSelectedCreditDetails(credit);
        setIsDetailsOpen(true);
    };

    const closeDetails = () => {
        setIsDetailsOpen(false);
        setSelectedCreditDetails(null);
    };

    // --- Annulment Logic ---
    const cancelCredit = async (credit) => {
        const result = await Swal.fire({
            title: '¿Anular Crédito?',
            text: `Se anulará el crédito #${credit.id_credito}. Esto revertirá la contabilidad. No se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.post(`${endpoints.credits.base}${credit.id_credito}/anular`);
                await Swal.fire('Anulado', 'El crédito ha sido anulado.', 'success');
                await loadData();
            } catch (e) {
                Swal.fire('Error', e.message || 'No se pudo anular', 'error');
            }
        }
    };

    // --- Payment Logic ---
    const openPayment = (cuota) => {
        // If viewing details modal, close it first or handle stacking. 
        // For simplicity, we can close details or keep it open. 
        // Let's keep detail open if modal supports stacking, but react-modal might need config.
        // Assuming we pay from the Detail Modal.

        setSelectedCuota(cuota);
        const saldo = parseFloat(cuota.monto_cuota) - parseFloat(cuota.monto_pagado || 0);
        setPaymentForm({
            id_detalle_credito: cuota.id_detalle,
            id_forma_pago: '',
            monto_pagado: saldo.toFixed(2),
            comprobante_nro: ''
        });
        setIsPaymentOpen(true);
    };

    const closePaymentModal = () => {
        setIsPaymentOpen(false);
        setSelectedCuota(null);
        // Refresh data to update the background modal (Details)
        loadData().then(() => {
            // Need to update selectedCreditDetails with fresh data
            if (selectedCreditDetails) {
                // Find the updated credit in the fresh list - tricky because state update is async
                // We rely on main `creditos` update, but `selectedCreditDetails` is a snapshot.
                // We will update it in useEffect or manually here.
                // A simpler way: just close payment, parent re-renders.
                // But selectedCreditDetails is local state copy.
            }
        });
    };

    // Update selected details when creditos change
    useEffect(() => {
        if (selectedCreditDetails) {
            const updated = creditos.find(c => c.id_credito === selectedCreditDetails.id_credito);
            if (updated) setSelectedCreditDetails(updated);
        }
    }, [creditos]);

    const onPaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentForm(p => ({ ...p, [name]: value }));
    };

    const savePayment = async (e) => {
        e.preventDefault();
        try {
            await api.post(endpoints.payments, paymentForm);
            await Swal.fire({ icon: 'success', title: 'Pago registrado', timer: 1500, showConfirmButton: false });
            closePaymentModal();
            // loadData triggered in closePaymentModal's logic via await above or separate call
            await loadData();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo registrar el pago', 'error');
        }
    };

    return (
        <div className="user-mgmt">
            <div className="um-header">
                <h2>Gestión de Créditos</h2>
                <div className="um-actions">
                    <button className="btn btn-accent" onClick={openCreate}>+ Nuevo Crédito</button>
                </div>
            </div>

            <div className="um-card">
                {loading ? (
                    <p className="muted">Cargando créditos...</p>
                ) : creditos.length === 0 ? (
                    <p className="muted">No hay créditos registrados.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="role-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Monto</th>
                                    <th>Total a Pagar</th>
                                    <th>Cuotas</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {creditos.map(c => (
                                    <tr key={c.id_credito}>
                                        <td>{c.id_credito}</td>
                                        <td>{c.cliente_nombre}</td>
                                        <td>{c.monto_solicitado.toLocaleString()}</td>
                                        <td>{c.monto_total_a_pagar.toLocaleString()}</td>
                                        <td>{c.cantidad_cuotas}</td>
                                        <td>{c.fecha_desembolso}</td>
                                        <td>
                                            <span className={`badge ${c.estado === 'PAGADO' ? 'badge-green' : c.estado === 'ANULADO' ? 'badge-red' : 'badge-yellow'}`}>
                                                {c.estado}
                                            </span>
                                        </td>
                                        <td style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => openDetails(c)}
                                            >
                                                Detalle
                                            </button>

                                            {c.estado !== 'ANULADO' && c.estado !== 'PAGADO' && (
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    style={{ background: '#ef4444', color: 'white', border: 'none' }}
                                                    onClick={() => cancelCredit(c)}
                                                >
                                                    Anular
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Create Credit Redesigned */}
            {isOpen && (
                <div className="dc-overlay">
                    <div className="dc-modal" style={{ maxWidth: '900px', width: '95%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Nuevo Crédito</h3>
                            <button className="close-btn" onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div className="credit-form-container" style={{ display: 'flex', gap: '30px', padding: '20px' }}>
                            {/* Left Column: Client Selection */}
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <h4 style={{ marginBottom: '15px', color: '#334155' }}>1. Seleccionar Cliente</h4>

                                {!selectedClientObj ? (
                                    <div className="form-row client-search" style={{ position: 'relative' }}>
                                        <label>Buscar por Nombre o Documento</label>
                                        <input
                                            type="text"
                                            placeholder="Escribe para buscar..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            onFocus={() => setShowSuggestions(true)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                        {showSuggestions && searchTerm && (
                                            <ul className="suggestions-list" style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px',
                                                maxHeight: '200px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0, zIndex: 100,
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}>
                                                {filteredClients.length > 0 ? (
                                                    filteredClients.map(c => (
                                                        <li
                                                            key={c.id_cliente}
                                                            onClick={() => selectClient(c)}
                                                            style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', hover: { background: '#f8fafc' } }}
                                                        >
                                                            <strong>{c.nombre} {c.apellido}</strong> <br />
                                                            <small className="muted">Doc: {c.documento}</small>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li style={{ padding: '10px', color: '#94a3b8' }}>No se encontraron resultados.</li>
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <div className="selected-client-card" style={{
                                        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '15px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <h5 style={{ margin: 0, color: '#1e40af' }}>{selectedClientObj.nombre} {selectedClientObj.apellido}</h5>
                                            <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9em' }}>Doc: {selectedClientObj.documento}</p>
                                        </div>
                                        <button onClick={clearClient} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer', padding: '5px' }}>
                                            &times;
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Credit Details */}
                            <div style={{ flex: 2 }}>
                                <h4 style={{ marginBottom: '15px', color: '#334155' }}>2. Detalles del Préstamo</h4>
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-row">
                                        <label>Tasa de Interés *</label>
                                        <select name="id_tasa" value={form.id_tasa} onChange={onChange} className="form-select" style={{ width: '100%', padding: '10px' }}>
                                            <option value="">-- Seleccione --</option>
                                            {tasas.map(t => (
                                                <option key={t.id_tasa} value={t.id_tasa}>
                                                    {t.nombre_tasa} ({t.porcentaje}%)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <label>Monto Solicitado *</label>
                                        <input
                                            name="monto"
                                            type="number"
                                            value={form.monto}
                                            onChange={onChange}
                                            placeholder="0.00"
                                            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label>Cantidad Cuotas *</label>
                                        <input
                                            name="cuotas"
                                            type="number"
                                            value={form.cuotas}
                                            onChange={onChange}
                                            placeholder="Ej. 6"
                                            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <label>Inicio de Pagos (Opcional)</label>
                                        <input
                                            name="fecha_primer_pago"
                                            type="date"
                                            value={form.fecha_primer_pago}
                                            onChange={onChange}
                                            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                                        />
                                        <small className="muted" style={{ display: 'block', marginTop: '5px', fontSize: '0.8em' }}>
                                            Por defecto: en 7 días.
                                        </small>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                                    <button type="button" className="btn btn-accent" onClick={calculate}>
                                        Calcular Plan
                                    </button>
                                </div>

                                {preview && (
                                    <div className="preview-section" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '20px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <h4 style={{ margin: 0 }}>Resumen del Plan</h4>
                                            <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Total: {preview.monto_total}</span>
                                        </div>

                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <table className="role-table" style={{ fontSize: '0.85em', width: '100%' }}>
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Vencimiento</th>
                                                        <th>Cuota</th>
                                                        <th>Capital</th>
                                                        <th>Interés</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {preview.plan.map(p => (
                                                        <tr key={p.numero_cuota}>
                                                            <td>{p.numero_cuota}</td>
                                                            <td>{p.fecha_vencimiento}</td>
                                                            <td style={{ fontWeight: 'bold' }}>{p.cuota_total}</td>
                                                            <td className="muted">{p.capital_cuota}</td>
                                                            <td className="muted">{p.interes_cuota}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <button type="button" className="btn btn-secondary" onClick={closeModal} style={{ marginRight: '10px' }}>
                                Cancelar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={save} disabled={!preview || !form.id_cliente}>
                                Confirmar y Crear Crédito
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            {isDetailsOpen && selectedCreditDetails && (
                <div className="dc-overlay">
                    <div className="dc-modal" style={{ maxWidth: '900px', width: '95%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                Detalle de Crédito #{selectedCreditDetails.id_credito} - {selectedCreditDetails.cliente_nombre}
                            </h3>
                            <button className="close-btn" onClick={closeDetails} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
                                <div><strong>Monto Original:</strong> {selectedCreditDetails.monto_solicitado.toLocaleString()}</div>
                                <div><strong>Total a Pagar:</strong> {selectedCreditDetails.monto_total_a_pagar.toLocaleString()}</div>
                                <div><strong>Cuotas:</strong> {selectedCreditDetails.cantidad_cuotas}</div>
                                <div>
                                    <span className={`badge ${selectedCreditDetails.estado === 'PAGADO' ? 'badge-green' : selectedCreditDetails.estado === 'ANULADO' ? 'badge-red' : 'badge-yellow'}`}>
                                        {selectedCreditDetails.estado}
                                    </span>
                                </div>
                            </div>

                            <div className="table-responsive" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                                <table className="role-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Vencimiento</th>
                                            <th>Monto Cuota</th>
                                            <th>Monto Pagado</th>
                                            <th>Estado</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedCreditDetails.detalles.map(d => (
                                            <tr key={d.id_detalle}>
                                                <td>{d.numero_cuota}</td>
                                                <td>{d.fecha_vencimiento}</td>
                                                <td>{d.monto_cuota.toLocaleString()}</td>
                                                <td>{d.monto_pagado.toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge ${d.estado_cuota === 'PAGADO' ? 'badge-green' : 'badge-yellow'}`}>
                                                        {d.estado_cuota}
                                                    </span>
                                                </td>
                                                <td>
                                                    {d.estado_cuota !== 'PAGADO' && selectedCreditDetails.estado !== 'ANULADO' && (
                                                        <button
                                                            className="btn btn-xs btn-primary"
                                                            onClick={() => openPayment(d)}
                                                        >
                                                            Pagar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeDetails}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Payment */}
            {isPaymentOpen && selectedCuota && (
                <div className="dc-overlay" style={{ zIndex: 2000 }}>
                    <div className="dc-modal">
                        <div className="modal-header">
                            <h3 className="modal-title">Registrar Pago - Cuota #{selectedCuota.numero_cuota}</h3>
                        </div>
                        <form onSubmit={savePayment} className="user-form">
                            <div className="form-row">
                                <label>Monto a Pagar *</label>
                                <input
                                    name="monto_pagado"
                                    type="number"
                                    step="0.01"
                                    value={paymentForm.monto_pagado}
                                    onChange={onPaymentChange}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <label>Forma de Pago *</label>
                                <select
                                    name="id_forma_pago"
                                    value={paymentForm.id_forma_pago}
                                    onChange={onPaymentChange}
                                    required
                                    className="form-select"
                                >
                                    <option value="">-- Seleccione --</option>
                                    {formasPago.map(f => (
                                        <option key={f.id_forma_pago} value={f.id_forma_pago}>
                                            {f.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Nro Comprobante</label>
                                <input
                                    name="comprobante_nro"
                                    type="text"
                                    value={paymentForm.comprobante_nro}
                                    onChange={onPaymentChange}
                                    placeholder="Opcional"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary">Registrar Pago</button>
                                <button type="button" className="btn btn-secondary" onClick={closePaymentModal}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreditManagement;
