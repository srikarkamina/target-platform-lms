import React from "react";
import { Award, ShieldCheck, ShieldAlert, Layout } from "lucide-react";

interface CertificateStatsProps {
  total: number;
  active: number;
  revoked: number;
  templatesCount: number;
}

export default function CertificateStats({ total, active, revoked, templatesCount }: CertificateStatsProps) {
  const cards = [
    {
      name: "Total Issued",
      value: total,
      icon: Award,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      description: "Lifetime certificates generated",
    },
    {
      name: "Active",
      value: active,
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      description: "Valid verification records",
    },
    {
      name: "Revoked",
      value: revoked,
      icon: ShieldAlert,
      color: "bg-rose-50 text-rose-600 border-rose-100",
      description: "Invalidated certificates",
    },
    {
      name: "Templates",
      value: templatesCount,
      icon: Layout,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      description: "Configured layouts",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.name}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 transition-all duration-200 hover:shadow-sm"
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${card.color}`}>
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.name}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">{card.value}</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-none">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
