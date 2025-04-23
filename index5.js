// JavaScript لتنفيذ وظائف نظام التكامل مع المنصات الخارجية
// يضاف هذا الكود إلى ملف index.js

// 1. تهيئة واجهة المستخدم للتكاملات
function initIntegrationsUI() {
    // إضافة زر التكاملات إلى شريط القائمة
    const headerControls = document.querySelector('.header-controls');
    const integrationsButton = document.createElement('button');
    integrationsButton.id = 'btn-integrations';
    integrationsButton.innerHTML = '<i class="fas fa-plug"></i> التكاملات';
    headerControls.insertBefore(integrationsButton, document.getElementById('btn-settings'));
    
    // إضافة المستمع للزر
    integrationsButton.addEventListener('click', openIntegrationsModal);
    
    // إضافة أيقونة للإشعارات المعلقة
    const pendingCounts = integrationsManager.getPendingCounts();
    const totalPending = pendingCounts.onlineStore + pendingCounts.delivery + pendingCounts.accounting;
    
    if (totalPending > 0) {
        integrationsButton.innerHTML += `<span class="badge">${totalPending}</span>`;
        
        // إضافة CSS للشارة
        const badgeStyle = document.createElement('style');
        badgeStyle.textContent = `
            .badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background-color: #e74c3c;
                color: white;
                border-radius: 50%;
                padding: 3px 6px;
                font-size: 10px;
                font-weight: bold;
            }
            .header-controls button {
                position: relative;
            }
        `;
        document.head.appendChild(badgeStyle);
    }
}

// 2. فتح نافذة التكاملات
function openIntegrationsModal() {
    document.getElementById('integrations-modal').style.display = 'flex';
    
    // تحديث واجهة المستخدم
    updateIntegrationsUIStatus();
    displayRecentSyncLogs();
    setupIntegrationTabs();
    setupToggleSwitches();
    loadIntegrationSettings();
}

// 3. تحديث حالة التكاملات في واجهة المستخدم
function updateIntegrationsUIStatus() {
    // تحديث حالة كل تكامل
    updateIntegrationStatus('online-store', integrationsManager.activeIntegrations.onlineStore);
    updateIntegrationStatus('accounting', integrationsManager.activeIntegrations.accounting);
    updateIntegrationStatus('delivery', integrationsManager.activeIntegrations.delivery);
    updateIntegrationStatus('payment', integrationsManager.activeIntegrations.payment);
 // تحديث عدد العناصر المعلقة
const pendingCounts = integrationsManager.getPendingCounts();
    
if (pendingCounts.onlineStore > 0) {
    document.getElementById('online-store-pending').textContent = `${pendingCounts.onlineStore} طلب جديد بانتظار المعالجة`;
} else {
    document.getElementById('online-store-pending').textContent = '';
}

if (pendingCounts.accounting > 0) {
    document.getElementById('accounting-pending').textContent = `${pendingCounts.accounting} معاملة بانتظار التصدير`;
} else {
    document.getElementById('accounting-pending').textContent = '';
}

if (pendingCounts.delivery > 0) {
    document.getElementById('delivery-pending').textContent = `${pendingCounts.delivery} طلب بانتظار التوصيل`;
} else {
    document.getElementById('delivery-pending').textContent = '';
}
}

// 4. تحديث حالة التكامل المحدد في واجهة المستخدم
function updateIntegrationStatus(integrationType, isActive) {
    const statusElement = document.getElementById(`${integrationType}-status`);
    const toggleElement = document.getElementById(`${integrationType}-toggle`);
    
    if (isActive) {
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i> مفعل';
        statusElement.className = 'integration-status status-active';
        
        // عرض إعدادات التكامل ولوحة البيانات
        if (document.getElementById(`${integrationType}-settings`)) {
            document.getElementById(`${integrationType}-settings`).style.display = 'block';
        }
        
        const contentContainer = document.getElementById(`${integrationType}-${getContentContainerSuffix(integrationType)}`);
        if (contentContainer) {
            contentContainer.style.display = 'block';
        }
    } else {
        statusElement.innerHTML = '<i class="fas fa-times-circle"></i> غير مفعل';
        statusElement.className = 'integration-status status-inactive';
        
        // إخفاء إعدادات التكامل ولوحة البيانات
        if (document.getElementById(`${integrationType}-settings`)) {
            document.getElementById(`${integrationType}-settings`).style.display = 'none';
        }
        
        const contentContainer = document.getElementById(`${integrationType}-${getContentContainerSuffix(integrationType)}`);
        if (contentContainer) {
            contentContainer.style.display = 'none';
        }
    }
    
    // تحديث مفتاح التبديل
    if (toggleElement) {
        toggleElement.checked = isActive;
        document.getElementById(`${integrationType}-toggle-label`).textContent = isActive ? 'مفعل' : 'غير مفعل';
    }
}

