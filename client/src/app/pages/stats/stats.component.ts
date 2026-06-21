import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { VendorStats } from '../../shared/models';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>统计分析</h2>
      </div>

      <div class="card" *ngIf="loading && !comparison.length">
        <p>加载中...</p>
      </div>

      <div class="card" *ngIf="!loading && !comparison.length">
        <p>暂无数据</p>
      </div>

      <div class="card" *ngIf="comparison.length">
        <h3>外协厂对比</h3>
        <table class="table">
          <thead>
            <tr>
              <th>外协厂</th>
              <th>总项数</th>
              <th>已收货</th>
              <th>交货率</th>
              <th>合格率</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of comparison" class="clickable-row" (click)="selectVendor(v)">
              <td>{{ v.vendor_name }}</td>
              <td>{{ v.total_items }}</td>
              <td>{{ v.total_received }}</td>
              <td>{{ v.delivery_rate?.toFixed(1) }}%</td>
              <td>{{ v.quality_rate?.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card" *ngIf="vendorDetail">
        <div class="detail-header">
          <h3>{{ vendorDetail.vendor?.name || vendorDetail.vendor?.vendor_name }} - 详细统计</h3>
          <button class="btn btn-sm btn-secondary" (click)="vendorDetail = null">关闭</button>
        </div>

        <div class="filter-bar">
          <label>起始日期: <input type="date" [(ngModel)]="startDate" (ngModelChange)="loadDetail()"></label>
          <label>截止日期: <input type="date" [(ngModel)]="endDate" (ngModelChange)="loadDetail()"></label>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">订单总数</span>
            <span class="stat-value">{{ vendorDetail.orders?.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已完成</span>
            <span class="stat-value">{{ vendorDetail.orders?.completed }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">订单总额</span>
            <span class="stat-value">{{ vendorDetail.orders?.total_amount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">交货率</span>
            <span class="stat-value">{{ vendorDetail.delivery?.delivery_rate?.toFixed(1) }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">合格率</span>
            <span class="stat-value">{{ vendorDetail.quality?.quality_rate?.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StatsComponent implements OnInit {
  comparison: any[] = [];
  vendorDetail: VendorStats | null = null;
  selectedVendorId: number | null = null;
  startDate = '';
  endDate = '';
  loading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadComparison();
  }

  loadComparison(): void {
    this.loading = true;
    this.apiService.getVendorsComparison().subscribe({
      next: (res) => {
        this.comparison = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  selectVendor(v: any): void {
    this.selectedVendorId = v.vendor_id;
    this.loadDetail();
  }

  loadDetail(): void {
    if (!this.selectedVendorId) return;
    this.apiService.getVendorStats(this.selectedVendorId, this.startDate || undefined, this.endDate || undefined).subscribe({
      next: (res) => { this.vendorDetail = res.data; }
    });
  }
}
