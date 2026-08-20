import type {
  TeacherDirectoryEntry,
  TeacherDirectorySourceEntry,
  TeacherGender,
  TeacherCivility,
} from "./types";

export const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const createShortName = (lastName: string, firstName: string): string => {
  const normalizedLastName = normalizeWhitespace(lastName).toUpperCase();
  const normalizedFirstName = normalizeWhitespace(firstName);

  if (!normalizedFirstName) {
    return normalizedLastName;
  }

  const initial = normalizedFirstName.charAt(0).toUpperCase();
  return `${normalizedLastName} ${initial}.`;
};

const inferGender = (civility: TeacherCivility): TeacherGender =>
  civility === "Madame" ? "female" : "male";

export const createTeacherDirectory = (
  source: TeacherDirectorySourceEntry[],
): TeacherDirectoryEntry[] =>
  source.map((entry) => {
    const civility = entry.civility;
    const gender = inferGender(civility);
    const lastName = normalizeWhitespace(entry.lastName).toUpperCase();
    const firstName = normalizeWhitespace(entry.firstName);

    return {
      civility,
      gender,
      lastName,
      firstName,
      shortName: createShortName(lastName, firstName),
    };
  });

export const createTeacherDirectoryByShortName = (
  entries: TeacherDirectoryEntry[],
): Record<string, TeacherDirectoryEntry> =>
  entries.reduce<Record<string, TeacherDirectoryEntry>>((accumulator, entry) => {
    accumulator[entry.shortName] = entry;
    return accumulator;
  }, {});
