import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';
import { OverviewStats, Alert } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>工作台</h1>
      </div>

      <div class="stat-cards">
        <div class="stat-card primary">
          <div class="stat-value">{{ stats?.total_vendors ?? '-' }}</div>
          <div class="stat-label">外协厂数</div>
        </div>
        <div class="stat-card primary">
          <div class="stat-value">{{ stats?.total_orders ?? '-' }}</div>
          <div class="stat-label">订单总数</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">{{ stats?.active_orders ?? '-' }}</div>
          <div class="stat-label">在制订单</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">{{ stats?.overdue_orders ?? '-' }}</div>
          <div class="stat-label">超期订单</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">{{ stats?.total_issued ?? '-' }}</div>
          <div class="stat-label">发料总量</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">{{ stats?.total_received ?? '-' }}</div>
          <div class="stat-label">收货总量</div>
        </div>
        <div class="stat-card primary">
          <div class="stat-value">{{ stats?.in_process ?? '-' }}</div>
          <div class="stat-label">在制数量</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">{{ stats?.pending_alerts ?? '-' }}</div>
          <div class="stat-label">待处理预警</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">待处理预警</div>
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>外协厂</th>
              <th>预警类型</th>
              <th>预警日期</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let alert of alerts">
              <td>{{ alert.order_no }}</td>
              <td>{{ alert.vendor_name }}</td>
              <td>
                <span [class.badge-danger]="alert.alert_type === 1" [class.badge-warning]="alert.alert_type === 2" class="badge">
                  {{ alert.alert_type === 1 ? '超期未交货' : alert.alert_type === 2 ? '异常损耗' : '未知' }}
                </span>
              </td>
              <td>{{ alert.alert_date }}</td>
              <td>{{ alert.remark || '-' }}</td>
            </tr>
            <tr *ngIf="alerts.length === 0">
              <td colspan="5" style="text-align:center;color:#94a3b8;">暂无待处理预警</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  stats: OverviewStats | null = null;
  alerts: Alert[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getOverview().subscribe({
      next: (res) => {
        if (res.code === 0) {
          this.stats = res.data;
        }
      }
    });

    this.apiService.listAlerts(
      new HttpParams().set('status', '0')
    ).subscribe({
      next: (res) => {
        if (res.code === 0) {
          this.alerts = res.data.list;
        }
      }
    });
  }
}
