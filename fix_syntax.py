import os

path = r'd:\PROYECTOS\CreditoSquid\CRD-frontend\src\components\CreditManagement.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 587 is index 586
# But let's find it by content to be safe
for i, line in enumerate(lines):
    if '<div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">' in line:
        # Check if the previous line is empty or just whitespace
        if i > 0 and lines[i-1].strip() == "":
            print(f"Found at line {i+1}")
            # Replace empty line with closing div
            lines[i-1] = "                        </div>\n"
            break

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
