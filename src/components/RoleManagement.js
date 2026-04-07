// src/components/RoleManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config/api';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserShield, faBriefcase, faTag, faUsersCog, 
  faEdit, faTrash, faSearch, faPlus, faEye, faLock 
} from '@fortawesome/free-solid-svg-icons';
import './RoleManagement.css';

Modal.setAppElement('#root');


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
  const [search, setSearch] = useState(''); // Nuevo buscador

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

  // ===== Helpers UI =====
  const getRoleIcon = (name) => {
    const n = (name || '').toUpperCase();
    if (n.includes('ADMIN')) return faUserShield;
    if (n.includes('GERENTE')) return faBriefcase;
    if (n.includes('VENDEDOR')) return faTag;
    return faUsersCog;
  };

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(r => 
      (r.nombre || '').toLowerCase().includes(q) || 
      (r.descripcion || '').toLowerCase().includes(q)
    );
  }, [roles, search]);

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
        <div className="rm-actions-premium">
          <button className="btn-premium action-btn-link" onClick={openPermListModal}>
            <FontAwesomeIcon icon={faEye} /> Ver Catálogo de Permisos
          </button>
          <button className="btn-premium primary" onClick={openCreateRoleModal}>
            <FontAwesomeIcon icon={faPlus} /> Nuevo Rol
          </button>
        </div>
      </div>

      <div className="rm-card-premium">
        <div className="search-bar-premium">
          <div className="search-input-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar roles por nombre o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <p className="muted">Cargando roles…</p>
        ) : roles.length === 0 ? (
          <p className="muted">No hay roles registrados.</p>
        ) : (
          <div className="table-responsive">
            <table className="role-table">
              <thead>
                <tr>
                  <th>Rol / Perfil</th>
                  <th>Descripción</th>
                  <th>Permisos Asignados</th>
                  <th style={{ width: 120, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((r) => (
                  <tr key={r.id_rol}>
                    <td>
                      <div className="role-profile-cell">
                        <div className={`role-avatar color-${(r.id_rol % 5) + 1}`}>
                          <FontAwesomeIcon icon={getRoleIcon(r.nombre)} />
                        </div>
                        <div className="role-info">
                          <span className="role-name-main">{r.nombre}</span>
                          <span className="role-id-tag">ID: #{r.id_rol}</span>
                        </div>
                      </div>
                    </td>
                    <td className="desc-cell">{r.descripcion || '—'}</td>
                    <td>
                      <div className="perms-pill-container">
                        {Array.isArray(r.permisos) && r.permisos.length > 0 ? (
                          r.permisos.slice(0, 5).map((p) => (
                            <span key={p.id_permiso} className="perm-pill">
                              {p.nombre_permiso || p.nombre || 'Permiso'}
                            </span>
                          ))
                        ) : (
                          <span className="muted-text">Sin permisos</span>
                        )}
                        {Array.isArray(r.permisos) && r.permisos.length > 5 && (
                          <span className="perm-pill-more">+{r.permisos.length - 5} más</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="actions-premium">
                        <button className="action-btn edit-btn" onClick={() => openEditRoleModal(r)} title="Editar Rol">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => deleteRole(r.id_rol)}
                          disabled={deletingId === r.id_rol}
                          title="Eliminar Rol"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
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
          <div className="modal-body-premium">
            <div className="form-row">
              <label>Nombre del Rol</label>
              <div className="input-with-icon">
                <FontAwesomeIcon icon={faUsersCog} className="field-icon" />
                <input
                  name="nombre_rol"
                  value={roleForm.nombre_rol}
                  onChange={onRoleChange}
                  placeholder="Ej.: Cajero, Administrador…"
                  autoFocus
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-row">
              <label>Descripción del Perfil</label>
              <textarea
                name="descripcion"
                rows={2}
                value={roleForm.descripcion}
                onChange={onRoleChange}
                placeholder="Describe brevemente las responsabilidades de este rol…"
                disabled={saving}
              />
            </div>

            <div className="form-row">
              <div className="label-with-action">
                <label>Permisos de Acceso</label>
                <button type="button" className="btn-text-action" onClick={openPermModal}>
                  <FontAwesomeIcon icon={faPlus} /> Nuevo Permiso
                </button>
              </div>
              
              <div className="permisos-grid-premium">
                {availablePermisos.map((perm) => {
                  const isChecked = roleForm.permisos.includes(perm.id_permiso);
                  return (
                    <label key={perm.id_permiso} className={`perm-card ${isChecked ? 'active' : ''}`}>
                      <div className="perm-checkbox">
                        <input
                          type="checkbox"
                          name="permisos"
                          value={perm.id_permiso}
                          checked={isChecked}
                          onChange={onRoleChange}
                          disabled={saving}
                        />
                        <div className="custom-check"></div>
                      </div>
                      <div className="perm-content">
                        <span className="perm-name">{perm.nombre_permiso}</span>
                        <code className="perm-code">{perm.codigo}</code>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer-premium">
            <button type="button" className="btn-premium secondary" onClick={closeRoleModal} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-premium primary" disabled={saving}>
              <FontAwesomeIcon icon={faLock} style={{marginRight: '8px'}} />
              {saving ? 'Guardando…' : editingRole ? 'Actualizar Rol' : 'Crear Rol Premium'}
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
          <h3 className="modal-title">Nuevo Permiso del Sistema</h3>
        </div>
        <form onSubmit={savePerm} className="role-form">
          <div className="modal-body-premium">
            <div className="form-row">
              <label>Código Técnico</label>
              <div className="input-with-icon">
                <FontAwesomeIcon icon={faTag} className="field-icon" />
                <input
                  name="codigo"
                  value={permForm.codigo}
                  onChange={onPermChange}
                  placeholder="p.ej. ventas.crear, reportes.ver…"
                />
              </div>
              <small className="muted-text">Este código identifica al permiso en el código fuente.</small>
            </div>
            <div className="form-row">
              <label>Nombre Descriptivo</label>
              <div className="input-with-icon">
                <FontAwesomeIcon icon={faEdit} className="field-icon" />
                <input
                  name="nombre_permiso"
                  value={permForm.nombre_permiso}
                  onChange={onPermChange}
                  placeholder="p.ej. Crear ventas, Ver reportes financieros…"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer-premium">
            <button type="button" className="btn-premium secondary" onClick={closePermModal}>Cancelar</button>
            <button type="submit" className="btn-premium primary">Crear Permiso Autorizado</button>
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
          <h3 className="modal-title">Permisos del Sistema</h3>
          <span className="badge-pill pill-gray">Total: {availablePermisos.length}</span>
        </div>

        <div className="modal-body-premium">
          <div className="search-bar-premium" style={{ marginBottom: '20px' }}>
            <div className="search-input-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por código o nombre…"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
              />
            </div>
          </div>

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
                    <td><span className="role-id-tag">#{p.id_permiso}</span></td>
                    <td><code className="perm-code" style={{fontSize: '0.8rem'}}>{p.codigo}</code></td>
                    <td className="role-name-main" style={{fontSize: '0.9rem'}}>{p.nombre_permiso}</td>
                    <td>
                      <div className="actions-premium">
                        <button className="action-btn edit-btn" onClick={() => copyToClipboard(p.codigo)} title="Copiar Código">
                          <FontAwesomeIcon icon={faTag} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPerms.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted-text" style={{padding: '24px', textAlign: 'center'}}>Sin resultados…</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer-premium">
          <button className="btn-premium secondary" onClick={closePermListModal}>Cerrar Catálogo</button>
        </div>
      </Modal>
    </div>
  );
}
