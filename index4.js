// نظام التكامل مع المنصات الخارجية
// يضاف هذا الكود إلى ملف index.js

// 1. إدارة التكامل مع المنصات الخارجية
const integrationsManager = {
    // قائمة التكاملات النشطة
    activeIntegrations: JSON.parse(localStorage.getItem('activeIntegrations')) || {
        onlineStore: false,
        accounting: false,
        delivery: false,
        payment: false
    },
    
    // إعدادات التكامل
    integrationSettings: JSON.parse(localStorage.getItem('integrationSettings')) || {
        onlineStore: {
            platform: 'woocommerce',
            apiKey: '',
            apiSecret: '',
            storeUrl: '',
            syncInterval: 30 // بالدقائق
        },
        accounting: {
            platform: 'quickbooks',
            apiKey: '',
            companyId: '',
            autoSync: true
        },
        delivery: {
            providers: []
        },
        payment: {
            gateways: []
        }
    },
    
    // سجل التزامن
    syncLogs: JSON.parse(localStorage.getItem('syncLogs')) || [],
    
    // تمكين أو تعطيل التكامل
    toggleIntegration: function(integrationType, enabled) {
        if (this.activeIntegrations.hasOwnProperty(integrationType)) {
            this.activeIntegrations[integrationType] = enabled;
            this.saveActiveIntegrations();
            return true;
        }
        return false;
    },
    
    // تحديث إعدادات التكامل
    updateIntegrationSettings: function(integrationType, settings) {
        if (this.integrationSettings.hasOwnProperty(integrationType)) {
            this.integrationSettings[integrationType] = {
                ...this.integrationSettings[integrationType],
                ...settings
            };
            this.saveIntegrationSettings();
            return true;
        }
        return false;
    },
    
    // حفظ التكاملات النشطة
    saveActiveIntegrations: function() {
        localStorage.setItem('activeIntegrations', JSON.stringify(this.activeIntegrations));
    },
    
    // حفظ إعدادات التكامل
    saveIntegrationSettings: function() {
        localStorage.setItem('integrationSettings', JSON.stringify(this.integrationSettings));
    },
    
    // إضافة سجل تزامن
    addSyncLog: function(type, status, details) {
        const log = {
            id: Date.now().toString(),
            type,
            status,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.syncLogs.unshift(log);
        
        // الاحتفاظ بآخر 100 سجل فقط
        if (this.syncLogs.length > 100) {
            this.syncLogs = this.syncLogs.slice(0, 100);
        }
        
        this.saveSyncLogs();
        return log;
    },
    
    // حفظ سجلات التزامن
    saveSyncLogs: function() {
        localStorage.setItem('syncLogs', JSON.stringify(this.syncLogs));
    },
    
    // محاكاة استيراد الطلبات عبر الإنترنت
    simulateOnlineOrdersImport: function() {
        // في بيئة حقيقية، ستقوم باستدعاء واجهة برمجة التطبيقات للمتجر عبر الإنترنت
        return new Promise((resolve) => {
            setTimeout(() => {
                // محاكاة البيانات المستوردة
                const importedOrders = [
                    {
                        id: 'ONL' + Date.now(),
                        customer: {
                            name: 'علي محمد',
                            email: 'ali@example.com',
                            phone: '07701234567'
                        },
                        items: [
                            {
                                id: products.length > 0 ? products[Math.floor(Math.random() * products.length)].id : 'unknown',
                                name: 'منتج عبر الإنترنت',
                                quantity: Math.floor(Math.random() * 5) + 1,
                                price: 15000
                            },
                            {
                                id: products.length > 1 ? products[Math.floor(Math.random() * products.length)].id : 'unknown',
                                name: 'منتج عبر الإنترنت 2',
                                quantity: Math.floor(Math.random() * 3) + 1,
                                price: 25000
                            }
                        ],
                        total: 75000,
                        status: 'pending',
                        paymentMethod: 'online',
                        orderDate: new Date().toISOString(),
                        notes: 'طلب تم استيراده من المتجر الإلكتروني'
                    }
                ];
                
                resolve({
                    success: true,
                    orders: importedOrders,
                    count: importedOrders.length
                });
            }, 1500);
        });
    },
    
    // محاكاة تصدير المنتجات إلى المتجر عبر الإنترنت
    simulateProductsExport: function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                // في بيئة حقيقية، ستقوم بإرسال بيانات المنتجات إلى واجهة برمجة التطبيقات للمتجر
                resolve({
                    success: true,
                    exported: products.length,
                    failed: 0
                });
            }, 2000);
        });
    },
    
    // محاكاة تصدير البيانات إلى نظام المحاسبة
    simulateAccountingExport: function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    details: 'تم تصدير المبيعات والمخزون إلى نظام المحاسبة'
                });
            }, 1800);
        });
    },
    
    // محاكاة إنشاء طلب توصيل
    simulateDeliveryRequest: function(order) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    trackingNumber: 'DLV' + Date.now().toString().substring(6),
                    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
                    provider: 'خدمة التوصيل السريع'
                });
            }, 1200);
        });
    },
    
    // محاكاة تكامل بوابة الدفع الإلكتروني
    simulatePaymentProcessing: function(amount) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // محاكاة نجاح الدفع بنسبة 90%
                if (Math.random() < 0.9) {
                    resolve({
                        success: true,
                        transactionId: 'TRX' + Date.now(),
                        amount: amount,
                        gateway: 'بوابة الدفع الافتراضية',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    reject({
                        success: false,
                        error: 'فشل معالجة الدفع',
                        errorCode: 'PAYMENT_FAILED'
                    });
                }
            }, 1500);
        });
    },
    
    // الحصول على عدد الطلبات غير المعالجة في كل منصة
    getPendingCounts: function() {
        // في تطبيق حقيقي، ستستعلم عن هذه البيانات من المنصات المختلفة
        return {
            onlineStore: Math.floor(Math.random() * 5),
            delivery: Math.floor(Math.random() * 3),
            accounting: Math.floor(Math.random() * 10)
        };
    }
};

