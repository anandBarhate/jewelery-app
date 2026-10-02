// "use client";
// import React, { useState } from "react";
// import Link from "next/link";
// import { Shield, Package, CheckCircle, DollarSign } from "lucide-react";

// export default function PimLayout({ children }) {
//   const [activeRole, setActiveRole] = useState("APPROVER");

//   return (
//     <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
//       <aside className="w-64 border-r border-slate-800 p-6 flex flex-col justify-between">
//         <div>
//           <div className="flex items-center gap-2 mb-8 text-amber-400 font-bold text-lg">
//             <Shield className="w-6 h-6" />
//             <span>JEWELRY PIM v0.2</span>
//           </div>

//           <nav className="space-y-2">
//             <Link href="/admin/catalog" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 text-sm font-medium">
//               <Package className="w-4 h-4" /> Catalog Management
//             </Link>
//             <Link href="/admin/approvals" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 text-sm font-medium">
//               <CheckCircle className="w-4 h-4" /> Approval Queue
//             </Link>
//             <Link href="/admin/pricing" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 text-sm font-medium">
//               <DollarSign className="w-4 h-4" /> Pricing & Rates
//             </Link>
//           </nav>
//         </div>

//         <div className="border-t border-slate-800 pt-4">
//           <label className="text-xs text-slate-400 uppercase font-semibold block mb-2">Active Role Context</label>
//           <select 
//             value={activeRole} 
//             onChange={(e) => setActiveRole(e.target.value)}
//             className="w-full bg-slate-800 border border-slate-700 text-sm rounded p-2 text-white"
//           >
//             <option value="CATALOGER">Sarah (Cataloger)</option>
//             <option value="APPROVER">Marcus (Approver)</option>
//             <option value="ADMIN">Alex (Admin)</option>
//           </select>
//         </div>
//       </aside>

//       <main className="flex-1 p-8 bg-slate-950 overflow-y-auto">
//         {children}
//       </main>
//     </div>
//   );
// }


"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Shield, Package, CheckCircle, DollarSign } from "lucide-react";

export default function PimLayout({ children }) {
  const [activeRole, setActiveRole] = useState("APPROVER");
  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      <aside className="w-64 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8 text-amber-400 font-bold text-lg">
            <Shield className="w-6 h-6" />
            <span>JEWELRY PIM v0.2</span>
          </div>
          <nav className="space-y-2">
            <Link href="/admin/catalog" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 text-sm font-medium">
              <Package className="w-4 h-4" /> Catalog Management
            </Link>
            <Link href="/admin/approvals" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Approval Queue
            </Link>
            <Link href="/admin/pricing" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 text-sm font-medium">
              <DollarSign className="w-4 h-4" /> Pricing & Rates
            </Link>
          </nav>
        </div>
        <div className="border-t border-slate-800 pt-4">
          <label className="text-xs text-slate-400 uppercase font-semibold block mb-2">Active Role Context</label>
          <select value={activeRole} onChange={(e) => setActiveRole(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-sm rounded p-2 text-white">
            <option value="CATALOGER">Sarah (Cataloger)</option>
            <option value="APPROVER">Marcus (Approver)</option>
            <option value="ADMIN">Alex (Admin)</option>
          </select>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-slate-950 overflow-y-auto">{children}</main>
    </div>
  );
}