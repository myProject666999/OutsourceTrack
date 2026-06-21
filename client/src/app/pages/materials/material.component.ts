import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';
import { Material } from '../../shared/models';

@Component({
  selector: 'app-material',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>物料管理</h1>
        <button class="btn btn-primary" (click)="openModal()">+ 新增物料</button>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="form-group">
            <label>类型</label>
            <select class="form-control" [(ngModel)]="filterType" (ngModelChange)="loadData()">
              <option [ngValue]="null">全部类型</option>
              <option [ngValue]="1">原材料</option>
              <option [ngValue]="2">成品/半成品</option>
            </select>
          </div>
          <div class="form-group">
            <label>关键词</label>
            <input class="form-control" [(ngModel)]="keyword" (keyup.enter)="loadData()" placeholder="搜索编码/名称" />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <button class="btn btn-outline" (click)="loadData()">查询</button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>编码</th>
              <th>名称</th>
              <th>规格</th>
              <th>单位</th>
              <th>类型</th>
              <th>分类</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of list; track item.id) {
              <tr>
                <td>{{ item.code }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.spec }}</td>
                <td>{{ item.unit }}</td>
                <td>{{ item.type === 1 ? '原材料' : '成品/半成品' }}</td>
                <td>{{ item.category }}</td>
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
              <tr><td colspan="8" style="text-align:center;color:#94a3b8;">暂无数据</td></tr>
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
              <h3>{{ editingId ? '编辑物料' : '新增物料' }}</h3>
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
                <label>规格</label>
                <input class="form-control" [(ngModel)]="form.spec" placeholder="请输入规格" />
              </div>
              <div class="form-group">
                <label>单位</label>
                <input class="form-control" [(ngModel)]="form.unit" placeholder="请输入单位" />
              </div>
              <div class="form-group">
                <label>类型</label>
                <select class="form-control" [(ngModel)]="form.type">
                  <option [ngValue]="1">原材料</option>
                  <option [ngValue]="2">成品/半成品</option>
                </select>
              </div>
              <div class="form-group">
                <label>分类</label>
                <input class="form-control" [(ngModel)]="form.category" placeholder="请输入分类" />
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
export class MaterialComponent implements OnInit {
  list: Material[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  filterType: number | null = null;
  keyword = '';
  showModal = false;
  editingId: number | null = null;
  form: Partial<Material> = { code: '', name: '', spec: '', unit: '', type: 1, category: '' };

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    let params = new HttpParams()
      .set('page', this.page.toString())
      .set('pageSize', this.pageSize.toString());
    if (this.filterType !== null) params = params.set('type', this.filterType.toString());
    if (this.keyword.trim()) params = params.set('keyword', this.keyword.trim());
    this.apiService.listMaterials(params).subscribe({
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

  openModal(item?: Material): void {
    if (item) {
      this.editingId = item.id!;
      this.form = {
        code: item.code,
        name: item.name,
        spec: item.spec,
        unit: item.unit,
        type: item.type,
        category: item.category
      };
    } else {
      this.editingId = null;
      this.form = { code: '', name: '', spec: '', unit: '', type: 1, category: '' };
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  save(): void {
    if (this.editingId) {
      this.apiService.updateMaterial(this.editingId, this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        }
      });
    } else {
      this.apiService.createMaterial(this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        }
      });
    }
  }

  deleteItem(id: number): void {
    if (!confirm('确认删除？')) return;
    this.apiService.deleteMaterial(id).subscribe({
      next: () => this.loadData()
    });
  }
}
