import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../shared/api.service';
import { OutsourceOrder } from '../../shared/models';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="flex items-center gap-2">
          <button class="btn btn-outline" (click)="goBack()">← 返回</button>
          <h1>订单详情</h1>
        </div>
        <div class="flex gap-2">
          @if (order && order.status === 0) {
            <button class="btn btn-primary" (click)="setStatus(1)">下达</button>
          }
          @if (order && (order.status === 1 || order.status === 2)) {
            <button class="btn btn-danger" (click)="setStatus(4)">关闭</button>
          }
        </div>
      </div>

      @if (order) {
        <div class="card">
          <div class="card-title">基本信息</div>
          <div class="form-row">
            <div class="form-group">
              <label>订单编号</label>
              <div>{{ order.order_no }}</div>
            </div>
            <div class="form-group">
              <label>外协厂</label>
              <div>{{ order.vendor_name }}</div>
            </div>
            <div class="form-group">
              <label>订单日期</label>
              <div>{{ order.order_date }}</div>
            </div>
            <div class="form-group">
              <label>交货日期</label>
              <div>{{ order.delivery_date }}</div>
            </div>
            <div class="form-group">
              <label>状态</label>
              <div><span [ngClass]="orderStatusBadge(order.status)">{{ orderStatusText(order.status) }}</span></div>
            </div>
            <div class="form-group">
              <label>总金额</label>
              <div>{{ formatAmount(order.total_amount) }}</div>
            </div>
            <div class="form-group">
              <label>备注</label>
              <div>{{ order.remark || '-' }}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">订单明细</div>
          <table>
            <thead>
              <tr>
                <th>产品名称</th>
                <th>原材料</th>
                <th>加工内容</th>
                <th>订单数量</th>
                <th>发料数量</th>
                <th>收货数量</th>
                <th>合格数量</th>
                <th>不合格数量</th>
                <th>投入产出比</th>
                <th>预期产出</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              @for (item of order.items; track item.id) {
                <tr>
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.raw_name }}</td>
                  <td>{{ item.process_content || '-' }}</td>
                  <td>{{ item.order_qty }}</td>
                  <td>
                    <span [class.text-warning]="item.issued_qty && item.issued_qty < item.order_qty"
                          [class.text-success]="item.issued_qty && item.issued_qty >= item.order_qty">
                      {{ item.issued_qty ?? 0 }}
                    </span>
                  </td>
                  <td>
                    <span [class.text-warning]="item.received_qty && item.received_qty < (item.issued_qty ?? 0)"
                          [class.text-success]="item.received_qty && item.received_qty >= (item.issued_qty ?? 0)">
                      {{ item.received_qty ?? 0 }}
                    </span>
                  </td>
                  <td>{{ item.qualified_qty ?? 0 }}</td>
                  <td>{{ item.unqualified_qty ?? 0 }}</td>
                  <td>{{ item.input_output_ratio ?? '-' }}</td>
                  <td>{{ item.expected_product_qty ?? '-' }}</td>
                  <td><span [ngClass]="itemStatusBadge(item.status)">{{ itemStatusText(item.status) }}</span></td>
                  <td>-</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: []
})
export class OrderDetailComponent implements OnInit {
  order: OutsourceOrder | null = null;

  private orderStatusMap: Record<number, { text: string; badge: string }> = {
    0: { text: '草稿', badge: 'badge badge-gray' },
    1: { text: '已下达', badge: 'badge badge-info' },
    2: { text: '部分收货', badge: 'badge badge-warning' },
    3: { text: '全部收货', badge: 'badge badge-success' },
    4: { text: '已关闭', badge: 'badge badge-gray' }
  };

  private itemStatusMap: Record<number, { text: string; badge: string }> = {
    0: { text: '待发料', badge: 'badge badge-gray' },
    1: { text: '已发料', badge: 'badge badge-info' },
    2: { text: '部分收货', badge: 'badge badge-warning' },
    3: { text: '已收货', badge: 'badge badge-success' }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadOrder(id);
    }
  }

  loadOrder(id: number): void {
    this.apiService.getOrder(id).subscribe({
      next: (res) => { this.order = res.data; },
      error: () => { this.order = null; }
    });
  }

  setStatus(status: number): void {
    if (!this.order?.id) return;
    this.apiService.updateOrderStatus(this.order.id, status).subscribe({
      next: () => { this.loadOrder(this.order!.id!); }
    });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  orderStatusText(status?: number): string {
    return this.orderStatusMap[status ?? 0]?.text ?? '未知';
  }

  orderStatusBadge(status?: number): string {
    return this.orderStatusMap[status ?? 0]?.badge ?? 'badge-gray';
  }

  itemStatusText(status?: number): string {
    return this.itemStatusMap[status ?? 0]?.text ?? '未知';
  }

  itemStatusBadge(status?: number): string {
    return this.itemStatusMap[status ?? 0]?.badge ?? 'badge-gray';
  }

  formatAmount(value?: number | null): string {
    if (value == null) return '0.00';
    return value.toFixed(2);
  }
}
