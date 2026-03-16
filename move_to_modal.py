import os
import re

path = r'd:\PROYECTOS\CreditoSquid\CRD-frontend\src\components\CreditManagement.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the Historial de Pagos at the bottom
# We look for the comment and the div that follows
bottom_history_pattern = re.compile(r'\{\/\* Historial de Pagos \*\/ \}.*?<tbody.*?>.*?\{.*?\(\).*?=>.*?\{.*?\}\).*?\}.*?<\/tbody>.*?<\/table>.*?<\/div>.*?<\/div>', re.DOTALL)
# Actually, let's be more specific based on the known structure
bottom_history_pattern_v2 = re.compile(r'\{\/\* Historial de Pagos \*\/ \}.*?<h4.*?>Historial de Pagos<\/h4>.*?<\/div>\s*<\/div>\s*<\/div>', re.DOTALL)

# Let's try string replacement for the footer first (it's simpler)
search_footer = """{/* Historial de Pagos */}
                             <div className="mt-8">"""
# We want to keep the closing div of the main content area.
# Looking at line 628: it's a </div> for the Historial de Pagos, then another </div>?
# Let's re-examine the lines from view_file.

# 2. Add the detall_pago button
# Target: {d.estado_cuota !== 'PAGADO' ? ... }
old_status_block = """{d.estado_cuota !== 'PAGADO' ? (
                                                                 <span className="text-[0.7rem] font-black text-amber-500 uppercase">Pendiente</span>
                                                             ) : (
                                                                 <span className="text-[0.7rem] font-black text-emerald-500 uppercase">Completado</span>
                                                             )}"""

new_status_block = """<div className="flex flex-col items-center gap-1">
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
                                                             </div>"""

# Robust replacement for the status block
content = content.replace(old_status_block, new_status_block)

# Robust removal of the bottom section
# We'll find the "Historial de Pagos" h4 and remove its container.
# It starts at { /* Historial de Pagos */ } and ends before the modal footer.

start_marker = "{/* Historial de Pagos */}"
end_marker = '<div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">'

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    content = content[:start_idx] + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
