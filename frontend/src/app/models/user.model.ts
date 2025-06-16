export interface UserWithHabits {
    id: number;
    username: string;
    email: string;
    role: string;
    dailyHabits: any[];
    weeklyHabits: any[];
    monthlyHabits: any[];
  }