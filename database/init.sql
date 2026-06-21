CREATE DATABASE IF NOT EXISTS outsource_track DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE outsource_track;

DROP TABLE IF EXISTS ot_alert;
DROP TABLE IF EXISTS ot_receipt_record;
DROP TABLE IF EXISTS ot_issue_record;
DROP TABLE IF EXISTS ot_order_item;
DROP TABLE IF EXISTS ot_outsource_order;
DROP TABLE IF EXISTS ot_input_output_ratio;
DROP TABLE IF EXISTS ot_material;
DROP TABLE IF EXISTS ot_warehouse;
DROP TABLE IF EXISTS ot_vendor;

CREATE TABLE ot_vendor (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL COMMENT '外协厂编码',
  name VARCHAR(128) NOT NULL COMMENT '外协厂名称',
  contact_person VARCHAR(64) DEFAULT NULL COMMENT '联系人',
  contact_phone VARCHAR(32) DEFAULT NULL COMMENT '联系电话',
  address VARCHAR(512) DEFAULT NULL COMMENT '地址',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1-启用 0-停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='外协厂';

CREATE TABLE ot_warehouse (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL COMMENT '仓库编码',
  name VARCHAR(128) NOT NULL COMMENT '仓库名称',
  type TINYINT NOT NULL DEFAULT 1 COMMENT '类型 1-原料仓 2-成品仓 3-综合仓',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1-启用 0-停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仓库';

CREATE TABLE ot_material (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL COMMENT '物料编码',
  name VARCHAR(128) NOT NULL COMMENT '物料名称',
  spec VARCHAR(256) DEFAULT NULL COMMENT '规格型号',
  unit VARCHAR(16) NOT NULL COMMENT '计量单位',
  type TINYINT NOT NULL COMMENT '类型 1-原材料 2-成品/半成品',
  category VARCHAR(64) DEFAULT NULL COMMENT '分类',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1-启用 0-停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料';

CREATE TABLE ot_input_output_ratio (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  raw_material_id INT UNSIGNED NOT NULL COMMENT '原材料ID',
  product_material_id INT UNSIGNED NOT NULL COMMENT '成品物料ID',
  ratio DECIMAL(10,4) NOT NULL COMMENT '投入产出比(产出/投入)',
  process_name VARCHAR(128) DEFAULT NULL COMMENT '工序名称',
  remark VARCHAR(512) DEFAULT NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_raw_product (raw_material_id, product_material_id),
  KEY idx_raw_material (raw_material_id),
  KEY idx_product_material (product_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='投入产出比';

CREATE TABLE ot_outsource_order (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(32) NOT NULL COMMENT '订单编号',
  vendor_id INT UNSIGNED NOT NULL COMMENT '外协厂ID',
  order_date DATE NOT NULL COMMENT '下单日期',
  delivery_date DATE NOT NULL COMMENT '交货日期',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '状态 0-草稿 1-已下达 2-部分收货 3-全部收货 4-已关闭',
  total_amount DECIMAL(14,2) DEFAULT 0 COMMENT '订单总金额',
  remark VARCHAR(1024) DEFAULT NULL COMMENT '备注',
  created_by VARCHAR(64) DEFAULT NULL COMMENT '创建人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_vendor (vendor_id),
  KEY idx_status (status),
  KEY idx_delivery_date (delivery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='外协订单';

CREATE TABLE ot_order_item (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL COMMENT '订单ID',
  material_id INT UNSIGNED NOT NULL COMMENT '成品物料ID',
  raw_material_id INT UNSIGNED NOT NULL COMMENT '原材料ID',
  process_content VARCHAR(512) DEFAULT NULL COMMENT '加工内容',
  order_qty DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT '订单数量',
  issued_qty DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT '已发料数量',
  received_qty DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT '已收货数量',
  qualified_qty DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT '合格数量',
  unqualified_qty DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT '不合格数量',
  input_output_ratio DECIMAL(10,4) DEFAULT NULL COMMENT '投入产出比',
  expected_product_qty DECIMAL(14,4) DEFAULT NULL COMMENT '应收成品数量(按产出比)',
  unit_price DECIMAL(14,4) DEFAULT NULL COMMENT '加工单价',
  amount DECIMAL(14,2) DEFAULT NULL COMMENT '金额',
  delivery_date DATE DEFAULT NULL COMMENT '明细交期',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '状态 0-待发料 1-已发料 2-部分收货 3-已收货',
  remark VARCHAR(512) DEFAULT NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order (order_id),
  KEY idx_material (material_id),
  KEY idx_raw_material (raw_material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='外协订单明细';

CREATE TABLE ot_issue_record (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL COMMENT '订单ID',
  order_item_id INT UNSIGNED NOT NULL COMMENT '订单明细ID',
  material_id INT UNSIGNED NOT NULL COMMENT '原材料ID',
  issue_qty DECIMAL(14,4) NOT NULL COMMENT '发料数量',
  issue_date DATE NOT NULL COMMENT '发料日期',
  issue_by VARCHAR(64) DEFAULT NULL COMMENT '发料人',
  warehouse_id INT UNSIGNED DEFAULT NULL COMMENT '出库仓库ID',
  remark VARCHAR(512) DEFAULT NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order (order_id),
  KEY idx_order_item (order_item_id),
  KEY idx_material (material_id),
  KEY idx_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发料出库记录';

CREATE TABLE ot_receipt_record (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL COMMENT '订单ID',
  order_item_id INT UNSIGNED NOT NULL COMMENT '订单明细ID',
  material_id INT UNSIGNED NOT NULL COMMENT '成品物料ID',
  receipt_qty DECIMAL(14,4) NOT NULL COMMENT '收货数量',
  qualified_qty DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT '合格数量',
  unqualified_qty DECIMAL(14,4) NOT NULL DEFAULT 0 COMMENT '不合格数量',
  receipt_date DATE NOT NULL COMMENT '收货日期',
  received_by VARCHAR(64) DEFAULT NULL COMMENT '收货人',
  warehouse_id INT UNSIGNED DEFAULT NULL COMMENT '入库仓库ID',
  remark VARCHAR(512) DEFAULT NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order (order_id),
  KEY idx_order_item (order_item_id),
  KEY idx_material (material_id),
  KEY idx_receipt_date (receipt_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收货入库记录';

CREATE TABLE ot_alert (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL COMMENT '订单ID',
  order_item_id INT UNSIGNED DEFAULT NULL COMMENT '订单明细ID',
  vendor_id INT UNSIGNED NOT NULL COMMENT '外协厂ID',
  alert_type TINYINT NOT NULL COMMENT '预警类型 1-超期未交货 2-异常损耗',
  alert_date DATE NOT NULL COMMENT '预警日期',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '状态 0-待处理 1-已处理 2-已忽略',
  remark VARCHAR(512) DEFAULT NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order (order_id),
  KEY idx_vendor (vendor_id),
  KEY idx_status (status),
  KEY idx_alert_type (alert_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警记录';

INSERT INTO ot_warehouse (code, name, type) VALUES ('WH-RAW', '原材料仓', 1);
INSERT INTO ot_warehouse (code, name, type) VALUES ('WH-FIN', '成品仓', 2);

INSERT INTO ot_vendor (code, name, contact_person, contact_phone, address) VALUES
('V001', '鼎盛精密加工厂', '张经理', '13800001001', '苏州市工业园区A路1号'),
('V002', '恒达热处理有限公司', '李工', '13800001002', '无锡市新区B路2号'),
('V003', '精艺表面处理厂', '王总', '13800001003', '常州市武进区C路3号');

INSERT INTO ot_material (code, name, spec, unit, type, category) VALUES
('M-RAW-001', '铝合金毛坯6061', '120x80x50mm', '件', 1, '铝合金'),
('M-RAW-002', '不锈钢圆棒304', 'Φ30x200mm', '件', 1, '不锈钢'),
('M-RAW-003', '碳钢锻坯45#', '150x100x60mm', '件', 1, '碳钢'),
('M-FIN-001', '铝合金壳体', '120x80x45mm', '件', 2, '壳体类'),
('M-FIN-002', '不锈钢轴套', 'Φ28x180mm', '件', 2, '轴套类'),
('M-FIN-003', '碳钢支架', '140x90x55mm', '件', 2, '支架类');

INSERT INTO ot_input_output_ratio (raw_material_id, product_material_id, ratio, process_name, remark) VALUES
(1, 4, 0.9000, 'CNC精加工', '铝合金毛坯加工壳体，正常损耗10%'),
(2, 5, 0.8500, '车削+热处理', '不锈钢棒料加工轴套，正常损耗15%'),
(3, 6, 0.8800, '铣削+表面处理', '碳钢锻坯加工支架，正常损耗12%');
