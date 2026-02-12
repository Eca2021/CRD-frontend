import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { api, endpoints } from '../config/api';

Modal.setAppElement('#root');

function Cashier() {
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientCredits, setClientCredits] = useState([]);
    const [formasPago, setFormasPago] = useState([]);

    // Payment Modal
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedCuota, setSelectedCuota] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        id_detalle_credito: '',
        id_forma_pago: '',
        monto_pagado: '',
        comprobante_nro: ''
    });

    useEffect(() => {
        loadFormasPago();
        loadClients();
    }, []);

    const loadFormasPago = async () => {
        try {
            const data = await api.get(endpoints.paymentMethods);
            setFormasPago(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadClients = async () => {
        try {
            const data = await api.get(endpoints.clients);
            setClients(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setSelectedClient(null);
        setClientCredits([]);
    };

    const selectClient = async (client) => {
        setSelectedClient(client);
        setSearch(`${client.nombre} ${client.apellido}`);
        try {
            const data = await api.get(endpoints.credits.byClient(client.id_cliente));
            setClientCredits(Array.isArray(data) ? data : []);
        } catch (e) {
            Swal.fire('Error', 'No se pudieron cargar los créditos', 'error');
        }
    };

    const openPayment = (cuota) => {
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
    };

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
            // Reload credits for the selected client
            if (selectedClient) {
                selectClient(selectedClient);
            }
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo registrar el pago', 'error');
        }
    };

    const filteredClients = clients.filter(c =>
        search && (
            c.nombre.toLowerCase().includes(search.toLowerCase()) ||
            c.apellido.toLowerCase().includes(search.toLowerCase()) ||
            c.documento.includes(search)
        )
    );

    return (
        <div className="user-mgmt">
            <div className="um-header">
                <h2>Caja - Pagos</h2>
            </div>

            <div className="um-card">
                <div className="form-row">
                    <label>Buscar Cliente (Nombre, Apellido, Documento)</label>
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch}
                        placeholder="Escriba para buscar..."
                        autoFocus
                    />
                    {search && !selectedClient && filteredClients.length > 0 && (
                        <ul className="autocomplete-list" style={{ border: '1px solid #ccc', maxHeight: '150px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0 }}>
                            {filteredClients.map(c => (
                                <li
                                    key={c.id_cliente}
                                    onClick={() => selectClient(c)}
                                    style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                >
                                    {c.documento} - {c.nombre} {c.apellido}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {selectedClient && (
                    <div style={{ marginTop: '20px' }}>
                        <h3>Créditos de {selectedClient.nombre} {selectedClient.apellido}</h3>
                        {clientCredits.filter(c => c.estado === 'PENDIENTE').length === 0 ? (
                            <p className="muted">No hay créditos pendientes.</p>
                        ) : (
                            clientCredits.filter(c => c.estado === 'PENDIENTE').map(cred => (
                                <div key={cred.id_credito} className="credit-card" style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <strong>Crédito #{cred.id_credito} - {cred.tasa_nombre}</strong>
                                        <span className={`badge ${cred.estado === 'PAGADO' ? 'badge-green' : 'badge-yellow'}`}>{cred.estado}</span>
                                    </div>

                                    <table className="role-table" style={{ fontSize: '0.9em' }}>
                                        <thead>
                                            <tr>
                                                <th>Cuota</th>
                                                <th>Vencimiento</th>
                                                <th>Monto</th>
                                                <th>Pagado</th>
                                                <th>Estado</th>
                                                <th>Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cred.detalles.map(d => (
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
                                                        {d.estado_cuota !== 'PAGADO' && (
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
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modal Payment */}
            {isPaymentOpen && selectedCuota && (
                <div className="dc-overlay">
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

export default Cashier;
