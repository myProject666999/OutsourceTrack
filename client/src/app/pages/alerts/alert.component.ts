import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Alert, PageResult } from '../../shared/models';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>预警催交</h2>
        <button class="btn btn-primary" (click)="generateAlerts()">生成预警</button>
      </div>

      <div class="filter-bar">
        <select [(ngModel)]="filter.alert_type" (ngModelChange)="loadAlerts()">
          <option [ngValue]="null">全部类型</option>
          <option [ngValue]="1">超期未交货</option>
          <option [ngValue]="2">异常损耗</option>
        </select>
        <select [(ngModel)]="filter.status" (ngModelChange)="loadAlerts()">
          <option [ngValue]="null">全部状态</option>
          <option [ngValue]="0">待处理</option>
          <option [ngValue]="1">已处理</option>
          <option [ngValue]="2">已忽略</option>
        </select>
        <select [(ngModel)]="filter.vendor_id" (ngModelChange)="loadAlerts()">
          <option [ngValue]="null">全部外协厂</option>
          <option *ngFor="let v of vendors" [ngValue]="v.id">{{ v.name }}</option>
        </select>
      </div>

      <div class="card">
        <table class="table" *ngIf="alerts.length; else noData">
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
                  <button class="btn btn-sm btn-secondary" (click)="updateStatus(a.id!, 2)">忽略</button>
                </ng-container>
                <span *ngIf="a.status !== 0">-</span>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noData><p>暂无预警数据</p></ng-template>
      </div>

      <div class="pagination" *ngIf="total > pageSize">
        <button class="btn btn-sm" [disabled]="page <= 1" (click)="changePage(page - 1)">上一页</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button class="btn btn-sm" [disabled]="page >= totalPages" (click)="changePage(page + 1)">下一页</button>
      </div>
    </div>
  `,
  styles: []
})
export class AlertComponent implements OnInit {
  alerts: Alert[] = [];
  vendors: { id?: number; name: string }[] = [];
  filter: { alert_type: number | null; status: number | null; vendor_id: number | null } = {
    alert_type: null, status: null, vendor_id: null
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
    let params = new URLSearchParams();
    params.set('page', String(this.page));
    params.set('pageSize', String(this.pageSize));
    if (this.filter.alert_type !== null) params.set('alert_type', String(this.filter.alert_type));
    if (this.filter.status !== null) params.set('status', String(this.filter.status));
    if (this.filter.vendor_id !== null) params.set('vendor_id', String(this.filter.vendor_id));

    const httpParams = this.buildHttpParams();
    this.apiService.listAlerts(httpParams).subscribe({
      next: (res) => {
        const data: PageResult<Alert> = res.data;
        this.alerts = data?.list || [];
        this.total = data?.total || 0;
      }
    });
  }

  private buildHttpParams(): any {
    let params: any = {};
    params['page'] = this.page;
    params['pageSize'] = this.pageSize;
    if (this.filter.alert_type !== null) params['alert_type'] = this.filter.alert_type;
    if (this.filter.status !== null) params['status'] = this.filter.status;
    if (this.filter.vendor_id !== null) params['vendor_id'] = this.filter.vendor_id;
    return params;
  }

  generateAlerts(): void {
    this.apiService.generateAlerts().subscribe({
      next: (res) => {
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
