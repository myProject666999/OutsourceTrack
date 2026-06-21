import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../shared/api.service';
import { Warehouse } from '../../shared/models';

@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>仓库管理</h1>
        <button class="btn btn-primary" (click)="openModal()">+ 新增仓库</button>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>编码</th>
              <th>名称</th>
              <th>类型</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of list; track item.id) {
              <tr>
                <td>{{ item.code }}</td>
                <td>{{ item.name }}</td>
                <td>{{ warehouseTypeLabel(item.type) }}</td>
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
              <tr><td colspan="5" style="text-align:center;color:#94a3b8;">暂无数据</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (showModal) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingId ? '编辑仓库' : '新增仓库' }}</h3>
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
                <label>类型</label>
                <select class="form-control" [(ngModel)]="form.type">
                  <option [ngValue]="1">原料仓</option>
                  <option [ngValue]="2">成品仓</option>
                  <option [ngValue]="3">综合仓</option>
                </select>
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
export class WarehouseComponent implements OnInit {
  list: Warehouse[] = [];
  showModal = false;
  editingId: number | null = null;
  form: Partial<Warehouse> = { code: '', name: '', type: 1 };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.allWarehouses().subscribe({
      next: (res) => this.list = res.data
    });
  }

  warehouseTypeLabel(type?: number): string {
    switch (type) {
      case 1: return '原料仓';
      case 2: return '成品仓';
      case 3: return '综合仓';
      default: return '-';
    }
  }

  openModal(item?: Warehouse): void {
    if (item) {
      this.editingId = item.id!;
      this.form = {
        code: item.code,
        name: item.name,
        type: item.type
      };
    } else {
      this.editingId = null;
      this.form = { code: '', name: '', type: 1 };
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  save(): void {
    if (this.editingId) {
      this.apiService.updateWarehouse(this.editingId, this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        }
      });
    } else {
      this.apiService.createWarehouse(this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        }
      });
    }
  }

  deleteItem(id: number): void {
    if (!confirm('确认删除？')) return;
    this.apiService.deleteWarehouse(id).subscribe({
      next: () => this.loadData()
    });
  }
}