// 5. الحصول على لاحقة حاوية المحتوى حسب نوع التكامل
function getContentContainerSuffix(integrationType) {
    switch (integrationType) {
        case 'online-store':
            return 'orders-container';
        case 'accounting':
            return 'reports-container';
        case 'delivery':
            return 'tracking-container';
        case 'payment':
            return 'transactions-container';
        default:
            return 'container';
    }
}

// 6. عرض سجلات المزامنة الأخيرة
function displayRecentSyncLogs() {
    const recentLogsContainer = document.getElementById('recent-sync-logs');
    const logs = integrationsManager.syncLogs.slice(0, 5); // آخر 5 سجلات
    
    if (logs.length === 0) {
        recentLogsContainer.innerHTML = '<div style="text-align: center; padding: 10px;">لا توجد سجلات مزامنة حالياً</div>';
        return;
    }
    
    let html = '';
    logs.forEach(log => {
        const statusClass = `sync-status-${log.status}`;
        const timestamp = new Date(log.timestamp).toLocaleString();
        
        html += `
        <div class="sync-log-item">
            <div>
                <span class="sync-log-type">${getIntegrationTypeDisplay(log.type)}</span>
                <span class="sync-log-status ${statusClass}">${getStatusDisplay(log.status)}</span>
            </div>
            <span class="sync-log-time">${timestamp}</span>
        </div>`;
    });
    
    recentLogsContainer.innerHTML = html;
}

// 7. عرض سجلات المزامنة الكاملة
function displaySyncLogs() {
    const logsContainer = document.getElementById('sync-logs-list');
    const typeFilter = document.getElementById('sync-log-filter').value;
    const statusFilter = document.getElementById('sync-log-status').value;
    
    // تطبيق التصفية
    let filteredLogs = integrationsManager.syncLogs;
    
    if (typeFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.type === typeFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.status === statusFilter);
    }
    
    if (filteredLogs.length === 0) {
        logsContainer.innerHTML = '<div style="text-align: center; padding: 20px;">لا توجد سجلات تطابق معايير التصفية</div>';
        return;
    }
    
    let html = '';
    filteredLogs.forEach(log => {
        const statusClass = `sync-status-${log.status}`;
        const timestamp = new Date(log.timestamp).toLocaleString();
        
        html += `
        <div class="sync-log-item">
            <div>
                <span class="sync-log-type">${getIntegrationTypeDisplay(log.type)}</span>
                <span class="sync-log-status ${statusClass}">${getStatusDisplay(log.status)}</span>
                <div class="sync-log-details">${log.details || ''}</div>
            </div>
            <span class="sync-log-time">${timestamp}</span>
        </div>`;
    });
    
    logsContainer.innerHTML = html;
}

// 8. الحصول على عرض نوع التكامل
function getIntegrationTypeDisplay(type) {
    switch (type) {
        case 'online-store':
            return 'المتجر الإلكتروني';
        case 'accounting':
            return 'نظام المحاسبة';
        case 'delivery':
            return 'خدمة التوصيل';
        case 'payment':
            return 'بوابة الدفع';
        default:
            return type;
    }
}

// 9. الحصول على عرض الحالة
function getStatusDisplay(status) {
    switch (status) {
        case 'success':
            return 'ناجح';
        case 'error':
            return 'خطأ';
        case 'pending':
            return 'معلق';
        default:
            return status;
    }
}

// 10. إعداد تبديل علامات تبويب التكاملات
function setupIntegrationTabs() {
    const tabs = document.querySelectorAll('.settings-tab[data-integration]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const panel = this.getAttribute('data-integration');
            
            // تغيير علامة التبويب النشطة
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // تغيير اللوحة النشطة
            document.querySelectorAll('.integration-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`${panel}-panel`).classList.add('active');
            
            // تحديث محتوى اللوحة النشطة
            if (panel === 'sync') {
                displaySyncLogs();
            }
        });
    });
    
    // إضافة مستمعي الأحداث لعناصر تصفية سجلات المزامنة
    document.getElementById('sync-log-filter').addEventListener('change', displaySyncLogs);
    document.getElementById('sync-log-status').addEventListener('change', displaySyncLogs);
}

