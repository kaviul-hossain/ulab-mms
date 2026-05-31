/**
 * Shared project rubric utilities — safe to use in both client and server code.
 * Keep this file free of any server-only imports (mongoose, next-auth, etc.).
 */

export interface IRubricScores {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
}

export const RUBRIC_CRITERIA = [
  {
    key: 'c1' as const,
    label: 'Understanding Requirements',
    co: '[CO*, PO*]',
    descriptions: [
      'No / wrong answer',
      'Defined requirements and specifications poorly.',
      'Defined requirements and specifications moderately.',
      'Defined requirements and specifications clearly & properly.',
    ],
  },
  {
    key: 'c2' as const,
    label: 'Design & Develop Solutions',
    co: '[CO*, PO*]',
    descriptions: [
      'No / wrong answer',
      'Poorly designed & developed the solutions using appropriate tools, techniques, and skills.',
      'Partly/moderately designed & developed the solutions using appropriate tools, techniques, and skills.',
      'Properly designed & developed the solutions using appropriate tools, techniques, and skills.',
    ],
  },
  {
    key: 'c3' as const,
    label: 'Result & Analysis',
    co: '[CO*, PO*]',
    descriptions: [
      'No / wrong answer',
      'Weak demonstration of the ability to draw correct conclusion of results obtained from the tool.',
      'Partly demonstrate the ability to draw correct conclusion of results obtained from the tool.',
      'Fully demonstrate the ability to draw correct conclusion of results obtained from the tool.',
    ],
  },
  {
    key: 'c4' as const,
    label: 'Addressing Complex Engineering Problems',
    co: '[CO*, PO*]',
    descriptions: [
      'No / wrong answer',
      'Performed the design addressing very few attributes from A1-A7 of complex engineering problem.',
      'Performed the design addressing few possible attributes from A1-A7 of complex engineering problem.',
      'Performed the design addressing all possible attributes from A1-A7 of complex engineering problem.',
    ],
  },
  {
    key: 'c5' as const,
    label: 'Addressing Complex Engineering Activities',
    co: '[CO*, PO*]',
    descriptions: [
      'No / wrong answer',
      'Developed and designed the system addressing very few attributes from A1-A7 of complex engineering problem.',
      'Developed and designed the system addressing few possible attributes from A1-A7 of complex engineering problem.',
      'Developed and designed the system addressing all possible attributes from A1-A7 of complex engineering problem.',
    ],
  },
] as const;

/**
 * Calculate the final project mark for a group based on rubric scores.
 * Formula: Σ (score_i / 3) × (totalProjectMarks / 5) for i in 1..5
 */
export function calculateProjectMark(
  rubricScores: IRubricScores,
  totalProjectMarks: number
): number {
  const markPerCriterion = totalProjectMarks / 5;
  const total =
    (rubricScores.c1 / 3) * markPerCriterion +
    (rubricScores.c2 / 3) * markPerCriterion +
    (rubricScores.c3 / 3) * markPerCriterion +
    (rubricScores.c4 / 3) * markPerCriterion +
    (rubricScores.c5 / 3) * markPerCriterion;
  return Math.round(total * 100) / 100;
}
