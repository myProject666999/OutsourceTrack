import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>外协加工跟踪</h2>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">📊 工作台</a>
          <a routerLink="/orders" routerLinkActive="active">📋 外协订单</a>
          <a routerLink="/issue" routerLinkActive="active">📤 发料出库</a>
          <a routerLink="/receipt" routerLinkActive="active">📥 收货入库</a>
          <a routerLink="/balance" routerLinkActive="active">⚖️ 在制料账</a>
          <a routerLink="/alerts" routerLinkActive="active">🔔 预警催交</a>
          <a routerLink="/stats" routerLinkActive="active">📈 统计分析</a>
          <div class="nav-divider"></div>
          <a routerLink="/vendors" routerLinkActive="active">🏭 外协厂管理</a>
          <a routerLink="/materials" routerLinkActive="active">📦 物料管理</a>
          <a routerLink="/ratios" routerLinkActive="active">🔄 投入产出比</a>
          <a routerLink="/warehouses" routerLinkActive="active">🏗️ 仓库管理</a>
        </nav>
      </aside>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 220px; background: #1e293b; color: #e2e8f0; display: flex; flex-direction: column; flex-shrink: 0; }
    .sidebar-header { padding: 20px 16px; border-bottom: 1px solid #334155; }
    .sidebar-header h2 { margin: 0; font-size: 18px; color: #f8fafc; white-space: nowrap; }
    .sidebar-nav { display: flex; flex-direction: column; padding: 8px 0; }
    .sidebar-nav a { display: block; padding: 10px 20px; color: #94a3b8; text-decoration: none; font-size: 14px; transition: all .2s; }
    .sidebar-nav a:hover { background: #334155; color: #f1f5f9; }
    .sidebar-nav a.active { background: #3b82f6; color: #fff; }
    .nav-divider { height: 1px; background: #334155; margin: 8px 16px; }
    .main-content { flex: 1; background: #f1f5f9; overflow-y: auto; }
  `]
})
export class LayoutComponent {}
