import React, { useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import './UserManagement.css';
import { api, endpoints } from '../config/api';

Modal.setAppElement('#root');

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal CRUD usuario
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre_usuario: '',
    nombre: '',
    email: '',
    password: '',
    estado: 'ACTIVO',
    roles: [], // ids
  });

  // Modal "Ver eliminados"
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [deletedSearch, setDeletedSearch] = useState('');
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);

  const rolesById = useMemo(
    () => Object.fromEntries((availableRoles || []).map(r => [r.id_rol, r])),
    [availableRoles]
  );

  const normalizeUsers = (arr) =>
    (arr || []).map(u => ({
      ...u,
      roles: (u.roles || []).map(r =>
        typeof r === 'number' ? (rolesById[r] || { id_rol: r, nombre: `#${r}` }) : r
      ),
    }));

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rs, us] = await Promise.all([
        api.get(endpoints.roles),
        api.get(endpoints.users),
      ]);
      setAvailableRoles(Array.isArray(rs) ? rs : []);
      setUsers(normalizeUsers(Array.isArray(us) ? us : []));
    } catch (e) {
      Swal.fire('Error', e.message || 'No se pudieron cargar usuarios/roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { setUsers(prev => normalizeUsers(prev)); /* eslint-disable-next-line */ }, [availableRoles]);

  // ------- Crear / Editar -------
  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre_usuario: '',
      nombre: '',
      email: '',
      password: '',
      estado: 'ACTIVO',
      roles: [],
    });
    setIsOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      nombre_usuario: u.nombre_usuario || '',
      nombre: u.nombre || '',
      email: u.email || '',
      password: '',
      estado: u.estado || 'ACTIVO',
      roles: (u.roles || []).map(r => r.id_rol),
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setForm({
      nombre_usuario: '',
      nombre: '',
      email: '',
      password: '',
      estado: 'ACTIVO',
      roles: [],
    });
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'roles') {
      const id = parseInt(value, 10);
      setForm(p => ({
        ...p,
        roles: checked ? [...p.roles, id] : p.roles.filter(x => x !== id),
      }));
    } else if (name === 'estadoSwitch') {
      setForm(p => ({ ...p, estado: checked ? 'ACTIVO' : 'INACTIVO' }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const save = async (e) => {
    e?.preventDefault?.();
    if (!editing && !form.password) {
      Swal.fire('Campos requeridos', 'La contraseña es obligatoria para nuevos usuarios.', 'warning');
      return;
    }
    const payload = { ...form };
    if (editing && !payload.password) delete payload.password;

    try {
      if (editing) {
        await api.put(`${endpoints.users}${editing.id_usuario}`, payload);
      } else {
        await api.post(endpoints.users, payload);
      }
      await Swal.fire({
        icon: 'success',
        title: editing ? 'Usuario actualizado' : 'Usuario creado',
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
      title: '¿Eliminar usuario?',
      text: 'La eliminación es lógica.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });
    if (!ok.isConfirmed) return;
    try {
      await api.del(`${endpoints.users}${id}`);
      await Swal.fire({ icon: 'success', title: 'Usuario eliminado', timer: 1200, showConfirmButton: false });
      await loadAll();
    } catch (e) {
      Swal.fire('Error', e.message || 'No se pudo eliminar', 'error');
    }
  };

  // ------- Ver eliminados -------
  const openDeleted = async () => {
    setDeletedSearch('');
    setLoadingDeleted(true);
    setDeletedOpen(true);
    try {
      // 1) intenta endpoint explícito
      let list = await api.get(`${endpoints.users}?deleted=true`);
      if (!Array.isArray(list)) list = [];

      // 2) fallback si la API no soporta deleted=true
      if (list.length === 0) {
        const all = await api.get(endpoints.users);
        const arr = Array.isArray(all) ? all : [];
        list = arr.filter(u =>
          String(u.estado || '').toUpperCase() === 'INACTIVO' ||
          String(u.estado || '').toUpperCase() === 'ELIMINADO' ||
          u.eliminado === true
        );
      }

      setDeletedUsers(list);
    } catch (e) {
      Swal.fire('Error', e.message || 'No se pudieron cargar eliminados', 'error');
      setDeletedUsers([]);
    } finally {
      setLoadingDeleted(false);
    }
  };

  const closeDeleted = () => setDeletedOpen(false);

  const restore = async (user) => {
    const ok = await Swal.fire({
      title: '¿Restaurar usuario?',
      text: `Se activará nuevamente: ${user.nombre_usuario || user.email}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });
    if (!ok.isConfirmed) return;

    try {
      await api.put(`${endpoints.users}${user.id_usuario}`, { estado: 'ACTIVO' });
      await Swal.fire({ icon: 'success', title: 'Usuario restaurado', timer: 1100, showConfirmButton: false });
      // refresca ambas vistas
      await loadAll();
      // refresca lista de eliminados
      setDeletedUsers(prev => prev.filter(u => u.id_usuario !== user.id_usuario));
    } catch (e) {
      Swal.fire('Error', e.message || 'No se pudo restaurar', 'error');
    }
  };

  // ------- Filtros -------
  const filtered = (users || []).filter(u => {
    const q = (search || '').toLowerCase();
    return (
      (u.nombre_usuario || '').toLowerCase().includes(q) ||
      (u.nombre || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  const filteredDeleted = (deletedUsers || []).filter(u => {
    const q = (deletedSearch || '').toLowerCase();
    return (
      (u.nombre_usuario || '').toLowerCase().includes(q) ||
      (u.nombre || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="user-mgmt">
      <div className="um-header">
        <h2>Gestión de Usuarios</h2>
        <div className="um-actions">
          <button className="btn btn-accent" onClick={openDeleted}>Ver eliminados</button>
          <button className="btn btn-accent" onClick={openCreate}>+ Nuevo usuario</button>
        </div>
      </div>

      <div className="um-card">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar usuarios por nombre, email o usuario…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="muted">Cargando usuarios…</p>
        ) : filtered.length === 0 ? (
          <p className="muted">No hay usuarios.</p>
        ) : (
          <div className="table-responsive">
            <table className="role-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Roles</th>
                  <th style={{ width: 180 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const inactive = String(user.estado || '').toUpperCase() !== 'ACTIVO';
                  return (
                    <tr key={user.id_usuario} className={inactive ? 'inactive-user-row' : ''}>
                      <td>{user.id_usuario}</td>
                      <td>{user.nombre_usuario}</td>
                      <td>{user.nombre}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${inactive ? 'badge-gray' : 'badge-green'}`}>
                          {user.estado || '-'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(user.roles || []).length > 0 ? (
                            (user.roles || []).map(r => (
                              <span key={r.id_rol} className="badge badge-gray" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                {r.nombre}
                              </span>
                            ))
                          ) : (
                            <span className="muted" style={{ fontStyle: 'italic' }}>Sin roles</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-accent btn-sm" onClick={() => openEdit(user)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(user.id_usuario)}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Modal CRUD usuario ===== */}
      {isOpen && (
        <div className="dc-overlay">
          <div className="dc-modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            </div>

            <form onSubmit={save} className="user-form">
              <div className="form-row">
                <label>Nombre de usuario</label>
                <input
                  type="text"
                  name="nombre_usuario"
                  value={form.nombre_usuario}
                  onChange={onChange}
                  required
                  disabled={!!editing}
                />
              </div>

              <div className="form-row">
                <label>Nombre completo</label>
                <input type="text" name="nombre" value={form.nombre} onChange={onChange} />
              </div>

              <div className="form-row">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={onChange} />
              </div>

              <div className="form-row">
                <label>Contraseña {editing ? '(dejar en blanco para no cambiar)' : '*'}</label>
                <input type="password" name="password" value={form.password} onChange={onChange} />
              </div>

              <div className="form-row switch-row">
                <label>Estado</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="estadoSwitch"
                    checked={form.estado === 'ACTIVO'}
                    onChange={onChange}
                  />
                  <span className="slider" />
                </label>
                <span className={`badge ${form.estado === 'ACTIVO' ? 'badge-green' : 'badge-gray'}`}>
                  {form.estado}
                </span>
              </div>

              <div className="form-row">
                <label>Roles</label>
                <div className="roles-grid">
                  {(availableRoles || []).map(r => (
                    <label key={r.id_rol} className="role-item">
                      <input
                        type="checkbox"
                        name="roles"
                        value={r.id_rol}
                        checked={form.roles.includes(r.id_rol)}
                        onChange={onChange}
                      />
                      <span>{r.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Guardar cambios' : 'Registrar'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal Ver eliminados ===== */}
      {deletedOpen && (
        <div className="dc-overlay">
          <div className="dc-modal dc-modal-wide">
            <div className="modal-header">
              <h3 className="modal-title">Usuarios eliminados</h3>
              <span className="muted">Total: {deletedUsers.length}</span>
            </div>

            <div className="form-row" style={{ marginBottom: 8 }}>
              <label>Búsqueda</label>
              <input
                type="text"
                placeholder="Buscar por usuario, nombre o email…"
                value={deletedSearch}
                onChange={(e) => setDeletedSearch(e.target.value)}
              />
            </div>

            <div className="perm-list-body">
              {loadingDeleted ? (
                <p className="muted">Cargando…</p>
              ) : (
                <div className="table-responsive">
                  <table className="role-table">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>ID</th>
                        <th>Usuario</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th style={{ width: 140 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeleted.map((u) => (
                        <tr key={u.id_usuario}>
                          <td>{u.id_usuario}</td>
                          <td>{u.nombre_usuario}</td>
                          <td>{u.nombre}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`badge ${String(u.estado || '').toUpperCase() === 'ELIMINADO' ? 'badge-danger' : 'badge-gray'
                              }`}>
                              {u.estado || 'ELIMINADO'}
                            </span>
                          </td>

                          <td>
                            <button className="btn btn-accent btn-sm" onClick={() => restore(u)}>
                              Restaurar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredDeleted.length === 0 && (
                        <tr>
                          <td colSpan={6} className="muted">Sin resultados…</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeleted}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserManagement;