// 2. إنشاء واجهة المستخدم للتكاملات
function createIntegrationsModal() {
    const modalHtml = `
    <div class="modal" id="integrations-modal">
        <div class="modal-content" style="width: 80%; max-width: 1000px;">
            <div class="modal-header">
                <h2>تكامل المنصات</h2>
                <button class="modal-close" id="close-integrations-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-tabs">
                    <div class="settings-tab active" data-integration="overview">نظرة عامة</div>
                    <div class="settings-tab" data-integration="online-store">المتجر الإلكتروني</div>
                    <div class="settings-tab" data-integration="accounting">نظام المحاسبة</div>
                    <div class="settings-tab" data-integration="delivery">خدمات التوصيل</div>
                    <div class="settings-tab" data-integration="payment">بوابات الدفع</div>
                    <div class="settings-tab" data-integration="sync">سجل المزامنة</div>
                </div>
                
                <!-- نظرة عامة -->
                <div class="integration-panel active" id="overview-panel">
                    <div class="form-row">
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">المتجر الإلكتروني</div>
                            <div class="report-content">
                                <div class="report-value">
                                    <div class="integration-status" id="online-store-status"></div>
                                </div>
                                <div class="report-icon"><i class="fas fa-shopping-cart"></i></div>
                            </div>
                            <div class="pending-items" id="online-store-pending"></div>
                        </div>
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">نظام المحاسبة</div>
                            <div class="report-content">
                                <div class="report-value">
                                    <div class="integration-status" id="accounting-status"></div>
                                </div>
                                <div class="report-icon"><i class="fas fa-calculator"></i></div>
                            </div>
                            <div class="pending-items" id="accounting-pending"></div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">خدمات التوصيل</div>
                            <div class="report-content">
                                <div class="report-value">
                                    <div class="integration-status" id="delivery-status"></div>
                                </div>
                                <div class="report-icon"><i class="fas fa-truck"></i></div>
                            </div>
                            <div class="pending-items" id="delivery-pending"></div>
                        </div>
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">بوابات الدفع</div>
                            <div class="report-content">
                                <div class="report-value">
                                    <div class="integration-status" id="payment-status"></div>
                                </div>
                                <div class="report-icon"><i class="fas fa-credit-card"></i></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-top: 20px;">
                        <h3>آخر عمليات المزامنة</h3>
                        <div class="sync-logs-mini" id="recent-sync-logs">
                            <!-- ستتم إضافة سجلات المزامنة الأخيرة هنا -->
                        </div>
                    </div>
                    
                    <div class="form-group" style="text-align: center; margin-top: 20px;">
                        <button class="btn btn-primary" id="sync-all-now">
                            <i class="fas fa-sync"></i>
                            مزامنة جميع البيانات الآن
                        </button>
                    </div>
                </div>
                
              <!-- المتجر الإلكتروني -->
<div class="integration-panel" id="online-store-panel">
    <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>إعدادات المتجر الإلكتروني</h3>
            <label class="switch">
                <input type="checkbox" id="online-store-toggle">
                <span class="slider round"></span>
                <span class="toggle-label" id="online-store-toggle-label">غير مفعل</span>
            </label>
        </div>
    </div>
    
    <div id="online-store-settings" style="display: none;">
        <div class="form-group">
            <label for="online-store-platform">منصة المتجر</label>
            <select class="form-control" id="online-store-platform">
                <option value="woocommerce">WooCommerce</option>
                <option value="shopify">Shopify</option>
                <option value="opencart">OpenCart</option>
                <option value="magento">Magento</option>
                <option value="custom">أخرى</option>
            </select>
        </div>
        
        <div class="form-row">
            <div class="form-col">
                <div class="form-group">
                    <label for="online-store-apikey">مفتاح API</label>
                    <input type="text" class="form-control" id="online-store-apikey">
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="online-store-apisecret">كلمة سر API</label>
                    <input type="password" class="form-control" id="online-store-apisecret">
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label for="online-store-url">رابط المتجر</label>
            <input type="url" class="form-control" id="online-store-url" placeholder="https://your-store.com">
        </div>
        
        <div class="form-group">
            <label for="online-store-sync-interval">فترة المزامنة التلقائية (بالدقائق)</label>
            <input type="number" class="form-control" id="online-store-sync-interval" min="5" value="30">
        </div>
        
        <div class="form-group">
            <label><input type="checkbox" id="online-store-auto-import"> استيراد الطلبات الجديدة تلقائياً</label>
        </div>
        
        <div class="form-group">
            <label><input type="checkbox" id="online-store-auto-stock"> مزامنة المخزون تلقائياً</label>
        </div>
        
        <div class="form-group" style="margin-top: 20px;">
            <button class="btn btn-primary" id="test-online-store-connection">
                اختبار الاتصال
            </button>
            <button class="btn btn-primary" id="import-online-orders">
                استيراد الطلبات
            </button>
            <button class="btn btn-primary" id="export-products-to-store">
                تصدير المنتجات
            </button>
        </div>
    </div>
    
    <div id="online-orders-container" style="margin-top: 30px; display: none;">
        <h3>الطلبات عبر الإنترنت</h3>
        <table class="inventory-list">
            <thead>
                <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>المبلغ</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody id="online-orders-list">
                <!-- ستتم إضافة الطلبات هنا -->
            </tbody>
        </table>
    </div>
</div>

<!-- نظام المحاسبة -->
<div class="integration-panel" id="accounting-panel">
    <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>إعدادات نظام المحاسبة</h3>
            <label class="switch">
                <input type="checkbox" id="accounting-toggle">
                <span class="slider round"></span>
                <span class="toggle-label" id="accounting-toggle-label">غير مفعل</span>
            </label>
        </div>
    </div>
    
    <div id="accounting-settings" style="display: none;">
        <div class="form-group">
            <label for="accounting-platform">نظام المحاسبة</label>
            <select class="form-control" id="accounting-platform">
                <option value="quickbooks">QuickBooks</option>
                <option value="xero">Xero</option>
                <option value="zoho">Zoho Books</option>
                <option value="excel">تصدير Excel</option>
                <option value="custom">أخرى</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="accounting-apikey">مفتاح API</label>
            <input type="text" class="form-control" id="accounting-apikey">
        </div>
        
        <div class="form-group">
            <label for="accounting-company-id">معرف الشركة</label>
            <input type="text" class="form-control" id="accounting-company-id">
        </div>
        
        <div class="form-group">
            <label><input type="checkbox" id="accounting-auto-sync"> تصدير المبيعات تلقائياً</label>
        </div>
        
        <div class="form-group">
            <label><input type="checkbox" id="accounting-include-inventory"> تضمين حركات المخزون</label>
        </div>
        
        <div class="form-group" style="margin-top: 20px;">
            <button class="btn btn-primary" id="test-accounting-connection">
                اختبار الاتصال
            </button>
            <button class="btn btn-primary" id="export-to-accounting">
                تصدير البيانات الآن
            </button>
        </div>
    </div>
    
    <div id="accounting-reports-container" style="margin-top: 30px; display: none;">
        <h3>تقارير المحاسبة</h3>
        <div class="form-row">
            <div class="report-card" style="flex: 1;">
                <div class="report-title">المبيعات المصدرة</div>
                <div class="report-content">
                    <div class="report-value" id="exported-sales-count">0</div>
                    <div class="report-icon"><i class="fas fa-file-invoice-dollar"></i></div>
                </div>
            </div>
            <div class="report-card" style="flex: 1;">
                <div class="report-title">آخر تصدير</div>
                <div class="report-content">
                    <div class="report-value" id="last-export-date">لا يوجد</div>
                    <div class="report-icon"><i class="fas fa-calendar-check"></i></div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- خدمات التوصيل -->
<div class="integration-panel" id="delivery-panel">
    <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>إعدادات خدمات التوصيل</h3>
            <label class="switch">
                <input type="checkbox" id="delivery-toggle">
                <span class="slider round"></span>
                <span class="toggle-label" id="delivery-toggle-label">غير مفعل</span>
            </label>
        </div>
    </div>
    
    <div id="delivery-settings" style="display: none;">
        <div class="form-group">
            <h3>مزودي خدمة التوصيل</h3>
            <table class="inventory-list">
                <thead>
                    <tr>
                        <th>اسم المزود</th>
                        <th>رسوم التوصيل</th>
                        <th>المناطق المدعومة</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody id="delivery-providers-list">
                    <tr>
                        <td colspan="5" style="text-align: center;">لا يوجد مزودين خدمة مضافين</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="form-group" style="margin-top: 20px;">
            <button class="btn btn-primary" id="add-delivery-provider">
                <i class="fas fa-plus"></i>
                إضافة مزود خدمة
            </button>
        </div>
        
        <div class="form-group" style="margin-top: 30px;">
            <h3>إعدادات التوصيل</h3>
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label for="delivery-default-provider">مزود الخدمة الافتراضي</label>
                        <select class="form-control" id="delivery-default-provider">
                            <option value="">-- اختر مزود الخدمة --</option>
                        </select>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label for="delivery-auto-create">إنشاء طلب توصيل تلقائياً</label>
                        <select class="form-control" id="delivery-auto-create">
                            <option value="never">لا</option>
                            <option value="manual">بعد تأكيد الطلب يدوياً</option>
                            <option value="auto">مع كل طلب جديد</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label><input type="checkbox" id="delivery-collect-payment"> تحصيل المبلغ عند التوصيل</label>
            </div>
        </div>
    </div>
    
    <div id="delivery-tracking-container" style="margin-top: 30px; display: none;">
        <h3>تتبع الطلبات</h3>
        <table class="inventory-list">
            <thead>
                <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>مزود الخدمة</th>
                    <th>رقم التتبع</th>
                    <th>حالة التوصيل</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody id="delivery-tracking-list">
                <!-- ستتم إضافة الطلبات هنا -->
            </tbody>
        </table>
    </div>
</div>

<!-- بوابات الدفع -->
<div class="integration-panel" id="payment-panel">
    <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>إعدادات بوابات الدفع</h3>
            <label class="switch">
                <input type="checkbox" id="payment-toggle">
                <span class="slider round"></span>
                <span class="toggle-label" id="payment-toggle-label">غير مفعل</span>
            </label>
        </div>
    </div>
    
    <div id="payment-settings" style="display: none;">
        <div class="form-group">
            <h3>بوابات الدفع المتاحة</h3>
            <div class="payment-gateways-container" id="payment-gateways-list">
                <div class="payment-gateway-item" data-gateway="card">
                    <div class="payment-gateway-header">
                        <span><i class="fas fa-credit-card"></i> بطاقة الائتمان</span>
                        <label class="switch">
                            <input type="checkbox" class="payment-gateway-toggle" data-gateway="card">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="payment-gateway-settings" style="display: none;">
                        <div class="form-group">
                            <label for="payment-card-provider">مزود الخدمة</label>
                            <select class="form-control" id="payment-card-provider">
                                <option value="stripe">Stripe</option>
                                <option value="payfort">PayFort</option>
                                <option value="tap">Tap Payments</option>
                                <option value="manual">معالجة يدوية</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="payment-card-apikey">مفتاح API</label>
                            <input type="text" class="form-control" id="payment-card-apikey">
                        </div>
                        <div class="form-group">
                            <label for="payment-card-secret">كلمة السر</label>
                            <input type="password" class="form-control" id="payment-card-secret">
                        </div>
                        <div class="form-group">
                            <label><input type="checkbox" id="payment-card-test-mode"> وضع الاختبار</label>
                        </div>
                    </div>
                </div>
                
                <div class="payment-gateway-item" data-gateway="wallet">
                    <div class="payment-gateway-header">
                        <span><i class="fas fa-wallet"></i> المحافظ الإلكترونية</span>
                        <label class="switch">
                            <input type="checkbox" class="payment-gateway-toggle" data-gateway="wallet">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="payment-gateway-settings" style="display: none;">
                        <div class="form-group">
                            <label>المحافظ المدعومة</label>
                            <div>
                                <label><input type="checkbox" id="payment-wallet-stcpay"> STC Pay</label><br>
                                <label><input type="checkbox" id="payment-wallet-applepay"> Apple Pay</label><br>
                                <label><input type="checkbox" id="payment-wallet-googlepay"> Google Pay</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="payment-wallet-apikey">مفتاح API</label>
                            <input type="text" class="form-control" id="payment-wallet-apikey">
                        </div>
                    </div>
                </div>
                
                <div class="payment-gateway-item" data-gateway="bank">
                    <div class="payment-gateway-header">
                        <span><i class="fas fa-university"></i> تحويل بنكي</span>
                        <label class="switch">
                            <input type="checkbox" class="payment-gateway-toggle" data-gateway="bank">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="payment-gateway-settings" style="display: none;">
                        <div class="form-group">
                            <label for="payment-bank-name">اسم البنك</label>
                            <input type="text" class="form-control" id="payment-bank-name">
                        </div>
                        <div class="form-group">
                            <label for="payment-bank-account">رقم الحساب</label>
                            <input type="text" class="form-control" id="payment-bank-account">
                        </div>
                        <div class="form-group">
                            <label for="payment-bank-iban">رقم IBAN</label>
                            <input type="text" class="form-control" id="payment-bank-iban">
                        </div>
                        <div class="form-group">
                            <label><input type="checkbox" id="payment-bank-require-confirmation"> تتطلب تأكيد يدوي</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="form-group" style="margin-top: 30px;">
            <h3>إعدادات عامة للدفع</h3>
            <div class="form-row">
                <div class="form-col">
                    <div class="form-group">
                        <label for="payment-default-gateway">بوابة الدفع الافتراضية</label>
                        <select class="form-control" id="payment-default-gateway">
                            <option value="cash">الدفع نقداً</option>
                            <option value="card">بطاقة الائتمان</option>
                            <option value="wallet">محفظة إلكترونية</option>
                            <option value="bank">تحويل بنكي</option>
                        </select>
                    </div>
                </div>
                <div class="form-col">
                    <div class="form-group">
                        <label for="payment-currency">العملة</label>
                        <select class="form-control" id="payment-currency">
                            <option value="IQD">دينار عراقي (IQD)</option>
                            <option value="USD">دولار أمريكي (USD)</option>
                            <option value="SAR">ريال سعودي (SAR)</option>
                            <option value="AED">درهم إماراتي (AED)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="payment-transactions-container" style="margin-top: 30px; display: none;">
        <h3>المعاملات المالية</h3>
        <table class="inventory-list">
            <thead>
                <tr>
                    <th>رقم المعاملة</th>
                    <th>المبلغ</th>
                    <th>طريقة الدفع</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody id="payment-transactions-list">
                <!-- ستتم إضافة المعاملات هنا -->
            </tbody>
        </table>
    </div>
</div>

<!-- سجل المزامنة -->
<div class="integration-panel" id="sync-panel">
    <div class="form-group">
        <h3>سجل عمليات المزامنة</h3>
        <div class="form-row">
            <div class="form-col">
                <div class="form-group">
                    <label for="sync-log-filter">تصفية حسب</label>
                    <select class="form-control" id="sync-log-filter">
                        <option value="all">الكل</option>
                        <option value="online-store">المتجر الإلكتروني</option>
                        <option value="accounting">نظام المحاسبة</option>
                        <option value="delivery">خدمات التوصيل</option>
                        <option value="payment">بوابات الدفع</option>
                    </select>
                </div>
            </div>
            <div class="form-col">
                <div class="form-group">
                    <label for="sync-log-status">الحالة</label>
                    <select class="form-control" id="sync-log-status">
                        <option value="all">الكل</option>
                        <option value="success">ناجح</option>
                        <option value="error">خطأ</option>
                        <option value="pending">معلق</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div class="sync-logs-container" id="sync-logs-list">
            <!-- ستتم إضافة سجلات المزامنة هنا -->
        </div>
    </div>
</div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="save-integration-settings">حفظ الإعدادات</button>
                <button class="btn" id="close-integrations">إغلاق</button>
            </div>
        </div>
    </div>`;

document.body.insertAdjacentHTML('beforeend', modalHtml);

// إضافة CSS للتكاملات
const integrationsStyles = `
<style>
    .integration-panel {
        display: none;
        margin-top: 20px;
    }
    .integration-panel.active {
        display: block;
    }
    .integration-status {
        display: inline-flex;
        align-items: center;
        font-weight: bold;
    }
    .status-active {
        color: var(--secondary-color);
    }
    .status-inactive {
        color: #bbb;
    }
    .status-error {
        color: var(--danger-color);
    }
    
    /* مفتاح التبديل */
    .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
    }
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
    }
    .slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
    }
    input:checked + .slider {
        background-color: var(--secondary-color);
    }
    input:focus + .slider {
        box-shadow: 0 0 1px var(--secondary-color);
    }
    input:checked + .slider:before {
        transform: translateX(26px);
    }
    .slider.round {
        border-radius: 34px;
    }
    .slider.round:before {
        border-radius: 50%;
    }
    .toggle-label {
        display: inline-block;
        margin-left: 10px;
        vertical-align: middle;
    }
    
    /* سجلات المزامنة */
    .sync-logs-container {
        max-height: 500px;
        overflow-y: auto;
        margin-top: 20px;
    }
    .sync-logs-mini {
        max-height: 200px;
        overflow-y: auto;
    }
    .sync-log-item {
        padding: 10px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
    }
    .sync-log-item:last-child {
        border-bottom: none;
    }
    .sync-log-status {
        font-weight: bold;
        padding: 2px 8px;
        border-radius: 4px;
        color: white;
    }
    .sync-status-success {
        background-color: var(--secondary-color);
    }
    .sync-status-error {
        background-color: var(--danger-color);
    }
    .sync-status-pending {
        background-color: var(--primary-color);
    }
    .sync-log-type {
        display: inline-block;
        width: 120px;
    }
    .sync-log-time {
        color: #777;
        font-size: 12px;
    }
    .sync-log-details {
        margin-top: 5px;
        font-size: 13px;
        color: #666;
    }
    
    /* طلبات الإنترنت وتتبع التوصيل */
    .online-order-actions,
    .delivery-tracking-actions {
        display: flex;
        gap: 5px;
    }
    .action-btn-sm {
        padding: 4px 8px;
        font-size: 12px;
    }
    
    /* بوابات الدفع */
    .payment-gateways-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }
    .payment-gateway-item {
        border: 1px solid #eee;
        border-radius: 8px;
        overflow: hidden;
    }
    .payment-gateway-header {
        background-color: #f9f9f9;
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
    }
    .payment-gateway-settings {
        padding: 15px;
    }
    
    /* عداد المعلقات */
    .pending-items {
        font-size: 12px;
        margin-top: 5px;
        color: #e74c3c;
    }
</style>`;

document.head.insertAdjacentHTML('beforeend', integrationsStyles);
}