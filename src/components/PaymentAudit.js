import React, { useState, useEffect } from 'react';
import { api, endpoints } from '../config/api';
import Swal from 'sweetalert2';

function PaymentAudit() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    <button 
                        onClick={fetchLogs}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all active:scale-95 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar Logs
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Acción</th>
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                                    <th className="px-8 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Monto</th>
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Detalle</th>
                                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">IP Origen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="px-8 py-6"><div className="h-8 bg-slate-100 rounded-xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : auditLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center">
                                            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-full mb-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                            </div>
                                            <p className="text-slate-400 font-bold text-lg">No se encontraron registros de auditoría</p>
                                        </td>
                                    </tr>
                                ) : (
                                    auditLogs.map((log) => (
                                        <tr key={log.id_audit} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-tighter ${getActionColor(log.accion)} shadow-sm`}>
                                                    {log.accion}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        {log.usuario_nombre?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-bold text-slate-700">{log.usuario_nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{new Date(log.fecha_accion).toLocaleDateString()}</span>
                                                    <span className="text-[10px] font-black text-slate-400">{new Date(log.fecha_accion).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="font-black text-slate-800 text-lg">
                                                    {log.monto_registrado ? Number(log.monto_registrado).toLocaleString() : '---'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="max-w-xs">
                                                    <p className="font-bold text-slate-600 truncate" title={log.observacion}>
                                                        {log.observacion}
                                                    </p>
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase">ID Pago: #{log.id_pago}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                    {log.direccion_ip || '127.0.0.1'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
