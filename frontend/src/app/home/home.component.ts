import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartOptions, Plugin, ArcElement, Tooltip, Legend, DoughnutController,   LineController, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
import { BarController, BarElement } from 'chart.js';
import { first } from 'rxjs';


const centerTextPlugin: Plugin<'doughnut'> = {
  id: 'centerText',
  beforeDraw(chart) {
    const { width, height, ctx } = chart;
    const dataset = chart.data.datasets[0];
    const total = dataset.data[0] + dataset.data[1];
    const percentage = total > 0 ? Math.round((dataset.data[0] / total) * 100) : 0;



    ctx.save();

    ctx.font = 'bold 2.3em "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = percentage >= 50 ? '#4CAF50' : '#f44336';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${percentage}%`, width / 2, height / 2 + 25);
    ctx.restore();
  }
};

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);




Chart.register(
  ArcElement, Tooltip, Legend, DoughnutController,
  LineController, LineElement, PointElement, CategoryScale, LinearScale
);


Chart.register(BarController, BarElement);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatChipsModule, MatTableModule, MatCheckboxModule, MatIconModule, MatButtonModule, BaseChartDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  userId: number | null = null;
  dailyHabits: any[] = [];
  habitLogs: {habit_id: number, completed_date: string}[] = [];
  daysInRange: string[] = [];
  range: number = 30;
  displayedColumns: string[] = ['habit_name', 'quantity', 'done', 'delete', 'edit'];
  groupedMonths: { label: string, days: number}[] = [];
  weeklyHabits: any[] = [];
  weekRanges: string[] = [];
  weeklyLogs: { habit_id: number, week: string, done: boolean }[] = [];
  currentWeek: string = '';
  weekHistory: string[] = [];
  profile: any = null;
  monthlyHabits: any[] = [];
  monthlyLogs: { habit_id: number, completed_date: string}[] = [];
  monthlyHistory: { habit_id: number, month: string }[] = [];




  constructor(private authService: AuthService, private router: Router) {
    this.userId = this.authService.getUserId();
    
    if (this.userId) {
      this.authService
      .getUserDailyHabits(this.userId)
      .subscribe({
        next: (habits) => {
          console.log('Habitos del user', habits);
          this.dailyHabits = habits
          this.getDailyLogs();
        }
        ,error: () => {
          console.log('No se encontraron');
        }
      });

      this.authService.getUserWeeklyHabits(this.userId).subscribe({
        next: (habits) => {
          this.weeklyHabits = habits;
          this.getWeeklyLogs();
          this.generateWeeklyHistory();
          this.loadWeeklyGraph();
        },
        error: () => {
          console.log('No se encontraron weekly habits');
        }
      });
      

      this.authService.getUserMonthlyHabits(this.userId)
      .subscribe({
        next: (habits) => {
          this.monthlyHabits = habits;
          this.getMonthlyLogs();
          this.loadMonthlyGraph();
        },
        error: () => {
          console.log('No se encontraron los monthly habits');
        }
      });

    }
  }
  
  toggleDailyDone(habit: any){

    this.authService.updateDailyHabitDone(habit.id, habit.done)
    .subscribe({
      next: (response) => {
        console.log('Estado actualizado');

        const today = new Date().toISOString().split('T')[0];

        if (this.userId){
          if (habit.done) {
            this.authService.logHabitDone(habit.id, this.userId, today).subscribe({
              next: () => {
                console.log('Log creado');
                this.getDailyLogs();
              },
              error: err => console.error('Error al registrar el log', err)
            });
          } else {
            this.authService.logHabitFalse(habit.id, this.userId, today).subscribe({
              next: () => {
                console.log('Log eliminado');
                this.getDailyLogs();
              },
              error: err => console.error('Error al eliminar el log', err)
            });
          }
        }
      },
      error: (error) => {
        console.error('Error al actualizar', error);
      }
    })
  }


  showDailyForm: boolean = false;
  toggleDailyForm() {
    this.showDailyForm = !this.showDailyForm;
  }
 
  newDailyName: string = "";
  newDailyQuantity: number = 0;
  
  addDaily() {
    if( this.newDailyName.trim() !== "" && this.newDailyQuantity > 0 && this.userId) {
      this.authService.addDailyHabit(this.userId, this.newDailyName, this.newDailyQuantity)
      .subscribe({
        next: (habit) => {
          console.log("Habito agregado", habit);
          this.dailyHabits.push(habit);
          this.newDailyName = "";
          this.newDailyQuantity = 0;
          this.showDailyForm = false;

          this.loadDailyHabits();
        },
        error: (error) => {
          console.error("Error al agregar el habito ", error);
        }
      });

    } else {
      console.log("Por favor introduzca valores validos");
    }

  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadDailyHabits(){
    if(this.userId){
      this.authService.getUserDailyHabits(this.userId)
      .subscribe({
        next: (habits) => {
          console.log('Daily habits actualizados');
          this.dailyHabits = habits;
        },
        error: () => {
          console.log('No se han cargado los daily habits');
        }
      })
    }
  }

  deleteDailyHabit(dailyId: number) {
    this.authService.deleteDailyHabit(dailyId).subscribe({
      next: () => {
        this.dailyHabits = this.dailyHabits.filter(h => h.id !== dailyId);
      },
      error: (error) => {
        console.error('Error al eliminar', error);
      }
    });
    
  }

  habitEditedId: number | null = null;
  editedName = '';
  editedQuantity = 0;

  startEdit(habit: any){
    this.habitEditedId = habit.id;
    this.editedName = habit.habit_name;
    this.editedQuantity = habit.quantity;
  }

  cancelEdit(){
    this.habitEditedId = null;
  }

  saveEdit(dailyId: number) {
    this.authService.updateDailyHabit(dailyId, this.editedName, this.editedQuantity).subscribe({
      next: (response) => {
        const edited = this.dailyHabits.findIndex(h=> h.id === dailyId);
        if (edited > -1) {
          this.dailyHabits[edited].habit_name = this.editedName;
          this.dailyHabits[edited].quantity = this.editedQuantity;
        }
        this.habitEditedId = null;
        this.editedName = '';
        this.editedQuantity = 0;
      },
      error: (error) => {
        console.error('Error al guardar cambios', error);
      }
    });
  }

  generatorDaysInRange(){
    const today = new Date();
    this.daysInRange = [];
    const tempMonths: { [key: string]: number } = {};

    for (let i = this.range - 1; i >= 0; i--){
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      this.daysInRange.push(d.toISOString().split('T')[0]);
      
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      tempMonths[monthLabel] = (tempMonths[monthLabel] || 0) + 1;
    }
    this.groupedMonths = Object.entries(tempMonths).map(([label, days]) => ({ label, days }));

  }

  getDailyLogs() {
    if (this.userId) {
      this.authService.getUserDailyLogs(this.userId, this.range).subscribe({
        next: (data) => {
          this.habitLogs = data;
          this.generatorDaysInRange();
          this.updateCompletionChart();
        },
        error: (error) => {
          console.error('Error cargando logs', error);
        }
      });
    }
  }

  getDailyDayStatus(habit: any, date: string): 'done' | 'not-done' | 'not-exist' {
    if (!habit.creation_date) return 'not-exist';

    const habitDate = habit.creation_date.split('T')[0];

    if ( date < habitDate) return 'not-exist';

    return this.habitLogs.some(log => log.habit_id === habit.id && log.completed_date === date)
     ? 'done'
     : 'not-done'; 
  }

  selectedRange: number = 30;
  changeRange(days: number) {
    this.selectedRange = days;
    this.range = days;
    this.getDailyLogs();
  }


  //GRAFICO
doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Completados', 'No completados'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#66bb6a', '#ef5350'],
      borderRadius: 10,
      hoverOffset: 10
    }]
};