// 11. إعداد مفاتيح تبديل التكاملات
function setupToggleSwitches() {
    // مفاتيح تبديل التكاملات الرئيسية
    const toggles = ['online-store', 'accounting', 'delivery', 'payment'];
    toggles.forEach(type => {
        const toggle = document.getElementById(`${type}-toggle`);
        if (toggle) {
            toggle.addEventListener('change', function() {
                const isEnabled = this.checked;
                
                // تحديث حالة التكامل
                integrationsManager.toggleIntegration(type, isEnabled);
                
                // تحديث واجهة المستخدم
                updateIntegrationStatus(type, isEnabled);
            });
        }
    });
    
    // مفاتيح تبديل بوابات الدفع
    document.querySelectorAll('.payment-gateway-toggle').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const gateway = this.getAttribute('data-gateway');
            const isEnabled = this.checked;
            
            // عرض أو إخفاء إعدادات البوابة
            const settingsElement = this.closest('.payment-gateway-item').querySelector('.payment-gateway-settings');
            settingsElement.style.display = isEnabled ? 'block' : 'none';
        });
    });
    
    // توسيع/طي إعدادات بوابات الدفع عند النقر على العنوان
    document.querySelectorAll('.payment-gateway-header').forEach(header => {
        header.addEventListener('click', function(e) {
            // تجاهل النقرات على مفتاح التبديل نفسه
            if (e.target.classList.contains('switch') || e.target.classList.contains('slider')) {
                return;
            }
            
            const item = this.closest('.payment-gateway-item');
            const settings = item.querySelector('.payment-gateway-settings');
            const toggle = item.querySelector('.payment-gateway-toggle');
            
            // طي/توسيع الإعدادات فقط إذا كانت البوابة مفعّلة
            if (toggle.checked) {
                settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
            }
        });
    });
}

// 12. تحميل إعدادات التكاملات
function loadIntegrationSettings() {
    // المتجر الإلكتروني
    const onlineStore = integrationsManager.integrationSettings.onlineStore;
    document.getElementById('online-store-platform').value = onlineStore.platform;
    document.getElementById('online-store-apikey').value = onlineStore.apiKey;
    document.getElementById('online-store-apisecret').value = onlineStore.apiSecret;
    document.getElementById('online-store-url').value = onlineStore.storeUrl;
    document.getElementById('online-store-sync-interval').value = onlineStore.syncInterval;
    
    // نظام المحاسبة
    const accounting = integrationsManager.integrationSettings.accounting;
    document.getElementById('accounting-platform').value = accounting.platform;
    document.getElementById('accounting-apikey').value = accounting.apiKey;
    document.getElementById('accounting-company-id').value = accounting.companyId;
    document.getElementById('accounting-auto-sync').checked = accounting.autoSync;
}

// 13. حفظ إعدادات التكاملات
function saveIntegrationSettings() {
    // المتجر الإلكتروني
    integrationsManager.updateIntegrationSettings('onlineStore', {
        platform: document.getElementById('online-store-platform').value,
        apiKey: document.getElementById('online-store-apikey').value,
        apiSecret: document.getElementById('online-store-apisecret').value,
        storeUrl: document.getElementById('online-store-url').value,
        syncInterval: parseInt(document.getElementById('online-store-sync-interval').value)
    });
    
    // نظام المحاسبة
    integrationsManager.updateIntegrationSettings('accounting', {
        platform: document.getElementById('accounting-platform').value,
        apiKey: document.getElementById('accounting-apikey').value,
        companyId: document.getElementById('accounting-company-id').value,
        autoSync: document.getElementById('accounting-auto-sync').checked
    });
    
    showNotification('تم حفظ إعدادات التكاملات بنجاح', 'success');
}

