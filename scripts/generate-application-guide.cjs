const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

const outputPath = path.resolve(__dirname, "..", "docs", "guide-application-examens-lfjp.pdf");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const doc = new jsPDF({ unit: "pt", format: "a4" });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 48;
const contentWidth = pageWidth - margin * 2;
let y = margin;

function footer() {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Guide de l'application - Examens blancs LFJP", margin, pageHeight - 24);
  doc.text(String(doc.getNumberOfPages()), pageWidth - margin, pageHeight - 24, { align: "right" });
}

function ensureSpace(height) {
  if (y + height > pageHeight - 52) {
    footer();
    doc.addPage();
    y = margin;
  }
}

function title(text) {
  ensureSpace(42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(text, margin, y);
  y += 30;
}

function heading(text) {
  ensureSpace(32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text(text, margin, y);
  y += 22;
}

function paragraph(text) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(text, contentWidth);
  ensureSpace(lines.length * 14 + 8);
  doc.text(lines, margin, y, { lineHeightFactor: 1.35 });
  y += lines.length * 14 + 10;
}

function bullet(text) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(text, contentWidth - 18);
  ensureSpace(lines.length * 14 + 4);
  doc.text("•", margin, y);
  doc.text(lines, margin + 14, y, { lineHeightFactor: 1.3 });
  y += lines.length * 14 + 5;
}

function code(text) {
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const lines = doc.splitTextToSize(text, contentWidth - 20);
  ensureSpace(lines.length * 12 + 16);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y - 12, contentWidth, lines.length * 12 + 16, 4, 4, "F");
  doc.text(lines, margin + 10, y, { lineHeightFactor: 1.25 });
  y += lines.length * 12 + 18;
}

// Cover page
const coverY = 180;
doc.setFillColor(15, 23, 42);
doc.rect(0, 0, pageWidth, pageHeight, "F");
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(28);
doc.text("Guide de l'application", margin, coverY);
doc.setFontSize(20);
doc.setTextColor(147, 197, 253);
doc.text("Examens blancs LFJP", margin, coverY + 40);
doc.setFont("helvetica", "normal");
doc.setFontSize(12);
doc.setTextColor(226, 232, 240);
doc.text("Présentation fonctionnelle et technique", margin, coverY + 82);
doc.text("Document généré le 20 août 2026", margin, coverY + 104);
doc.setDrawColor(96, 165, 250);
doc.line(margin, coverY + 132, pageWidth - margin, coverY + 132);
doc.setFontSize(10);
doc.setTextColor(203, 213, 225);
doc.text("Portail de consultation des plannings, salles, élèves, surveillances et convocations.", margin, coverY + 164);
footer();
doc.addPage();
y = margin;

title("1. Présentation générale");
paragraph("L'application Examens blancs LFJP est un portail web destiné à centraliser l'organisation des examens blancs et de plusieurs épreuves de l'établissement. Elle permet aux enseignants et responsables d'accéder rapidement aux informations utiles depuis une seule interface.");
bullet("Consulter les dates et les plannings d'examens.");
bullet("Visualiser les salles, les élèves et les affectations.");
bullet("Organiser les surveillances BAC et DNB.");
bullet("Générer des convocations et des documents PDF.");
bullet("Exporter certains plannings au format CSV.");

heading("Nature de l'application");
paragraph("L'application fonctionne entièrement côté navigateur. Les données sont actuellement stockées dans des fichiers TypeScript intégrés au projet. Il n'y a pas de serveur applicatif, d'authentification ou de base de données connectée.");

heading("Technologies principales");
bullet("React 18 et TypeScript pour l'interface et la logique.");
bullet("Vite pour le développement et la compilation de production.");
bullet("React Router pour la navigation entre les pages.");
bullet("Tailwind CSS pour les styles.");
bullet("Lucide React pour les icônes.");
bullet("jsPDF et html2canvas pour les exports et impressions.");

title("2. Parcours utilisateur");
heading("Accueil");
paragraph("L'utilisateur arrive sur une page d'accueil présentant l'espace examens et une série de cartes classées par date. Chaque carte ouvre la page correspondant à une épreuve ou à un planning.");
code("/\n/examens-blancs\n/examens-blancs/mathematiques-2026-02-13\n/examens-blancs/oraux-eaf-2026-05\n/surveillances-bac-dnb");
heading("Consultation d'un examen");
paragraph("Les pages d'examen affichent un en-tête avec le titre, la date et les indicateurs clés, puis des vues adaptées au besoin : organisation complète, planning par enseignant ou jury, planning par salle, élèves et convocations.");
heading("Navigation");
paragraph("Les tableaux de bord utilisent des onglets accessibles au clavier. Les flèches gauche et droite changent d'onglet, tandis que les touches Home et End permettent d'aller au premier ou au dernier onglet.");

