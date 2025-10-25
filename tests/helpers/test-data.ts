/**
 * Test Data Helper - Realistic ZOTAC & SSTC Service Center Data
 *
 * Products: ZOTAC (Graphics Cards, Mini PCs), SSTC (SSDs, NVMe, RAM, Barebone PCs)
 * Workflows: Warranty Service & Repair Service
 */

// ==================== BRANDS ====================
export const BRANDS = {
  ZOTAC: 'ZOTAC',
  SSTC: 'SSTC',
};

// ==================== PRODUCT CATEGORIES ====================
export const PRODUCT_CATEGORIES = {
  // ZOTAC Products
  GRAPHICS_CARD: 'Card đồ họa',
  MINI_PC: 'Mini PC',

  // SSTC Products
  SSD_SATA: 'Ổ cứng SSD SATA',
  SSD_NVME: 'Ổ cứng NVMe',
  RAM: 'RAM',
  BAREBONE_PC: 'Barebone PC',
};

// ==================== ZOTAC PRODUCTS ====================
export const ZOTAC_PRODUCTS = {
  // Graphics Cards
  RTX_4090: {
    brand: BRANDS.ZOTAC,
    name: 'ZOTAC GAMING GeForce RTX 4090 Trinity',
    category: PRODUCT_CATEGORIES.GRAPHICS_CARD,
    sku: 'ZT-D40900D-10P',
    warrantyMonths: 36, // 3 năm bảo hành
    serialFormat: 'ZT4090', // Format: ZT4090-YYYYMMDD-XXXXX
  },
  RTX_4070_TI: {
    brand: BRANDS.ZOTAC,
    name: 'ZOTAC GAMING GeForce RTX 4070 Ti AMP AIRO',
    category: PRODUCT_CATEGORIES.GRAPHICS_CARD,
    sku: 'ZT-D40710B-10P',
    warrantyMonths: 36,
    serialFormat: 'ZT4070TI',
  },
  RTX_3060: {
    brand: BRANDS.ZOTAC,
    name: 'ZOTAC GAMING GeForce RTX 3060 Twin Edge OC',
    category: PRODUCT_CATEGORIES.GRAPHICS_CARD,
    sku: 'ZT-A30600H-10M',
    warrantyMonths: 24, // 2 năm
    serialFormat: 'ZT3060',
  },

  // Mini PCs
  ZBOX_MAGNUS: {
    brand: BRANDS.ZOTAC,
    name: 'ZOTAC ZBOX Magnus EN173070C',
    category: PRODUCT_CATEGORIES.MINI_PC,
    sku: 'ZBOX-EN173070C-BE',
    warrantyMonths: 24,
    serialFormat: 'ZBOX',
  },
  ZBOX_EDGE: {
    brand: BRANDS.ZOTAC,
    name: 'ZOTAC ZBOX Edge CI342',
    category: PRODUCT_CATEGORIES.MINI_PC,
    sku: 'ZBOX-CI342-BE',
    warrantyMonths: 12,
    serialFormat: 'ZBOX',
  },
};

