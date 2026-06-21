export interface ApiResult<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Vendor {
  id?: number;
  code: string;
  name: string;
  contact_person?: string;
  contact_phone?: string;
  address?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
  vendor_name?: string;
}

export interface Material {
  id?: number;
  code: string;
  name: string;
  spec?: string;
  unit: string;
  type: number;
  category?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
  product_code?: string;
  product_name?: string;
  product_spec?: string;
  product_unit?: string;
  raw_code?: string;
  raw_name?: string;
  raw_unit?: string;
}

export interface Warehouse {
  id?: number;
  code: string;
  name: string;
  type?: number;
  status?: number;
}

export interface InputOutputRatio {
  id?: number;
  raw_material_id: number;
  product_material_id: number;
  ratio: number;
  process_name?: string;
  remark?: string;
  raw_code?: string;
  raw_name?: string;
  raw_unit?: string;
  product_code?: string;
  product_name?: string;
  product_unit?: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  material_id: number;
  raw_material_id: number;
  process_content?: string;
  order_qty: number;
  issued_qty?: number;
  received_qty?: number;
  qualified_qty?: number;
  unqualified_qty?: number;
  input_output_ratio?: number;
  expected_product_qty?: number;
  unit_price?: number;
  amount?: number;
  delivery_date?: string;
  status?: number;
  remark?: string;
  product_code?: string;
  product_name?: string;
  product_spec?: string;
  product_unit?: string;
  raw_code?: string;
  raw_name?: string;
  raw_unit?: string;
}

export interface OutsourceOrder {
  id?: number;
  order_no: string;
  vendor_id: number;
  order_date: string;
  delivery_date: string;
  status?: number;
  total_amount?: number;
  remark?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  vendor_name?: string;
  vendor_code?: string;
  items?: OrderItem[];
}

export interface IssueRecord {
  id?: number;
  order_id: number;
  order_item_id: number;
  material_id: number;
  issue_qty: number;
  issue_date: string;
  issue_by?: string;
  warehouse_id?: number;
  remark?: string;
  order_no?: string;
  vendor_name?: string;
  material_code?: string;
  material_name?: string;
  material_unit?: string;
  warehouse_name?: string;
}

export interface ReceiptRecord {
  id?: number;
  order_id: number;
  order_item_id: number;
  material_id: number;
  receipt_qty: number;
  qualified_qty?: number;
  unqualified_qty?: number;
  receipt_date: string;
  received_by?: string;
  warehouse_id?: number;
  remark?: string;
  order_no?: string;
  vendor_name?: string;
  material_code?: string;
  material_name?: string;
  material_unit?: string;
  warehouse_name?: string;
}

export interface Alert {
  id?: number;
  order_id: number;
  order_item_id?: number;
  vendor_id: number;
  alert_type: number;
  alert_date: string;
  status?: number;
  remark?: string;
  order_no?: string;
  vendor_name?: string;
}

export interface OrderBalance {
  order: OutsourceOrder;
  items: any[];
  computed_at: string;
}

export interface VendorBalance {
  vendor: Vendor;
  summary: {
    total_orders: number;
    total_issued: number;
    total_received: number;
    total_qualified: number;
    in_process: number;
    overdue_count: number;
  };
  orders: OutsourceOrder[];
  computed_at: string;
}

export interface VendorStats {
  vendor: Vendor;
  period: { start_date?: string; end_date?: string };
  orders: { total: number; completed: number; total_amount: number };
  delivery: { total_items: number; delivered_items: number; delivery_rate: number };
  quality: { total_received: number; total_qualified: number; total_unqualified: number; quality_rate: number };
}

export interface OverviewStats {
  total_vendors: number;
  total_orders: number;
  active_orders: number;
  overdue_orders: number;
  total_issued: number;
  total_received: number;
  in_process: number;
  pending_alerts: number;
}
