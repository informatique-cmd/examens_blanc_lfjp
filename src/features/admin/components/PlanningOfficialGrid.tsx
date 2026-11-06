import React from "react";
import { Printer, Calendar, Shield, Users, School, Clock, FileSpreadsheet, Download } from "lucide-react";
import { OFFICIAL_LFJP_PLANNING_SESSIONS, type OfficialPlanningSession } from "../../../shared/data/official-lfjp-planning";
import type { CmsSurveillance, CmsTeacher } from "../../../shared/services/cms-store";

interface PlanningOfficialGridProps {
  surveillances?: CmsSurveillance[];
  teachers?: CmsTeacher[];
  onShowNotification?: (msg: string) => void;
}

export default function PlanningOfficialGrid({
  surveillances = [],
  teachers = [],
  onShowNotification,
}: PlanningOfficialGridProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-[#002060]">
              Document Officiel Direction
            </span>
            <span className="text-xs text-slate-500">
              Format homologué Google Sheets / PDF LFJP
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#002060]" />
            <span>Planning de surveillance des épreuves – 8 au 10 décembre</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Tableau complet avec découpage des créneaux, relais de surveillance (scindés en 1h ou 2h), salles tiers-temps et surveillants de renfort.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-amber-300" />
            <span>Imprimer la Grille (A4 Paysage)</span>
          </button>
        </div>
      </div>

      {/* Official LFJP Schedule Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-8 overflow-x-auto print:p-0 print:border-none print:shadow-none">
        {/* Document Header (Institutional French LFJP) */}
        <div className="text-center space-y-1 border-b border-slate-200 pb-4">
          <div className="flex items-center justify-center gap-3">
            <img
              src="/assets/aistudio/logo-lfjp_62451311.png"
              alt="LFJP Logo"
              className="h-9 w-9 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-lfjp.png";
              }}
            />
            <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
              Planning de surveillance des épreuves – 8 au 10 décembre
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Lycée Français Jacques Prévert de Saly • Session Officielle 2026-2027
          </p>
        </div>

        {/* Sessions Table */}
        <div className="space-y-6">
          {OFFICIAL_LFJP_PLANNING_SESSIONS.map((session, idx) => (
            <div
              key={session.id}
              className="rounded-xl border border-slate-300 overflow-hidden shadow-2xs break-inside-avoid print:shadow-none print:border-slate-400"
            >
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0b2545] text-white font-bold text-xs">
                    <th className="p-2.5 border border-[#1b3d68] w-24">Jour</th>
                    <th className="p-2.5 border border-[#1b3d68] w-28">Créneau</th>
                    {session.rooms.map((r) => (
                      <th
                        key={r.roomName}
                        className={`p-2.5 border border-[#1b3d68] ${
                          r.isTiersTemps ? "bg-[#1b3d68] text-amber-200" : ""
                        }`}
                      >
                        {r.roomName}
                      </th>
                    ))}
                    <th className="p-2.5 border border-[#1b3d68] w-48">Renfort</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row: Surveillants */}
                  <tr>
                    <td
                      rowSpan={2}
                      className="p-3 font-black text-slate-900 border border-slate-300 bg-slate-50 align-middle"
                    >
                      <span className="block text-sm">{session.jour}</span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-slate-50 align-middle">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-200 font-bold">
                        {session.creneau}
                      </span>
                    </td>

                    {/* Room surveillance cells */}
                    {session.rooms.map((r) => (
                      <td
                        key={r.roomName}
                        className="p-2 border border-slate-300 align-top bg-white"
                      >
                        <div className="flex flex-col gap-1.5 h-full justify-center">
                          {r.subSlots.map((sub, sIdx) => {
                            // Assign realistic colors matching the PDF
                            const isTT = r.isTiersTemps;
                            let colorClasses = "bg-sky-100 text-sky-950 border-sky-300";

                            if (isTT) {
                              colorClasses = "bg-rose-100/90 text-rose-950 border-rose-300";
                            } else if (sub.timeSlot.includes("8h00 - 10h00") || sub.timeSlot.includes("13h00 - 14h00") || sub.timeSlot.includes("14h00 - 15h00")) {
                              colorClasses = "bg-amber-100/90 text-amber-950 border-amber-300";
                            } else if (sub.timeSlot.includes("10h00 - 11h00") || sub.timeSlot.includes("11h00 - 12h00") || sub.timeSlot.includes("15h00 - 16h00")) {
                              colorClasses = "bg-indigo-100 text-indigo-950 border-indigo-300";
                            } else if (sub.timeSlot.includes("16h00 - 18h00")) {
                              colorClasses = "bg-teal-100 text-teal-950 border-teal-300";
                            }

                            return (
                              <div
                                key={sIdx}
                                className={`p-1.5 rounded-lg border text-xs font-semibold shadow-2xs space-y-0.5 ${colorClasses}`}
                              >
                                <div className="font-bold text-xs">{sub.teacherName}</div>
                                <div className="font-mono text-[10px] opacity-80">{sub.timeSlot}</div>
                                {sub.note && (
                                  <div className="text-[9px] italic opacity-90">{sub.note}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    ))}

                    {/* Renfort Cell */}
                    <td
                      rowSpan={2}
                      className="p-3 border border-slate-300 bg-slate-50 align-middle text-xs font-bold text-slate-800"
                    >
                      {session.renfort ? (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-center">
                          <Shield className="h-3.5 w-3.5 mx-auto text-emerald-600 mb-1" />
                          <span>{session.renfort}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>
                  </tr>

                  {/* Row: Épreuve / Disciplines */}
                  <tr className="bg-slate-100/70">
                    <td className="p-2 border border-slate-300 font-bold text-slate-600 text-[11px] uppercase">
                      Épreuve
                    </td>
                    {session.rooms.map((r) => (
                      <td
                        key={r.roomName}
                        className="p-2 border border-slate-300 font-black text-slate-800 text-xs bg-slate-50"
                      >
                        {r.subject || session.subjectTitle}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Footer Notes & Signatures */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start justify-between gap-4 text-xs text-slate-600 print:pt-4">
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Directives impératives pour les surveillants :</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
              <li>Présence requise au secrétariat 20 minutes avant l'appel pour retirer la pochette d'examen.</li>
              <li>Émargement individuel obligatoire de chaque candidat sur la feuille certifiée.</li>
              <li>Pour les relais de surveillance (créneaux scindés), la passation s'effectue directement en salle.</li>
              <li>Les surveillants de renfort veillent aux couloirs et à l'acheminement des copies à la loge.</li>
            </ul>
          </div>

          <div className="text-right sm:self-end space-y-1 shrink-0">
            <p className="text-[11px] text-slate-500">Pour le Lycée Français Jacques Prévert,</p>
            <p className="font-bold text-slate-900 text-xs">Le / La Proviseur(e)</p>
            <div className="h-10 border-b border-dashed border-slate-300 w-36 ml-auto mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