// ==================== SSTC PRODUCTS ====================
export const SSTC_PRODUCTS = {
  // SSD SATA
  SSD_1TB: {
    brand: BRANDS.SSTC,
    name: 'SSTC SSD SATA III 1TB',
    category: PRODUCT_CATEGORIES.SSD_SATA,
    sku: 'SSTC-SSD-1TB',
    warrantyMonths: 36,
    serialFormat: 'SSD1T',
  },
  SSD_512GB: {
    brand: BRANDS.SSTC,
    name: 'SSTC SSD SATA III 512GB',
    category: PRODUCT_CATEGORIES.SSD_SATA,
    sku: 'SSTC-SSD-512GB',
    warrantyMonths: 36,
    serialFormat: 'SSD512',
  },

  // NVMe
  NVME_2TB: {
    brand: BRANDS.SSTC,
    name: 'SSTC NVMe Gen4 2TB',
    category: PRODUCT_CATEGORIES.SSD_NVME,
    sku: 'SSTC-NVME4-2TB',
    warrantyMonths: 60, // 5 năm
    serialFormat: 'NVME2T',
  },
  NVME_1TB: {
    brand: BRANDS.SSTC,
    name: 'SSTC NVMe Gen3 1TB',
    category: PRODUCT_CATEGORIES.SSD_NVME,
    sku: 'SSTC-NVME3-1TB',
    warrantyMonths: 36,
    serialFormat: 'NVME1T',
  },

  // RAM
  RAM_32GB: {
    brand: BRANDS.SSTC,
    name: 'SSTC DDR5 32GB (2x16GB) 6000MHz',
    category: PRODUCT_CATEGORIES.RAM,
    sku: 'SSTC-DDR5-32GB-6000',
    warrantyMonths: 120, // Lifetime warranty (10 năm)
    serialFormat: 'RAM32',
  },
  RAM_16GB: {
    brand: BRANDS.SSTC,
    name: 'SSTC DDR4 16GB (2x8GB) 3200MHz',
    category: PRODUCT_CATEGORIES.RAM,
    sku: 'SSTC-DDR4-16GB-3200',
    warrantyMonths: 120,
    serialFormat: 'RAM16',
  },

  // Barebone PC
  BAREBONE_AMD: {
    brand: BRANDS.SSTC,
    name: 'SSTC Barebone PC AMD Ryzen',
    category: PRODUCT_CATEGORIES.BAREBONE_PC,
    sku: 'SSTC-BB-AMD',
    warrantyMonths: 24,
    serialFormat: 'BBONE',
  },
};

