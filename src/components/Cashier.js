import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { api, endpoints } from '../config/api';

function Cashier() {
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientCredits, setClientCredits] = useState([]);
    const [formasPago, setFormasPago] = useState([]);

    // Payment Modal State
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
        if (e.target.value === '') {
            setSelectedClient(null);
            setClientCredits([]);
        }
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
        search && !selectedClient && (
            c.nombre.toLowerCase().includes(search.toLowerCase()) ||
            c.apellido.toLowerCase().includes(search.toLowerCase()) ||
            c.documento.includes(search)
        )
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 lg:p-12 font-sans text-slate-900 transition-all">

            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style={{ width: '1.5rem', height: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Caja y Tesorería</h1>
                        <p className="text-slate-500 font-medium">Gestión de Cobros y Movimientos</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-8">

                {/* Search Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 relative z-40">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                        Buscar Cliente
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg style={{ width: '1.25rem', height: '1.25rem' }} className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearch}
                            className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-lg shadow-inner"
                            placeholder="Nombre, Apellido o Documento..."
                            autoFocus
                        />
                        {/* Dropdown Results */}
                        {search && !selectedClient && filteredClients.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <ul className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                                    {filteredClients.map(c => (
                                        <li
                                            key={c.id_cliente}
                                            onClick={() => selectClient(c)}
                                            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-4 group"
                                        >
                                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                {c.nombre.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{c.nombre} {c.apellido}</p>
                                                <p className="text-xs font-medium text-slate-400">CI: {c.documento}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Client & Credits */}
                {selectedClient && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                                Créditos Activos
                            </h2>
                            <button onClick={() => { setSelectedClient(null); setSearch(''); }} className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">
                                Limpiar Selección
                            </button>
                        </div>

                        {clientCredits.filter(c => c.estado === 'PENDIENTE').length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-sm">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '2rem', height: '2rem' }} className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-1">¡Al día!</h3>
                                <p className="text-slate-500">Este cliente no tiene créditos pendientes de pago.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {clientCredits.filter(c => c.estado === 'PENDIENTE').map(cred => (
                                    <div key={cred.id_credito} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-black text-slate-700 text-lg">Crédito #{cred.id_credito}</h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cred.tasa_nombre}</p>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${cred.estado === 'PAGADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {cred.estado}
                                            </span>
                                        </div>

                                        <div className="p-6">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm item-table">
                                                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left rounded-l-lg">Cuota</th>
                                                            <th className="px-4 py-3 text-left">Vencimiento</th>
                                                            <th className="px-4 py-3 text-right">Monto</th>
                                                            <th className="px-4 py-3 text-right">Pagado</th>
                                                            <th className="px-4 py-3 text-center">Estado</th>
                                                            <th className="px-4 py-3 text-center rounded-r-lg">Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {cred.detalles.map(d => (
                                                            <tr key={d.id_detalle} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-4 py-4 font-bold text-slate-500">#{d.numero_cuota}</td>
                                                                <td className="px-4 py-4 font-medium text-slate-600">{d.fecha_vencimiento}</td>
                                                                <td className="px-4 py-4 text-right font-black text-slate-700">{Number(d.monto_cuota).toLocaleString()}</td>
                                                                <td className="px-4 py-4 text-right font-bold text-emerald-600">{Number(d.monto_pagado || 0).toLocaleString()}</td>
                                                                <td className="px-4 py-4 text-center">
                                                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${d.estado_cuota === 'PAGADO' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                                                        }`}>
                                                                        {d.estado_cuota}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-4 text-center">
                                                                    {d.estado_cuota !== 'PAGADO' ? (
                                                                        <button
                                                                            onClick={() => openPayment(d)}
                                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-md shadow-indigo-100 transition-all active:scale-95"
                                                                        >
                                                                            Pagar
                                                                        </button>
                                                                    ) : (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.25rem', height: '1.25rem' }} className="h-5 w-5 text-emerald-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL PAGO (Inline Style - Professional Verification) */}
            {isPaymentOpen && selectedCuota && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, backdropFilter: 'blur(8px)' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '450px', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                        <div style={{ padding: '2.5rem', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: 'white', textAlign: 'center', position: 'relative' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0 }}>Registrar Pago</h3>
                            <p style={{ color: '#e0e7ff', fontSize: '0.75rem', fontWeight: '600', marginTop: '0.25rem' }}>CUOTA NRO #{selectedCuota.numero_cuota}</p>
                            <div style={{
                                position: 'absolute', bottom: '-1.5rem', left: '50%', transform: 'translateX(-50%)',
                                backgroundColor: 'white', color: '#4f46e5', width: '3rem', height: '3rem', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '4px solid white'
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style={{ width: '1.5rem', height: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                        </div>
                        <form onSubmit={savePayment} style={{ padding: '2.5rem', paddingTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'white' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '0.25rem' }}>Monto Pagado</label>
                                <input
                                    name="monto_pagado"
                                    type="number"
                                    step="0.01"
                                    value={paymentForm.monto_pagado}
                                    onChange={onPaymentChange}
                                    required
                                    style={{
                                        width: '100%', padding: '1rem', backgroundColor: '#f8fafc', border: '2px solid #f1f5f9', borderRadius: '1rem',
                                        outline: 'none', fontWeight: '900', fontSize: '1.5rem', color: '#334155', textAlign: 'center', transition: 'border-color 0.2s'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '0.25rem' }}>Forma de Pago</label>
                                <select
                                    name="id_forma_pago"
                                    value={paymentForm.id_forma_pago}
                                    onChange={onPaymentChange}
                                    required
                                    style={{
                                        width: '100%', padding: '1rem', backgroundColor: '#f8fafc', border: '2px solid #f1f5f9', borderRadius: '1rem',
                                        outline: 'none', fontWeight: '700', color: '#475569', appearance: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Seleccione...</option>
                                    {formasPago.map(f => (<option key={f.id_forma_pago} value={f.id_forma_pago}>{f.nombre}</option>))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '0.25rem' }}>Nro Comprobante</label>
                                <input
                                    name="comprobante_nro"
                                    type="text"
                                    placeholder="Ej: 001-002-12345"
                                    value={paymentForm.comprobante_nro}
                                    onChange={onPaymentChange}
                                    style={{
                                        width: '100%', padding: '1rem', backgroundColor: '#f8fafc', border: '2px solid #f1f5f9', borderRadius: '1rem',
                                        outline: 'none', fontWeight: '600', color: '#475569'
                                    }}
                                />
                            </div>
                            <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    type="submit"
                                    style={{
                                        width: '100%', backgroundColor: '#059669', color: 'white', padding: '1rem', borderRadius: '1rem',
                                        fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem',
                                        boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.2)', border: 'none', cursor: 'pointer'
                                    }}
                                >
                                    Confirmar Pago
                                </button>
                                <button
                                    type="button"
                                    onClick={closePaymentModal}
                                    style={{
                                        width: '100%', padding: '1rem', color: '#94a3b8', fontWeight: '800', border: 'none',
                                        background: 'transparent', cursor: 'pointer', transition: 'color 0.2s'
                                    }}
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

export default Cashier;
