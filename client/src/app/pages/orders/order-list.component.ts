import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { NgClass } from '@angular/common';
import { ApiService } from '../../shared/api.service';
import { OutsourceOrder, OrderItem, Vendor, Material } from '../../shared/models';

const STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '已下达',
  2: '部分收货',
  3: '全部收货',
  4: '已关闭'
};

const STATUS_BADGE: Record<number, string> = {
  0: 'badge-gray',
  1: 'badge-info',
  2: 'badge-warning',
  3: 'badge-success',
  4: 'badge-gray'
};

const NEXT_STATUS: Record<number, { label: string; value: number } | null> = {
  0: { label: '下达', value: 1 },
  1: { label: '部分收货', value: 2 },
  2: { label: '全部收货', value: 3 },
  3: { label: '关闭', value: 4 },
  4: null
};

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [FormsModule, NgClass, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>外协订单</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">+ 新建订单</button>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="form-group">
            <label>关键词</label>
            <input class="form-control" [(ngModel)]="filter.keyword" (keyup.enter)="loadOrders()" placeholder="订单号/供应商">
          </div>
          <div class="form-group">
            <label>供应商</label>
            <select class="form-control" [(ngModel)]="filter.vendor_id" (change)="loadOrders()">
              <option value="">全部</option>
              @for (v of vendors; track v.id) {
                <option [value]="v.id">{{ v.name }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select class="form-control" [(ngModel)]="filter.status" (change)="loadOrders()">
              <option value="">全部</option>
              @for (opt of statusOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>开始日期</label>
            <input class="form-control" type="date" [(ngModel)]="filter.start_date" (change)="loadOrders()">
          </div>
          <div class="form-group">
            <label>结束日期</label>
            <input class="form-control" type="date" [(ngModel)]="filter.end_date" (change)="loadOrders()">
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button class="btn btn-outline" (click)="resetFilter()">重置</button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>供应商</th>
              <th>订单日期</th>
              <th>交货日期</th>
              <th>状态</th>
              <th class="text-right">总金额</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders; track order.id) {
              <tr>
                <td><a routerLink="/orders/{{ order.id }}">{{ order.order_no }}</a></td>
                <td>{{ order.vendor_name }}</td>
                <td>{{ order.order_date }}</td>
                <td>{{ order.delivery_date }}</td>
                <td><span class="badge" [ngClass]="statusBadge(order.status!)">{{ statusLabel(order.status!) }}</span></td>
                <td class="text-right">{{ order.total_amount }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <a routerLink="/orders/{{ order.id }}" class="btn btn-sm btn-outline">查看</a>
                    @if (order.status === 0) {
                      <button class="btn btn-sm btn-danger" (click)="deleteOrder(order)">删除</button>
                    }
                    @if (nextStatus(order.status!) && order.status !== 4) {
                      <button class="btn btn-sm btn-success" (click)="changeStatus(order)">{{ nextStatus(order.status!)!.label }}</button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" style="text-align:center;color:#94a3b8;">暂无数据</td></tr>
            }
          </tbody>
        </table>

        <div class="pagination">
          <span>共 {{ total }} 条</span>
          <div class="pagination-buttons">
            <button [disabled]="page <= 1" (click)="goPage(page - 1)">上一页</button>
            @for (p of pageNumbers; track p) {
              <button [class.active]="p === page" (click)="goPage(p)">{{ p }}</button>
            }
            <button [disabled]="page >= totalPages" (click)="goPage(page + 1)">下一页</button>
          </div>
        </div>
      </div>

      @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>新建外协订单</h3>
              <button class="modal-close" (click)="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>供应商 *</label>
                  <select class="form-control" [(ngModel)]="form.vendor_id">
                    <option value="">请选择供应商</option>
                    @for (v of vendors; track v.id) {
                      <option [value]="v.id">{{ v.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>订单日期 *</label>
                  <input class="form-control" type="date" [(ngModel)]="form.order_date">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>交货日期 *</label>
                  <input class="form-control" type="date" [(ngModel)]="form.delivery_date">
                </div>
                <div class="form-group">
                  <label>备注</label>
                  <textarea class="form-control" [(ngModel)]="form.remark" rows="2"></textarea>
                </div>
              </div>

              <div class="card-title mt-4">订单明细</div>
              <table>
                <thead>
                  <tr>
                    <th>加工件</th>
                    <th>原材料</th>
                    <th>工序内容</th>
                    <th>数量</th>
                    <th>投入产出比</th>
                    <th>单价</th>
                    <th>交货日期</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of form.items; track $index; let i = $index) {
                    <tr>
                      <td>
                        <select class="form-control" [(ngModel)]="item.material_id" style="min-width:120px">
                          <option value="">选择加工件</option>
                          @for (m of productMaterials; track m.id) {
                            <option [value]="m.id">{{ m.name }}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="form-control" [(ngModel)]="item.raw_material_id" style="min-width:120px">
                          <option value="">选择原材料</option>
                          @for (m of rawMaterials; track m.id) {
                            <option [value]="m.id">{{ m.name }}</option>
                          }
                        </select>
                      </td>
                      <td><input class="form-control" [(ngModel)]="item.process_content" style="min-width:100px"></td>
                      <td><input class="form-control" type="number" [(ngModel)]="item.order_qty" style="width:80px"></td>
                      <td><input class="form-control" type="number" step="0.01" [(ngModel)]="item.input_output_ratio" style="width:90px"></td>
                      <td><input class="form-control" type="number" step="0.01" [(ngModel)]="item.unit_price" style="width:90px"></td>
                      <td><input class="form-control" type="date" [(ngModel)]="item.delivery_date" style="width:140px"></td>
                      <td><button class="btn btn-sm btn-danger" (click)="removeItem(i)">删除</button></td>
                    </tr>
                  }
                </tbody>
              </table>
              <button class="btn btn-outline mt-2" (click)="addItem()">+ 添加明细行</button>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closeModal()">取消</button>
              <button class="btn btn-primary" (click)="saveOrder()" [disabled]="saving">{{ saving ? '保存中...' : '保存' }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class OrderListComponent implements OnInit {
  orders: OutsourceOrder[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  totalPages = 1;

  vendors: Vendor[] = [];
  rawMaterials: Material[] = [];
  productMaterials: Material[] = [];

  filter = {
    keyword: '',
    vendor_id: '',
    status: '',
    start_date: '',
    end_date: ''
  };

  statusOptions = Object.entries(STATUS_MAP).map(([value, label]) => ({ value: +value, label }));

  showModal = false;
  saving = false;

  form = this.emptyForm();

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadVendors();
    this.loadMaterials();
    this.loadOrders();
  }

  private emptyForm() {
    return {
      vendor_id: '' as string | number,
      order_date: '',
      delivery_date: '',
      remark: '',
      items: [] as Partial<OrderItem>[]
    };
  }

  statusLabel(status: number): string {
    return STATUS_MAP[status] ?? '未知';
  }

  statusBadge(status: number): string {
    return STATUS_BADGE[status] ?? 'badge-gray';
  }

  nextStatus(status: number): { label: string; value: number } | null {
    return NEXT_STATUS[status] ?? null;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  loadOrders(): void {
    let params = new HttpParams()
      .set('page', String(this.page))
      .set('pageSize', String(this.pageSize));
    if (this.filter.keyword) params = params.set('keyword', this.filter.keyword);
    if (this.filter.vendor_id) params = params.set('vendor_id', String(this.filter.vendor_id));
    if (this.filter.status !== '') params = params.set('status', String(this.filter.status));
    if (this.filter.start_date) params = params.set('start_date', this.filter.start_date);
    if (this.filter.end_date) params = params.set('end_date', this.filter.end_date);

    this.apiService.listOrders(params).subscribe({
      next: (res) => {
        this.orders = res.data.list;
        this.total = res.data.total;
        this.totalPages = Math.ceil(this.total / this.pageSize) || 1;
      }
    });
  }

  loadVendors(): void {
    this.apiService.listVendors().subscribe({
      next: (res) => {
        this.vendors = res.data.list;
      }
    });
  }

  loadMaterials(): void {
    this.apiService.allMaterials(2).subscribe({
      next: (res) => { this.productMaterials = res.data; }
    });
    this.apiService.allMaterials(1).subscribe({
      next: (res) => { this.rawMaterials = res.data; }
    });
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadOrders();
  }

  resetFilter(): void {
    this.filter = { keyword: '', vendor_id: '', status: '', start_date: '', end_date: '' };
    this.page = 1;
    this.loadOrders();
  }

  deleteOrder(order: OutsourceOrder): void {
    if (!confirm(`确定删除订单 ${order.order_no}？`)) return;
    this.apiService.deleteOrder(order.id!).subscribe({
      next: () => this.loadOrders()
    });
  }

  changeStatus(order: OutsourceOrder): void {
    const ns = this.nextStatus(order.status!);
    if (!ns) return;
    if (!confirm(`确定将订单 ${order.order_no} 状态变更为「${ns.label}」？`)) return;
    this.apiService.updateOrderStatus(order.id!, ns.value).subscribe({
      next: () => this.loadOrders()
    });
  }

  openCreateModal(): void {
    this.form = this.emptyForm();
    this.addItem();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  addItem(): void {
    this.form.items.push({
      material_id: undefined as any,
      raw_material_id: undefined as any,
      process_content: '',
      order_qty: 0,
      input_output_ratio: 1,
      unit_price: 0,
      delivery_date: ''
    });
  }

  removeItem(index: number): void {
    this.form.items.splice(index, 1);
  }

  saveOrder(): void {
    this.saving = true;
    this.apiService.createOrder(this.form).subscribe({
      next: (res) => {
        this.saving = false;
        this.showModal = false;
        this.router.navigate(['/orders', res.data.id]);
      },
      error: () => { this.saving = false; }
    });
  }
}
