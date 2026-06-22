import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';
import { InputOutputRatio, Material } from '../../shared/models';

@Component({
  selector: 'app-ratio',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>投入产出比管理</h1>
        <button class="btn btn-primary" (click)="openModal()">+ 新增配比</button>
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>原材料名称</th>
              <th>成品名称</th>
              <th>投入产出比</th>
              <th>工序名称</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            @for (item of list; track item.id) {
              <tr>
                <td>{{ item.raw_name }}</td>
                <td>{{ item.product_name }}</td>
                <td>{{ item.ratio }}</td>
                <td>{{ item.process_name }}</td>
                <td>{{ item.remark }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <button class="btn btn-sm btn-outline" (click)="openModal(item)">编辑</button>
                    <button class="btn btn-sm btn-danger" (click)="deleteItem(item.id!)">删除</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" style="text-align:center;color:#94a3b8;">暂无数据</td></tr>
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
              <h3>{{ editingId ? '编辑配比' : '新增配比' }}</h3>
              <button class="modal-close" (click)="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>原材料</label>
                <select class="form-control" [(ngModel)]="form.raw_material_id">
                  <option [ngValue]="0" disabled>请选择原材料</option>
                  @for (m of rawMaterials; track m.id) {
                    <option [ngValue]="m.id">{{ m.name }} ({{ m.code }})</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>成品/半成品</label>
                <select class="form-control" [(ngModel)]="form.product_material_id">
                  <option [ngValue]="0" disabled>请选择成品</option>
                  @for (m of productMaterials; track m.id) {
                    <option [ngValue]="m.id">{{ m.name }} ({{ m.code }})</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>投入产出比</label>
                <input class="form-control" type="number" [(ngModel)]="form.ratio" placeholder="请输入投入产出比" />
              </div>
              <div class="form-group">
                <label>工序名称</label>
                <input class="form-control" [(ngModel)]="form.process_name" placeholder="请输入工序名称" />
              </div>
              <div class="form-group">
                <label>备注</label>
                <textarea class="form-control" [(ngModel)]="form.remark" placeholder="请输入备注" rows="3"></textarea>
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
export class RatioComponent implements OnInit {
  list: InputOutputRatio[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  showModal = false;
  editingId: number | null = null;
  rawMaterials: Material[] = [];
  productMaterials: Material[] = [];
  form: Partial<InputOutputRatio> = { raw_material_id: 0, product_material_id: 0, ratio: 1, process_name: '', remark: '' };

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
    this.loadMaterials();
  }

  loadData(): void {
    const params = new HttpParams()
      .set('page', this.page.toString())
      .set('pageSize', this.pageSize.toString());
    this.apiService.listRatios(params).subscribe({
      next: (res) => {
        this.list = res.data.list;
        this.total = res.data.total;
      }
    });
  }

  loadMaterials(): void {
    this.apiService.allMaterials(1).subscribe({
      next: (res) => this.rawMaterials = res.data
    });
    this.apiService.allMaterials(2).subscribe({
      next: (res) => this.productMaterials = res.data
    });
  }

  loadPage(p: number): void {
    this.page = p;
    this.loadData();
  }

  openModal(item?: InputOutputRatio): void {
    if (item) {
      this.editingId = item.id!;
      this.form = {
        raw_material_id: item.raw_material_id,
        product_material_id: item.product_material_id,
        ratio: item.ratio,
        process_name: item.process_name,
        remark: item.remark
      };
    } else {
      this.editingId = null;
      this.form = { raw_material_id: 0, product_material_id: 0, ratio: 1, process_name: '', remark: '' };
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  save(): void {
    if (this.editingId) {
      this.apiService.updateRatio(this.editingId, this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        }
      });
    } else {
      this.apiService.createRatio(this.form).subscribe({
        next: () => {
          this.closeModal();
          this.loadData();
        }
      });
    }
  }

  deleteItem(id: number): void {
    if (!confirm('确认删除？')) return;
    this.apiService.deleteRatio(id).subscribe({
      next: () => this.loadData()
    });
  }
}
