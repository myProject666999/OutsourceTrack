import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'orders', loadComponent: () => import('./pages/orders/order-list.component').then(m => m.OrderListComponent) },
      { path: 'orders/:id', loadComponent: () => import('./pages/orders/order-detail.component').then(m => m.OrderDetailComponent) },
      { path: 'issue', loadComponent: () => import('./pages/issue/issue.component').then(m => m.IssueComponent) },
      { path: 'receipt', loadComponent: () => import('./pages/receipt/receipt.component').then(m => m.ReceiptComponent) },
      { path: 'balance', loadComponent: () => import('./pages/balance/balance.component').then(m => m.BalanceComponent) },
      { path: 'alerts', loadComponent: () => import('./pages/alerts/alert.component').then(m => m.AlertComponent) },
      { path: 'stats', loadComponent: () => import('./pages/stats/stats.component').then(m => m.StatsComponent) },
      { path: 'vendors', loadComponent: () => import('./pages/vendors/vendor.component').then(m => m.VendorComponent) },
      { path: 'materials', loadComponent: () => import('./pages/materials/material.component').then(m => m.MaterialComponent) },
      { path: 'ratios', loadComponent: () => import('./pages/ratios/ratio.component').then(m => m.RatioComponent) },
      { path: 'warehouses', loadComponent: () => import('./pages/warehouses/warehouse.component').then(m => m.WarehouseComponent) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
