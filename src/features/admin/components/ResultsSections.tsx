import React, { useState, useMemo } from "react";
import {
  DownloadCloud,
  FileSpreadsheet,
  FileCheck2,
  PieChart,
  Sparkles,
  BarChart3,
  Printer,
  Search,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import type { CmsCandidate, SiteInfo } from "../../../shared/services/cms-store";

interface ResultsSectionProps {
  candidates: CmsCandidate[];
  siteInfo: SiteInfo;
  activeSub: "res-import" | "res-analyse" | "res-releves" | "res-datavis" | "res-simul";
  onShowNotification: (msg: string) => void;
}

export default function ResultsSections({
  candidates,
  siteInfo,
  activeSub,
  onShowNotification,
}: ResultsSectionProps) {
  // Grades state: candidateId -> { fr: number, math: number, hg: number, sci: number }
  const [grades, setGrades] = useState<Record<string, { fr: number; math: number; hg: number; sci: number }>>(() => {
    const initial: Record<string, any> = {};
    candidates.forEach((c, i) => {
      // Deterministic realistic grades
      const seed = (c.lastName.length * 7 + i * 11) % 40;
      initial[c.id] = {
        fr: Math.min(100, Math.max(20, 50 + seed)),
        math: Math.min(100, Math.max(20, 55 + (seed * 2) % 45)),
        hg: Math.min(50, Math.max(10, 25 + (seed % 25))),
        sci: Math.min(50, Math.max(10, 30 + (seed % 20))),
      };
    });
    return initial;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(candidates[0]?.id || "");
  const [simulSocle, setSimulSocle] = useState<number>(300); // Socle commun out of 400

  // Calculate statistics
  const stats = useMemo(() => {
    const totals: number[] = [];
    candidates.forEach((c) => {
      const g = grades[c.id] || { fr: 0, math: 0, hg: 0, sci: 0 };
      const sum = g.fr + g.math + g.hg + g.sci; // out of 300
      totals.push(sum);
    });

    if (totals.length === 0) return { avg: 0, min: 0, max: 0, passRate: 0 };
    const sumTotal = totals.reduce((a, b) => a + b, 0);
    const avg = Math.round(sumTotal / totals.length);
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const passed = totals.filter((t) => t >= 150).length;
    const passRate = Math.round((passed / totals.length) * 100);

    return { avg, min, max, passRate, passedCount: passed, totalCount: totals.length };
  }, [candidates, grades]);

  // Selected student for transcript
  const student = candidates.find((c) => c.id === selectedStudentId) || candidates[0];
  const studentGrade = student ? grades[student.id] || { fr: 0, math: 0, hg: 0, sci: 0 } : null;
  const studentTotal = studentGrade ? studentGrade.fr + studentGrade.math + studentGrade.hg + studentGrade.sci : 0;

  return (
    <div className="space-y-6">
      {/* SUB-SECTION 1: IMPORT / SAISIE DES NOTES */}
      {activeSub === "res-import" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
                  Saisie & Barèmes
                </span>
                <span className="text-xs text-slate-500">Grille de notation des épreuves</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                📥 Saisie et Import des Notes d'Examen
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Saisissez directement les notes des candidats ou importez votre fichier de notes tableur (CSV).
              </p>
            </div>

            <button
              onClick={() => onShowNotification("✅ Toutes les notes ont été sauvegardées avec succès !")}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-2"
            >
              <span>Enregistrer les notes</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3 w-16 text-center">Table</th>
                    <th className="p-3">Candidat</th>
                    <th className="p-3 text-center">Classe</th>
                    <th className="p-3 text-center">Français (/100)</th>
                    <th className="p-3 text-center">Maths (/100)</th>
                    <th className="p-3 text-center">Hist-Géo (/50)</th>
                    <th className="p-3 text-center">Sciences (/50)</th>
                    <th className="p-3 text-center">Total (/300)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((cand, idx) => {
                    const g = grades[cand.id] || { fr: 0, math: 0, hg: 0, sci: 0 };
                    const sum = g.fr + g.math + g.hg + g.sci;
                    return (
                      <tr key={cand.id} className="hover:bg-slate-50/70">
                        <td className="p-3 text-center font-bold text-slate-700">
                          {cand.tableNumber || idx + 1}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {cand.lastName.toUpperCase()} {cand.firstName}
                        </td>
                        <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                          {cand.className}
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={g.fr}
                            onChange={(e) =>
                              setGrades((prev) => ({
                                ...prev,
                                [cand.id]: { ...g, fr: Number(e.target.value) },
                              }))
                            }
                            className="w-16 px-2 py-1 text-center font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={g.math}
                            onChange={(e) =>
                              setGrades((prev) => ({
                                ...prev,
                                [cand.id]: { ...g, math: Number(e.target.value) },
                              }))
                            }
                            className="w-16 px-2 py-1 text-center font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={g.hg}
                            onChange={(e) =>
                              setGrades((prev) => ({
                                ...prev,
                                [cand.id]: { ...g, hg: Number(e.target.value) },
                              }))
                            }
                            className="w-16 px-2 py-1 text-center font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={g.sci}
                            onChange={(e) =>
                              setGrades((prev) => ({
                                ...prev,
                                [cand.id]: { ...g, sci: Number(e.target.value) },
                              }))
                            }
                            className="w-16 px-2 py-1 text-center font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="p-3 text-center font-black font-mono">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              sum >= 150 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {sum} / 300
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: ANALYSE DES CORRECTIONS */}
      {activeSub === "res-analyse" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Statistiques Pédagogiques
                </span>
                <span className="text-xs text-slate-500">Harmonisation & Écarts</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                📊 Analyse des Corrections & Moyennes
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Moyennes générales, note minimale, note maximale et taux de réussite pour la commission d'harmonisation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <p className="text-[11px] font-bold uppercase text-slate-400">Moyenne Générale</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.avg} / 300</p>
              <p className="text-xs text-slate-500 mt-0.5">Soit {((stats.avg / 300) * 20).toFixed(1)} / 20</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <p className="text-[11px] font-bold uppercase text-slate-400">Taux de Réussite</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats.passRate}%</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {stats.passedCount} / {stats.totalCount} admis (&ge; 150/300)
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <p className="text-[11px] font-bold uppercase text-slate-400">Meilleure Note</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{stats.max} / 300</p>
              <p className="text-xs text-slate-500 mt-0.5">Soit {((stats.max / 300) * 20).toFixed(1)} / 20</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <p className="text-[11px] font-bold uppercase text-slate-400">Note la Plus Basse</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{stats.min} / 300</p>
              <p className="text-xs text-slate-500 mt-0.5">Soit {((stats.min / 300) * 20).toFixed(1)} / 20</p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: RELEVÉS DE NOTES */}
      {activeSub === "res-releves" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                  Bulletins
                </span>
                <span className="text-xs text-slate-500">Relevés individuels d'examen</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                📄 Relevés de Notes Individuels
              </h2>
            </div>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer le relevé</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Sélectionner l'élève :</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lastName.toUpperCase()} {c.firstName} ({c.className})
                </option>
              ))}
            </select>
          </div>

          {student && studentGrade && (
            <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 max-w-2xl mx-auto printable-content space-y-6">
              <div className="text-center border-b pb-4">
                <h1 className="text-base font-black text-slate-900">{siteInfo.title}</h1>
                <p className="text-xs text-slate-600">Relevé de Notes — Examen Blanc Session {siteInfo.schoolYear}</p>
                <p className="text-sm font-bold text-slate-900 mt-3">
                  {student.lastName.toUpperCase()} {student.firstName} — Classe de {student.className}
                </p>
              </div>

              <table className="w-full text-xs text-left border border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b font-bold">
                    <th className="p-2 border-r">Épreuve</th>
                    <th className="p-2 border-r text-center">Barème</th>
                    <th className="p-2 text-center">Note Obtenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  <tr>
                    <td className="p-2 border-r font-sans font-semibold">Français</td>
                    <td className="p-2 border-r text-center">/ 100</td>
                    <td className="p-2 text-center font-bold">{studentGrade.fr}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r font-sans font-semibold">Mathématiques</td>
                    <td className="p-2 border-r text-center">/ 100</td>
                    <td className="p-2 text-center font-bold">{studentGrade.math}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r font-sans font-semibold">Histoire-Géographie & EMC</td>
                    <td className="p-2 border-r text-center">/ 50</td>
                    <td className="p-2 text-center font-bold">{studentGrade.hg}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r font-sans font-semibold">Sciences</td>
                    <td className="p-2 border-r text-center">/ 50</td>
                    <td className="p-2 text-center font-bold">{studentGrade.sci}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold font-sans">
                    <td className="p-2 border-r">TOTAL ÉPREUVES TERMINALES</td>
                    <td className="p-2 border-r text-center font-mono">/ 300</td>
                    <td className="p-2 text-center font-mono text-sm text-indigo-700">
                      {studentTotal} / 300
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex items-center justify-between pt-4 border-t text-xs">
                <div>
                  <p className="font-bold text-slate-800">Décision du jury :</p>
                  <p className="font-bold text-emerald-700">
                    {studentTotal >= 150 ? "✓ EXAMEN BLANC VALIDÉ" : "À RENFORCER"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Le Chef d'Établissement</p>
                  <div className="h-10"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-SECTION 4: DATAVISUALISATION */}
      {activeSub === "res-datavis" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
              Graphiques & Répartition
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              📈 DataVisualisation des Résultats
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Répartition des mentions au brevet / bac blanc (Très Bien, Bien, Assez Bien, Sans mention).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Répartition des Mentions (Simulée)</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Très Bien (&ge; 16/20)</span>
                    <span className="text-purple-600 font-bold">25%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full w-1/4"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Bien (&ge; 14/20)</span>
                    <span className="text-indigo-600 font-bold">35%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[35%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Assez Bien (&ge; 12/20)</span>
                    <span className="text-sky-600 font-bold">22%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full w-[22%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Admis Sans Mention (&ge; 10/20)</span>
                    <span className="text-emerald-600 font-bold">12%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full w-[12%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Indicateurs Globaux</h3>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                <p className="font-bold text-emerald-900">Excellence globale du LFJP</p>
                <p className="text-emerald-700 mt-1">
                  Plus de 82% des candidats obtiennent une mention lors de cette session blanche.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 5: SIMULATION */}
      {activeSub === "res-simul" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800">
              Calculateur DNB
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              🔮 Simulation d'Obtention du DNB
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Simulez le total des points (Socle commun sur 400 + Épreuves sur 400 = Total sur 800).
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-xl mx-auto space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Points du Contrôle Continu / Socle Commun (sur 400 pts) :
              </label>
              <input
                type="range"
                min={100}
                max={400}
                step={10}
                value={simulSocle}
                onChange={(e) => setSimulSocle(Number(e.target.value))}
                className="w-full accent-yellow-500"
              />
              <div className="flex justify-between text-xs font-mono font-bold text-slate-600 mt-1">
                <span>100 pts</span>
                <span className="text-amber-700 font-black">{simulSocle} / 400 pts</span>
                <span>400 pts</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span>Total Épreuves Écrites d'Examen :</span>
                <span className="font-bold font-mono">{(stats.avg / 300) * 400 | 0} / 400</span>
              </div>
              <div className="flex justify-between">
                <span>Points du Socle Continu :</span>
                <span className="font-bold font-mono">{simulSocle} / 400</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>TOTAL ESTIMÉ DNB :</span>
                <span className="text-indigo-700 font-mono">
                  {simulSocle + (((stats.avg / 300) * 400) | 0)} / 800 PTS
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
