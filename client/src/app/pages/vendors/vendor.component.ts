import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';
import { Vendor } from '../../shared/models';

@Component({
  selector: 'app-vendor',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>外协厂管理</h1>
        <button class="btn btn-primary" (click)="openModal()">+ 新增外协厂</button>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>编码</th>
              <th>名称</th>
              <th>联系人</th>
              <th>联系电话</th>
              <th>地址</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of list; track item.id) {
              <tr>
                <td>{{ item.code }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.contact_person }}</td>
                <td>{{ item.contact_phone }}</td>
                <td>{{ item.address }}</td>
                <td>
                  <span class="badge" [ngClass]="item.status === 1 ? 'badge-success' : 'badge-default'">
                    {{ item.status === 1 ? '启用' : '停用' }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <button class="btn btn-sm btn-outline" (click)="openModal(item)">编辑</button>
                    <button class="btn btn-sm btn-danger" (click)="deleteItem(item.id!)">删除</button>
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
            <button [disabled]="page <= 1" (click)="loadPage(page - 1)">上一页</button>
            <button [disabled]="page >= totalPages" (click)="loadPage(page + 1)">下一页</button>
          </div>
        </div>
      </div>

      @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingId ? '编辑外协厂' : '新增外协厂' }}</h3>
              <button class="modal-close" (click)="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>编码</label>
                <input class="form-control" [(ngModel)]="form.code" placeholder="请输入编码" />
              </div>
              <div class="form-group">
                <label>名称</label>
                <input class="form-control" [(ngModel)]="form.name" placeholder="请输入名称" />
              </div>
              <div class="form-group">
                <label>联系人</label>
                <input class="form-control" [(ngModel)]="form.contact_person" placeholder="请输入联系人" />
              </div>
              <div class="form-group">
                <label>联系电话</label>
                <input class="form-control" [(ngModel)]="form.contact_phone" placeholder="请输入联系电话" />
              </div>
              <div class="form-group">
                <label>地址</label>
                <input class="form-control" [(ngModel)]="form.address" placeholder="请输入地址" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closeModal()">取消</button>
              <button class="btn btn-primary" (click)="save()">保存</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class VendorComponent implements OnInit {
  list: Vendor[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  showModal = false;
  editingId: number | null = null;
  form: Partial<Vendor> = { code: '', name: '', contact_person: '', contact_phone: '', address: '' };

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const params = new HttpParams()
      .set('page', this.page.toString())
      .set('pageSize', this.pageSize.toString());
    this.apiService.listVendors(params).subscribe({
      next: (res) => {
        this.list = res.data.list;
        this.total = res.data.total;
      }
    });
  }

  loadPage(p: number): void {
    this.page = p;
    this.loadData();
  }

  openModal(item?: Vendor): void {
    if (item) {
      this.editingId = item.id!;
      this.form = {
        code: item.code,
        name: item.name,
        contact_person: item.contact_person,
        contact_phone: item.contact_phone,
        address: item.address
      };
    } else {
      this.editingId = null;
      this.form = { code: '', name: '', contact_person: '', contact_phone: '', address: '' };
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  save(): void {
    if (this.editingId) {
      this.apiService.updateVendor(this.editingId, this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        }
      });
    } else {
      this.apiService.createVendor(this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        }
      });
    }
  }

  deleteItem(id: number): void {
    if (!confirm('确认删除？')) return;
    this.apiService.deleteVendor(id).subscribe({
      next: () => this.loadData()
    });
  }
}
