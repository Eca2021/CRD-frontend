import React, { useState, useEffect } from 'react';
import { api, endpoints } from '../config/api';
import Swal from 'sweetalert2';

function PaymentAudit() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Paginación y Búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await api.get(endpoints.payments.auditoria);
            setAuditLogs(data);
        } catch (e) {
            Swal.fire('Error', 'No se pudieron cargar los registros de auditoría', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREACION': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'ANULACION': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'MODIFICACION': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    // Lógica de Filtrado y Paginación
    const filteredLogs = auditLogs.filter(log => {
        const q = searchTerm.toLowerCase();
        return (
            (log.usuario_nombre || '').toLowerCase().includes(q) ||
            (log.cliente_nombre || '').toLowerCase().includes(q) ||
            (log.cliente_ci || '').toLowerCase().includes(q) ||
            (log.observacion || '').toLowerCase().includes(q) ||
            (log.id_pago && String(log.id_pago).includes(q))
        );
    });

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRecords = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const onSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset a primera página al buscar
    };

    const onItemCountChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 lg:p-12 font-sans transition-all">
            {/* Header with Glassmorphism effect */}
            <div className="max-w-7xl mx-auto mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 animate-pulse-subtle">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Historial de Pagos</h1>
                            <p className="text-slate-500 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                                Auditoría técnica y operativa en tiempo real
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Buscador de Cliente */}
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Buscar por cliente, detalle o ID..."
                                className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-slate-700 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all w-[320px] shadow-sm"
                                value={searchTerm}
                                onChange={onSearchChange}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Registros:</span>
                            <select 
                                className="bg-transparent border-none text-slate-700 font-black focus:ring-0 outline-none cursor-pointer"
                                value={itemsPerPage}
                                onChange={onItemCountChange}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <button 
                            onClick={fetchLogs}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refrescar
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-widest text-[10px] font-black text-slate-400">
                                    <th className="px-8 py-6 text-left">Cliente / Deudor</th>
                                    <th className="px-8 py-6 text-left">Concepto / Detalle</th>
                                    <th className="px-8 py-6 text-left">Responsable</th>
                                    <th className="px-8 py-6 text-left">Fecha y Hora</th>
                                    <th className="px-8 py-6 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="px-8 py-6"><div className="h-8 bg-slate-100 rounded-xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : currentRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-full mb-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-slate-400 font-bold text-lg">No se encontraron pagos con ese criterio</p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentRecords.map((log) => (
                                        <tr key={log.id_audit} className="hover:bg-indigo-50/20 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 leading-none">{log.cliente_nombre}</span>
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest">CI: {log.cliente_ci}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="max-w-xs">
                                                    <p className="font-bold text-slate-600 truncate text-xs" title={log.observacion}>
                                                        {log.observacion}
                                                    </p>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID Pago: #{log.id_pago}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-black text-[10px] border border-slate-200">
                                                        {log.usuario_nombre?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-bold text-slate-600 text-xs">{log.usuario_nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{new Date(log.fecha_accion).toLocaleDateString()}</span>
                                                    <span className="text-[10px] font-black text-slate-400">{new Date(log.fecha_accion).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="font-black text-indigo-600 text-xl tracking-tighter">
                                                    {log.monto_registrado ? Number(log.monto_registrado).toLocaleString() : '---'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-50/80 px-8 py-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-slate-500 font-bold text-sm">
                            Mostrando <span className="text-slate-900">{indexOfFirstItem + 1}</span> a <span className="text-slate-900">{Math.min(indexOfLastItem, filteredLogs.length)}</span> de <span className="text-slate-900">{filteredLogs.length}</span> registros
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            
                            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-indigo-600 font-black text-sm shadow-sm">
                                Página {currentPage} de {totalPages || 1}
                            </div>

                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}} />
        </div>
    );
}

export default PaymentAudit;