centerTextPlugin = centerTextPlugin;

doughnutChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  cutout: '55%',
  animation: {
    duration: 1200,
    easing: 'easeOutBounce'
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 14
        }
      }
    },
    tooltip: {
      enabled: true
    }
  }
};
updateCompletionChart(): void {
  const days = this.daysInRange;
  let done = 0;
  let total = 0;

  for (const habit of this.dailyHabits) {
    for(const day of days) {
      const status = this.getDailyDayStatus(habit, day);
      if (status === 'done'){
        done++;
        total++;
      }
      if (status === 'not-done') total++;
    }
  }

  this.doughnutChartData = {
    labels: ['Completados', 'No completados'],
    datasets: [{
      data: [done, total - done],
      backgroundColor: ['#66bb6a', '#ef5350'],
      hoverOffset: 8
    }]
  };
}

getMotivationalMessage(): string {
  const [done, notDone] = this.doughnutChartData.datasets[0].data;
  const total = done + notDone;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  if (percentage >= 80) return '¡Buen trabajo! 🎉';
  if (percentage >= 50) return 'Vas bien 💪';
  return 'Puedes mejorar 👀';
}
  //WEEKLY

  getWeeklyLogs() {
    if (this.userId) {
      this.authService.getUserWeeklyLogs(this.userId).subscribe({
        next: (logs) => {
          this.weeklyLogs = logs;
        },
        error: () => {
          console.error('Error cargando logs semanales');
        }
      });
    }
  }
  

  generateWeeklyHistory() {
    const today = new Date();
    const currentMonday = new Date(today.setDate(today.getDate() - ((today.getDay() + 6) % 7)));
  
    this.currentWeek = currentMonday.toISOString().split('T')[0];
    this.weekHistory = [this.currentWeek];
  
    for (let i = 1; i <= 4; i++) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(currentMonday.getDate() - (7 * i));
      this.weekHistory.push(weekStart.toISOString().split('T')[0]);
    }
  }
  

  habitExistsThatWeek(habit: any, week: string): boolean {
    return habit.created_at <= week;
  }
  

  getHistoryStatus(habit: any, week: string): 'done' | 'not-done' | 'not-exist' {
    if (!this.habitExistsThatWeek(habit, week)) return 'not-exist';
  
    const log = this.weeklyLogs.find(l => l.habit_id === habit.id && l.week === week);
    return log?.done ? 'done' : 'not-done';
  }
  
  
  isWeeklyDone(habit: any): boolean {
    return this.weeklyLogs.some(log => log.habit_id === habit.id && log.week === this.currentWeek && log.done);
  }
  
  toggleWeeklyDone(habit: any) {
    const isDone = this.isWeeklyDone(habit);
  
    if (this.userId) {
      if (isDone) {
        this.authService.logWeeklyFalse(habit.id, this.userId, this.currentWeek).subscribe(() => {
          this.getWeeklyLogs();
          this.loadWeeklyGraph();
        });
      } else {
        this.authService.logWeeklyDone(habit.id, this.userId, this.currentWeek).subscribe(() => {
          this.getWeeklyLogs();
          this.loadWeeklyGraph();
        });
      }
    }
  }

  weeklyHabitEditedId: number | null = null;
  editedWeeklyName = '';
  editedWeeklyQuantity = 0;

  startEditWeekly(habit: any){
    this.weeklyHabitEditedId = habit.id;
    this.editedWeeklyName = habit.habit_name;
    this.editedWeeklyQuantity = habit.quantity;
  }

  cancelEditWeekly(){
    this.weeklyHabitEditedId = null;
    this.editedWeeklyName = '';
    this.editedWeeklyQuantity = 0;
  }

  saveEditWeekly(habitId: number) {
    this.authService.updateWeeklyHabit(habitId, this.editedWeeklyName, this.editedWeeklyQuantity)
    .subscribe({
      next: () => {
        const index = this.weeklyHabits.findIndex(h => h.id === habitId);
        if (index !== -1) {
          this.weeklyHabits[index].habit_name = this.editedWeeklyName;
          this.weeklyHabits[index].quantity = this.editedWeeklyQuantity;
        }
        this.cancelEditWeekly();
      },
      error: err => {
        console.error('Error al guardar cambios del hábito semanal', err);
      }
    });
  }

  deleteWeeklyHabit(habitId: number) {
    this.authService.deleteWeeklyHabit(habitId).subscribe({
      next: () => {
        this.weeklyHabits = this.weeklyHabits.filter(h => h.id !== habitId);
      },
      error: err => {
        console.error('Error al eliminar hábito semanal', err);
      }
    });
  }

  showWeeklyForm: boolean = false;
  newWeeklyName: string = '';
  newWeeklyQuantity: number = 0;
  toggleWeeklyForm() {
    this.showWeeklyForm = !this.showWeeklyForm;
  }

  getMondayOfToday(): string {
    const today = new Date();
    const monday = new Date(today.setDate(today.getDate() - ((today.getDay() + 6) % 7)));
    return monday.toISOString().split('T')[0];
  }

  addWeeklyHabit() {
    const createdAt = this.getMondayOfToday();

    if (this.newWeeklyName.trim() !== '' && this.newWeeklyQuantity > 0 && this.userId) {
      this.authService.addWeeklyHabit(this.userId, this.newWeeklyName, this.newWeeklyQuantity, createdAt)
      .subscribe({
        next: (habit) => {
          this.weeklyHabits.push(habit);
          this.newWeeklyName = '';
          this.newWeeklyQuantity = 0;
          this.showWeeklyForm = false;
          this.getWeeklyLogs();
        },
        error: (err) => {
          console.error('Error al agregar hábito semanal', err);
        }
      });
    } else {
      console.log('Por favor, introduzca valores válidos');
    }
  }

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Hábitos Completados por Semana',
        fill: true,
        tension: 0.4,
        borderColor: '#6d6875'
      }
    ]
  };




  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      x: {
        ticks: {
          font: {
            size: 14,
            weight: 600
          },
          color: '#555'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1, 
          precision: 0,
          font: {
            size: 14,
            weight: 600
          },
          color: '#555'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#333'
        }
      }
    }
  };


  loadWeeklyGraph() {
    if(this.userId){

      
      this.authService.getUserWeeklyCount(this.userId).subscribe({
        next: (data) => {
          const values = data.map(d => d.completed_count);
          const min = 0;
          const max = this.weeklyHabits.length;

          const getColor = (value: number): string => {
            const percent = (value - min) / (max - min || 1);

            let r, g;
            if (percent < 0.5) {
              r = 255;
              g = Math.round(165 * (percent / 0.5));
            } else {
              r = Math.round(255 * (1 - (percent - 0.5) / 0.5));
              g = Math.round(165 + (128 - 165) * ((percent - 0.5) / 0.5));
            }

            return `rgb(${r},${g},0)`;
          };

          const pointColors = values.map(v => getColor(v));

          this.lineChartData = {
            labels: data.map(d => d.week),
            datasets: [
              {
                data: data.map(d => d.completed_count),
                label: 'Hábitos Completados por Semana',
                fill: true,
                tension: 0.4,
                borderColor: 'black',
                pointBorderColor: pointColors,
                pointBackgroundColor: pointColors,
                pointHoverBorderColor: pointColors,
                pointHoverBackgroundColor: pointColors,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBorderWidth: 5,
                pointStyle: 'circle'
              }
            ]
          };
        },
        error: () => {
          console.error('Error al cargar los datos');
        }
      })
    }
    ;
  }

  

  hasLineChartData(): boolean {
    return Array.isArray(this.lineChartData.labels) && this.lineChartData.labels.length > 2;
  }
  
  goToProfile(){
    this.router.navigate(['/profile']);
  }


  // MONTHLY

  getMonthlyLogs() {
    if (this.userId !== null){
      this.authService.getUserMonthlyLogs(this.userId)
      .subscribe({
        next: (logs) => {
          this.monthlyLogs = logs;
        },
        error: () => {
          console.error('Error al cargar los logs');
        }
      });
    }
    
  }

  getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  isMonthlyDone(habit: any): boolean {
    const month = this.getCurrentMonth();
    return this.monthlyLogs.some(log => log.habit_id === habit.id && log.completed_date === month);
  }

  toggleMonthlyDone(habit: any) {
    const month = this.getCurrentMonth();
    const isDone = this.isMonthlyDone(habit);

    if ( this.userId !== null){
      if (isDone) {
      this.authService.logMonthlyFalse(habit.id, this.userId, month)
      .subscribe({
        next: () => {
          this.getMonthlyLogs(); 
          this.loadMonthlyGraph();
        },
        error: () => console.error('Error al eliminar el monthly log')
      });
      } else {
        this.authService.logMonthlyDone(habit.id, this.userId, month)
        .subscribe({
          next: () => {
            this.getMonthlyLogs();
            this.loadMonthlyGraph();
          },
          error: () => console.error('Error al crear el monthly log')
        });
      }
    }
    
  }


  monthlyHabitEditedId: number | null = null;
  editedMonthlyName = '';
  editedMonthlyQuantity = 0;

  showMonthlyForm = false;
  newMonthlyName = '';
  newMonthlyQuantity = 1;

  startEditMonthly(habit: any) {
    this.monthlyHabitEditedId = habit.id;
    this.editedMonthlyName = habit.habit_name;
    this.editedMonthlyQuantity = habit.quantity;
  }

  cancelEditMonthly() {
    this.monthlyHabitEditedId = null;
    this.editedMonthlyName = '';
    this.editedMonthlyQuantity = 0;
  }

  saveEditMonthly(habitId: number) {
    this.authService.updateMonthlyHabit(habitId, this.editedMonthlyName, this.editedMonthlyQuantity).subscribe({
      next: () => {
        const index = this.monthlyHabits.findIndex(h => h.id === habitId);
        if (index !== -1) {
          this.monthlyHabits[index].habit_name = this.editedMonthlyName;
          this.monthlyHabits[index].quantity = this.editedMonthlyQuantity;
        }
        this.cancelEditMonthly();
      },
      error: err => console.error('Error al editar hábito mensual', err)
    });
  }
  
  deleteMonthlyHabit(habitId: number) {
    this.authService.deleteMonthlyHabit(habitId).subscribe({
      next: () => {
        this.monthlyHabits = this.monthlyHabits.filter(h => h.id !== habitId);
      },
      error: err => console.error('Error al eliminar hábito mensual', err)
    });
  }
  
  addMonthlyHabit() {
    if (this.newMonthlyName.trim() !== '' && this.newMonthlyQuantity > 0 && this.userId) {
      this.authService.addMonthlyHabit(this.userId, this.newMonthlyName, this.newMonthlyQuantity).subscribe({
        next: (habit) => {
          this.monthlyHabits.push(habit);
          this.newMonthlyName = '';
          this.newMonthlyQuantity = 1;
          this.showMonthlyForm = false;
        },
        error: err => console.error('Error al crear hábito mensual', err)
      });
    }
  }

  toggleMonthlyForm() {
    this.showMonthlyForm = !this.showMonthlyForm;
  }
  
  //GRAFICO
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        ticks: {
          font: { size: 14 }
        }
      },
      y: {
        stacked: true,
        ticks: {
          stepSize: 1,
          precision: 0
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 14 }
        }
      }
    }
  };
  

  loadMonthlyGraph() {
    if (this.userId){
      this.authService.getMonthlyHistory(this.userId).subscribe({
      next: (logs) => {
        this.monthlyHistory = logs;

        
        this.generateMonthlyChartData();
      },
      error: () => {
        console.error('Error al obtener historial mensual');
      }
    });
    }
    
  }

  generateMonthlyChartData() {
    const months = this.getLast6Months();
  
    this.barChartData = {
      labels: months,
      datasets: this.monthlyHabits.map((habit, index) => {
        const data = months.map(month =>
          this.monthlyHistory.some(log => log.habit_id === habit.id && log.month === month) ? 1 : 0
        );
  
        return {
          label: habit.habit_name,
          data,
          backgroundColor: this.getColor(index),
          stack: 'monthly'
        };
      })
    };
  }

  getLast6Months(): string[] {
    const months: string[] = [];
  
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }
  
    return months;
  }
  
  getColor(index: number): string {
    const colors = ['#2ecc71', '#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#1abc9c'];
    return colors[index % colors.length];
  }
  

}