// 14. محاكاة مزامنة البيانات
function simulateSyncAllData() {
    showNotification('جاري مزامنة البيانات...', 'info');
    
    // تحديث واجهة المستخدم لإظهار حالة التزامن
    document.getElementById('sync-all-now').disabled = true;
    document.getElementById('sync-all-now').innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المزامنة...';
    
    // مزامنة المتجر الإلكتروني
    if (integrationsManager.activeIntegrations.onlineStore) {
        integrationsManager.addSyncLog('online-store', 'pending', 'بدء استيراد الطلبات من المتجر الإلكتروني');
        
        integrationsManager.simulateOnlineOrdersImport().then(result => {
            if (result.success) {
                integrationsManager.addSyncLog('online-store', 'success', `تم استيراد ${result.count} طلب بنجاح`);
            } else {
                integrationsManager.addSyncLog('online-store', 'error', 'فشل استيراد الطلبات');
            }
            
            // مزامنة المنتجات إلى المتجر
            return integrationsManager.simulateProductsExport();
        }).then(result => {
            if (result.success) {
                integrationsManager.addSyncLog('online-store', 'success', `تم تصدير ${result.exported} منتج إلى المتجر الإلكتروني`);
            } else {
                integrationsManager.addSyncLog('online-store', 'error', 'فشل تصدير المنتجات');
            }
        });
    }
    
    // مزامنة نظام المحاسبة
    if (integrationsManager.activeIntegrations.accounting) {
        integrationsManager.addSyncLog('accounting', 'pending', 'بدء تصدير البيانات إلى نظام المحاسبة');
        
        integrationsManager.simulateAccountingExport().then(result => {
            if (result.success) {
                integrationsManager.addSyncLog('accounting', 'success', result.details);
            } else {
                integrationsManager.addSyncLog('accounting', 'error', 'فشل تصدير البيانات إلى نظام المحاسبة');
            }
        });
    }
    
    // بعد الانتهاء من جميع العمليات
    setTimeout(() => {
        document.getElementById('sync-all-now').disabled = false;
        document.getElementById('sync-all-now').innerHTML = '<i class="fas fa-sync"></i> مزامنة جميع البيانات الآن';
        
        // تحديث واجهة المستخدم
        showNotification('تمت المزامنة بنجاح', 'success');
        updateIntegrationsUIStatus();
        displayRecentSyncLogs();
        
        // تحديث عدد الطلبات المعلقة
        integrationsButton.innerHTML = '<i class="fas fa-plug"></i> التكاملات';
    }, 3000);
}

// 15. محاكاة استيراد الطلبات من المتجر الإلكتروني
function simulateImportOnlineOrders() {
    showNotification('جاري استيراد الطلبات...', 'info');
    document.getElementById('import-online-orders').disabled = true;
    
    integrationsManager.simulateOnlineOrdersImport().then(result => {
        if (result.success) {
            showNotification(`تم استيراد ${result.count} طلب بنجاح`, 'success');
            integrationsManager.addSyncLog('online-store', 'success', `تم استيراد ${result.count} طلب بنجاح`);
            
            // عرض الطلبات المستوردة
            displayOnlineOrders(result.orders);
        } else {
            showNotification('فشل استيراد الطلبات', 'error');
            integrationsManager.addSyncLog('online-store', 'error', 'فشل استيراد الطلبات');
        }
        
        document.getElementById('import-online-orders').disabled = false;
    });
}

// 16. عرض الطلبات المستوردة من المتجر الإلكتروني
function displayOnlineOrders(orders) {
    const ordersContainer = document.getElementById('online-orders-container');
    const ordersList = document.getElementById('online-orders-list');
    
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد طلبات مستوردة حالياً</td></tr>';
        return;
    }
    
    ordersContainer.style.display = 'block';
    
    let html = '';
    orders.forEach(order => {
        const orderDate = new Date(order.orderDate).toLocaleDateString();
        
        let statusBadge = '';
        switch (order.status) {
            case 'pending':
                statusBadge = '<span class="stock-status low-stock">معلق</span>';
                break;
            case 'processing':
                statusBadge = '<span class="stock-status in-stock">قيد المعالجة</span>';
                break;
            case 'completed':
                statusBadge = '<span class="stock-status in-stock">مكتمل</span>';
                break;
            case 'cancelled':
                statusBadge = '<span class="stock-status out-of-stock">ملغي</span>';
                break;
        }
        
        html += `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer.name}</td>
            <td>${formatCurrency(order.total)}</td>
            <td>${orderDate}</td>
            <td>${statusBadge}</td>
            <td class="online-order-actions">
                <button class="btn btn-primary action-btn-sm" onclick="importOrderToPos('${order.id}')">
                    استيراد إلى نقطة البيع
                </button>
                <button class="btn action-btn-sm" onclick="viewOrderDetails('${order.id}')">
                    عرض التفاصيل
                </button>
            </td>
        </tr>`;
    });
    
    ordersList.innerHTML = html;
}

