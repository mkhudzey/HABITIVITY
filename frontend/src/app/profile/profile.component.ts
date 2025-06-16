import { Component, signal, computed } from '@angular/core';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';
import { UserWithHabits } from '../models/user.model';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData } from 'chart.js';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  user = signal<UserWithHabits | null>(null);
  error = signal<string | null>(null);

  doneCount = { daily: 0, weekly: 0, monthly: 0};


  chartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { label: 'Diarios', data: [] },
      { label: 'Semanales', data: [] },
      { label: 'Mensuales', data: [] }
    ]
  };


  constructor(
    private authService: AuthService, 
    private http: HttpClient, 
    private router: Router, 
    private snackBar: MatSnackBar, 
    private dialog: MatDialog) 
    
    {
    const userId = this.authService.getUserId();
    
    if (userId) {
      this.authService.getUserProfile(userId).subscribe({
        next: (userData: UserWithHabits) => {
          this.user.set(userData);
        },
        error: () => {
          this.error.set('Error al cargar el perfil');
        }
      });

      this.authService.getMonthlyStats(userId).subscribe({
        next: (stats) => {
          this.chartData = {
            labels: stats.labels,
            datasets: [
              { 
                label: 'Diarios',
                data: stats.daily,
                borderColor: '#42A5F5',
                backgroundColor: '#42A5F5',
                tension: 0.4,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6 
              },
              { 
                label: 'Semanales',
                data: stats.weekly,
                borderColor: '#66BB6A',
                backgroundColor: '#66BB6A',
                tension: 0.4,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6 
              },
              { 
                label: 'Mensuales',
                data: stats.monthly,
                borderColor: '#9b59b6',
                backgroundColor: '#9b59b6',
                tension: 0.4,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          };
        },
        error: () => {
          console.error('Error al cargar estadísticas');
        }
      });

      this.authService.getUserHabitDoneCount(userId).subscribe({
        next: (counts) => {
          this.doneCount = counts;
        },
        error: () => {
          console.error('Error al obtener los logros');
        }
      })
      
    }
  }
  
  username = computed(() => this.user()?.username ?? 'Usuario');

  

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.snackBar.open('Cesion cerrada', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-toast']
    });
  }
  
  deleteAccount() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);


    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const userId = this.authService.getUserId();

        if (userId) {
          this.authService.deleteAccount(userId).subscribe({
            next: () => {
              this.authService.logout();
              this.router.navigate(['/login']);
              this.snackBar.open('Cuenta eliminada', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-toast']
              });
              
            },
            error: () => {
              this.error.set('Error al eliminar la cuenta');
            }
          });
        }
      }
    });
    
  }
  
  changePassword() {
    this.dialog.open(ChangePasswordDialogComponent);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToAdminDashboard(){
      this.router.navigate(['/admin-dashboard']);
  }
  
  //ESTADISTICAS

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: { size: 14 }
        }
      },
      tooltip: {
        titleFont: { size: 13 },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      x: {
        ticks: {
          font: { size: 13 },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        ticks: {
          font: { size: 13 },
          beginAtZero: true
        }
      }
    }
  };
  


}