title("3. Modules fonctionnels");
heading("Tableau de bord des examens blancs");
bullet("Configuration des salles et capacités.");
bullet("Liste des élèves de Première et Terminale.");
bullet("Affectation des enseignants aux missions de surveillance.");
bullet("État des salles et informations pratiques.");
bullet("Génération de convocations.");
heading("Examens de mathématiques et DNB");
paragraph("Les pages de mathématiques réutilisent une même structure. Seules les données changent selon l'examen : date, élèves, salles, enseignants, épreuves et horaires.");
heading("Oraux EAF et Grand Oral");
paragraph("Ces modules sont construits autour de listes de candidats. Les candidats peuvent être regroupés par date, jury ou salle. Les tableaux affichent les horaires de convocation, les horaires de passage, les classes et les salles.");
heading("Surveillances BAC et DNB");
paragraph("Le module de surveillance permet de basculer entre les plannings BAC et DNB, de rechercher un surveillant et de produire une convocation individuelle. L'heure de présence est calculée automatiquement 30 minutes avant le début de l'épreuve.");

title("4. Architecture technique");
heading("Point d'entrée et routes");
paragraph("Le fichier src/main.tsx monte React et BrowserRouter. Le fichier src/app/App.tsx déclare les routes et charge les pages avec lazy() afin de réduire le chargement initial.");
heading("Organisation par fonctionnalités");
paragraph("Le code est organisé par domaine dans src/features. Chaque fonctionnalité regroupe ses pages, composants, données, hooks, contextes, services et utilitaires. Les composants génériques sont placés dans src/shared.");
heading("Gestion d'état");
paragraph("L'état d'interface est local aux composants React. Les tableaux de bord utilisent des Contexts pour partager l'onglet actif, le conteneur de rendu et le jeu de données de l'examen. Les données ne sont pas persistées dans localStorage.");
heading("Données");
paragraph("Les données de l'établissement sont déclarées comme constantes TypeScript : annuaire des enseignants, élèves, salles, horaires, jurys et missions. Pour modifier une organisation, il faut donc modifier le code source puis reconstruire l'application.");

title("5. Documents et exports");
heading("PDF");
paragraph("Les exports PDF sont générés directement dans le navigateur avec jsPDF. Les tableaux sont dessinés ligne par ligne, avec gestion des retours à la ligne et des pages multiples.");
heading("CSV");
paragraph("Les pages d'oraux créent un fichier CSV avec séparateur point-virgule, encodage UTF-8 et marqueur BOM afin de faciliter l'ouverture dans Excel.");
heading("Impression");
paragraph("Le module de surveillance peut ouvrir une fenêtre d'impression dédiée. html2canvas est également utilisé pour transformer certains éléments HTML en image avant création du PDF.");

heading("Limites des documents");
bullet("Les documents reflètent les données intégrées au moment de la compilation.");
bullet("Le cachet et certains logos utilisent des ressources externes.");
bullet("Les bloqueurs de fenêtres contextuelles peuvent empêcher l'impression.");
bullet("Les exports ne constituent pas une sauvegarde centralisée.");

title("6. Installation et validation");
code("npm install --legacy-peer-deps\nnpm run dev\nnpm run build");
paragraph("La commande npm install standard rencontre actuellement un conflit entre ESLint 9 et @typescript-eslint 7. L'installation avec --legacy-peer-deps permet de lancer le projet.");
paragraph("Le build de production a été vérifié avec succès. ESLint ne s'exécute pas avec la configuration actuelle, car ESLint 9 attend un fichier eslint.config.js alors que le projet possède encore une configuration .eslintrc.cjs.");

heading("Publication");
paragraph("Le dépôt GitHub est : https://github.com/informatique-cmd/examens_blanc_lfjp. La branche locale main est synchronisée avec origin/main.");

title("7. Points d'amélioration");
bullet("Ajouter une base de données ou un CMS pour modifier les plannings sans changer le code.");
bullet("Ajouter une authentification et des droits d'accès, car l'application contient des données nominatives.");
bullet("Ajouter des tests unitaires et des tests de parcours navigateur.");
bullet("Moderniser la configuration ESLint.");
bullet("Résoudre le conflit de versions ESLint et réduire les vulnérabilités npm.");
bullet("Héberger localement les logos, le cachet et les autres ressources nécessaires.");
bullet("Prévoir une gestion des erreurs pour les exports et les liens externes.");
bullet("Optimiser le poids des gros bundles, en particulier jsPDF.");

heading("Conclusion");
paragraph("L'application est déjà un portail opérationnel de consultation et de génération de documents pour les examens. Son architecture par fonctionnalités et ses jeux de données typés facilitent l'ajout de nouvelles sessions. Le principal changement de niveau serait de remplacer les données statiques par une source administrable et sécurisée.");

footer();
doc.save(outputPath);
console.log(`PDF généré : ${outputPath}`);
