import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResult, PageResult, Vendor, Material, Warehouse, InputOutputRatio, OutsourceOrder, IssueRecord, ReceiptRecord, Alert, OrderBalance, VendorBalance, VendorStats, OverviewStats } from './models';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private get<T>(url: string, params?: HttpParams): Observable<ApiResult<T>> {
    return this.http.get<ApiResult<T>>(API_BASE + url, { params });
  }

  private post<T>(url: string, body: any): Observable<ApiResult<T>> {
    return this.http.post<ApiResult<T>>(API_BASE + url, body);
  }

  private put<T>(url: string, body: any): Observable<ApiResult<T>> {
    return this.http.put<ApiResult<T>>(API_BASE + url, body);
  }

  private delete<T>(url: string): Observable<ApiResult<T>> {
    return this.http.delete<ApiResult<T>>(API_BASE + url);
  }

  listVendors(params?: HttpParams): Observable<ApiResult<PageResult<Vendor>>> {
    return this.get('/vendors', params);
  }

  getVendor(id: number): Observable<ApiResult<Vendor>> {
    return this.get('/vendors/' + id);
  }

  createVendor(data: Partial<Vendor>): Observable<ApiResult<{ id: number }>> {
    return this.post('/vendors', data);
  }

  updateVendor(id: number, data: Partial<Vendor>): Observable<ApiResult<null>> {
    return this.put('/vendors/' + id, data);
  }

  deleteVendor(id: number): Observable<ApiResult<null>> {
    return this.delete('/vendors/' + id);
  }

  listMaterials(params?: HttpParams): Observable<ApiResult<PageResult<Material>>> {
    return this.get('/materials', params);
  }

  allMaterials(type?: number): Observable<ApiResult<Material[]>> {
    let params = new HttpParams();
    if (type !== undefined) params = params.set('type', type);
    return this.get('/materials/all', params);
  }

  createMaterial(data: Partial<Material>): Observable<ApiResult<{ id: number }>> {
    return this.post('/materials', data);
  }

  updateMaterial(id: number, data: Partial<Material>): Observable<ApiResult<null>> {
    return this.put('/materials/' + id, data);
  }

  deleteMaterial(id: number): Observable<ApiResult<null>> {
    return this.delete('/materials/' + id);
  }

  allWarehouses(): Observable<ApiResult<Warehouse[]>> {
    return this.get('/warehouses/all');
  }

  createWarehouse(data: Partial<Warehouse>): Observable<ApiResult<{ id: number }>> {
    return this.post('/warehouses', data);
  }

  updateWarehouse(id: number, data: Partial<Warehouse>): Observable<ApiResult<null>> {
    return this.put('/warehouses/' + id, data);
  }

  deleteWarehouse(id: number): Observable<ApiResult<null>> {
    return this.delete('/warehouses/' + id);
  }

  listRatios(params?: HttpParams): Observable<ApiResult<PageResult<InputOutputRatio>>> {
    return this.get('/ratios', params);
  }

  allRatios(): Observable<ApiResult<InputOutputRatio[]>> {
    return this.get('/ratios/all');
  }

  createRatio(data: Partial<InputOutputRatio>): Observable<ApiResult<{ id: number }>> {
    return this.post('/ratios', data);
  }

  updateRatio(id: number, data: Partial<InputOutputRatio>): Observable<ApiResult<null>> {
    return this.put('/ratios/' + id, data);
  }

  deleteRatio(id: number): Observable<ApiResult<null>> {
    return this.delete('/ratios/' + id);
  }

  listOrders(params?: HttpParams): Observable<ApiResult<PageResult<OutsourceOrder>>> {
    return this.get('/orders', params);
  }

  getOrder(id: number): Observable<ApiResult<OutsourceOrder>> {
    return this.get('/orders/' + id);
  }

  createOrder(data: any): Observable<ApiResult<{ id: number; order_no: string }>> {
    return this.post('/orders', data);
  }

  updateOrder(id: number, data: any): Observable<ApiResult<null>> {
    return this.put('/orders/' + id, data);
  }

  updateOrderStatus(id: number, status: number): Observable<ApiResult<null>> {
    return this.put('/orders/' + id + '/status', { status });
  }

  deleteOrder(id: number): Observable<ApiResult<null>> {
    return this.delete('/orders/' + id);
  }

  listIssues(params?: HttpParams): Observable<ApiResult<PageResult<IssueRecord>>> {
    return this.get('/issues', params);
  }

  createIssue(data: any): Observable<ApiResult<{ ids: number[] }>> {
    return this.post('/issues', data);
  }

  deleteIssue(id: number): Observable<ApiResult<null>> {
    return this.delete('/issues/' + id);
  }

  listReceipts(params?: HttpParams): Observable<ApiResult<PageResult<ReceiptRecord>>> {
    return this.get('/receipts', params);
  }

  createReceipt(data: any): Observable<ApiResult<{ ids: number[] }>> {
    return this.post('/receipts', data);
  }

  deleteReceipt(id: number): Observable<ApiResult<null>> {
    return this.delete('/receipts/' + id);
  }

  getOrderBalance(orderId: number): Observable<ApiResult<OrderBalance>> {
    return this.get('/balances/order/' + orderId);
  }

  getVendorBalance(vendorId: number): Observable<ApiResult<VendorBalance>> {
    return this.get('/balances/vendor/' + vendorId);
  }

  getAllVendorBalances(): Observable<ApiResult<VendorBalance[]>> {
    return this.get('/balances/vendor');
  }

  refreshBalance(data: { order_id?: number; vendor_id?: number }): Observable<ApiResult<null>> {
    return this.post('/balances/refresh', data);
  }

  listAlerts(params?: HttpParams): Observable<ApiResult<PageResult<Alert>>> {
    return this.get('/alerts', params);
  }

  generateAlerts(): Observable<ApiResult<{ overdueCount: number; lossCount: number }>> {
    return this.post('/alerts/generate', {});
  }

  updateAlertStatus(id: number, status: number): Observable<ApiResult<null>> {
    return this.put('/alerts/' + id + '/status', { status });
  }

  getVendorStats(vendorId: number, startDate?: string, endDate?: string): Observable<ApiResult<VendorStats>> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.get('/stats/vendor/' + vendorId, params);
  }

  getOverview(): Observable<ApiResult<OverviewStats>> {
    return this.get('/stats/overview');
  }

  getVendorsComparison(): Observable<ApiResult<any[]>> {
    return this.get('/stats/vendors-comparison');
  }
}
