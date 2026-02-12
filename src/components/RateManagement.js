import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { api, endpoints } from '../config/api';

Modal.setAppElement('#root');

function RateManagement() {
    const [tasas, setTasas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        nombre_tasa: '',
        porcentaje: '',
        descripcion: ''
    });

    const loadAll = async () => {
        setLoading(true);
        try {
            const data = await api.get(endpoints.rates);
            setTasas(Array.isArray(data) ? data : []);
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudieron cargar tasas', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ nombre_tasa: '', porcentaje: '', descripcion: '' });
        setIsOpen(true);
    };

    const openEdit = (t) => {
        setEditing(t);
        setForm({
            nombre_tasa: t.nombre_tasa || '',
            porcentaje: t.porcentaje || '',
            descripcion: t.descripcion || ''
        });
        setIsOpen(true);
    };

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
        if (!form.nombre_tasa || !form.porcentaje) {
            Swal.fire('Campos requeridos', 'Nombre y Porcentaje son obligatorios.', 'warning');
            return;
        }

        try {
            const payload = { ...form, porcentaje: parseFloat(form.porcentaje) };
            if (editing) {
                await api.put(`${endpoints.rates}/${editing.id_tasa}`, payload);
            } else {
                await api.post(endpoints.rates, payload);
            }
            await Swal.fire({
                icon: 'success',
                title: editing ? 'Tasa actualizada' : 'Tasa creada',
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
            title: '¿Eliminar tasa?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });
        if (!ok.isConfirmed) return;
        try {
            await api.del(`${endpoints.rates}/${id}`);
            await Swal.fire({ icon: 'success', title: 'Tasa eliminada', timer: 1200, showConfirmButton: false });
            await loadAll();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo eliminar', 'error');
        }
    };

    return (
        <div className="user-mgmt">
            <div className="um-header">
                <h2>Gestión de Tasas de Interés</h2>
                <div className="um-actions">
                    <button className="btn btn-accent" onClick={openCreate}>+ Nueva Tasa</button>
                </div>
            </div>

            <div className="um-card">
                {loading ? (
                    <p className="muted">Cargando tasas...</p>
                ) : tasas.length === 0 ? (
                    <p className="muted">No hay tasas registradas.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="role-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Porcentaje (%)</th>
                                    <th>Descripción</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasas.map(t => (
                                    <tr key={t.id_tasa}>
                                        <td>{t.nombre_tasa}</td>
                                        <td>{t.porcentaje}%</td>
                                        <td>{t.descripcion}</td>
                                        <td>
                                            <button className="btn btn-accent btn-sm" onClick={() => openEdit(t)}>Editar</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => remove(t.id_tasa)}>Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="dc-overlay">
                    <div className="dc-modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{editing ? 'Editar Tasa' : 'Nueva Tasa'}</h3>
                        </div>
                        <form onSubmit={save} className="user-form">
                            <div className="form-row">
                                <label>Nombre Tasa *</label>
                                <input name="nombre_tasa" value={form.nombre_tasa} onChange={onChange} required placeholder="Ej. Tasa Anual" />
                            </div>
                            <div className="form-row">
                                <label>Porcentaje (%) *</label>
                                <input name="porcentaje" type="number" step="0.01" value={form.porcentaje} onChange={onChange} required placeholder="Ej. 10.5" />
                            </div>
                            <div className="form-row">
                                <label>Descripción</label>
                                <textarea name="descripcion" value={form.descripcion} onChange={onChange} rows="3" />
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary">Guardar</button>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RateManagement;