// 17. إضافة وظيفة استيراد طلب إلى نقطة البيع
window.importOrderToPos = function(orderId) {
    showNotification(`جاري استيراد الطلب ${orderId} إلى نقطة البيع...`, 'info');
    
    // محاكاة استيراد الطلب (في التطبيق الحقيقي، ستبحث عن بيانات الطلب)
    setTimeout(() => {
        showNotification(`تم استيراد الطلب ${orderId} بنجاح`, 'success');
        
        // إضافة سجل مزامنة
        integrationsManager.addSyncLog('online-store', 'success', `تم استيراد الطلب ${orderId} إلى نقطة البيع`);
        
        // تحديث سجلات المزامنة في واجهة المستخدم
        displayRecentSyncLogs();
    }, 1000);
};

// 18. إضافة وظيفة عرض تفاصيل الطلب
window.viewOrderDetails = function(orderId) {
    // محاكاة عرض تفاصيل الطلب
    alert(`عرض تفاصيل الطلب ${orderId}`);
};

// 19. تهيئة نظام التكاملات
function initIntegrations() {
    // إنشاء نافذة التكاملات
    createIntegrationsModal();
    
    // إضافة زر التكاملات إلى الشريط العلوي
    initIntegrationsUI();
    
    // إضافة مستمعي الأحداث للأزرار
    
    // زر إغلاق النافذة
    document.getElementById('close-integrations-modal').addEventListener('click', function() {
        document.getElementById('integrations-modal').style.display = 'none';
    });
    
    document.getElementById('close-integrations').addEventListener('click', function() {
        document.getElementById('integrations-modal').style.display = 'none';
    });
    
    // زر حفظ الإعدادات
    document.getElementById('save-integration-settings').addEventListener('click', saveIntegrationSettings);
    
    // زر مزامنة جميع البيانات
    document.getElementById('sync-all-now').addEventListener('click', simulateSyncAllData);
    
    // أزرار المتجر الإلكتروني
    document.getElementById('test-online-store-connection').addEventListener('click', function() {
        showNotification('جاري اختبار الاتصال بالمتجر الإلكتروني...', 'info');
        
        setTimeout(() => {
            showNotification('تم الاتصال بالمتجر الإلكتروني بنجاح', 'success');
        }, 1500);
    });
    
    document.getElementById('import-online-orders').addEventListener('click', simulateImportOnlineOrders);
    
    document.getElementById('export-products-to-store').addEventListener('click', function() {
        showNotification('جاري تصدير المنتجات إلى المتجر الإلكتروني...', 'info');
        
        integrationsManager.simulateProductsExport().then(result => {
            if (result.success) {
                showNotification(`تم تصدير ${result.exported} منتج بنجاح`, 'success');
                
                // إضافة سجل مزامنة
                integrationsManager.addSyncLog('online-store', 'success', `تم تصدير ${result.exported} منتج إلى المتجر الإلكتروني`);
                
                // تحديث سجلات المزامنة في واجهة المستخدم
                displayRecentSyncLogs();
            } else {
                showNotification('فشل تصدير المنتجات', 'error');
                
                // إضافة سجل مزامنة
                integrationsManager.addSyncLog('online-store', 'error', 'فشل تصدير المنتجات إلى المتجر الإلكتروني');
            }
        });
    });
    
    // أزرار نظام المحاسبة
    document.getElementById('test-accounting-connection').addEventListener('click', function() {
        showNotification('جاري اختبار الاتصال بنظام المحاسبة...', 'info');
        
        setTimeout(() => {
            showNotification('تم الاتصال بنظام المحاسبة بنجاح', 'success');
        }, 1500);
    });
    
    document.getElementById('export-to-accounting').addEventListener('click', function() {
        showNotification('جاري تصدير البيانات إلى نظام المحاسبة...', 'info');
        
        integrationsManager.simulateAccountingExport().then(result => {
            if (result.success) {
                showNotification(result.details, 'success');
                
                // إضافة سجل مزامنة
                integrationsManager.addSyncLog('accounting', 'success', result.details);
                
                // تحديث سجلات المزامنة في واجهة المستخدم
                displayRecentSyncLogs();
            } else {
                showNotification('فشل تصدير البيانات إلى نظام المحاسبة', 'error');
                
                // إضافة سجل مزامنة
                integrationsManager.addSyncLog('accounting', 'error', 'فشل تصدير البيانات إلى نظام المحاسبة');
            }
        });
    });
}

// تهيئة نظام التكاملات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initIntegrations();
});