// ==================== REALISTIC ISSUE DESCRIPTIONS ====================
export const COMMON_ISSUES = {
  // Graphics Card Issues
  GPU_NO_DISPLAY: {
    deviceType: 'Card đồ họa ZOTAC RTX 4090',
    issueDescription: 'Card không lên hình, đèn LED sáng bình thường nhưng màn hình không có tín hiệu. Đã thử đổi màn hình và cáp HDMI khác nhưng vẫn không được. Quạt card quay bình thường.',
    category: 'Warranty',
  },
  GPU_ARTIFACTS: {
    deviceType: 'Card đồ họa ZOTAC RTX 4070 Ti',
    issueDescription: 'Màn hình xuất hiện các chấm đen, vệt màu khi chơi game hoặc render. Nhiệt độ card lên đến 85°C. Hiện tượng xảy ra từ 1 tuần nay.',
    category: 'Warranty',
  },
  GPU_OVERHEAT: {
    deviceType: 'Card đồ họa ZOTAC RTX 3060',
    issueDescription: 'Card bị quá nóng, tự động tắt máy khi chơi game sau 10-15 phút. Quạt card quay rất nhanh và ồn. Đã vệ sinh nhưng không cải thiện.',
    category: 'Repair',
  },

  // Mini PC Issues
  MINIPC_NO_BOOT: {
    deviceType: 'Mini PC ZOTAC ZBOX Magnus',
    issueDescription: 'Máy không khởi động, đèn nguồn không sáng. Đã thử đổi adapter nguồn khác nhưng vẫn không lên. Trước đó máy hoạt động bình thường.',
    category: 'Warranty',
  },
  MINIPC_RANDOM_RESTART: {
    deviceType: 'Mini PC ZOTAC ZBOX Edge',
    issueDescription: 'Máy tự khởi động lại ngẫu nhiên trong khi sử dụng. Không có lỗi Blue Screen. Hiện tượng xảy ra 3-4 lần/ngày.',
    category: 'Repair',
  },

  // SSD Issues
  SSD_NOT_DETECTED: {
    deviceType: 'Ổ cứng SSD SATA SSTC 1TB',
    issueDescription: 'Ổ SSD không được nhận diện trong BIOS. Đã thử cắm vào cổng SATA khác và máy khác nhưng vẫn không nhận. Trước đó có hiện tượng giật lag.',
    category: 'Warranty',
  },
  SSD_SLOW_SPEED: {
    deviceType: 'Ổ cứng SSD SATA SSTC 512GB',
    issueDescription: 'Tốc độ đọc/ghi chỉ đạt 150MB/s (spec là 550MB/s). Máy khởi động và mở ứng dụng rất chậm. Kiểm tra CrystalDiskInfo cho thấy nhiều bad sectors.',
    category: 'Warranty',
  },

  // NVMe Issues
  NVME_OVERHEATING: {
    deviceType: 'Ổ cứng NVMe SSTC Gen4 2TB',
    issueDescription: 'Ổ NVMe bị quá nóng (đạt 80-85°C), gây giảm tốc độ (thermal throttling). Máy bị giật khi copy file lớn. Đã gắn heatsink nhưng vẫn nóng.',
    category: 'Repair',
  },
  NVME_READ_ERROR: {
    deviceType: 'Ổ cứng NVMe SSTC Gen3 1TB',
    issueDescription: 'Xuất hiện lỗi đọc/ghi dữ liệu. File bị hỏng sau khi copy. Event Viewer hiển thị lỗi "disk controller error". SMART status: Warning.',
    category: 'Warranty',
  },

  // RAM Issues
  RAM_BSOD: {
    deviceType: 'RAM SSTC DDR5 32GB',
    issueDescription: 'Máy bị Blue Screen với lỗi MEMORY_MANAGEMENT. Chạy Windows Memory Diagnostic phát hiện lỗi. Đã thử chạy từng thanh riêng lẻ, phát hiện 1 thanh bị lỗi.',
    category: 'Warranty',
  },
  RAM_NOT_STABLE: {
    deviceType: 'RAM SSTC DDR4 16GB',
    issueDescription: 'RAM không chạy ở tốc độ XMP (3200MHz), chỉ chạy được ở 2133MHz. Khi bật XMP máy không boot. Đã update BIOS mới nhất nhưng vẫn vậy.',
    category: 'Repair',
  },

  // Barebone PC Issues
  BAREBONE_USB_FAILED: {
    deviceType: 'Barebone PC SSTC AMD Ryzen',
    issueDescription: 'Tất cả cổng USB phía trước không hoạt động. Cổng phía sau vẫn dùng được. Kiểm tra Device Manager không thấy lỗi. Đã thử cắm header lại vẫn không được.',
    category: 'Repair',
  },
};

// ==================== REALISTIC CUSTOMERS ====================
export const TEST_CUSTOMERS = {
  customer1: {
    name: 'Nguyễn Minh Tuấn',
    phone: '0901234567',
    email: 'tuannm.pc@gmail.com',
    address: '123 Lê Lợi, Quận 1, TP.HCM',
  },
  customer2: {
    name: 'Trần Hoàng Long',
    phone: '0912345678',
    email: 'longth.gaming@gmail.com',
    address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
  },
  customer3: {
    name: 'Lê Thị Hồng',
    phone: '0923456789',
    email: 'honglth@company.com',
    address: '789 Điện Biên Phủ, Quận 3, TP.HCM',
  },
  customer4: {
    name: 'Phạm Văn Đức',
    phone: '0934567890',
    email: 'ducpv.workstation@gmail.com',
    address: '321 Pasteur, Quận 3, TP.HCM',
  },
};

