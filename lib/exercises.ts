// Suggestions for the workout planner. Users can still type any exercise.
export const exerciseLibrary: Record<string, string[]> = {
  Chest: ["Bench Press", "Incline Dumbbell Press", "Chest Fly", "Push-Ups", "Cable Crossover"],
  Back: ["Deadlift", "Lat Pulldown", "Seated Cable Row", "Bent-Over Row", "Pull-Ups"],
  Legs: ["Squat", "Leg Press", "Lunges", "Leg Extension", "Leg Curl", "Calf Raises"],
  Shoulders: ["Overhead Press", "Lateral Raise", "Front Raise", "Rear Delt Fly", "Shrugs"],
  Arms: ["Barbell Curl", "Hammer Curl", "Tricep Pushdown", "Skull Crushers", "Dips"],
  Core: ["Plank", "Crunches", "Hanging Leg Raise", "Russian Twist", "Mountain Climbers"],
  Cardio: ["Treadmill", "Cycling", "Skipping", "Cross Trainer", "Burpees"],
};

export const allExercises = Object.values(exerciseLibrary).flat();
