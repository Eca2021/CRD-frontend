import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { api, endpoints } from '../config/api';

Modal.setAppElement('#root');

function RateManagement() {
    const [reglas, setReglas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        nombre: '',
        codigo: '',
        porcentaje: '',
        dias_intervalo: 7
    });

    const loadAll = async () => {
        setLoading(true);
        try {
            const data = await api.get(endpoints.rules);
            setReglas(Array.isArray(data) ? data : []);
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudieron cargar tasas', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ nombre: '', codigo: '', porcentaje: '', dias_intervalo: 7 });
        setIsOpen(true);
    };

    const openEdit = (t) => {
        setEditing(t);
        setForm({
            nombre: t.nombre || '',
            codigo: t.codigo || '',
            porcentaje: t.porcentaje || '',
            dias_intervalo: t.dias_intervalo || 7
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
        if (!form.nombre || !form.porcentaje || !form.codigo || !form.dias_intervalo) {
            Swal.fire('Campos requeridos', 'Todos los campos son obligatorios.', 'warning');
            return;
        }

        try {
            const payload = { ...form, porcentaje: parseFloat(form.porcentaje), dias_intervalo: parseInt(form.dias_intervalo) };
            if (editing) {
                await api.put(`${endpoints.rules}${editing.id_regla}`, payload);
            } else {
                await api.post(endpoints.rules, payload);
            }
            await Swal.fire({
                icon: 'success',
                title: editing ? 'Regla actualizada' : 'Regla creada',
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
            title: '¿Eliminar regla?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });
        if (!ok.isConfirmed) return;
        try {
            await api.del(`${endpoints.rules}${id}`);
            await Swal.fire({ icon: 'success', title: 'Regla eliminada', timer: 1200, showConfirmButton: false });
            await loadAll();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo eliminar', 'error');
        }
    };

    return (
        <div className="user-mgmt">
            <div className="um-header">
                <h2>Gestión de Reglas de Crédito</h2>
                <div className="um-actions">
                    <button className="btn btn-accent" onClick={openCreate}>+ Nueva Regla</button>
                </div>
            </div>

            <div className="um-card">
                {loading ? (
                    <p className="muted">Cargando reglas...</p>
                ) : reglas.length === 0 ? (
                    <p className="muted">No hay reglas registradas.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="role-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Nombre</th>
                                    <th>Porcentaje (%)</th>
                                    <th>Días Intervalo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reglas.map(t => (
                                    <tr key={t.id_regla}>
                                        <td>{t.codigo}</td>
                                        <td>{t.nombre}</td>
                                        <td>{t.porcentaje}%</td>
                                        <td>{t.dias_intervalo}</td>
                                        <td>
                                            <button className="btn btn-accent btn-sm" onClick={() => openEdit(t)}>Editar</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => remove(t.id_regla)}>Eliminar</button>
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
                            <h3 className="modal-title">{editing ? 'Editar Regla' : 'Nueva Regla'}</h3>
                        </div>
                        <form onSubmit={save} className="user-form">
                            <div className="form-row">
                                <label>Código *</label>
                                <input name="codigo" value={form.codigo} onChange={onChange} required placeholder="Ej. SEM, MENS" />
                            </div>
                            <div className="form-row">
                                <label>Nombre Regla *</label>
                                <input name="nombre" value={form.nombre} onChange={onChange} required placeholder="Ej. Semanal" />
                            </div>
                            <div className="form-row">
                                <label>Porcentaje (%) *</label>
                                <input name="porcentaje" type="number" step="0.01" value={form.porcentaje} onChange={onChange} required placeholder="Ej. 10.5" />
                            </div>
                            <div className="form-row">
                                <label>Días de Intervalo *</label>
                                <input name="dias_intervalo" type="number" step="1" value={form.dias_intervalo} onChange={onChange} required placeholder="Ej. 7" />
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