// ==================== REALISTIC TASK TEMPLATES ====================
export const TASK_TEMPLATES = {
  // Warranty Service - Graphics Card
  WARRANTY_GPU: {
    name: 'Dịch vụ Bảo hành - Card đồ họa',
    description: 'Quy trình bảo hành cho card đồ họa ZOTAC (RTX series)',
    serviceType: 'warranty',
    enforceSequence: true,
    tasks: [
      {
        name: 'Tiếp nhận và kiểm tra serial',
        category: 'Intake',
        estimatedMinutes: 10,
        instructions: 'Kiểm tra serial number, ngày mua, tình trạng bảo hành. Chụp ảnh sản phẩm và phiếu bảo hành.',
      },
      {
        name: 'Kiểm tra vật lý ban đầu',
        category: 'Diagnosis',
        estimatedMinutes: 15,
        instructions: 'Kiểm tra vết cháy, rỉ nước, vỡ linh kiện. Kiểm tra quạt, đèn LED. Chụp ảnh tổn thương (nếu có).',
      },
      {
        name: 'Test card với hệ thống chuẩn',
        category: 'Diagnosis',
        estimatedMinutes: 30,
        instructions: 'Cắm card vào test bench. Chạy GPU-Z, FurMark, 3DMark. Kiểm tra tín hiệu output, nhiệt độ, tốc độ quạt.',
      },
      {
        name: 'Chẩn đoán lỗi chi tiết',
        category: 'Diagnosis',
        estimatedMinutes: 20,
        instructions: 'Xác định lỗi: GPU die, VRAM, VRM, quạt, PCB. Ghi nhận kết quả test vào hệ thống.',
      },
      {
        name: 'Liên hệ ZOTAC RMA (nếu cần)',
        category: 'Coordination',
        estimatedMinutes: 15,
        instructions: 'Tạo ticket RMA với ZOTAC. Upload hình ảnh và kết quả test. Chờ approval.',
      },
      {
        name: 'Thay thế linh kiện hoặc đổi máy',
        category: 'Repair',
        estimatedMinutes: 45,
        instructions: 'Thay quạt, thermal pad, hoặc đổi card mới (tùy policy). Cập nhật serial mới vào hệ thống.',
      },
      {
        name: 'Test lại sau sửa/đổi',
        category: 'QA',
        estimatedMinutes: 30,
        instructions: 'Chạy lại bộ test đầy đủ. Burn-in test 2 giờ. Đảm bảo nhiệt độ ổn định.',
      },
      {
        name: 'Dọn dẹp và đóng gói',
        category: 'Closing',
        estimatedMinutes: 10,
        instructions: 'Lau chùi card, đóng gói vào hộp chống tĩnh điện. In phiếu bàn giao.',
      },
      {
        name: 'Thông báo khách hàng và bàn giao',
        category: 'Closing',
        estimatedMinutes: 5,
        instructions: 'Gọi điện thông báo hoàn thành. Hẹn lịch nhận hoặc gửi ship.',
      },
    ],
  },

  // Repair Service - Graphics Card
  REPAIR_GPU: {
    name: 'Dịch vụ Sửa chữa - Card đồ họa',
    description: 'Quy trình sửa chữa có tính phí cho card đồ họa hết bảo hành',
    serviceType: 'paid',
    enforceSequence: true,
    tasks: [
      {
        name: 'Tiếp nhận và báo giá sơ bộ',
        category: 'Intake',
        estimatedMinutes: 15,
        instructions: 'Thu thập thông tin: triệu chứng, thời gian sử dụng. Báo giá kiểm tra: 100,000 VNĐ.',
      },
      {
        name: 'Chẩn đoán chi tiết',
        category: 'Diagnosis',
        estimatedMinutes: 45,
        instructions: 'Test toàn diện. Sử dụng multimeter kiểm tra điện áp. Xác định linh kiện hỏng cụ thể.',
      },
      {
        name: 'Báo giá chi tiết cho khách',
        category: 'Coordination',
        estimatedMinutes: 10,
        instructions: 'Lập bảng báo giá: linh kiện + công sửa. Gọi khách xác nhận. Chờ approval.',
      },
      {
        name: 'Thay thế/sửa chữa linh kiện',
        category: 'Repair',
        estimatedMinutes: 90,
        instructions: 'Thay quạt (200k), thermal paste (50k), hoặc reball GPU (1,500k). Ghi nhận parts sử dụng.',
      },
      {
        name: 'Test chất lượng sau sửa',
        category: 'QA',
        estimatedMinutes: 30,
        instructions: 'Stress test 2 giờ. Kiểm tra nhiệt độ, artifacts, ổn định. Chụp ảnh kết quả test.',
      },
      {
        name: 'Hoàn tất và thu phí',
        category: 'Closing',
        estimatedMinutes: 10,
        instructions: 'In hóa đơn. Thu tiền. Cập nhật trạng thái thanh toán.',
      },
    ],
  },

  // Warranty Service - SSD/NVMe
  WARRANTY_SSD: {
    name: 'Dịch vụ Bảo hành - SSD/NVMe',
    description: 'Quy trình bảo hành ổ cứng SSD và NVMe SSTC',
    serviceType: 'warranty',
    enforceSequence: true,
    tasks: [
      {
        name: 'Tiếp nhận và kiểm tra bảo hành',
        category: 'Intake',
        estimatedMinutes: 10,
        instructions: 'Kiểm tra serial, ngày mua, thời hạn BH. Chụp ảnh nhãn serial.',
      },
      {
        name: 'Backup dữ liệu khách hàng (nếu có)',
        category: 'Diagnosis',
        estimatedMinutes: 60,
        instructions: 'Thông báo khách về chính sách mất dữ liệu. Backup nếu ổ còn đọc được. Ký xác nhận.',
      },
      {
        name: 'Test ổ cứng với phần mềm chuẩn',
        category: 'Diagnosis',
        estimatedMinutes: 30,
        instructions: 'Chạy CrystalDiskInfo, AS SSD Benchmark, HD Tune. Kiểm tra SMART status, bad sectors, tốc độ.',
      },
      {
        name: 'Chẩn đoán lỗi',
        category: 'Diagnosis',
        estimatedMinutes: 15,
        instructions: 'Xác định: ổ hỏng hoàn toàn, chậm, lỗi controller, lỗi NAND. Ghi nhận SMART data.',
      },
      {
        name: 'Xử lý RMA với SSTC',
        category: 'Coordination',
        estimatedMinutes: 10,
        instructions: 'Tạo phiếu đổi trả. Chờ ổ thay thế từ kho hoặc nhà cung cấp.',
      },
      {
        name: 'Cấp ổ cứng thay thế',
        category: 'Repair',
        estimatedMinutes: 15,
        instructions: 'Lấy ổ mới từ kho warranty. Kiểm tra serial mới. Cập nhật vào hệ thống.',
      },
      {
        name: 'Test ổ mới trước khi trả',
        category: 'QA',
        estimatedMinutes: 20,
        instructions: 'Test ổ mới 100% healthy. Benchmark tốc độ đạt spec.',
      },
      {
        name: 'Thông báo khách và bàn giao',
        category: 'Closing',
        estimatedMinutes: 5,
        instructions: 'Gọi điện/email thông báo. Hẹn lịch nhận. Nhắc nhở về dữ liệu.',
      },
    ],
  },

  // Warranty Service - RAM
  WARRANTY_RAM: {
    name: 'Dịch vụ Bảo hành - RAM',
    description: 'Quy trình bảo hành RAM SSTC (Lifetime warranty)',
    serviceType: 'warranty',
    enforceSequence: true,
    tasks: [
      {
        name: 'Tiếp nhận RAM',
        category: 'Intake',
        estimatedMinutes: 5,
        instructions: 'Kiểm tra serial, model. RAM SSTC có BH trọn đời.',
      },
      {
        name: 'Test RAM với MemTest86',
        category: 'Diagnosis',
        estimatedMinutes: 120,
        instructions: 'Chạy MemTest86 ít nhất 4 passes. Kiểm tra từng thanh riêng lẻ. Ghi nhận lỗi (nếu có).',
      },
      {
        name: 'Xác định thanh lỗi',
        category: 'Diagnosis',
        estimatedMinutes: 10,
        instructions: 'Xác định thanh nào bị lỗi. Chụp ảnh kết quả test.',
      },
      {
        name: 'Đổi thanh RAM mới',
        category: 'Repair',
        estimatedMinutes: 5,
        instructions: 'Lấy RAM thay thế từ kho. Cùng capacity và tốc độ.',
      },
      {
        name: 'Test lại bộ RAM mới',
        category: 'QA',
        estimatedMinutes: 60,
        instructions: 'Test MemTest86 ít nhất 1 pass. Đảm bảo 0 lỗi.',
      },
      {
        name: 'Bàn giao',
        category: 'Closing',
        estimatedMinutes: 5,
        instructions: 'Đóng gói, gọi khách.',
      },
    ],
  },
};

