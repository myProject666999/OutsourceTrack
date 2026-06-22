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
          <div class="sidebar-subtitle">Outsource Track</div>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">📊 工作台</a>
          <a routerLink="/orders" routerLinkActive="active">📋 外协订单</a>
          <a routerLink="/issue" routerLinkActive="active">📤 发料出库</a>
          <a routerLink="/receipt" routerLinkActive="active">📥 收货入库</a>
          <a routerLink="/balance" routerLinkActive="active">⚖️ 在制料账</a>
          <a routerLink="/alerts" routerLinkActive="active">🔔 预警催交</a>
          <a routerLink="/stats" routerLinkActive="active">📈 统计分析</a>
        </nav>
        <div class="nav-section-title">基础数据</div>
        <nav class="sidebar-nav">
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
    .sidebar { width: 260px; background: #1e293b; color: #e2e8f0; display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden; }
    .sidebar-header { padding: 20px 20px 16px; border-bottom: 1px solid #334155; }
    .sidebar-header h2 { margin: 0; font-size: 17px; color: #f8fafc; white-space: nowrap; font-weight: 600; }
    .sidebar-subtitle { font-size: 10px; color: #64748b; margin-top: 5px; letter-spacing: 1.5px; }
    .sidebar-nav { display: flex; flex-direction: column; padding: 6px 10px; }
    .sidebar-nav a { display: block; padding: 10px 14px; color: #94a3b8; text-decoration: none; font-size: 14px; transition: all .18s; white-space: nowrap; border-left: 3px solid transparent; border-radius: 4px; margin: 1px 0; font-family: inherit; }
    .sidebar-nav a:hover { background: #334155; color: #f1f5f9; border-left-color: #64748b; }
    .sidebar-nav a.active { background: rgba(59,130,246,.15); color: #93c5fd; border-left-color: #60a5fa; font-weight: 500; }
    .nav-section-title { padding: 14px 20px 6px; font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 1.8px; font-weight: 700; }
    .main-content { flex: 1; background: #f1f5f9; overflow-y: auto; min-width: 0; }
  `]
})
export class LayoutComponent {}
