import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../shared/api.service';
import { VendorBalance } from '../../shared/models';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>在制料账</h1>
        <button class="btn btn-primary" (click)="refresh()">刷新</button>
      </div>

      <div class="card" *ngIf="loading && !balances.length">
        <p>加载中...</p>
      </div>

      <div class="card" *ngIf="!loading && !balances.length">
        <p>暂无数据</p>
      </div>

      <div *ngFor="let vb of balances; trackBy: trackByVendor" class="card">
        <div class="vendor-row" (click)="toggleVendor(vb)">
          <span class="expand-icon">{{ expandedVendorId === vb.vendor.id ? '▼' : '▶' }}</span>
          <strong>{{ vb.vendor.name || vb.vendor.vendor_name }}</strong>
          <span class="stats">
            订单: {{ vb.summary.total_orders }} |
            发料: {{ vb.summary.total_issued }} |
            收货: {{ vb.summary.total_received }} |
            合格: {{ vb.summary.total_qualified }} |
            在制: {{ vb.summary.in_process }} |
            <span [class.text-danger]="vb.summary.overdue_count > 0">超期: {{ vb.summary.overdue_count }}</span>
          </span>
        </div>

        <div *ngIf="expandedVendorId === vb.vendor.id && vendorDetail" class="vendor-detail">
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>订单日期</th>
                <th>交货日期</th>
                <th>状态</th>
                <th>金额</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of vendorDetail.orders">
                <td>{{ order.order_no }}</td>
                <td>{{ order.order_date }}</td>
                <td>{{ order.delivery_date }}</td>
                <td>{{ orderStatusText(order.status) }}</td>
                <td>{{ order.total_amount }}</td>
              </tr>
            </tbody>
          </table>
          <p class="computed-at">计算时间: {{ vendorDetail.computed_at }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class BalanceComponent implements OnInit {
  balances: VendorBalance[] = [];
  expandedVendorId: number | null = null;
  vendorDetail: VendorBalance | null = null;
  loading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadBalances();
  }

  loadBalances(): void {
    this.loading = true;
    this.apiService.getAllVendorBalances().subscribe({
      next: (res) => {
        this.balances = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleVendor(vb: VendorBalance): void {
    if (this.expandedVendorId === vb.vendor.id) {
      this.expandedVendorId = null;
      this.vendorDetail = null;
      return;
    }
    this.expandedVendorId = vb.vendor.id!;
    this.apiService.getVendorBalance(vb.vendor.id!).subscribe({
      next: (res) => { this.vendorDetail = res.data; }
    });
  }

  refresh(): void {
    this.expandedVendorId = null;
    this.vendorDetail = null;
    this.apiService.refreshBalance({}).subscribe({
      next: () => { this.loadBalances(); }
    });
  }

  orderStatusText(status?: number): string {
    if (status === 0) return '草稿';
    if (status === 1) return '已下达';
    if (status === 2) return '部分收货';
    if (status === 3) return '全部收货';
    if (status === 4) return '已关闭';
    return '未知';
  }

  trackByVendor(_: number, vb: VendorBalance): number {
    return vb.vendor.id!;
  }
}