// ==================== REALISTIC PARTS ====================
export const REPLACEMENT_PARTS = {
  // GPU Parts
  GPU_FAN_92MM: {
    name: 'Quạt GPU 92mm (ZOTAC RTX 40 series)',
    sku: 'FAN-GPU-92MM-ZOTAC',
    price: 250000,
    cost: 150000,
    stockQuantity: 15,
  },
  THERMAL_PAD_SET: {
    name: 'Bộ thermal pad GPU (full set)',
    sku: 'THERMAL-PAD-GPU',
    price: 100000,
    cost: 50000,
    stockQuantity: 50,
  },
  GPU_BRACKET: {
    name: 'Bracket card đồ họa (universal)',
    sku: 'GPU-BRACKET',
    price: 80000,
    cost: 40000,
    stockQuantity: 20,
  },

  // SSD/NVMe Parts
  NVME_HEATSINK: {
    name: 'Tản nhiệt NVMe M.2',
    sku: 'HEATSINK-NVME',
    price: 150000,
    cost: 80000,
    stockQuantity: 30,
  },
  SATA_CABLE: {
    name: 'Cáp SATA III 6Gbps 50cm',
    sku: 'CABLE-SATA',
    price: 30000,
    cost: 15000,
    stockQuantity: 100,
  },

  // Others
  THERMAL_PASTE: {
    name: 'Keo tản nhiệt Arctic MX-4 (4g)',
    sku: 'PASTE-ARCTIC-MX4',
    price: 120000,
    cost: 70000,
    stockQuantity: 25,
  },
  ANTI_STATIC_BAG: {
    name: 'Túi chống tĩnh điện (lớn)',
    sku: 'BAG-ANTI-STATIC-L',
    price: 10000,
    cost: 5000,
    stockQuantity: 200,
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate realistic serial number based on product type
 */
export function generateSerialNumber(productFormat: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 90000) + 10000; // 5 digit random

  return `${productFormat}-${year}${month}${day}-${random}`;
}

/**
 * Generate realistic service request for testing
 */
export function generateServiceRequest(issueKey: keyof typeof COMMON_ISSUES) {
  const issue = COMMON_ISSUES[issueKey];
  const customer = TEST_CUSTOMERS.customer1;

  return {
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    deviceType: issue.deviceType,
    issueDescription: issue.issueDescription,
  };
}

/**
 * Generate warranty date range for products
 */
export function generateWarrantyDates(warrantyMonths: number) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - Math.floor(warrantyMonths / 2)); // Bought in the middle of warranty

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + warrantyMonths);

  return {
    warrantyStart: startDate.toISOString().split('T')[0],
    warrantyEnd: endDate.toISOString().split('T')[0],
    isUnderWarranty: new Date() < endDate,
  };
}

/**
 * Wait helper
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get random customer
 */
export function getRandomCustomer() {
  const customers = Object.values(TEST_CUSTOMERS);
  return customers[Math.floor(Math.random() * customers.length)];
}

/**
 * Get random ZOTAC product
 */
export function getRandomZotacProduct() {
  const products = Object.values(ZOTAC_PRODUCTS);
  return products[Math.floor(Math.random() * products.length)];
}

/**
 * Get random SSTC product
 */
export function getRandomSSTCProduct() {
  const products = Object.values(SSTC_PRODUCTS);
  return products[Math.floor(Math.random() * products.length)];
}
