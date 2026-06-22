import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';
import { Alert, PageResult } from '../../shared/models';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>预警催交</h1>
        <button class="btn btn-primary" (click)="generateAlerts()">生成预警</button>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="form-group">
            <label>预警类型</label>
            <select class="form-control" [(ngModel)]="filter.alert_type" (ngModelChange)="loadAlerts()">
              <option value="">全部类型</option>
              <option value="1">超期未交货</option>
              <option value="2">异常损耗</option>
            </select>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select class="form-control" [(ngModel)]="filter.status" (ngModelChange)="loadAlerts()">
              <option value="">全部状态</option>
              <option value="0">待处理</option>
              <option value="1">已处理</option>
              <option value="2">已忽略</option>
            </select>
          </div>
          <div class="form-group">
            <label>外协厂</label>
            <select class="form-control" [(ngModel)]="filter.vendor_id" (ngModelChange)="loadAlerts()">
              <option value="">全部外协厂</option>
              <option *ngFor="let v of vendors" [value]="v.id">{{ v.name }}</option>
            </select>
          </div>
        </div>

        <table *ngIf="alerts.length > 0">
          <thead>
            <tr>
              <th>订单号</th>
              <th>外协厂</th>
              <th>预警类型</th>
              <th>预警日期</th>
              <th>状态</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of alerts">
              <td>{{ a.order_no }}</td>
              <td>{{ a.vendor_name }}</td>
              <td>
                <span class="badge" [class.badge-danger]="a.alert_type === 1" [class.badge-warning]="a.alert_type === 2">
                  {{ alertTypeText(a.alert_type) }}
                </span>
              </td>
              <td>{{ a.alert_date }}</td>
              <td>
                <span class="badge" [class.badge-danger]="a.status === 0" [class.badge-success]="a.status === 1" [class.badge-gray]="a.status === 2">
                  {{ statusText(a.status) }}
                </span>
              </td>
              <td>{{ a.remark }}</td>
              <td>
                <ng-container *ngIf="a.status === 0">
                  <button class="btn btn-sm btn-success" (click)="updateStatus(a.id!, 1)">已处理</button>
                  <button class="btn btn-sm btn-outline" (click)="updateStatus(a.id!, 2)">忽略</button>
                </ng-container>
                <span *ngIf="a.status !== 0">-</span>
              </td>
            </tr>
          </tbody>
        </table>
        <table *ngIf="alerts.length === 0">
          <tbody>
            <tr>
              <td colspan="7" class="empty">暂无预警数据</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" *ngIf="total > pageSize">
          <span>共 {{ total }} 条，第 {{ page }} / {{ totalPages }} 页</span>
          <div class="pagination-buttons">
            <button class="btn btn-sm" [disabled]="page <= 1" (click)="changePage(page - 1)">上一页</button>
            <button class="btn btn-sm" [disabled]="page >= totalPages" (click)="changePage(page + 1)">下一页</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AlertComponent implements OnInit {
  alerts: Alert[] = [];
  vendors: { id?: number; name: string }[] = [];
  filter: { alert_type: string; status: string; vendor_id: string } = {
    alert_type: '', status: '', vendor_id: ''
  };
  page = 1;
  pageSize = 20;
  total = 0;

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadVendors();
    this.loadAlerts();
  }

  loadVendors(): void {
    this.apiService.listVendors().subscribe({
      next: (res) => { this.vendors = res.data?.list || []; }
    });
  }

  loadAlerts(): void {
    let params = new HttpParams();
    params = params.set('page', String(this.page));
    params = params.set('pageSize', String(this.pageSize));
    if (this.filter.alert_type !== '') params = params.set('alert_type', this.filter.alert_type);
    if (this.filter.status !== '') params = params.set('status', this.filter.status);
    if (this.filter.vendor_id !== '') params = params.set('vendor_id', this.filter.vendor_id);

    this.apiService.listAlerts(params).subscribe({
      next: (res) => {
        const data: PageResult<Alert> = res.data;
        this.alerts = data?.list || [];
        this.total = data?.total || 0;
      }
    });
  }

  generateAlerts(): void {
    this.apiService.generateAlerts().subscribe({
      next: () => {
        this.loadAlerts();
      }
    });
  }

  updateStatus(id: number, status: number): void {
    this.apiService.updateAlertStatus(id, status).subscribe({
      next: () => { this.loadAlerts(); }
    });
  }

  changePage(p: number): void {
    this.page = p;
    this.loadAlerts();
  }

  alertTypeText(type: number): string {
    return type === 1 ? '超期未交货' : '异常损耗';
  }

  statusText(status?: number): string {
    if (status === 0) return '待处理';
    if (status === 1) return '已处理';
    if (status === 2) return '已忽略';
    return '未知';
  }
}
