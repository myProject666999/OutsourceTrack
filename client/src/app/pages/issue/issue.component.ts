import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';
import { IssueRecord, OutsourceOrder, OrderItem, Warehouse } from '../../shared/models';

@Component({
  selector: 'app-issue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>发料出库</h2>
        <button class="btn btn-primary" (click)="openCreateModal()">新建发料</button>
      </div>

      <div class="filter-bar">
        <input type="text" placeholder="订单号" [(ngModel)]="filterOrderId" (ngModelChange)="loadIssues()" />
        <input type="text" placeholder="外协厂" [(ngModel)]="filterVendorId" (ngModelChange)="loadIssues()" />
        <input type="date" [(ngModel)]="filterDateStart" (ngModelChange)="loadIssues()" />
        <input type="date" [(ngModel)]="filterDateEnd" (ngModelChange)="loadIssues()" />
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>外协厂</th>
            <th>物料名称</th>
            <th>发料数量</th>
            <th>发料日期</th>
            <th>发料人</th>
            <th>仓库</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of issues">
            <td>{{ item.order_no }}</td>
            <td>{{ item.vendor_name }}</td>
            <td>{{ item.material_name }}</td>
            <td>{{ item.issue_qty }}</td>
            <td>{{ item.issue_date }}</td>
            <td>{{ item.issue_by }}</td>
            <td>{{ item.warehouse_name }}</td>
            <td>
              <button class="btn btn-danger btn-sm" (click)="deleteIssue(item.id!)">删除</button>
            </td>
          </tr>
          <tr *ngIf="issues.length === 0">
            <td colspan="8" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" *ngIf="total > pageSize">
        <button class="btn btn-sm" [disabled]="page <= 1" (click)="prevPage()">上一页</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button class="btn btn-sm" [disabled]="page >= totalPages" (click)="nextPage()">下一页</button>
      </div>

      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>新建发料</h3>
            <button class="btn-close" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group" *ngIf="!selectedOrder">
              <label>选择订单</label>
              <select [(ngModel)]="modalOrderId" (ngModelChange)="onOrderSelected()">
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
                    <label>发料数量</label>
                    <input type="number" [(ngModel)]="item.issue_qty" min="0" />
                  </div>
                  <div class="form-group">
                    <label>发料日期</label>
                    <input type="date" [(ngModel)]="item.issue_date" />
                  </div>
                  <div class="form-group">
                    <label>发料人</label>
                    <input type="text" [(ngModel)]="item.issue_by" />
                  </div>
                  <div class="form-group">
                    <label>仓库</label>
                    <select [(ngModel)]="item.warehouse_id">
                      <option value="">请选择仓库</option>
                      <option *ngFor="let w of warehouses" [ngValue]="w.id">{{ w.name }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer" *ngIf="selectedOrder">
            <button class="btn" (click)="closeModal()">取消</button>
            <button class="btn btn-primary" (click)="saveIssue()" [disabled]="saving">{{ saving ? '保存中...' : '确认发料' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class IssueComponent implements OnInit {
  issues: IssueRecord[] = [];
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
    issue_qty: number | null;
    issue_date: string;
    issue_by: string;
    warehouse_id: number | null;
  }[] = [];
  saving = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadIssues();
  }

  loadIssues(): void {
    let params = new HttpParams()
      .set('page', String(this.page))
      .set('pageSize', String(this.pageSize));
    if (this.filterOrderId) params = params.set('order_id', this.filterOrderId);
    if (this.filterVendorId) params = params.set('vendor_id', this.filterVendorId);
    if (this.filterDateStart) params = params.set('start_date', this.filterDateStart);
    if (this.filterDateEnd) params = params.set('end_date', this.filterDateEnd);

    this.apiService.listIssues(params).subscribe({
      next: (res) => {
        this.issues = res.data.list;
        this.total = res.data.total;
        this.totalPages = Math.ceil(this.total / this.pageSize);
      }
    });
  }

  deleteIssue(id: number): void {
    if (!confirm('确认删除此发料记录?')) return;
    this.apiService.deleteIssue(id).subscribe({
      next: () => this.loadIssues()
    });
  }

  prevPage(): void { this.page--; this.loadIssues(); }
  nextPage(): void { this.page++; this.loadIssues(); }

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
          material_id: item.raw_material_id,
          product_name: item.product_name || '',
          raw_name: item.raw_name || '',
          issue_qty: null,
          issue_date: new Date().toISOString().slice(0, 10),
          issue_by: '',
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

  saveIssue(): void {
    if (!this.selectedOrder) return;
    const items = this.formItems
      .filter(item => item.issue_qty !== null && item.issue_qty! > 0)
      .map(item => ({
        order_item_id: item.order_item_id,
        material_id: item.material_id,
        issue_qty: item.issue_qty,
        issue_date: item.issue_date,
        issue_by: item.issue_by,
        warehouse_id: item.warehouse_id
      }));

    if (items.length === 0) {
      alert('请至少填写一条发料记录');
      return;
    }

    this.saving = true;
    this.apiService.createIssue({ order_id: this.selectedOrder.id, items }).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadIssues();
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
