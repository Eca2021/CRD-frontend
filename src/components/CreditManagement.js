import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { api, endpoints } from '../config/api';



Modal.setAppElement('#root');

function CreditManagement() {
    // ESTADOS cambios de fecha 
    const [creditos, setCreditos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [tasas, setTasas] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCreditDetails, setSelectedCreditDetails] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({ id_cliente: '', id_tasa: '', monto: '', cuotas: '', fecha_primer_pago: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedClientObj, setSelectedClientObj] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ id_detalle_credito: '', id_forma_pago: '', monto_pagado: '', comprobante_nro: '' });
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
            Swal.fire('Error', 'Error cargando datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const openCreate = () => {
        setForm({ id_cliente: '', id_tasa: '', monto: '', cuotas: '', fecha_primer_pago: '' });
        setSearchTerm('');
        setSelectedClientObj(null);
        setPreview(null);
        setIsOpen(true);
    };

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
    };

    const calculate = async () => {
        // Validación manual para mostrar error específico
        if (!form.id_cliente) return Swal.fire('Atención', 'Debe seleccionar un cliente primero.', 'warning');
        if (!form.id_tasa) return Swal.fire('Atención', 'Debe seleccionar una tasa de interés.', 'warning');
        if (!form.monto) return Swal.fire('Atención', 'Debe ingresar el monto del crédito.', 'warning');
        if (!form.cuotas) return Swal.fire('Atención', 'Debe ingresar la cantidad de cuotas.', 'warning');

        try {
            const data = await api.post(endpoints.credits.preview, {
                monto: form.monto,
                cuotas: form.cuotas,
                id_tasa: form.id_tasa,
                fecha_primer_pago: form.fecha_primer_pago
            });
            setPreview(data);
        } catch (e) {
            Swal.fire('Error', 'No se pudo generar el plan de pagos.', 'error');
        }
    };

    const save = async () => {
        try {
            await api.post(endpoints.credits.base, form);
            await Swal.fire('Éxito', 'Crédito otorgado correctamente', 'success');
            setIsOpen(false);
            loadData();
        } catch (e) {
            Swal.fire('Error', 'No se pudo guardar el crédito.', 'error');
        }
    };

    const openDetails = async (credit) => {
        try {
            const response = await api.get(`${endpoints.credits.base}${credit.id_credito}`);
            setSelectedCreditDetails(response || credit);
            setIsDetailsOpen(true);
        } catch (e) {
            setSelectedCreditDetails(credit);
            setIsDetailsOpen(true);
            console.error("Error al obtener detalles extendidos:", e);
        }
    };

    const closeDetails = () => {
        setIsDetailsOpen(false);
        setSelectedCreditDetails(null);
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

    const closePaymentModal = () => { setIsPaymentOpen(false); setSelectedCuota(null); loadData(); };

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
            // Si el modal de detalles está abierto, actualizarlo
            if (isDetailsOpen && selectedCreditDetails) {
                openDetails(selectedCreditDetails);
            }
        } catch (e) {
            Swal.fire('Error', e.message || 'Error al pagar', 'error');
        }
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-100 font-sans">

            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 m-0">Gestión de Créditos</h2>
                    <p className="text-slate-500 mt-1 font-medium">Administre los préstamos de sus clientes</p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold cursor-pointer flex items-center gap-2.5 shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors w-full md:w-auto justify-center"
                >
                    <svg width="20" height="20" style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    NUEVO CRÉDITO
                </button>
            </div>

            {/* Tabla Principal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="p-5">ID</th>
                            <th className="p-5">Cliente</th>
                            <th className="p-5">Monto Solicitado</th>
                            <th className="p-5 text-center">Estado</th>
                            <th className="p-5 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-800 font-medium">
                        {creditos.map(c => (
                            <tr key={c.id_credito} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="p-5 font-black text-blue-600">#{c.id_credito}</td>
                                <td className="p-5 font-semibold">{c.cliente_nombre}</td>
                                <td className="p-5 font-bold">{Number(c.monto_solicitado).toLocaleString('es-PY')} Gs.</td>
                                <td className="p-5 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black
                                        ${c.estado === 'PAGADO' ? 'bg-emerald-100 text-emerald-800' :
                                            c.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' :
                                                'bg-slate-100 text-slate-600'}`}>
                                        {c.estado}
                                    </span>
                                </td>
                                <td className="p-5 text-center">
                                    <button onClick={() => openDetails(c)} className="bg-slate-100 text-blue-600 p-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer border-none">
                                        <svg width="18" height="18" style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CREAR */}
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(8px)' }}>
                    <div className="bg-white w-[95%] max-w-[950px] rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                        <div className="p-6 md:px-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="m-0 font-black text-slate-900 tracking-tight text-lg">NUEVO PRÉSTAMO</h3>
                            <button onClick={() => setIsOpen(false)} className="bg-slate-100 border-none text-xl w-9 h-9 rounded-full text-slate-500 hover:bg-slate-200 cursor-pointer flex items-center justify-center transition-colors">&times;</button>
                        </div>

                        <div className="p-6 md:p-10 flex flex-col md:flex-row gap-8 overflow-y-auto">
                            {/* PASO 1: CLIENTE */}
                            <div className="flex-1">
                                <label className="text-xs font-black text-blue-600 block mb-4 uppercase tracking-widest">1. Seleccionar Cliente</label>
                                {!selectedClientObj ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre o documento..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className="w-full p-4 rounded-xl border-2 border-slate-200 outline-none font-medium text-slate-700 focus:border-blue-500 transition-colors"
                                        />
                                        {showSuggestions && searchTerm && (
                                            <div className="absolute w-full bg-white border border-slate-200 rounded-xl mt-2 shadow-xl z-10 max-h-[200px] overflow-y-auto">
                                                {filteredClients.map(cl => (
                                                    <div key={cl.id_cliente} onClick={() => selectClient(cl)} className="p-3 md:p-4 cursor-pointer border-b border-slate-50 text-sm font-semibold hover:bg-slate-50 transition-colors text-slate-700">
                                                        {cl.nombre} {cl.apellido} <br />
                                                        <small className="text-slate-400">Doc: {cl.documento}</small>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-blue-600 text-white p-5 rounded-xl flex justify-between items-center shadow-lg shadow-blue-200">
                                        <div>
                                            <p className="m-0 font-bold block">{selectedClientObj.nombre} {selectedClientObj.apellido}</p>
                                            <p className="m-0 text-xs opacity-80">{selectedClientObj.documento}</p>
                                        </div>
                                        <button onClick={() => setSelectedClientObj(null)} className="bg-white/20 border-none text-white cursor-pointer rounded-lg p-1 hover:bg-white/30 transition-colors">&times;</button>
                                    </div>
                                )}
                            </div>

                            {/* PASO 2: DATOS Y TASA */}
                            <div className="flex-[1.5]">
                                <label className="text-xs font-black text-blue-600 block mb-4 uppercase tracking-widest">2. Configuración del Crédito</label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 block mb-2">Elegir Tasa de Interés</label>
                                        <select
                                            value={form.id_tasa}
                                            onChange={(e) => setForm({ ...form, id_tasa: e.target.value })}
                                            className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors cursor-pointer bg-white"
                                        >
                                            <option value="">-- Seleccionar Tasa --</option>
                                            {tasas.map(t => (
                                                <option key={t.id_tasa} value={t.id_tasa}>{t.nombre_tasa} ({t.porcentaje}%)</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">Monto a Prestar</label>
                                        <input type="number" placeholder="0.00" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-extrabold text-slate-700 outline-none focus:border-blue-500 transition-colors" />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">Cuotas (Semanal)</label>
                                        <input type="number" placeholder="Ej: 12" value={form.cuotas} onChange={(e) => setForm({ ...form, cuotas: e.target.value })} className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-extrabold text-slate-700 outline-none focus:border-blue-500 transition-colors" />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">Fecha 1er Vencimiento</label>
                                        <input
                                            type="date"
                                            value={form.fecha_primer_pago}
                                            onChange={(e) => setForm({ ...form, fecha_primer_pago: e.target.value })}
                                            className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <button onClick={calculate} className="w-full mt-6 p-4 bg-slate-900 text-white rounded-xl border-none font-bold cursor-pointer uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                    Calcular Plan de Pagos
                                </button>

                                {preview && (
                                    <div className="mt-6 bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-black text-emerald-700">TOTAL A DEVOLVER:</span>
                                            <span className="text-xl font-black text-emerald-800">{Number(preview.monto_total).toLocaleString()} Gs.</span>
                                        </div>
                                        <div className="max-h-[150px] overflow-y-auto bg-white rounded-xl border border-emerald-100">
                                            <table className="w-full text-xs">
                                                <tbody className="font-semibold text-slate-600">
                                                    {preview.plan.map(p => (
                                                        <tr key={p.numero_cuota} className="border-b border-emerald-50">
                                                            <td className="p-2">Cuota {p.numero_cuota}</td>
                                                            <td className="p-2 text-right">{Number(p.cuota_total).toLocaleString()} Gs.</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 md:px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                            <button onClick={() => setIsOpen(false)} className="px-6 py-3 bg-transparent border-none font-bold text-slate-500 hover:text-slate-700 cursor-pointer transition-colors">DESCARTAR</button>
                            <button onClick={save} disabled={!preview} className={`px-8 py-3 rounded-xl border-none font-bold cursor-pointer text-white shadow-lg transition-all
                                ${preview ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'}`}>
                                GUARDAR CRÉDITO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETALLES */}
            {isDetailsOpen && selectedCreditDetails && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
                    <div className="bg-white w-full max-w-[900px] rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] mx-4">

                        {/* Cabecera del Detalle */}
                        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight m-0">
                                    Expediente #{selectedCreditDetails.id_credito}
                                </h3>
                                <p className="text-sm text-slate-500 font-bold mt-1">Cliente: {selectedCreditDetails.cliente_nombre}</p>
                            </div>
                            <button onClick={closeDetails} className="text-slate-400 bg-transparent border-none text-3xl leading-none cursor-pointer hover:text-slate-600 transition-colors">&times;</button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto">
                            {/* Resumen de Valores */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                    <p className="text-[0.65rem] uppercase font-black text-indigo-500 tracking-wider mb-2">Capital Prestado</p>
                                    <p className="text-xl font-black text-indigo-900">{Number(selectedCreditDetails.monto_solicitado).toLocaleString()} Gs.</p>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                    <p className="text-[0.65rem] uppercase font-black text-emerald-500 tracking-wider mb-2">Total con Interés</p>
                                    <p className="text-xl font-black text-emerald-900">{Number(selectedCreditDetails.monto_total_a_pagar).toLocaleString()} Gs.</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <p className="text-[0.65rem] uppercase font-black text-slate-500 tracking-wider mb-2">Cuotas</p>
                                    <p className="text-xl font-black text-slate-900">{selectedCreditDetails.cantidad_cuotas}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <p className="text-[0.65rem] uppercase font-black text-slate-500 tracking-wider mb-2">Estado</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-[0.65rem] font-black uppercase
                                        ${selectedCreditDetails.estado === 'PAGADO' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                                        {selectedCreditDetails.estado}
                                    </span>
                                </div>
                            </div>

                            {/* Tabla de Cuotas (Detalles) */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Plan de Amortización</h4>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-sm border-collapse text-left min-w-[600px]">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[0.7rem]">
                                            <tr>
                                                <th className="p-3 md:p-4">Nro</th>
                                                <th className="p-3 md:p-4">Vencimiento</th>
                                                <th className="p-3 md:p-4 text-right">Monto Cuota</th>
                                                <th className="p-3 md:p-4 text-right">Monto Pagado</th>
                                                <th className="p-3 md:p-4 text-center">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="font-medium">
                                            {selectedCreditDetails.detalles && selectedCreditDetails.detalles.length > 0 ? (
                                                selectedCreditDetails.detalles.map(d => (
                                                    <tr key={d.id_detalle} className="border-t border-slate-100 bg-white hover:bg-slate-50/50">
                                                        <td className="p-4 font-bold text-slate-400">#{d.numero_cuota}</td>
                                                        <td className="p-4 text-slate-600">{d.fecha_vencimiento}</td>
                                                        <td className="p-4 text-right font-black text-slate-700">{Number(d.monto_cuota).toLocaleString()}</td>
                                                        <td className="p-4 text-right font-bold text-emerald-600">
                                                            {d.monto_pagado > 0 ? Number(d.monto_pagado).toLocaleString() : '-'}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {d.estado_cuota !== 'PAGADO' && selectedCreditDetails.estado !== 'ANULADO' ? (
                                                                <button
                                                                    onClick={() => openPayment(d)}
                                                                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[0.7rem] font-black uppercase border-none cursor-pointer shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                                                                >
                                                                    Pagar
                                                                </button>
                                                            ) : (
                                                                <span className="text-[0.7rem] font-black text-emerald-500 uppercase">Completado</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="p-10 text-center text-slate-400 italic">
                                                        No hay cuotas registradas para este crédito.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={closeDetails}
                                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500 cursor-pointer shadow-sm hover:text-slate-800 transition-colors"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PAGO */}
            {isPaymentOpen && selectedCuota && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, backdropFilter: 'blur(8px)' }}>
                    <div className="bg-white w-full max-w-[450px] rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 mx-4">
                        <div className="p-8 md:p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-center relative">
                            <h3 className="text-2xl font-black uppercase tracking-tight m-0">Registrar Pago</h3>
                            <p className="text-indigo-100 text-xs font-bold mt-1">CUOTA NRO #{selectedCuota.numero_cuota}</p>
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                        </div>
                        <form onSubmit={savePayment} className="p-8 md:p-10 pt-12 flex flex-col gap-6 bg-white">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Monto Pagado</label>
                                <input
                                    name="monto_pagado"
                                    type="number"
                                    step="0.01"
                                    value={paymentForm.monto_pagado}
                                    onChange={onPaymentChange}
                                    required
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-2xl text-slate-700 text-center focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Forma de Pago</label>
                                <select
                                    name="id_forma_pago"
                                    value={paymentForm.id_forma_pago}
                                    onChange={onPaymentChange}
                                    required
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-600 appearance-none cursor-pointer focus:border-indigo-500 transition-colors"
                                >
                                    <option value="">Seleccione...</option>
                                    {formasPago.map(f => (<option key={f.id_forma_pago} value={f.id_forma_pago}>{f.nombre}</option>))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nro Comprobante</label>
                                <input
                                    name="comprobante_nro"
                                    type="text"
                                    placeholder="Ej: 001-002-12345"
                                    value={paymentForm.comprobante_nro}
                                    onChange={onPaymentChange}
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-semibold text-slate-600 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div className="pt-4 flex flex-col gap-3">
                                <button
                                    type="submit"
                                    className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg shadow-emerald-600/20 border-none cursor-pointer hover:bg-emerald-700 transition-colors"
                                >
                                    Confirmar Pago
                                </button>
                                <button
                                    type="button"
                                    onClick={closePaymentModal}
                                    className="w-full p-4 text-slate-400 font-bold border-none bg-transparent cursor-pointer hover:text-slate-600 transition-colors"
                                >
                                    Volver
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreditManagement;