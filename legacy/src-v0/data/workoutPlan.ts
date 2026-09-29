export type WeeklyProgressEntry = {
  week: string
  value: number
}

export type PlanExercise = {
  code: string
  name: string
  sets: number | string
  reps: string
  rest: string
  tempo: string
  rpe: number | string
  weekSummary: string
  progress?: WeeklyProgressEntry[]
}

export type PlanGroup = {
  name: string
  exercises: PlanExercise[]
}

export type WorkoutPhase = {
  id: string
  label: string
  title?: string
  groups: PlanGroup[]
}

export const workoutPhases: WorkoutPhase[] = [
  {
    id: 'tp-16-2-26',
    label: 'TP 16-2-26',
    title: 'Hypertrophy Flat Pyramid',
    groups: [
      {
        name: 'Chest-Back A',
        exercises: [
          { code: 'A1', name: '45 Db Press Neutral Grip', sets: 4, reps: '12-12-12-12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '26 / 26 / 30 / 30 / 32' },
          { code: 'B1', name: '30 Db Press Neutral Grip', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '24 / 24 / 26 / 28 / 28' },
          { code: 'C1', name: 'High Cable Flies', sets: 3, reps: '15-15-15', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '10 / 15 / 15 / 16' },
          { code: 'D1', name: 'Wide Grip Cable Row', sets: 4, reps: '12-12-12-12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '50 / 50 / 55 / 60 / 60' },
        ],
      },
      {
        name: 'Arms A',
        exercises: [
          { code: 'A1', name: 'Wide Grip Shoulder Press Machine', sets: 4, reps: '12-12-12-12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '40 / 40 / 45 / 47.5 / 47.5' },
          { code: 'B1', name: '60 Db OH Press Neutral Grip', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '18 / 18 / 20 / 22 / 24' },
          { code: 'C1', name: 'Reverse Grip Lats Machine', sets: 4, reps: '10-10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '0 / 0 / 0 / 55' },
          { code: 'D1', name: 'Close Grip Decline Press', sets: 4, reps: '10-10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '20 / 20 / 30 / 35 / 35' },
        ],
      },
      {
        name: 'Lower Body A',
        exercises: [
          { code: 'A1', name: '45 Leg Press Quad Dominant', sets: 4, reps: '12-12-12-12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '140 / 140 / 145 / 145 / 145' },
          { code: 'B1', name: 'Db Walking Lunges Long Steps', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '10 / 10 / 12 / 16 / 18' },
          { code: 'C1', name: 'BB RDL', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '10 / 10 / 26 / 30 / 30' },
          { code: 'D1', name: 'Leg Press Calf Raises Toes Neutral', sets: 4, reps: '12-12-12-12', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '40 / 40 / 65 / 90 / 100' },
        ],
      },
      {
        name: 'Chest-Back B',
        exercises: [
          { code: 'A1', name: '45 Db Press Neutral Grip', sets: 4, reps: '15-15-15-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '24 / 26 / 26 / 28 / 28' },
          { code: 'B1', name: '30 Db Press Neutral Grip', sets: 3, reps: '15-15-15', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '22 / 24 / 24 / 26 / 26' },
          { code: 'C1', name: 'Wide Grip Cable Row', sets: 4, reps: '15-15-15-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '45 / 50 / 55 / 55 / 60' },
          { code: 'D1', name: 'Neutral Grip LPD', sets: 3, reps: '15-15-15', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '50 / 55 / 60 / 60 / 60' },
        ],
      },
      {
        name: 'Arms B',
        exercises: [
          { code: 'A1', name: 'Wide Grip Shoulder Press Machine', sets: 4, reps: '15-15-15-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '35 / 35 / 37.5 / 42.5 / 42.5' },
          { code: 'B1', name: '60 Db OH Press Neutral Grip', sets: 3, reps: '15-15-15', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '16 / 16 / 18 / 20 / 22' },
          { code: 'C1', name: 'Reverse Grip Lats Machine', sets: 4, reps: '12-12-12-12', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '0 / 0 / 0 / 50 / 50' },
          { code: 'D1', name: 'Close Grip Decline Press', sets: 4, reps: '12-12-12-12', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '15 / 15 / 25 / 27.5 / 30' },
        ],
      },
      {
        name: 'Lower Body B',
        exercises: [
          { code: 'A1', name: '45 Leg Press Quad Dominant', sets: 4, reps: '15-15-15-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '120 / 120 / 125 / 125 / 125' },
          { code: 'B1', name: 'Db Walking Lunges Long Steps', sets: 3, reps: '15-15-15', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '10 / 10 / 12 / 14 / 18' },
          { code: 'C1', name: 'BB RDL', sets: 3, reps: '15-15-15', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '10 / 10 / 12 / 14 / 15' },
          { code: 'D1', name: 'Leg Press Calf Raises Toes Neutral', sets: 4, reps: '15-15-15-15', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '50 / 50 / 80 / 100' },
        ],
      },
    ],
  },
  {
    id: 'tp-30-3-26',
    label: 'TP 30-3-26',
    title: 'Hypertrophy Reverse Pyramid',
    groups: [
      {
        name: 'Chest-Back A',
        exercises: [
          { code: 'A1', name: '30 BB Bench Press', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '32-30-28-26 / 34-32-20-28' },
          { code: 'B1', name: 'Wide Grip Chest Press Drop Sets', sets: 3, reps: '12+12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '40-35 / 62.5-30.25 / 65-35' },
          { code: 'C1', name: 'Decline Db Flies', sets: 3, reps: '15-15-15', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '17.5 / 18 / 19' },
          { code: 'D1', name: 'Neutral Grip Supp. Rows', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '45-42.5-40-38 / 50-47.5-45-42.5' },
        ],
      },
      {
        name: 'Arms A',
        exercises: [
          { code: 'A1', name: '75 Neutral Grip Db OH Press', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '50-47.5-45-42.5 / 55-52-50-48' },
          { code: 'B1', name: 'Lateral Raises Machine Drop Sets', sets: 3, reps: '12+12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '14-8 / 16-8' },
          { code: 'C1', name: 'EZ BB Preacher Curls', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '9-9-7.5-6.25 / 12-11-10-9' },
          { code: 'D1', name: '45 Hammer Curls Drop Sets', sets: 3, reps: '12+12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '10-8 / 14-6' },
        ],
      },
      {
        name: 'Lower Body A',
        exercises: [
          { code: 'A1', name: 'Heels Elevated HB Squats', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '24-22-20-18 / 32-30-28-26' },
          { code: 'B1', name: 'Leg Extensions Toes Dorsiflexed Out Drop Sets', sets: 3, reps: '12+12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '52.5-20 / 57.5-22.5' },
          { code: 'C1', name: 'Hor. Back Extensions Glutes Dominant', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '60-60-50-40 / 80-80-80-70' },
          { code: 'D1', name: 'Seated Leg Curl Toes Dorsiflexed Neutral Drop Sets', sets: 3, reps: '12+12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '37.5-20 / 42-22' },
        ],
      },
      {
        name: 'Chest-Back B',
        exercises: [
          { code: 'A1', name: '30 BB Bench Press', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '28-26-24-20 / 34-30-28-22' },
          { code: 'B1', name: 'Wide Grip Chest Press Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '45-20 / 62-32' },
          { code: 'C1', name: 'Decline Db Flies', sets: 3, reps: '15-15-15', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '15 / 17.5 / 18' },
          { code: 'D1', name: 'Neutral Grip Supp. Rows', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '42.5-40-40-30 / 50-50-45-20' },
        ],
      },
      {
        name: 'Arms B',
        exercises: [
          { code: 'A1', name: '75 Neutral Grip Db OH Press', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '45-42.5-40-20 / 50-47-45-42' },
          { code: 'B1', name: 'Lateral Raises Machine Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '14-8 / 16-8' },
          { code: 'C1', name: 'EZ BB Preacher Curls', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '9-7.25-6.5-5 / 12-10-10-5' },
          { code: 'D1', name: '45 Hammer Curls Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '10-6 / 12-7.5' },
        ],
      },
      {
        name: 'Lower Body B',
        exercises: [
          { code: 'A1', name: 'Heels Elevated HB Squats', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '22-20-18-15 / 30-30-30-18' },
          { code: 'B1', name: 'Leg Extensions Toes Dorsiflexed Out Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '40-15 / 47.5-22.5' },
          { code: 'C1', name: 'Hor. Back Extensions Glutes Dominant', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '60-55-50-40 / 80-80-80-70' },
          { code: 'D1', name: 'Seated Leg Curl Toes Dorsiflexed Neutral Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '32.5-17.5 / 35-20' },
        ],
      },
    ],
  },
  {
    id: 'tp-11-5-26',
    label: 'TP 11-5-26',
    title: 'Functional Hypertrophy Flat Pyramid',
    groups: [
      {
        name: 'Chest-Back A',
        exercises: [
          { code: 'A1', name: 'BB Bench Press', sets: 4, reps: '6-6-6-6', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '30 / 35 / 40 / 40' },
          { code: 'B1', name: '45 BB Press', sets: 4, reps: '8-8-8-8', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '22.5 / 25 / 30 / 30' },
          { code: 'D1', name: 'Neutral Grip Weighted Chin Ups', sets: 4, reps: '8-8-8-8', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '60 / 65 / 70 / 75' },
          { code: 'E1', name: 'Wide Grip Cable Chest Pulls', sets: 4, reps: '10-10-10-10', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '35 / 40 / 45 / 50' },
        ],
      },
      {
        name: 'Arms A',
        exercises: [
          { code: 'A1', name: 'Plate Loaded Wide Grip Shoulder Press Machine', sets: 4, reps: '6-6-6-6', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '45 / 47.5 / 50 / 50' },
          { code: 'B1', name: 'Reverse Grip Chin Up Weighted', sets: 4, reps: '6-6-6-6', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '60 / 65 / 70 / 80' },
          { code: 'C1', name: 'Close Grip Bench Press', sets: 4, reps: '6-6-6-6', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '30 / 32.5 / 35 / 36.5' },
          { code: 'D1', name: '60 Db Curls Offset Grip', sets: 4, reps: '8-8-8-8', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '9 / 10 / 11 / 14' },
        ],
      },
      {
        name: 'Lower Body A',
        exercises: [
          { code: 'A1', name: 'Hack Squat Machine', sets: 4, reps: '6-6-6-6', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '30 / 35 / 40 / 45' },
          { code: 'B1', name: 'Db Walking Lunges Long Steps', sets: 4, reps: '8-8-8-8', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '16 / 18 / 18 / 20' },
          { code: 'C1', name: 'Prone Leg Curl Toes Dorsiflexed Neutral', sets: 4, reps: '6-6-6-6', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '42 / 47.5 / 45 / 47.5' },
          { code: 'D1', name: 'Weighted 45 Back Extensions', sets: 4, reps: '10-10-10-10', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '58 / 30 / 35 / 35' },
        ],
      },
      {
        name: 'Chest-Back B',
        exercises: [
          { code: 'A1', name: 'BB Bench Press', sets: 4, reps: '8-8-8-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '30 / 34 / 40 / 40' },
          { code: 'B1', name: '45 BB Press', sets: 4, reps: '10-10-10-10', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '25 / 26.5 / 25 / 30' },
          { code: 'C1', name: 'Wide Grip Supp. Seated Row', sets: 4, reps: '8-8-8-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '45 / 50 / 56 / 50' },
          { code: 'D1', name: 'Neutral Grip Weighted Chin Ups', sets: 4, reps: '10-10-10-10', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '55 / 60 / 63 / 70' },
        ],
      },
      {
        name: 'Arms B',
        exercises: [
          { code: 'A1', name: 'Plate Loaded Wide Grip Shoulder Press Machine', sets: 4, reps: '8-8-8-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '40 / 45 / 50 / 49' },
          { code: 'B1', name: 'Reverse Grip Chin Up Weighted', sets: 4, reps: '8-8-8-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '55 / 65 / 68 / 70' },
          { code: 'C1', name: 'Close Grip Bench Press', sets: 4, reps: '8-8-8-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '25 / 27.5 / 68 / 30' },
          { code: 'D1', name: '60 Db Curls Offset Grip', sets: 4, reps: '10-10-10-10', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '7.5 / 10 / 10.28 / 14' },
        ],
      },
      {
        name: 'Lower Body B',
        exercises: [
          { code: 'A1', name: 'Hack Squat Machine', sets: 4, reps: '8-8-8-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '30 / 35 / 40 / 42.5' },
          { code: 'B1', name: 'Db Walking Lunges Long Steps', sets: 4, reps: '10-10-10-10', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '18 / 20 / 20 / 20' },
          { code: 'C1', name: 'Prone Leg Curl Toes Dorsiflexed Neutral', sets: 4, reps: '8-8-8-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '42 / 47.5 / 45 / 47.5' },
          { code: 'D1', name: 'Weighted 45 Back Extensions', sets: 4, reps: '12-12-12-12', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '60 / 56 / 62 / 62' },
        ],
      },
    ],
  },
  {
    id: 'tp-6-7-26',
    label: 'TP 6-7-26',
    title: 'Hypertrophy Pyramid',
    groups: [
      {
        name: 'Chest-Back A',
        exercises: [
          { code: 'A1', name: 'Plate Loaded Chest Press Wide Grip', sets: 4, reps: '15-12-10-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '35-32.5-30-20 / 37.5-42.5-45' },
          { code: 'B1', name: '45 Db Press Neutral Grip', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '26 / 28 / 30' },
          { code: 'C1', name: 'Unilateral Handle LPD', sets: 4, reps: '15-12-10-8', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '15-19-21-24 / 22-27-32-37' },
          { code: 'D1', name: 'Unilateral Supp. Rows Reverse Grip', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '45 / 50 / 52.5' },
        ],
      },
      {
        name: 'Arms A',
        exercises: [
          { code: 'A1', name: 'Neutral Grip Pin Loaded Shoulder Press', sets: 4, reps: '15-12-10-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '42.5-40-37.5-35 / 52.5-50-47.5-45' },
          { code: 'B1', name: '75 Db OH Press Neutral Grip', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '26 / 28 / 28' },
          { code: 'C1', name: 'Standing Db Offset Grip Curls', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '7.5 / 9 / 15' },
          { code: 'D1', name: 'Cable Rope Tricep Extensions', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '11 / 13 / 12.5' },
        ],
      },
      {
        name: 'Lower Body A',
        exercises: [
          { code: 'A1', name: 'Heels Elevated HB Squats', sets: 4, reps: '15-12-10-8', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '20-25 / 27.5-32.5' },
          { code: 'B1', name: 'FFE Db Split Squats', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '14 / 16 / 26' },
          { code: 'C1', name: 'Seated Leg Curls Toes Dorsiflexed Neutral', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '15 / 17.5 / 22.5' },
          { code: 'D1', name: 'Weighted V Ups', sets: 4, reps: '15-15-15-15', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '25 / 25' },
        ],
      },
      {
        name: 'Chest-Back B',
        exercises: [
          { code: 'A1', name: 'Plate Loaded Chest Press Wide Grip', sets: 4, reps: '20-15-12-10', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '20-25-30-35 / 32.5-37.5-42.5-47.5' },
          { code: 'B1', name: '45 Db Press Neutral Grip', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '26 / 28 / 30' },
          { code: 'C1', name: 'Unilateral Handle LPD', sets: 4, reps: '20-15-12-10', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '20-25-30-35 / 20-25-30-35' },
          { code: 'D1', name: 'Unilateral Supp. Rows Reverse Grip', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '45 / 50 / 55' },
        ],
      },
      {
        name: 'Arms B',
        exercises: [
          { code: 'A1', name: 'Neutral Grip Pin Loaded Shoulder Press', sets: 4, reps: '20-15-12-10', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '30-35-40-42.5 / 47.5-52.5-57.5' },
          { code: 'B1', name: '75 Db OH Press Neutral Grip', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '24 / 26 / 26' },
          { code: 'C1', name: 'Standing Db Offset Grip Curls', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '9 / 9 / 15' },
          { code: 'D1', name: 'Cable Rope Tricep Extensions', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '12 / 13 / 13' },
        ],
      },
      {
        name: 'Lower Body B',
        exercises: [
          { code: 'A1', name: 'Heels Elevated HB Squats', sets: 4, reps: '20-15-12-10', rest: "2'", tempo: 'NA', rpe: 10, weekSummary: '20-25 / 20-30' },
          { code: 'B1', name: 'FFE Db Split Squats', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '14 / 16 / 26' },
          { code: 'C1', name: 'Seated Leg Curls Toes Dorsiflexed Neutral', sets: 3, reps: '10-10-10', rest: '10"', tempo: 'NA', rpe: 10, weekSummary: '20 / 22.5 / 22.5' },
          { code: 'D1', name: 'Weighted V Ups', sets: 4, reps: '20-20-20-20', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '-' },
        ],
      },
    ],
  },
  {
    id: 'tp-17-8-26',
    label: 'TP 17-8-26',
    title: 'Hypertrophy Reverse Pyramid',
    groups: [
      {
        name: 'Chest-Back A',
        exercises: [
          { code: 'A1', name: '30 BB Bench Press', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '30-27.5-25-22.5 / 32.5-30-27.5-25' },
          { code: 'B1', name: 'Middle Cable Flies Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '11-7.5 / 12.5-8' },
          { code: 'C1', name: 'Decline BB Press', sets: 3, reps: '15-15-15', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '25 / 15' },
          { code: 'D1', name: 'Wide Grip LPD', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '70-65-60-55 / 80-75-70-65' },
        ],
      },
      {
        name: 'Arms A',
        exercises: [
          { code: 'A1', name: '60 Neutral Grip Db OH Press', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '26-24-22-20 / 30-28-26-24' },
          { code: 'B1', name: 'Db 60 Y Raises Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '12.5-8 / 13-9' },
          { code: 'C1', name: 'Single Db Preacher Curls', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '10-7.5 / 12.5' },
          { code: 'D1', name: 'Low Cable Ropes Curls Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '16-6 / 17.5-7.5' },
        ],
      },
      {
        name: 'Lower Body A',
        exercises: [
          { code: 'A1', name: 'Hack Squats', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '35-30-25-20 / 35-30-25-20' },
          { code: 'B1', name: 'Leg Extensions Toes Dorsiflexed Out Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '15-40 / 45-20' },
          { code: 'C1', name: 'Hor. Back Extensions Glutes Dominant', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '60-55-50-50 / 70' },
          { code: 'D1', name: 'Prone Leg Curls Toes Dorsiflexed Neutral Drop Sets', sets: 3, reps: '15+15', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '20 / 40-20' },
        ],
      },
      {
        name: 'Chest-Back B',
        exercises: [
          { code: 'A1', name: '30 BB Bench Press', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '30-27.5-25-22.5 / 32.5-30-27.5-25' },
          { code: 'B1', name: 'Middle Cable Flies Drop Sets', sets: 3, reps: '20+20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '12.5-8 / 12.5-8' },
          { code: 'C1', name: 'Decline BB Press', sets: 3, reps: '15-15-15', rest: "1'", tempo: 'NA', rpe: 10, weekSummary: '12.5 / 16' },
          { code: 'D1', name: 'Wide Grip LPD', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '70-65-60-55 / 75-70-65-60' },
        ],
      },
      {
        name: 'Arms B',
        exercises: [
          { code: 'A1', name: '60 Neutral Grip Db OH Press', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '26-24-22-20 / 28-26-24-22' },
          { code: 'B1', name: 'Db 60 Y Raises Drop Sets', sets: 3, reps: '20+20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '12.5-8 / 12.5-8' },
          { code: 'C1', name: 'Single Db Preacher Curls', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '10-7.5 / 12.5' },
          { code: 'D1', name: 'Low Cable Ropes Curls Drop Sets', sets: 3, reps: '20+20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '15-7.5 / 17.5-7.5' },
        ],
      },
      {
        name: 'Lower Body B',
        exercises: [
          { code: 'A1', name: 'Hack Squats', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '-' },
          { code: 'B1', name: 'Leg Extensions Toes Dorsiflexed Out Drop Sets', sets: 3, reps: '20+20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '-' },
          { code: 'C1', name: 'Hor. Back Extensions Glutes Dominant', sets: 4, reps: '10-12-15-20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '-' },
          { code: 'D1', name: 'Prone Leg Curls Toes Dorsiflexed Neutral Drop Sets', sets: 3, reps: '20+20', rest: "1'30\"", tempo: 'NA', rpe: 10, weekSummary: '-' },
        ],
      },
    ],
  },
  {
    id: 'tp-01-9-26',
    label: 'TP 01-9-26',
    title: 'Sept Hypertrophy Mix',
    groups: [
      {
        name: 'Chest-Back A',
        exercises: [
          { code: 'A1', name: 'Incline BB Press', sets: 4, reps: '8-10-12-15', rest: "1'30\"", tempo: 'NA', rpe: 9, weekSummary: '30 / 32 / 34 / 36' },
          { code: 'B1', name: 'Cable Flyes', sets: 3, reps: '12-12-12', rest: "1'00\"", tempo: 'NA', rpe: 8, weekSummary: '12 / 13 / 14' },
          { code: 'C1', name: 'Seated Row', sets: 4, reps: '10-10-10-10', rest: "1'30\"", tempo: 'NA', rpe: 9, weekSummary: '60 / 62 / 65 / 67' },
        ],
      },
      {
        name: 'Arms',
        exercises: [
          { code: 'A1', name: 'Standing DB Curls', sets: 4, reps: '10-10-10-10', rest: "1'00\"", tempo: 'NA', rpe: 8, weekSummary: '12 / 14 / 16 / 18' },
          { code: 'B1', name: 'Tricep Rope Pushdown', sets: 4, reps: '10-10-10-10', rest: "1'00\"", tempo: 'NA', rpe: 8, weekSummary: '25 / 27.5 / 30 / 32.5' },
        ],
      },
      {
        name: 'Legs',
        exercises: [
          { code: 'A1', name: 'Back Squat', sets: 4, reps: '6-8-10-12', rest: "2'00\"", tempo: 'NA', rpe: 9, weekSummary: '80 / 85 / 90 / 95' },
          { code: 'B1', name: 'Romanian Deadlift', sets: 3, reps: '8-8-8', rest: "1'30\"", tempo: 'NA', rpe: 9, weekSummary: '80 / 85 / 90' },
        ],
      },
    ],
  },
]

export const workoutExercises = [
  '45 Db Press Neutral Grip',
  '30 Db Press Neutral Grip',
  'High Cable Flies',
  'Wide Grip Cable Row',
  'Neutral Grip LPD',
  'Wide Grip Shoulder Press Machine',
  '60 Db OH Press Neutral Grip',
  'Reverse Grip Lats Machine',
  'Close Grip Decline Press',
  '45 Leg Press Quad Dominant',
  'Db Walking Lunges Long Steps',
  'BB RDL',
  'Leg Press Calf Raises Toes Neutral',
  '30 BB Bench Press',
  'Wide Grip Chest Press Drop Sets',
  'Decline Db Flies',
  'Neutral Grip Supp. Rows',
  'Wide Grip LPD',
  '75 Neutral Grip Db OH Press',
  'Lateral Raises Machine Drop Sets',
  'EZ BB Preacher Curls',
  '45 Hammer Curls Drop Sets',
  'Heels Elevated HB Squats',
  'Leg Extensions Toes Dorsiflexed Out Drop Sets',
  'Hor. Back Extensions Glutes Dominant',
  'Seated Leg Curl Toes Dorsiflexed Neutral Drop Sets',
  'BB Bench Press',
  '45 BB Press',
  'Neutral Grip Weighted Chin Ups',
  'Wide Grip Cable Chest Pulls',
  'Plate Loaded Wide Grip Shoulder Press Machine',
  'Reverse Grip Chin Up Weighted',
  'Close Grip Bench Press',
  '60 Db Curls Offset Grip',
  'Hack Squat Machine',
  'Weighted 45 Back Extensions',
  'Wide Grip Supp. Seated Row',
  'Plate Loaded Chest Press Wide Grip',
  'Unilateral Handle LPD',
  'Unilateral Supp. Rows Reverse Grip',
  'Neutral Grip Pin Loaded Shoulder Press',
  '75 Db OH Press Neutral Grip',
  'Standing Db Offset Grip Curls',
  'Cable Rope Tricep Extensions',
  'FFE Db Split Squats',
  'Seated Leg Curls Toes Dorsiflexed Neutral',
  'Middle Cable Flies Drop Sets',
  'Decline BB Press',
  '60 Neutral Grip Db OH Press',
  'Db 60 Y Raises Drop Sets',
  'Single Db Preacher Curls',
  'Low Cable Ropes Curls Drop Sets',
  'Hack Squats',
  'Prone Leg Curls Toes Dorsiflexed Neutral Drop Sets',
  'Weighted V Ups',
  'Prone Leg Curl Toes Dorsiflexed Neutral',
  'Leg Extensions Toes Dorsiflexed Neutral',
]

export const workoutExerciseNames = Array.from(
  new Set(
    workoutPhases.flatMap((phase) =>
      phase.groups.flatMap((group) => group.exercises.map((exercise) => exercise.name))
    )
  )
)

const muscleGroupPatterns: Array<[RegExp, string]> = [
  [/shoulder|deltoid|lateral raise|y raise|overhead press|oh press|pin loaded shoulder/i, 'Shoulders'],
  [/leg curl|leg extension|hack squat|squat|split squat|lunge|lunges|calf|rdl|glutes|hip thrust/i, 'Legs'],
  [/tricep|preacher curl|hammer curl|hammer|rope curls|offset grip curls|curls?/i, 'Arms'],
  [/bench|chest|fly|flies|db press|bb press|decline press|plate loaded chest press|wide grip chest press|close grip bench press/i, 'Chest'],
  [/row|pull|chin|lats|lat pulldown|supp\.? rows|cable chest pulls|back|back extension/i, 'Back'],
  [/v up|v ups|crunch|abs|core/i, 'Core'],
]

export function getMuscleGroupForExercise(exerciseName: string): string {
  const normalized = exerciseName.trim()
  if (!normalized) return 'Other'

  const cleaned = normalized.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')

  for (const [pattern, muscleGroup] of muscleGroupPatterns) {
    if (pattern.test(cleaned)) return muscleGroup
  }

  return 'Other'
}
