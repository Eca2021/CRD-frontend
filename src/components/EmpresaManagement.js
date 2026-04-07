import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, API_BASE_URL } from '../config/api'; 
import Swal from 'sweetalert2';

const EmpresaManagement = () => {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmpresa, setEditingEmpresa] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        ruc: '',
        direccion: '',
        phone: '',
        email: '',
        logo_url: ''
    });


    useEffect(() => {
        fetchEmpresas();
    }, []);

    const fetchEmpresas = async () => {
        try {
            setLoading(true);
            const data = await api.get(`${API_BASE_URL}/empresas`);
            setEmpresas(data);
        } catch (error) {
            console.error("Error fetching empresas:", error);
            Swal.fire("Error", "No se pudieron cargar las empresas", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            ruc: '',
            direccion: '',
            phone: '',
            email: '',
            logo_url: ''
        });
        setEditingEmpresa(null);
        setShowModal(false);
    };

    const handleEdit = (empresa) => {
        setEditingEmpresa(empresa);
        setFormData({
            nombre: empresa.nombre,
            ruc: empresa.ruc,
            direccion: empresa.direccion || '',
            phone: empresa.phone || '',
            email: empresa.email || '',
            logo_url: empresa.logo_url || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEmpresa) {
                await api.put(`${API_BASE_URL}/empresas/${editingEmpresa.id_empresa}`, formData);
                Swal.fire("Éxito", "Empresa actualizada correctamente", "success");
            } else {
                await api.post(`${API_BASE_URL}/empresas`, formData);
                Swal.fire("Éxito", "Empresa registrada correctamente", "success");
            }
            resetForm();
            fetchEmpresas();
        } catch (error) {
            console.error("Error saving empresa:", error);
            Swal.fire("Error", error.message || "No se pudo guardar la empresa", "error");
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2><i className="fas fa-building mr-2"></i>Gestión de Empresas</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <i className="fas fa-plus mr-1"></i> Nueva Empresa
                </button>
            </div>

            <div className="card shadow mb-4">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2">Cargando empresas...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="thead-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>RUC</th>
                                        <th>Teléfono</th>
                                        <th>Email</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empresas.map(emp => (
                                        <tr key={emp.id_empresa}>
                                            <td>{emp.id_empresa}</td>
                                            <td><strong>{emp.nombre}</strong></td>
                                            <td>{emp.ruc}</td>
                                            <td>{emp.phone || '-'}</td>
                                            <td>{emp.email || '-'}</td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-outline-info mr-2"
                                                    onClick={() => handleEdit(emp)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {empresas.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4 text-muted">
                                                No hay empresas registradas.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Registro/Edición */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    {editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
                                </h5>
                                <button type="button" className="close text-white" onClick={resetForm}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Nombre de la Empresa *</label>
                                        <input 
                                            type="text" name="nombre" className="form-control"
                                            value={formData.nombre} onChange={handleInputChange} required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>RUC *</label>
                                        <input 
                                            type="text" name="ruc" className="form-control"
                                            value={formData.ruc} onChange={handleInputChange} required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Dirección</label>
                                        <input 
                                            type="text" name="direccion" className="form-control"
                                            value={formData.direccion} onChange={handleInputChange} 
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 form-group">
                                            <label>Teléfono</label>
                                            <input 
                                                type="text" name="phone" className="form-control"
                                                value={formData.phone} onChange={handleInputChange} 
                                            />
                                        </div>
                                        <div className="col-md-6 form-group">
                                            <label>Email</label>
                                            <input 
                                                type="email" name="email" className="form-control"
                                                value={formData.email} onChange={handleInputChange} 
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Logo URL</label>
                                        <input 
                                            type="text" name="logo_url" className="form-control"
                                            value={formData.logo_url} onChange={handleInputChange} 
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingEmpresa ? 'Actualizar' : 'Registrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmpresaManagement;
