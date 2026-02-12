// src/components/RoleManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import './RoleManagement.css';

Modal.setAppElement('#root');

const API_BASE_URL = process.env.REACT_APP_API_URL; // p.ej. http://127.0.0.1:5000/api

const ensureOk = async (response, fallbackMsg) => {
  if (response.status === 401) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
  if (!response.ok) {
    let msg = fallbackMsg || `Error ${response.status}`;
    try {
      const err = await response.json();
      if (err?.error || err?.message || err?.msg) msg = err.error || err.message || err.msg;
    } catch { }
    throw new Error(msg);
  }
  if (response.status === 204) return null;
  return response.json();
};

export default function RoleManagement({ token }) {
  const authHeader = { Authorization: `Bearer ${token}` };

  const [roles, setRoles] = useState([]);
  const [availablePermisos, setAvailablePermisos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Modales
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permModalOpen, setPermModalOpen] = useState(false);       // crear permiso
  const [permListOpen, setPermListOpen] = useState(false);         // ver lista de permisos

  // Buscador en modal de permisos
  const [permSearch, setPermSearch] = useState('');

  // Formulario de rol (crear/editar)
  const [editingRole, setEditingRole] = useState(null); // objeto rol o null
  const [roleForm, setRoleForm] = useState({
    nombre_rol: '',
    descripcion: '',
    permisos: [], // Array de IDs (número)
  });

  // Formulario de permiso (crear)
  const [permForm, setPermForm] = useState({
    codigo: '',
    nombre_permiso: '',
  });

  // ===== Fetch =====
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/roles/`, { headers: authHeader });
      const data = await ensureOk(resp, 'Error al cargar roles');
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudieron cargar los roles.', 'error');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermisos = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/permisos/`, { headers: authHeader });
      const data = await ensureOk(resp, 'Error al cargar permisos');
      setAvailablePermisos(Array.isArray(data) ? data : []);
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudieron cargar los permisos.', 'error');
      setAvailablePermisos([]);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchPermisos(), fetchRoles()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ===== Role Modal =====
  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleForm({ nombre_rol: '', descripcion: '', permisos: [] });
    setRoleModalOpen(true);
  };

  const openEditRoleModal = (role) => {
    setEditingRole(role);
    setRoleForm({
      nombre_rol: role?.nombre_rol || '',
      descripcion: role?.descripcion || '',
      permisos: Array.isArray(role?.permisos) ? role.permisos.map((p) => p.id_permiso) : [],
    });
    setRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    if (saving) return;
    setRoleModalOpen(false);
    setEditingRole(null);
    setRoleForm({ nombre_rol: '', descripcion: '', permisos: [] });
  };

  const onRoleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'permisos') {
      const id = parseInt(value, 10);
      setRoleForm((prev) => ({
        ...prev,
        permisos: checked ? [...prev.permisos, id] : prev.permisos.filter((x) => x !== id),
      }));
    } else {
      setRoleForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const saveRole = async (e) => {
    e?.preventDefault?.();
    if (!roleForm.nombre_rol.trim()) {
      Swal.fire('Campos requeridos', 'El nombre del rol es obligatorio.', 'warning');
      return;
    }

    const method = editingRole ? 'PUT' : 'POST';
    const url = editingRole
      ? `${API_BASE_URL}/roles/${editingRole.id_rol}`
      : `${API_BASE_URL}/roles/`;

    setSaving(true);
    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(roleForm),
      });
      await ensureOk(resp, 'No se pudo guardar el rol.');

      await Swal.fire({
        icon: 'success',
        title: editingRole ? 'Rol actualizado' : 'Rol creado',
        timer: 1400,
        showConfirmButton: false,
      });

      closeRoleModal();
      await fetchRoles();
    } catch (err) {
      Swal.fire('Error', err.message || 'Error al guardar el rol.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (id_rol) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar rol?',
      text: 'Esta acción puede afectar a usuarios asignados a este rol.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setDeletingId(id_rol);
    try {
      const resp = await fetch(`${API_BASE_URL}/roles/${id_rol}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      await ensureOk(resp, 'No se pudo eliminar el rol.');

      await Swal.fire({
        icon: 'success',
        title: 'Rol eliminado',
        timer: 1200,
        showConfirmButton: false,
      });

      await fetchRoles();
    } catch (err) {
      Swal.fire('Error', err.message || 'Error al eliminar el rol.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ===== Permiso (crear) =====
  const openPermModal = () => {
    setPermForm({ codigo: '', nombre_permiso: '' });
    setPermModalOpen(true);
  };
  const closePermModal = () => {
    setPermModalOpen(false);
    setPermForm({ codigo: '', nombre_permiso: '' });
  };
  const onPermChange = (e) => {
    const { name, value } = e.target;
    setPermForm((prev) => ({ ...prev, [name]: value }));
  };
  const savePerm = async (e) => {
    e?.preventDefault?.();
    const { codigo, nombre_permiso } = permForm;
    if (!codigo.trim() || !nombre_permiso.trim()) {
      Swal.fire('Campos requeridos', 'Código y nombre del permiso son obligatorios.', 'warning');
      return;
    }
    try {
      const resp = await fetch(`${API_BASE_URL}/permisos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(permForm),
      });
      const created = await ensureOk(resp, 'No se pudo crear el permiso.');
      await Swal.fire({ icon: 'success', title: 'Permiso creado', timer: 1200, showConfirmButton: false });

      // Actualiza lista
      if (created && created.id_permiso) {
        setAvailablePermisos((prev) => [...prev, created]);
      } else {
        await fetchPermisos();
      }
      closePermModal();
    } catch (err) {
      Swal.fire('Error', err.message || 'Error al crear el permiso.', 'error');
    }
  };

  // ===== Permisos (ver lista) =====
  const openPermListModal = () => {
    setPermSearch('');
    setPermListOpen(true);
  };
  const closePermListModal = () => setPermListOpen(false);

  const filteredPerms = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return availablePermisos;
    return (availablePermisos || []).filter(
      (p) =>
        (p.codigo || '').toLowerCase().includes(q) ||
        (p.nombre_permiso || '').toLowerCase().includes(q)
    );
  }, [availablePermisos, permSearch]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      Swal.fire({ icon: 'success', title: 'Copiado', text: text, timer: 900, showConfirmButton: false });
    } catch {
      Swal.fire('Error', 'No se pudo copiar al portapapeles', 'error');
    }
  };

  // ===== Render =====
  return (
    <div className="role-mgmt">
      <div className="rm-header">
        <h2>Gestión de Roles</h2>
        <div className="rm-actions">
          {/* 👈 Ver Permisos a la izquierda del +Nuevo Permiso */}
          <button className="btn btn-accent" onClick={openPermListModal}>
            Ver Permisos
          </button>
          <button className="btn btn-accent" onClick={openPermModal}>
            + Nuevo Permiso
          </button>
          <button className="btn btn-accent" onClick={openCreateRoleModal}>
            + Nuevo Rol
          </button>
        </div>
      </div>

      <div className="rm-card">
        {loading ? (
          <p className="muted">Cargando roles…</p>
        ) : roles.length === 0 ? (
          <p className="muted">No hay roles registrados.</p>
        ) : (
          <div className="table-responsive">
            <table className="role-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Rol</th>
                  <th>Descripción</th>
                  <th>Permisos</th>
                  <th style={{ width: 180 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id_rol}>
                    <td>{r.id_rol}</td>
                    <td>{r.nombre_rol}</td>
                    <td>{r.descripcion || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxHeight: '60px', overflow: 'hidden' }}>
                        {Array.isArray(r.permisos) && r.permisos.length > 0 ? (
                          r.permisos.map((p) => (
                            <span key={p.id_permiso} className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                              {p.nombre_permiso}
                            </span>
                          ))
                        ) : (
                          <span className="muted" style={{ fontStyle: 'italic' }}>Ninguno</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-accent btn-sm" onClick={() => openEditRoleModal(r)}>
                        Editar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteRole(r.id_rol)}
                        disabled={deletingId === r.id_rol}
                        title={deletingId === r.id_rol ? 'Eliminando…' : 'Eliminar'}
                      >
                        {deletingId === r.id_rol ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==== Modal Rol ==== */}
      <Modal
        isOpen={roleModalOpen}
        onRequestClose={closeRoleModal}
        overlayClassName="dc-overlay"
        className="dc-modal"
        contentLabel="Formulario de Rol"
      >
        <div className="modal-header">
          <h3 className="modal-title">{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</h3>
        </div>

        <form onSubmit={saveRole} className="role-form">
          <div className="form-row">
            <label>Nombre del Rol</label>
            <input
              name="nombre_rol"
              value={roleForm.nombre_rol}
              onChange={onRoleChange}
              placeholder="Ej.: Cajero, Admin…"
              autoFocus
              disabled={saving}
            />
          </div>

          <div className="form-row">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              rows={3}
              value={roleForm.descripcion}
              onChange={onRoleChange}
              placeholder="Opcional"
              disabled={saving}
            />
          </div>

          <div className="form-row">
            <label>Permisos</label>
            <div className="permisos-grid">
              {availablePermisos.map((perm) => (
                <label key={perm.id_permiso} className="perm-item">
                  <input
                    type="checkbox"
                    name="permisos"
                    value={perm.id_permiso}
                    checked={roleForm.permisos.includes(perm.id_permiso)}
                    onChange={onRoleChange}
                    disabled={saving}
                  />
                  <span>{perm.nombre_permiso}</span>
                  <small className="code">{perm.codigo}</small>
                </label>
              ))}
            </div>
            <div className="inline-actions">
              <button type="button" className="btn btn-accent btn-sm" onClick={openPermModal}>
                + Nuevo Permiso
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : editingRole ? 'Guardar Cambios' : 'Registrar Rol'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={closeRoleModal} disabled={saving}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* ==== Modal Permiso (crear) ==== */}
      <Modal
        isOpen={permModalOpen}
        onRequestClose={closePermModal}
        overlayClassName="dc-overlay"
        className="dc-modal"
        contentLabel="Nuevo Permiso"
      >
        <div className="modal-header">
          <h3 className="modal-title">Nuevo Permiso</h3>
        </div>
        <form onSubmit={savePerm} className="role-form">
          <div className="form-row">
            <label>Código</label>
            <input
              name="codigo"
              value={permForm.codigo}
              onChange={onPermChange}
              placeholder="p.ej. ventas.crear"
            />
          </div>
          <div className="form-row">
            <label>Nombre</label>
            <input
              name="nombre_permiso"
              value={permForm.nombre_permiso}
              onChange={onPermChange}
              placeholder="p.ej. Crear ventas"
            />
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-accent">Crear Permiso</button>
            <button type="button" className="btn btn-secondary" onClick={closePermModal}>Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* ==== Modal Permisos (ver lista) ==== */}
      <Modal
        isOpen={permListOpen}
        onRequestClose={closePermListModal}
        overlayClassName="dc-overlay"
        className="dc-modal dc-modal-wide"
        contentLabel="Permisos del sistema"
      >
        <div className="modal-header">
          <h3 className="modal-title">Permisos del sistema</h3>
          <span className="muted">Total: {availablePermisos.length}</span>
        </div>

        <div className="form-row" style={{ marginBottom: 8 }}>
          <label>Búsqueda</label>
          <input
            type="text"
            placeholder="Buscar por código o nombre…"
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
          />
        </div>

        <div className="perm-list-body">
          <div className="table-responsive">
            <table className="role-table perm-list-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Código</th>
                  <th>Nombre (descripción)</th>
                  <th style={{ width: 120 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPerms.map((p) => (
                  <tr key={p.id_permiso}>
                    <td>{p.id_permiso}</td>
                    <td>{p.codigo}</td>
                    <td>{p.nombre_permiso}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(p.codigo)}>
                        Copiar
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPerms.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">Sin resultados…</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closePermListModal}>Cerrar</button>
        </div>
      </Modal>
    </div>
  );
}
