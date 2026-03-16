import os

path = r'd:\PROYECTOS\CreditoSquid\CRD-frontend\src\components\CreditManagement.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The modal JSX code
modal_jsx = """
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
"""

# Find the last </div> before the return ends
# Looking at the file, it's:
#         </div>
#     );
# }

search_pattern = "\n        </div>\n    );\n}"
if search_pattern in content:
    new_content = content.replace(search_pattern, modal_jsx + "\n        </div>\n    );\n}")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    # Try with single newline for robustness
    search_pattern = "\n        </div>\n    );\n}"
    # Wait, maybe indentation is different. Let's try to find the last </div>
    idx = content.rfind("</div>")
    # Actually, let's just use the end of the return block
    if idx != -1:
        new_content = content[:idx] + modal_jsx + content[idx:]
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Success by index")
    else:
        print("Failure")
