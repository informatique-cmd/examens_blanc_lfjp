import { useMathExamData } from "../context";

export default function Footer() {
  const { header } = useMathExamData();
  const reprographyDeadlineLabel = header.reprographyDeadline?.label;

  return (
    <footer className="rounded-lg bg-blue-100 p-4 text-center text-blue-800">
      <p className="font-semibold">Rappel :</p>
      <p>
        {reprographyDeadlineLabel
          ? `Merci de transmettre les sujets au plus tard le ${reprographyDeadlineLabel} et d'être présents 20 min avant le début de l'épreuve.`
          : "Merci de transmettre les sujets dans les délais de reprographie communiqués et d'être présents 20 min avant le début de l'épreuve."}
      </p>
    </footer>
  );
}
