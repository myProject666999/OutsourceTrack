import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';
import { ReceiptRecord, OutsourceOrder, OrderItem, Warehouse } from '../../shared/models';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>收货入库</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">新建收货</button>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="form-group">
            <label>订单号</label>
            <input class="form-control" type="text" placeholder="订单号" [(ngModel)]="filterOrderId" (ngModelChange)="loadReceipts()" />
          </div>
          <div class="form-group">
            <label>外协厂</label>
            <input class="form-control" type="text" placeholder="外协厂" [(ngModel)]="filterVendorId" (ngModelChange)="loadReceipts()" />
          </div>
          <div class="form-group">
            <label>开始日期</label>
            <input class="form-control" type="date" [(ngModel)]="filterDateStart" (ngModelChange)="loadReceipts()" />
          </div>
          <div class="form-group">
            <label>结束日期</label>
            <input class="form-control" type="date" [(ngModel)]="filterDateEnd" (ngModelChange)="loadReceipts()" />
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>外协厂</th>
              <th>物料名称</th>
              <th>收货数量</th>
              <th>合格数量</th>
              <th>不合格数量</th>
              <th>收货日期</th>
              <th>收货人</th>
              <th>仓库</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of receipts">
              <td>{{ item.order_no }}</td>
              <td>{{ item.vendor_name }}</td>
              <td>{{ item.material_name }}</td>
              <td>{{ item.receipt_qty }}</td>
              <td>{{ item.qualified_qty }}</td>
              <td>{{ item.unqualified_qty }}</td>
              <td>{{ item.receipt_date }}</td>
              <td>{{ item.received_by }}</td>
              <td>{{ item.warehouse_name }}</td>
              <td>
                <button class="btn btn-sm btn-danger" (click)="deleteReceipt(item.id!)">删除</button>
              </td>
            </tr>
            <tr *ngIf="receipts.length === 0">
              <td colspan="10" class="empty">暂无数据</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" *ngIf="total > pageSize">
          <span>{{ page }} / {{ totalPages }}</span>
          <div class="pagination-buttons">
            <button [disabled]="page <= 1" (click)="prevPage()">上一页</button>
            <button [disabled]="page >= totalPages" (click)="nextPage()">下一页</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>新建收货</h3>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group" *ngIf="!selectedOrder">
              <label>选择订单</label>
              <select class="form-control" [(ngModel)]="modalOrderId" (ngModelChange)="onOrderSelected()">
                <option value="">请选择订单</option>
                <option *ngFor="let o of orders" [ngValue]="o.id">{{ o.order_no }} - {{ o.vendor_name }}</option>
              </select>
            </div>

            <div *ngIf="selectedOrder">
              <div class="form-group">
                <label>已选订单: {{ selectedOrder.order_no }} - {{ selectedOrder.vendor_name }}</label>
                <button class="btn btn-sm" (click)="clearOrder()">更换订单</button>
              </div>

              <div *ngFor="let item of formItems; let i = index" class="issue-item-form">
                <h4>{{ item.product_name }} ({{ item.raw_name }})</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label>收货数量</label>
                    <input class="form-control" type="number" [(ngModel)]="item.receipt_qty" min="0" />
                  </div>
                  <div class="form-group">
                    <label>合格数量</label>
                    <input class="form-control" type="number" [(ngModel)]="item.qualified_qty" min="0" />
                  </div>
                  <div class="form-group">
                    <label>不合格数量</label>
                    <input class="form-control" type="number" [(ngModel)]="item.unqualified_qty" min="0" />
                  </div>
                  <div class="form-group">
                    <label>收货日期</label>
                    <input class="form-control" type="date" [(ngModel)]="item.receipt_date" />
                  </div>
                  <div class="form-group">
                    <label>收货人</label>
                    <input class="form-control" type="text" [(ngModel)]="item.received_by" />
                  </div>
                  <div class="form-group">
                    <label>仓库</label>
                    <select class="form-control" [(ngModel)]="item.warehouse_id">
                      <option value="">请选择仓库</option>
                      <option *ngFor="let w of warehouses" [ngValue]="w.id">{{ w.name }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer" *ngIf="selectedOrder">
            <button class="btn btn-outline" (click)="closeModal()">取消</button>
            <button class="btn btn-primary" (click)="saveReceipt()" [disabled]="saving">{{ saving ? '保存中...' : '确认收货' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReceiptComponent implements OnInit {
  receipts: ReceiptRecord[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  totalPages = 1;

  filterOrderId = '';
  filterVendorId = '';
  filterDateStart = '';
  filterDateEnd = '';

  showModal = false;
  orders: OutsourceOrder[] = [];
  selectedOrder: OutsourceOrder | null = null;
  modalOrderId: number | null = null;
  warehouses: Warehouse[] = [];
  formItems: {
    order_item_id: number;
    material_id: number;
    product_name: string;
    raw_name: string;
    receipt_qty: number | null;
    qualified_qty: number | null;
    unqualified_qty: number | null;
    receipt_date: string;
    received_by: string;
    warehouse_id: number | null;
  }[] = [];
  saving = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadReceipts();
  }

  loadReceipts(): void {
    let params = new HttpParams()
      .set('page', String(this.page))
      .set('pageSize', String(this.pageSize));
    if (this.filterOrderId) params = params.set('order_id', this.filterOrderId);
    if (this.filterVendorId) params = params.set('vendor_id', this.filterVendorId);
    if (this.filterDateStart) params = params.set('start_date', this.filterDateStart);
    if (this.filterDateEnd) params = params.set('end_date', this.filterDateEnd);

    this.apiService.listReceipts(params).subscribe({
      next: (res) => {
        this.receipts = res.data.list;
        this.total = res.data.total;
        this.totalPages = Math.ceil(this.total / this.pageSize);
      }
    });
  }

  loadOrders(): void {
    let params = new HttpParams();
    params = params.set('status_min', '1');
    this.apiService.listOrders(params).subscribe({
      next: (res) => {
        this.orders = res.data.list;
      }
    });
  }

  loadWarehouses(): void {
    this.apiService.allWarehouses().subscribe({
      next: (res) => {
        this.warehouses = res.data;
      }
    });
  }

  openCreateModal(): void {
    this.showModal = true;
    this.selectedOrder = null;
    this.modalOrderId = null;
    this.formItems = [];
    this.loadOrders();
    this.loadWarehouses();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedOrder = null;
    this.modalOrderId = null;
    this.formItems = [];
  }

  onOrderSelected(): void {
    if (!this.modalOrderId) {
      this.selectedOrder = null;
      this.formItems = [];
      return;
    }
    this.apiService.getOrder(this.modalOrderId).subscribe({
      next: (res) => {
        this.selectedOrder = res.data;
        this.formItems = (this.selectedOrder?.items || []).map((item: OrderItem) => ({
          order_item_id: item.id!,
          material_id: item.material_id,
          product_name: item.product_name || '',
          raw_name: item.raw_name || '',
          receipt_qty: null,
          qualified_qty: null,
          unqualified_qty: null,
          receipt_date: new Date().toISOString().slice(0, 10),
          received_by: '',
          warehouse_id: null
        }));
      }
    });
  }

  clearOrder(): void {
    this.selectedOrder = null;
    this.modalOrderId = null;
    this.formItems = [];
  }

  saveReceipt(): void {
    if (!this.selectedOrder) return;
    const items = this.formItems
      .filter(item => item.receipt_qty !== null && item.receipt_qty! > 0)
      .map(item => ({
        order_item_id: item.order_item_id,
        material_id: item.material_id,
        receipt_qty: item.receipt_qty,
        qualified_qty: item.qualified_qty,
        unqualified_qty: item.unqualified_qty,
        receipt_date: item.receipt_date,
        received_by: item.received_by,
        warehouse_id: item.warehouse_id
      }));

    if (items.length === 0) {
      alert('请至少填写一条收货记录');
      return;
    }

    this.saving = true;
    this.apiService.createReceipt({ order_id: this.selectedOrder.id, items }).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadReceipts();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  deleteReceipt(id: number): void {
    if (!confirm('确认删除此收货记录?')) return;
    this.apiService.deleteReceipt(id).subscribe({
      next: () => this.loadReceipts()
    });
  }

  prevPage(): void { this.page--; this.loadReceipts(); }
  nextPage(): void { this.page++; this.loadReceipts(); }
}
