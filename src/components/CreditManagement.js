import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2';
import { api, endpoints } from '../config/api';



Modal.setAppElement('#root');

function CreditManagement() {
    // ESTADOS cambios de fecha 
    const [creditos, setCreditos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [reglas, setReglas] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCreditDetails, setSelectedCreditDetails] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({ id_cliente: '', id_regla: '', monto: '', cuotas: '', fecha_primer_pago: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedClientObj, setSelectedClientObj] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isApprovalOpen, setIsApprovalOpen] = useState(false);
    const [showCuotasDropdown, setShowCuotasDropdown] = useState(false);
    const [hasPrinted, setHasPrinted] = useState(false);
    const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false);
    const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cData, clData, rData, fpData] = await Promise.all([
                api.get(endpoints.credits.base),
                api.get(endpoints.clients),
                api.get(endpoints.rules),
                api.get(endpoints.paymentMethods)
            ]);
            setCreditos(Array.isArray(cData) ? cData : []);
            setClientes(Array.isArray(clData) ? clData : []);
            setReglas(Array.isArray(rData) ? rData : []);
            setFormasPago(Array.isArray(fpData) ? fpData : []);
        } catch (e) {
            Swal.fire('Error', 'Error cargando datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const handleClick = () => setShowCuotasDropdown(false);
        if (showCuotasDropdown) {
            window.addEventListener('click', handleClick);
        }
        return () => window.removeEventListener('click', handleClick);
    }, [showCuotasDropdown]);

    const openCreate = () => {
        setForm({ id_cliente: '', id_regla: '', monto: '', cuotas: '', fecha_primer_pago: '' });
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
        if (!form.id_cliente) return Swal.fire('Atención', 'Debe seleccionar un cliente primero.', 'warning');
        if (!form.id_regla) return Swal.fire('Atención', 'Debe seleccionar una regla de crédito.', 'warning');
        if (!form.monto) return Swal.fire('Atención', 'Debe ingresar el monto del crédito.', 'warning');
        if (!form.cuotas) return Swal.fire('Atención', 'Debe seleccionar la cantidad de cuotas.', 'warning');

        try {
            const data = await api.post(endpoints.credits.preview, {
                monto: form.monto,
                cuotas: form.cuotas,
                id_regla: form.id_regla,
                fecha_primer_pago: form.fecha_primer_pago
            });
            setPreview(data);
            setHasPrinted(false); // Reset print status for new calculation
            setIsApprovalOpen(true); // Abrir el modal grande de aprobación
        } catch (e) {
            Swal.fire('Error', 'No se pudo generar el plan de pagos.', 'error');
        }
    };

    const formatPY = (val) => {
        if (!val) return '';
        return String(val).replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleMontoChange = (e) => {
        const val = e.target.value.replace(/\D/g, "");
        setForm({ ...form, monto: val });
    };

    const executePrint = () => {
        const printWindow = window.open('', '_blank');
        const username = localStorage.getItem('username') || 'Analista';
        const clientName = `${selectedClientObj?.nombre} ${selectedClientObj?.apellido}`;
        
        let planRows = '';
        preview.plan.forEach(p => {
            planRows += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;"># ${p.numero_cuota}</td>
                    <td style="padding: 10px;">${p.fecha_vencimiento}</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold;">${Number(p.cuota_total).toLocaleString()} Gs.</td>
                    <td style="padding: 10px; text-align: center; color: #666; font-size: 10px;">PENDIENTE</td>
                </tr>
            `;
        });

        printWindow.document.write(`
            <html>
                <head>
                    <title>Comprobante de Crédito - ${clientName}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                        .info-box { padding: 15px; background: #f9f9f9; border-radius: 10px; }
                        .label { font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; }
                        .value { font-size: 16px; font-weight: bold; margin-top: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { text-align: left; padding: 10px; border-bottom: 2px solid #eee; font-size: 12px; color: #666; }
                        .signatures { margin-top: 100px; display: flex; justify-content: space-around; }
                        .sig-box { text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px; font-size: 12px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 style="margin:0; text-transform: uppercase; letter-spacing: 2px;">Comprobante de Crédito</h1>
                        <p style="margin:5px 0 0; color: #666;">Resumen de Aprobación y Plan de Pagos</p>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-box">
                            <div class="label">Beneficiario</div>
                            <div class="value">${clientName}</div>
                            <div style="font-size: 12px; color: #666;">Doc: ${selectedClientObj?.documento}</div>
                        </div>
                        <div class="info-box" style="background: #333; color: white;">
                            <div class="label" style="color: #aaa;">Monto Total a Devolver</div>
                            <div class="value" style="font-size: 24px;">${Number(preview.monto_total).toLocaleString()} Gs.</div>
                            <div style="font-size: 12px; opacity: 0.8;">Capital: ${Number(form.monto).toLocaleString()} Gs. | ${form.cuotas} Cuotas</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>CUOTA</th>
                                <th>VENCIMIENTO</th>
                                <th style="text-align: right;">MONTO</th>
                                <th style="text-align: center;">ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${planRows}
                        </tbody>
                    </table>

                    <div class="signatures">
                        <div class="sig-box">
                            FIRMA DEL CLIENTE<br>
                            <span style="font-size: 10px; font-weight: normal; color: #666;">${clientName}</span>
                        </div>
                        <div class="sig-box">
                            AUTORIZADO POR<br>
                            <span style="font-size: 10px; font-weight: normal; color: #666;">${username}</span>
                        </div>
                    </div>

                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const save = async () => {
        const result = await Swal.fire({
            title: 'Confirmar Aprobación',
            text: "¿Desea imprimir el comprobante de este crédito?",
            icon: 'question',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonColor: '#10b981',
            denyButtonColor: '#334155',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Sí, imprimir y aprobar',
            denyButtonText: 'No, solo aprobar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isDismissed) return;

        if (result.isConfirmed) {
            executePrint();
        }

        try {
            await api.post(endpoints.credits.base, form);
            await Swal.fire('Éxito', 'Crédito otorgado correctamente', 'success');
            setIsApprovalOpen(false);
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



    const closePaymentModal = () => { loadData(); };

    const openPaymentDetail = (installment) => {
        setSelectedPaymentDetail(installment);
        setIsPaymentDetailOpen(true);
    };

    const closePaymentDetail = () => {
        setIsPaymentDetailOpen(false);
        setSelectedPaymentDetail(null);
    };


    const anularCredito = async () => {
        if (!selectedCreditDetails) return;

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción anulará el crédito y revertirá los movimientos contables. No se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, anular crédito',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.post(`${endpoints.credits.base}${selectedCreditDetails.id_credito}/anular`);
                await Swal.fire('Anulado', 'El crédito ha sido anulado correctamente.', 'success');
                closeDetails();
                loadData();
            } catch (e) {
                Swal.fire('Error', e.message || 'No se pudo anular el crédito', 'error');
            }
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
                                        <label className="text-xs font-bold text-slate-500 block mb-2">Regla de Crédito (Plan)</label>
                                        <select
                                            value={form.id_regla}
                                            onChange={(e) => setForm({ ...form, id_regla: e.target.value })}
                                            className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors cursor-pointer bg-white"
                                        >
                                            <option value="">-- Seleccionar Regla --</option>
                                            {reglas.map(r => (
                                                <option key={r.id_regla} value={r.id_regla}>{r.nombre} ({r.tasa_porcentaje}%)</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">Monto a Prestar</label>
                                        <input 
                                            type="text" 
                                            placeholder="0.000" 
                                            value={formatPY(form.monto)} 
                                            onChange={handleMontoChange} 
                                            className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-extrabold text-slate-700 outline-none focus:border-blue-500 transition-colors" 
                                        />
                                    </div>

                                    <div className="relative">
                                        <label className="text-xs font-bold text-slate-500 block mb-2">Cantidad de Cuotas</label>
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowCuotasDropdown(!showCuotasDropdown);
                                            }}
                                            className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-extrabold text-slate-700 outline-none focus:border-blue-500 transition-colors cursor-pointer bg-white flex justify-between items-center"
                                        >
                                            <span>{form.cuotas ? `${form.cuotas} Cuotas` : 'Nro de Cuotas'}</span>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${showCuotasDropdown ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"></path></svg>
                                        </div>
                                        
                                        {showCuotasDropdown && (
                                            <div 
                                                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                                                className="absolute w-full bg-white border-2 border-slate-100 rounded-2xl mt-2 shadow-2xl z-20 max-h-[380px] overflow-y-auto custom-scroll"
                                            >
                                                {[...Array(48)].map((_, i) => (
                                                    <div 
                                                        key={i+1} 
                                                        onClick={() => {
                                                            setForm({ ...form, cuotas: i+1 });
                                                            setShowCuotasDropdown(false);
                                                        }}
                                                        className={`p-3 px-5 cursor-pointer font-bold text-sm transition-colors border-b border-slate-50 last:border-none
                                                            ${form.cuotas == i+1 ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                                                    >
                                                        {i+1} Cuotas
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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

                                <button onClick={calculate} className="w-full mt-6 p-4 bg-slate-900 text-white rounded-xl border-none font-bold cursor-pointer uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-blue-900/20">
                                    Calcular Plan de Pagos
                                </button>
                            </div>
                        </div>

                        <div className="p-6 md:px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                            <button onClick={() => setIsOpen(false)} className="px-6 py-3 bg-transparent border-none font-bold text-slate-500 hover:text-slate-700 cursor-pointer transition-colors">DESCARTAR</button>
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
                                                <th className="p-3 md:p-4 text-center">Estado</th>
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
                                                            <div className="flex flex-col items-center gap-1">
                                                                 {d.estado_cuota !== 'PAGADO' ? (
                                                                     <span className="text-[0.7rem] font-black text-amber-500 uppercase">Pendiente</span>
                                                                 ) : (
                                                                     <span className="text-[0.7rem] font-black text-emerald-500 uppercase">Completado</span>
                                                                 )}
                                                                 {d.monto_pagado > 0 && (
                                                                     <button 
                                                                         onClick={() => openPaymentDetail(d)}
                                                                         className="text-[0.6rem] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tighter cursor-pointer border-none bg-transparent p-0"
                                                                     >
                                                                         detalle_pago
                                                                     </button>
                                                                 )}
                                                             </div>
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
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            {selectedCreditDetails.estado !== 'ANULADO' && !selectedCreditDetails.detalles.some(d => parseFloat(d.monto_pagado) > 0) ? (
                                <button
                                    onClick={anularCredito}
                                    className="px-6 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-black uppercase text-red-600 cursor-pointer shadow-sm hover:bg-red-100 transition-colors"
                                >
                                    Anular Crédito
                                </button>
                            ) : (
                                <div></div> // Espaciador para mantener el justify-between si no hay botÃ³n
                            )}

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


            {/* MODAL APROBACION - PLAN DE PAGOS DETALLADO */}
            {isApprovalOpen && preview && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, backdropFilter: 'blur(10px)' }}>
                    <div className="bg-white w-[95%] max-w-[1000px] rounded-[2.5rem] overflow-hidden flex flex-col max-h-[92vh] shadow-2xl animate-in zoom-in-95 duration-300 print:max-h-none print:overflow-visible">
                        {/* CONTENIDO IMPRIMIBLE */}
                        <div className="printable-content flex-1 flex flex-col overflow-hidden bg-white">
                            {/* Header Glassmorphism */}
                            <div className="p-8 md:px-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 no-print">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    </div>
                                    <div>
                                        <h3 className="m-0 font-black text-slate-900 tracking-tight text-xl uppercase">Validación de Crédito</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Verificación final antes de aprobar</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsApprovalOpen(false)} className="bg-white border border-slate-200 text-slate-400 text-xl w-10 h-10 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-center transition-all hover:rotate-90 no-print">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="p-8 md:p-12 overflow-y-auto bg-white/50 flex-1 print:overflow-visible print:h-auto">
                            {/* Panel Superior: Información Resumida */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                                {/* Cliente */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Beneficiario</span>
                                    <h4 className="text-lg font-black text-slate-800 m-0">{selectedClientObj?.nombre} {selectedClientObj?.apellido}</h4>
                                    <p className="text-sm font-bold text-slate-400 m-0">Doc: {selectedClientObj?.documento}</p>
                                </div>
                                {/* Monto y Cuotas */}
                                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 flex flex-col justify-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto a Desembolsar</span>
                                    <div className="flex items-baseline gap-2">
                                        <h4 className="text-3xl font-black m-0">{Number(form.monto).toLocaleString()}</h4>
                                        <span className="text-xs font-bold opacity-60 uppercase">Gs.</span>
                                    </div>
                                    <p className="text-sm font-bold text-blue-400 m-0 mt-1 whitespace-nowrap">{form.cuotas} Cuotas de {Number(preview.plan[0].cuota_total).toLocaleString()} Gs.</p>
                                </div>
                                {/* Analista y Fecha */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ejecutor del Crédito</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-xs uppercase">
                                            {localStorage.getItem('username')?.charAt(0) || 'A'}
                                        </div>
                                        <span className="text-sm font-black text-slate-700">{localStorage.getItem('username') || 'Analista Actual'}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 m-0 mt-2 flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        Inicio: {form.fecha_primer_pago}
                                    </p>
                                </div>
                            </div>

                            {/* Detalle de Cuotas */}
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-4">
                                <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                                    <h5 className="m-0 font-black text-slate-500 text-xs uppercase tracking-widest">Calendario de Pagos Estimado</h5>
                                    <span className="text-xs font-black text-emerald-600">Total Devuelto: {Number(preview.monto_total).toLocaleString()} Gs.</span>
                                </div>
                                <div className="overflow-y-auto px-4 py-2">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-slate-400 font-black text-[10px] uppercase">
                                                <th className="p-4 text-left">Nro Cuota</th>
                                                <th className="p-4 text-left">F. Vencimiento</th>
                                                <th className="p-4 text-right">Capital + Int.</th>
                                                <th className="p-4 text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="font-bold text-slate-600">
                                            {preview.plan.map(p => (
                                                <tr key={p.numero_cuota} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 text-blue-600"># {p.numero_cuota}</td>
                                                    <td className="p-4">{p.fecha_vencimiento}</td>
                                                    <td className="p-4 text-right text-slate-900 font-black">{Number(p.cuota_total).toLocaleString()} <small className="text-slate-400">Gs.</small></td>
                                                    <td className="p-4 text-center">
                                                        <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-tighter border border-amber-100 shadow-sm shadow-amber-50 no-print">PROYECTADO</span>
                                                        <span className="hidden print:inline text-[10px] text-slate-400 font-black uppercase">Pendiente</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* FIRMA - SOLO IMPRESION */}
                            <div className="hidden print:flex mt-20 justify-around border-t border-slate-100 pt-10">
                                <div className="text-center border-t-2 border-slate-900 pt-4 w-60">
                                    <p className="m-0 font-black text-xs uppercase tracking-widest">Firma del Cliente</p>
                                    <p className="m-0 text-[10px] text-slate-400 font-bold uppercase mt-1">{selectedClientObj?.nombre} {selectedClientObj?.apellido}</p>
                                </div>
                                <div className="text-center border-t-2 border-slate-900 pt-4 w-60">
                                    <p className="m-0 font-black text-xs uppercase tracking-widest">Autorizado por</p>
                                    <p className="m-0 text-[10px] text-slate-400 font-bold uppercase mt-1">{localStorage.getItem('username') || 'Analista'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer con acciones finales */}
                        <div className="p-8 md:px-12 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></span>
                                <p className="text-xs text-slate-400 font-bold m-0 uppercase tracking-tighter">Listo para aprobación. Confirme todos los campos.</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsApprovalOpen(false)}
                                    className="flex-1 md:flex-initial px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                    Corregir Datos
                                </button>
                                <button
                                    onClick={save}
                                    className="flex-1 md:flex-initial px-10 py-4 bg-emerald-600 text-white rounded-2xl border-none font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 cursor-pointer active:scale-95 hover:bg-emerald-700"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                    APROBAR CRÉDITO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL DETALLES DE PAGO POR CUOTA */}
            <Modal
                isOpen={isPaymentDetailOpen}
                onRequestClose={closePaymentDetail}
                style={{
                    overlay: { backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 150, backdropFilter: 'blur(8px)' },
                    content: {
                        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
                        transform: 'translate(-50%, -50%)',
                        padding: '0', border: 'none', borderRadius: '2rem',
                        width: '90%', maxWidth: '600px', backgroundColor: '#fff',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }
                }}
            >
                <div className="flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest m-0">Detalles de Pago</h3>
                            <p className="text-[0.65rem] text-slate-400 font-bold uppercase m-0 mt-1">Cuota #{selectedPaymentDetail?.numero_cuota}</p>
                        </div>
                        <button onClick={closePaymentDetail} className="text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[0.6rem]">
                                    <tr>
                                        <th className="p-3">Fecha de Pago</th>
                                        <th className="p-3 text-right">Monto</th>
                                        <th className="p-3">Forma</th>
                                        <th className="p-3">Referencia</th>
                                    </tr>
                                </thead>
                                <tbody className="font-medium text-[0.75rem]">
                                    {selectedPaymentDetail?.pagos?.map(p => (
                                        <tr key={p.id_pago} className="border-t border-slate-100 hover:bg-slate-50">
                                            <td className="p-3 text-slate-600">
                                                {new Date(p.fecha_pago).toLocaleString('es-ES', { 
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="p-3 text-right font-black text-emerald-600">{Number(p.monto_pagado).toLocaleString()}</td>
                                            <td className="p-3">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[0.6rem] font-black uppercase">
                                                    {p.forma_pago}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-400 font-mono text-[0.65rem] uppercase">{p.comprobante_nro || 'S/N'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={closePaymentDetail}
                            className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[0.65rem] font-black uppercase text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-sm shadow-slate-200/50"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}

export default CreditManagement;
