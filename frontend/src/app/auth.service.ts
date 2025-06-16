import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { UserWithHabits } from '../app/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiAuthUrl = 'http://localhost:3000/api/auth';
  private apiUserUrl = 'http://localhost:3000/api/user';
  private apiHabitsUrl = 'http://localhost:3000/api/user';
  private apiUpdateDone = 'http://localhost:3000/api/user/updateDone';
  private apiLogs = 'http://localhost:3000/api/logs'
  private apiWeekly = 'http://localhost:3000/api/weekly/weekly-habits'
  private apiWeeklyDone = 'http://localhost:3000/api/weekly'
  private apiWeeklyLogs = 'http://localhost:3000/api/weekly/weekly-logs'
  private apiMonthly = 'http://localhost:3000/api/monthly/monthly-habits';
  private apiMonthlyLogs = 'http://localhost:3000/api/monthly/monthly-logs';
  private apiAdmin = 'http://localhost:3000/api/admin'

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    return new Observable(observer => {
      this.http.post(`${this.apiAuthUrl}/login`, { username, password })
      .subscribe({
        next: (response: any) => {
          if(response.token) {
            localStorage.setItem('token', response.token);
            observer.next(response);
          } else {
            observer.error('No se recibio el token');
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiAuthUrl}/register`, { username, email, password });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try{
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (error) {
      return null;
    }
  }

  deleteAccount(userId: number) {
    return this.http.delete(`${this.apiAuthUrl}/delete/${userId}`);
  }

  getUserProfile(userId: number) {
    return this.http.get<UserWithHabits>(`${this.apiUserUrl}/profile/${userId}`);
  }

  changePassword(userId: number, currentPassword: string, newPassword: string){
    return this.http.post(`${this.apiUserUrl}/change-password`, {
      userId,
      currentPassword,
      newPassword
    });
  }

  getUserDailyHabits(userId: number): Observable<any> {
    return this.http.get(`${this.apiHabitsUrl}/daily-habits/${userId}`);
  }

  updateDailyHabitDone(habitId: number, done: boolean): Observable<any> {
    return this.http.patch(`${this.apiUpdateDone}/daily/${habitId}`, { done });
  }

  addDailyHabit(userId: number, name: string, quantity: number): Observable <any> {
    return this.http.post(`${this.apiHabitsUrl}/daily-habits`, {userId, name, quantity});
  }

  deleteDailyHabit(dailyId: number) {
    return this.http.delete(`${this.apiHabitsUrl}/daily-habits/${dailyId}`);
  }

  updateDailyHabit(dailyId: number, habit_name: string, quantity: number) {
    return this.http.patch(`${this.apiHabitsUrl}/updateHabit/daily/${dailyId}`, {
      habit_name,
      quantity
    });
  }

  logHabitDone(habitId: number, userId: number, completedDate: string) {
    return this.http.post(`${this.apiLogs}/daily-logs`, {
      habitId,
      userId,
      completedDate
    });
  }

  logHabitFalse(habitId: number, userId: number, completedDate: string) {
    return this.http.request('DELETE', `${this.apiLogs}/daily-logs`, {
      body: {
        habitId,
        userId,
        completedDate
      }
    });
  }

  getUserDailyLogs(userId: number, range: number = 30) {
    return this.http.get<any[]>(`http://localhost:3000/api/logs/daily-logs/${userId}?range=${range}`);
  }
  


  //WEEKLY 

  getUserWeeklyHabits(userId: number) {
    return this.http.get<any>(`${this.apiWeekly}/${userId}`);
  }

  getUserWeeklyLogs(userId: number) {
    return this.http.get<{ habit_id: number, week: string, done: boolean }[]>(
      `${this.apiWeeklyLogs}/${userId}`
    );
  }

  getUserWeeklyCount(userId: number) {
    return this.http.get<any[]>(`${this.apiWeeklyLogs}/completed-count/${userId}`);
  }

  logWeeklyDone(habitId: number, userId: number, completedDate: string) {
    return this.http.post( `${this.apiWeeklyLogs}` , {
      habitId,
      userId,
      completedDate
    }).pipe(
      switchMap(() => this.http.patch(`${this.apiWeeklyDone}/updateDone/${habitId}`, {done: true}))
    );
  }
  
  logWeeklyFalse(habitId: number, userId: number, completedDate: string) {
    return this.http.request('DELETE', `${this.apiWeeklyLogs}` , {
      body: {
        habitId,
        userId,
        completedDate
      }
    }).pipe(
      switchMap(() => this.http.patch(`${this.apiWeeklyDone}/updateDone/${habitId}`, {done: false}))
    );
  }

  updateWeeklyHabit(habitId: number, habit_name: string, quantity: number) {
    return this.http.patch(`http://localhost:3000/api/weekly/updateHabit/weekly/${habitId}`, {
      habit_name,
      quantity
    });
  }
  
  deleteWeeklyHabit(habitId: number) {
    return this.http.delete(`${this.apiWeekly}/${habitId}`);
  }  
  
  addWeeklyHabit(userId: number, name: string, quantity: number, createdAt: string) {
    return this.http.post(`${this.apiWeekly}`, {
      userId,
      name,
      quantity,
      created_at: createdAt
    });
  }

  //MONTHLY

  getUserMonthlyHabits(userId: number) {
    return this.http.get<any[]>(`${this.apiMonthly}/${userId}`);
  }

  addMonthlyHabit(userId : number, name: string, quantity: number) {
    return this.http.post(`${this.apiMonthly}`, {
      userId,
      name,
      quantity
    });
  }

  updateMonthlyHabit(habitId: number, name: string, quantity: number) {
    return this.http.patch(`${this.apiMonthly}/${habitId}`, {
      habit_name: name,
      quantity
    });
  }

  deleteMonthlyHabit(habitId: number) {
    return this.http.delete(`${this.apiMonthly}/${habitId}`);
  }


  //MONTHLY LOGS

  getUserMonthlyLogs(userId: number){
    return this.http.get<any[]>(`${this.apiMonthlyLogs}/${userId}`);
  }

  logMonthlyDone(habitId: number, userId: number, completedDate: string) {
    return this.http.post(`${this.apiMonthlyLogs}`, {
      habitId,
      userId,
      completedDate
    });
  }

  logMonthlyFalse(habitId: number, userId: number, completedDate: string){
    return this.http.delete(`${this.apiMonthlyLogs}`, {
      body: {
        habitId,
        userId,
        completedDate
      }
    });
  }

  getMonthlyHistory(userId: number) {
    return this.http.get<{ habit_id: number, month: string }[]>(`${this.apiMonthlyLogs}/history/${userId}`);
  }

  //STATS
  getMonthlyStats(userId: number) {
    return this.http.get<any>(`http://localhost:3000/api/stats/completed-logs/${userId}`);
  }

  getUserHabitDoneCount(userId: number) {
    return this.http.get<{ daily: number; weekly: number; monthly: number}>(`${this.apiUserUrl}/done-count/${userId}`);
  }

  //ADMIN

  getAdminStats() {
    return this.http.get<{
      totalUsers: number; 
      totalHabits:{ daily: number; weekly: number; monthly: number;};
      avgDailyPerUser: string;
      avgWeeklyPerUser: string;
      avgMonthlyPerUser: string;
   }>(`${this.apiAdmin}/stats`);
  }
  
  getAllUsers() {
    return this.http.get<any[]>(`${this.apiAdmin}/users`);
  }

}
