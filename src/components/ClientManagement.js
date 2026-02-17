import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { api, endpoints } from '../config/api';

Modal.setAppElement('#root');

function ClientManagement() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal CRUD
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        direccion: '',
        telefono: ''
    });

    // Modal Credits
    const [creditsModalOpen, setCreditsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientCredits, setClientCredits] = useState([]);
    const [loadingCredits, setLoadingCredits] = useState(false);
    const [expandedCredit, setExpandedCredit] = useState(null); // ID of credit to show details

    const loadAll = async () => {
        setLoading(true);
        try {
            const data = await api.get(endpoints.clients);
            setClientes(Array.isArray(data) ? data : []);
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudieron cargar clientes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({
            nombre: '',
            apellido: '',
            documento: '',
            direccion: '',
            telefono: ''
        });
        setIsOpen(true);
    };

    const openEdit = (c) => {
        setEditing(c);
        setForm({
            nombre: c.nombre || '',
            apellido: c.apellido || '',
            documento: c.documento || '',
            direccion: c.direccion || '',
            telefono: c.telefono || ''
        });
        setIsOpen(true);
    };

    const openCredits = async (c) => {
        setSelectedClient(c);
        setCreditsModalOpen(true);
        setLoadingCredits(true);
        setClientCredits([]);
        setExpandedCredit(null);
        try {
            const data = await api.get(endpoints.credits.byClient(c.id_cliente));
            setClientCredits(Array.isArray(data) ? data : []);
        } catch (e) {
            Swal.fire('Error', 'No se pudieron cargar los créditos del cliente', 'error');
        } finally {
            setLoadingCredits(false);
        }
    }

    const closeCreditsModal = () => {
        setCreditsModalOpen(false);
        setSelectedClient(null);
        setClientCredits([]);
    }

    const closeModal = () => {
        setIsOpen(false);
        setEditing(null);
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
    };

    const save = async (e) => {
        e?.preventDefault?.();
        if (!form.nombre || !form.apellido || !form.documento) {
            Swal.fire('Campos requeridos', 'Nombre, Apellido y Documento son obligatorios.', 'warning');
            return;
        }

        try {
            if (editing) {
                await api.put(`${endpoints.clients}/${editing.id_cliente}`, form);
            } else {
                await api.post(endpoints.clients, form);
            }
            await Swal.fire({
                icon: 'success',
                title: editing ? 'Cliente actualizado' : 'Cliente creado',
                timer: 1400,
                showConfirmButton: false
            });
            closeModal();
            await loadAll();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo guardar', 'error');
        }
    };

    const remove = async (id) => {
        const ok = await Swal.fire({
            title: '¿Eliminar cliente?',
            text: 'Se eliminará permanentemente de la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
        });
        if (!ok.isConfirmed) return;
        try {
            await api.del(`${endpoints.clients}/${id}`);
            await Swal.fire({ icon: 'success', title: 'Cliente eliminado', timer: 1200, showConfirmButton: false });
            await loadAll();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo eliminar', 'error');
        }
    };

    const toggleCreditDetails = (id) => {
        setExpandedCredit(expandedCredit === id ? null : id);
    }

    const filtered = (clientes || []).filter(c => {
        const q = (search || '').toLowerCase();
        return (
            (c.nombre || '').toLowerCase().includes(q) ||
            (c.apellido || '').toLowerCase().includes(q) ||
            (c.documento || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="user-mgmt">
            <div className="um-header">
                <h2>Gestión de Clientes</h2>
                <div className="um-actions">
                    <button className="btn btn-accent" onClick={openCreate}>+ Nuevo cliente</button>
                </div>
            </div>

            <div className="um-card">
                <div className="search-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por nombre, apellido, documento..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <p className="muted">Cargando clientes...</p>
                ) : filtered.length === 0 ? (
                    <p className="muted">No hay clientes encontrados.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="role-table table"> {/* Added 'table' class */}
                            <thead>
                                <tr>
                                    <th>Documento</th>
                                    <th>Apellido</th>
                                    <th>Nombre</th>
                                    <th>Teléfono</th>
                                    <th>Dirección</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => (
                                    <tr key={c.id_cliente}>
                                        <td data-label="Documento">{String(c.documento || '')}</td>
                                        <td data-label="Apellido">{String(c.apellido || '')}</td>
                                        <td data-label="Nombre">{String(c.nombre || '')}</td>
                                        <td data-label="Teléfono">{String(c.telefono || '')}</td>
                                        <td data-label="Dirección">{String(c.direccion || '')}</td>
                                        <td data-label="Acciones">
                                            <div className="actions">
                                                <button className="btn btn-secondary btn-sm" onClick={() => openCredits(c)} title="Ver Créditos">
                                                    <i className="fas fa-money-bill-wave"></i> Créditos
                                                </button>
                                                <button className="btn btn-accent btn-sm" onClick={() => openEdit(c)}>Editar</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => remove(c.id_cliente)}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Crear/Editar Cliente */}
            {isOpen && (
                <div className="dc-overlay">
                    <div className="dc-modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                        </div>
                        <form onSubmit={save} className="user-form">
                            <div className="form-row">
                                <label>Documento *</label>
                                <input
                                    name="documento"
                                    value={form.documento}
                                    onChange={onChange}
                                    required
                                    type="text"
                                    placeholder="RUC o Cédula"
                                    autoFocus
                                />
                            </div>
                            <div className="form-row">
                                <label>Apellido *</label>
                                <input name="apellido" value={form.apellido} onChange={onChange} required />
                            </div>
                            <div className="form-row">
                                <label>Nombre *</label>
                                <input name="nombre" value={form.nombre} onChange={onChange} required />
                            </div>
                            <div className="form-row">
                                <label>Teléfono</label>
                                <input name="telefono" value={form.telefono} onChange={onChange} />
                            </div>
                            <div className="form-row">
                                <label>Dirección</label>
                                <input name="direccion" value={form.direccion} onChange={onChange} />
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary">Guardar</button>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Créditos del Cliente */}
            {creditsModalOpen && (
                <div className="dc-overlay">
                    <div className="dc-modal" style={{ maxWidth: '900px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Créditos de {selectedClient?.nombre} {selectedClient?.apellido}</h3>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {loadingCredits ? (
                                <p>Cargando créditos...</p>
                            ) : clientCredits.length === 0 ? (
                                <p>Este cliente no tiene créditos registrados.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="role-table table"> {/* Added 'table' class */}
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Monto Solicitado</th>
                                                <th>Tasa</th>
                                                <th>Monto Total</th>
                                                <th>Cuotas</th>
                                                <th>Fecha</th>
                                                <th>Estado</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientCredits.map(c => (
                                                <React.Fragment key={c.id_credito}>
                                                    <tr>
                                                        <td data-label="ID">{c.id_credito}</td>
                                                        <td data-label="Monto Solicitado">{c.monto_solicitado.toLocaleString()}</td>
                                                        <td data-label="Tasa">{c.tasa_nombre}</td>
                                                        <td data-label="Monto Total">{c.monto_total_a_pagar.toLocaleString()}</td>
                                                        <td data-label="Cuotas">{c.cantidad_cuotas}</td>
                                                        <td data-label="Fecha">{c.fecha_desembolso}</td>
                                                        <td data-label="Estado">
                                                            <span className={`badge ${c.estado === 'PAGADO' ? 'badge-green' : 'badge-yellow'}`}>
                                                                {c.estado}
                                                            </span>
                                                        </td>
                                                        <td data-label="Acciones">
                                                            <button
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => toggleCreditDetails(c.id_credito)}
                                                            >
                                                                {expandedCredit === c.id_credito ? 'Ocultar Detalle' : 'Ver Detalle'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {expandedCredit === c.id_credito && (
                                                        <tr>
                                                            <td colSpan="8" style={{ background: '#f8fafc', padding: '10px' }}>
                                                                <h5>Detalle de Cuotas</h5>
                                                                <table className="role-table table" style={{ fontSize: '0.9em' }}> {/* Added 'table' class */}
                                                                    <thead>
                                                                        <tr>
                                                                            <th>#</th>
                                                                            <th>Vencimiento</th>
                                                                            <th>Monto Cuota</th>
                                                                            <th>Monto Pagado</th>
                                                                            <th>Estado</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {c.detalles.map(d => (
                                                                            <tr key={d.id_detalle}>
                                                                                <td data-label="#">{d.numero_cuota}</td>
                                                                                <td data-label="Vencimiento">{d.fecha_vencimiento}</td>
                                                                                <td data-label="Monto Cuota">{d.monto_cuota.toLocaleString()}</td>
                                                                                <td data-label="Monto Pagado">{d.monto_pagado.toLocaleString()}</td>
                                                                                <td data-label="Estado">
                                                                                    <span className={`badge ${d.estado_cuota === 'PAGADO' ? 'badge-green' : 'badge-yellow'}`}>
                                                                                        {d.estado_cuota}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeCreditsModal}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClientManagement;
