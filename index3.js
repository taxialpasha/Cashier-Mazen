document.getElementById('confirm-redeem').addEventListener('click', function() {
    const amount = parseInt(document.getElementById('redeem-amount').value);
    const pointsToRedeem = amount * 10; // كل دينار = 10 نقاط
    
    if (amount <= 0 || amount > availableDiscount) {
        showNotification('الرجاء إدخال قيمة صحيحة', 'error');
        return;
    }
    
    const customerId = this.getAttribute('data-id');
    const success = customerManager.redeemPoints(customerId, pointsToRedeem);
    
    if (success) {
        showNotification(`تم استبدال ${pointsToRedeem} نقطة بنجاح`, 'success');
        document.getElementById('redeem-modal').remove();
        
        // إضافة الخصم إلى الفاتورة الحالية إذا كانت هناك فاتورة مفتوحة
        if (cart.items.length > 0) {
            applyLoyaltyDiscount(amount);
        }
        
        // تحديث عرض تفاصيل العميل
        showCustomerDetails(customerId);
    } else {
        showNotification('حدث خطأ أثناء استبدال النقاط', 'error');
    }
});

// 12. تطبيق خصم الولاء على الفاتورة الحالية
function applyLoyaltyDiscount(amount) {
    // تحديث المتغيرات العالمية للخصم
    discountType = 'fixed';
    discountValue = amount;
    discountReason = 'استبدال نقاط ولاء';
    
    // إعادة حساب الفاتورة
    calculateTotals();
    
    // تحديث واجهة المستخدم
    document.getElementById('discount').textContent = formatCurrency(getDiscountAmount());
    document.getElementById('total').textContent = formatCurrency(getTotalAmount());
}

// 13. تعديل بيانات العميل
function editCustomer(customerId) {
    const customer = customerManager.getCustomerById(customerId);
    if (!customer) return;
    
    // إنشاء نافذة منبثقة للتعديل
    const editHtml = `
    <div class="modal" id="edit-customer-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>تعديل بيانات العميل</h2>
                <button class="modal-close" id="close-edit-customer-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="edit-customer-name">اسم العميل</label>
                    <input type="text" class="form-control" id="edit-customer-name" value="${customer.name}">
                </div>
                <div class="form-group">
                    <label for="edit-customer-phone">رقم الهاتف</label>
                    <input type="text" class="form-control" id="edit-customer-phone" value="${customer.phone}">
                </div>
                <div class="form-group">
                    <label for="edit-customer-email">البريد الإلكتروني</label>
                    <input type="email" class="form-control" id="edit-customer-email" value="${customer.email || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-customer-notes">ملاحظات</label>
                    <textarea class="form-control" id="edit-customer-notes" rows="3">${customer.notes || ''}</textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="save-customer-edit" data-id="${customerId}">حفظ التغييرات</button>
                <button class="btn" id="cancel-customer-edit">إلغاء</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', editHtml);
    document.getElementById('edit-customer-modal').style.display = 'flex';
    
    // إضافة مستمعي الأحداث
    document.getElementById('close-edit-customer-modal').addEventListener('click', () => {
        document.getElementById('edit-customer-modal').remove();
    });
    
    document.getElementById('cancel-customer-edit').addEventListener('click', () => {
        document.getElementById('edit-customer-modal').remove();
    });
    
    document.getElementById('save-customer-edit').addEventListener('click', function() {
        const customerId = this.getAttribute('data-id');
        const updatedData = {
            name: document.getElementById('edit-customer-name').value,
            phone: document.getElementById('edit-customer-phone').value,
            email: document.getElementById('edit-customer-email').value,
            notes: document.getElementById('edit-customer-notes').value
        };
        
        // التحقق من البيانات
        if (!updatedData.name || !updatedData.phone) {
            showNotification('الرجاء ملء الحقول المطلوبة', 'error');
            return;
        }
        
        const updated = customerManager.updateCustomer(customerId, updatedData);
        if (updated) {
            showNotification('تم تحديث بيانات العميل بنجاح', 'success');
            document.getElementById('edit-customer-modal').remove();
            
            // تحديث عرض تفاصيل العميل
            showCustomerDetails(customerId);
        } else {
            showNotification('حدث خطأ أثناء تحديث بيانات العميل', 'error');
        }
    });
}

// 14. إضافة عميل جديد
function setupAddCustomerForm() {
    document.getElementById('add-new-customer').addEventListener('click', () => {
        const name = document.getElementById('new-customer-name').value;
        const phone = document.getElementById('new-customer-phone').value;
        const email = document.getElementById('new-customer-email').value;
        const birthdate = document.getElementById('new-customer-birthdate').value;
        const notes = document.getElementById('new-customer-notes').value;
        
        // التحقق من البيانات
        if (!name || !phone) {
            showNotification('الرجاء ملء الحقول المطلوبة', 'error');
            return;
        }
        
        // التحقق من عدم وجود عميل بنفس رقم الهاتف
        if (customerManager.getCustomerByPhone(phone)) {
            showNotification('يوجد عميل مسجل بهذا الرقم بالفعل', 'error');
            return;
        }
        
        const customer = customerManager.addCustomer({
            name,
            phone,
            email,
            birthdate,
            notes
        });
        
        if (customer) {
            showNotification('تم إضافة العميل بنجاح', 'success');
            
            // إعادة تعيين النموذج
            document.getElementById('new-customer-name').value = '';
            document.getElementById('new-customer-phone').value = '';
            document.getElementById('new-customer-email').value = '';
            document.getElementById('new-customer-birthdate').value = '';
            document.getElementById('new-customer-notes').value = '';
            
            // الانتقال إلى تفاصيل العميل الجديد
            showCustomerDetails(customer.id);
        } else {
            showNotification('حدث خطأ أثناء إضافة العميل', 'error');
        }
    });
}

// 15. إضافة تبديل بين علامات التبويب
function setupLoyaltyTabs() {
    const tabs = document.querySelectorAll('.settings-tab[data-loyalty]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const panel = this.getAttribute('data-loyalty');
            
            // تغيير علامة التبويب النشطة
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // تغيير اللوحة النشطة
            document.querySelectorAll('.loyalty-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`loyalty-${panel}`).classList.add('active');
        });
    });
}

// 16. إضافة نظام الولاء إلى عملية الدفع
function enhancePaymentWithLoyalty() {
    // تعديل نافذة الدفع لإضافة حقل البحث عن العميل
    const customerSection = document.querySelector('#receipt-customer');
    
    const loyaltyHtml = `
    <div class="form-group">
        <label for="customer-loyalty-search">بحث عن عميل (نظام الولاء)</label>
        <div style="display: flex; gap: 10px;">
            <input type="text" class="form-control" id="customer-loyalty-search" placeholder="أدخل رقم الهاتف أو اسم العميل">
            <button class="btn" id="search-loyalty-customer"><i class="fas fa-search"></i></button>
        </div>
    </div>
    <div id="loyalty-customer-info" style="display: none; margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
        <!-- معلومات العميل ستظهر هنا -->
    </div>`;
    
    customerSection.insertAdjacentHTML('beforebegin', loyaltyHtml);
    
    // إضافة مستمع للبحث عن العميل
    document.getElementById('search-loyalty-customer').addEventListener('click', searchCustomerForPayment);
    document.getElementById('customer-loyalty-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCustomerForPayment();
        }
    });
}

// 17. البحث عن العميل عند الدفع
function searchCustomerForPayment() {
    const searchTerm = document.getElementById('customer-loyalty-search').value.trim();
    if (searchTerm.length < 2) {
        showNotification('أدخل على الأقل حرفين للبحث', 'error');
        return;
    }
    
    const results = customerManager.findCustomer(searchTerm);
    const infoContainer = document.getElementById('loyalty-customer-info');
    
    if (results.length === 0) {
        infoContainer.innerHTML = `
        <p>لا يوجد عميل بهذه البيانات.</p>
        <button class="btn btn-primary" id="quick-add-customer">إضافة عميل جديد</button>`;
        infoContainer.style.display = 'block';
        
        document.getElementById('quick-add-customer').addEventListener('click', () => {
            // نقل البيانات إلى نموذج إضافة العميل
            openLoyaltyModal();
            document.querySelectorAll('.settings-tab[data-loyalty]').forEach(tab => {
                if (tab.getAttribute('data-loyalty') === 'add') {
                    tab.click();
                }
            });
            document.getElementById('new-customer-phone').value = searchTerm;
        });
    } else if (results.length === 1) {
        // عميل واحد فقط - عرض معلوماته وتحديده تلقائياً
        const customer = results[0];
        currentLoyaltyCustomerId = customer.id;
        
        const loyaltyClass = getLoyaltyClass(customer.loyaltyTier);
        const availableDiscount = customerManager.calculateAvailableDiscount(customer.id);
        
        infoContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <h3 style="margin: 0;">${customer.name}</h3>
            <span class="loyalty-badge loyalty-${loyaltyClass}">${customer.loyaltyTier}</span>
        </div>
        <p>رقم الهاتف: ${customer.phone}</p>
        <p>النقاط: <strong>${customer.points}</strong></p>
        <p>الخصم المتاح: <strong>${formatCurrency(availableDiscount)}</strong></p>
        ${availableDiscount > 0 ? `
        <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="btn btn-primary" id="apply-loyalty-discount" data-id="${customer.id}" data-amount="${availableDiscount}">
                تطبيق الخصم
            </button>
            <button class="btn" id="no-loyalty-discount">
                عدم تطبيق الخصم
            </button>
        </div>` : ''}
        <input type="hidden" id="selected-customer-id" value="${customer.id}">`;
        
        infoContainer.style.display = 'block';
        
        // ملء حقول العميل
        document.getElementById('customer-name').value = customer.name;
        document.getElementById('customer-phone').value = customer.phone;
        
        // إضافة مستمعي الأحداث للأزرار
        if (availableDiscount > 0) {
            document.getElementById('apply-loyalty-discount').addEventListener('click', function() {
                const customerId = this.getAttribute('data-id');
                const amount = parseInt(this.getAttribute('data-amount'));
                applyLoyaltyDiscountOnPayment(customerId, amount);
            });
            
            document.getElementById('no-loyalty-discount').addEventListener('click', function() {
                showNotification('تم تجاهل خصم نقاط الولاء', 'info');
            });
        }
    } else {
        // أكثر من عميل - عرض قائمة للاختيار
        let customersHtml = '<p>يرجى اختيار العميل:</p>';
        results.forEach(customer => {
            customersHtml += `
            <div class="customer-card" data-id="${customer.id}" style="cursor: pointer; padding: 10px; margin: 5px 0; border: 1px solid #eee; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${customer.name}</span>
                    <span>${customer.phone}</span>
                </div>
            </div>`;
        });
        
        infoContainer.innerHTML = customersHtml;
        infoContainer.style.display = 'block';
        
        // إضافة مستمعي الأحداث لبطاقات العملاء
        document.querySelectorAll('#loyalty-customer-info .customer-card').forEach(card => {
            card.addEventListener('click', function() {
                const customerId = this.getAttribute('data-id');
                document.getElementById('customer-loyalty-search').value = '';
                
                // إعادة البحث بمعرف العميل المحدد
                const customer = customerManager.getCustomerById(customerId);
                document.getElementById('customer-loyalty-search').value = customer.phone;
                searchCustomerForPayment();
            });
        });
    }
}

// 18. متغير لتخزين معرف العميل الحالي للولاء
let currentLoyaltyCustomerId = null;

// 19. تطبيق خصم نقاط الولاء عند الدفع
function applyLoyaltyDiscountOnPayment(customerId, amount) {
    // استبدال النقاط
    const pointsToRedeem = amount * 10; // كل دينار = 10 نقاط
    const success = customerManager.redeemPoints(customerId, pointsToRedeem);
    
    if (success) {
        // تطبيق الخصم على الفاتورة
        discountType = 'fixed';
        discountValue = amount;
        discountReason = 'استبدال نقاط ولاء';
        
        // إعادة حساب الفاتورة
        calculateTotals();
        
        // تحديث واجهة المستخدم
        document.getElementById('discount').textContent = formatCurrency(getDiscountAmount());
        document.getElementById('total').textContent = formatCurrency(getTotalAmount());
        
        showNotification(`تم استبدال ${pointsToRedeem} نقطة وتطبيق خصم ${formatCurrency(amount)}`, 'success');
        
        // تحديث عرض معلومات العميل
        searchCustomerForPayment();
    } else {
        showNotification('حدث خطأ أثناء استبدال النقاط', 'error');
    }
}

// 20. تعديل وظيفة إكمال الدفع لإضافة النقاط
const originalCompletePayment = window.completePayment || function(){};
window.completePayment = function() {
    // استدعاء الوظيفة الأصلية
    const result = originalCompletePayment.apply(this, arguments);
    
    // إضافة النقاط للعميل إذا كان محدداً
    const selectedCustomerId = document.getElementById('selected-customer-id')?.value;
    if (selectedCustomerId) {
        const totalAmount = getTotalAmount();
        const points = customerManager.calculatePointsForPurchase(totalAmount);
        
        // إنشاء كائن المعاملة
        const transaction = {
            receiptNumber: document.getElementById('receipt-number').textContent,
            totalAmount: totalAmount,
            date: new Date().toISOString()
        };
        
        // إضافة النقاط للعميل
        const customer = customerManager.addPoints(selectedCustomerId, points, transaction);
        if (customer) {
            showNotification(`تم إضافة ${points} نقطة لحساب العميل`, 'success');
        }
    }
    
    return result;
};

// 21. تهيئة نظام ولاء العملاء
function initLoyaltySystem() {
    // إنشاء النافذة المنبثقة
    createLoyaltyModal();
    
    // إضافة زر النظام إلى الشريط العلوي
    addLoyaltyButtonToHeader();
    
    // إعداد البحث عن العملاء
    setupCustomerSearch();
    
    // إعداد نموذج إضافة العميل
    setupAddCustomerForm();
    
    // إعداد تبديل علامات التبويب
    setupLoyaltyTabs();
    
    // تعزيز نظام الدفع بنظام الولاء
    enhancePaymentWithLoyalty();
    
    // إضافة مستمع لزر إغلاق النافذة المنبثقة
    document.getElementById('close-loyalty-modal').addEventListener('click', () => {
        document.getElementById('loyalty-modal').style.display = 'none';
    });
    
    document.getElementById('close-loyalty').addEventListener('click', () => {
        document.getElementById('loyalty-modal').style.display = 'none';
    });
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initLoyaltySystem();
});




// واجهة مستخدم تحسينات المخزون
// يضاف هذا الكود إلى ملف index.js

// 1. إنشاء واجهة المستخدم لإدارة الموردين
function createSuppliersModal() {
    const modalHtml = `
    <div class="modal" id="suppliers-modal">
        <div class="modal-content" style="width: 80%; max-width: 1000px;">
            <div class="modal-header">
                <h2>إدارة الموردين</h2>
                <button class="modal-close" id="close-suppliers-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <div class="search-bar" style="width: 100%; margin-bottom: 20px;">
                        <i class="fas fa-search"></i>
                        <input type="text" id="supplier-search" placeholder="البحث عن مورد...">
                    </div>
                </div>
                <table class="inventory-list">
                    <thead>
                        <tr>
                            <th>اسم المورد</th>
                            <th>جهة الاتصال</th>
                            <th>رقم الهاتف</th>
                            <th>البريد الإلكتروني</th>
                            <th>المنتجات</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="suppliers-list">
                        <!-- ستتم إضافة الموردين هنا بواسطة JavaScript -->
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="add-new-supplier">
                    <i class="fas fa-plus"></i>
                    إضافة مورد جديد
                </button>
                <button class="btn" id="close-suppliers">إغلاق</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 2. إنشاء نموذج إضافة/تعديل المورد
function createSupplierForm(supplier = null) {
    const isEdit = supplier !== null;
    const modalHtml = `
    <div class="modal" id="supplier-form-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>${isEdit ? 'تعديل المورد' : 'إضافة مورد جديد'}</h2>
                <button class="modal-close" id="close-supplier-form-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="supplier-name">اسم المورد</label>
                    <input type="text" class="form-control" id="supplier-name" value="${isEdit ? supplier.name : ''}">
                </div>
                <div class="form-group">
                    <label for="supplier-contact">جهة الاتصال</label>
                    <input type="text" class="form-control" id="supplier-contact" value="${isEdit ? supplier.contactPerson || '' : ''}">
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="supplier-phone">رقم الهاتف</label>
                            <input type="text" class="form-control" id="supplier-phone" value="${isEdit ? supplier.phone || '' : ''}">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="supplier-email">البريد الإلكتروني</label>
                            <input type="email" class="form-control" id="supplier-email" value="${isEdit ? supplier.email || '' : ''}">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="supplier-address">العنوان</label>
                    <textarea class="form-control" id="supplier-address" rows="2">${isEdit ? supplier.address || '' : ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="supplier-notes">ملاحظات</label>
                    <textarea class="form-control" id="supplier-notes" rows="3">${isEdit ? supplier.notes || '' : ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="supplier-payment-terms">شروط الدفع</label>
                    <select class="form-control" id="supplier-payment-terms">
                        <option value="immediate" ${isEdit && supplier.paymentTerms === 'immediate' ? 'selected' : ''}>دفع فوري</option>
                        <option value="7days" ${isEdit && supplier.paymentTerms === '7days' ? 'selected' : ''}>خلال 7 أيام</option>
                        <option value="15days" ${isEdit && supplier.paymentTerms === '15days' ? 'selected' : ''}>خلال 15 يوم</option>
                        <option value="30days" ${isEdit && supplier.paymentTerms === '30days' ? 'selected' : ''}>خلال 30 يوم</option>
                    </select>
                </div>
                <input type="hidden" id="supplier-id" value="${isEdit ? supplier.id : ''}">
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="save-supplier">${isEdit ? 'حفظ التغييرات' : 'إضافة المورد'}</button>
                <button class="btn" id="cancel-supplier-form">إلغاء</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 3. إنشاء واجهة المستخدم لتنبيهات المخزون
function createAlertsModal() {
    const modalHtml = `
    <div class="modal" id="inventory-alerts-modal">
        <div class="modal-content" style="width: 80%; max-width: 1000px;">
            <div class="modal-header">
                <h2>تنبيهات المخزون</h2>
                <button class="modal-close" id="close-inventory-alerts-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-tabs">
                    <div class="settings-tab active" data-alert="active">التنبيهات النشطة</div>
                    <div class="settings-tab" data-alert="expiry">منتجات قرب انتهاء الصلاحية</div>
                    <div class="settings-tab" data-alert="restock">طلبات إعادة التخزين</div>
                    <div class="settings-tab" data-alert="analysis">تحليل المخزون</div>
                </div>

                <!-- التنبيهات النشطة -->
                <div class="alerts-panel active" id="active-alerts-panel">
                    <table class="inventory-list">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>نوع التنبيه</th>
                                <th>المخزون الحالي</th>
                                <th>الحد الأدنى</th>
                                <th>تاريخ التنبيه</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="active-alerts-list">
                            <!-- ستتم إضافة التنبيهات هنا بواسطة JavaScript -->
                        </tbody>
                    </table>
                    <div id="no-active-alerts" style="text-align: center; padding: 20px; display: none;">
                        <i class="fas fa-check-circle" style="font-size: 48px; color: var(--secondary-color);"></i>
                        <p>لا توجد تنبيهات نشطة حالياً</p>
                    </div>
                </div>

                <!-- منتجات قرب انتهاء الصلاحية -->
                <div class="alerts-panel" id="expiry-alerts-panel">
                    <table class="inventory-list">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>رقم الدفعة</th>
                                <th>الكمية</th>
                                <th>تاريخ الانتهاء</th>
                                <th>الأيام المتبقية</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="expiry-alerts-list">
                            <!-- ستتم إضافة منتجات قرب انتهاء الصلاحية هنا بواسطة JavaScript -->
                        </tbody>
                    </table>
                    <div id="no-expiry-alerts" style="text-align: center; padding: 20px; display: none;">
                        <i class="fas fa-check-circle" style="font-size: 48px; color: var(--secondary-color);"></i>
                        <p>لا توجد منتجات قريبة من انتهاء الصلاحية</p>
                    </div>
                </div>

                <!-- طلبات إعادة التخزين -->
                <div class="alerts-panel" id="restock-alerts-panel">
                    <table class="inventory-list">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>المورد</th>
                                <th>الكمية</th>
                                <th>التكلفة التقديرية</th>
                                <th>تاريخ الطلب</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="restock-orders-list">
                            <!-- ستتم إضافة طلبات إعادة التخزين هنا بواسطة JavaScript -->
                        </tbody>
                    </table>
                    <div id="no-restock-orders" style="text-align: center; padding: 20px; display: none;">
                        <i class="fas fa-check-circle" style="font-size: 48px; color: var(--secondary-color);"></i>
                        <p>لا توجد طلبات إعادة تخزين حالياً</p>
                    </div>
                </div>

                <!-- تحليل المخزون -->
                <div class="alerts-panel" id="inventory-analysis-panel">
                    <div class="form-row">
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">قيمة المخزون</div>
                            <div class="report-content">
                                <div class="report-value" id="inventory-total-value">0 د.ع</div>
                                <div class="report-icon"><i class="fas fa-warehouse"></i></div>
                            </div>
                        </div>
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">منتجات نفذت</div>
                            <div class="report-content">
                                <div class="report-value" id="out-of-stock-count">0</div>
                                <div class="report-icon"><i class="fas fa-exclamation-triangle"></i></div>
                            </div>
                        </div>
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">منتجات منخفضة</div>
                            <div class="report-content">
                                <div class="report-value" id="low-stock-count">0</div>
                                <div class="report-icon"><i class="fas fa-battery-quarter"></i></div>
                            </div>
                        </div>
                    </div>

                    <div class="report-card">
                        <div class="report-title">توصيات إعادة التخزين</div>
                        <table class="inventory-list">
                            <thead>
                                <tr>
                                    <th>المنتج</th>
                                    <th>المخزون الحالي</th>
                                    <th>معدل المبيعات الأسبوعي</th>
                                    <th>الكمية الموصى بها</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="restock-recommendations-list">
                                <!-- ستتم إضافة توصيات إعادة التخزين هنا بواسطة JavaScript -->
                            </tbody>
                        </table>
                    </div>

                    <div class="report-card">
                        <div class="report-title">المنتجات بطيئة الحركة</div>
                        <table class="inventory-list">
                            <thead>
                                <tr>
                                    <th>المنتج</th>
                                    <th>المخزون الحالي</th>
                                    <th>معدل المبيعات الأسبوعي</th>
                                    <th>مخزون يكفي لـ</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="slow-moving-items-list">
                                <!-- ستتم إضافة المنتجات بطيئة الحركة هنا بواسطة JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="export-inventory-alerts">
                    <i class="fas fa-file-export"></i>
                    تصدير التقرير
                </button>
                <button class="btn" id="close-inventory-alerts">إغلاق</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // إضافة CSS لتنبيهات المخزون
    const alertsStyles = `
    <style>
        .alerts-panel {
            display: none;
            margin-top: 20px;
        }
        .alerts-panel.active {
            display: block;
        }
        .alert-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            color: white;
        }
        .alert-low {
            background-color: #f39c12;
        }
        .alert-out {
            background-color: #e74c3c;
        }
        .alert-expiry {
            background-color: #8e44ad;
        }
        .days-remaining {
            font-weight: bold;
        }
        .days-critical {
            color: #e74c3c;
        }
        .days-warning {
            color: #f39c12;
        }
        .days-ok {
            color: #27ae60;
        }
        .restock-pending {
            background-color: #3498db;
            color: white;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
        }
        .restock-completed {
            background-color: #27ae60;
            color: white;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
        }
        .restock-cancelled {
            background-color: #7f8c8d;
            color: white;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
        }
        .action-btn-sm {
            padding: 3px 8px;
            font-size: 12px;
            margin-right: 5px;
        }
    </style>`;
    document.head.insertAdjacentHTML('beforeend', alertsStyles);
}

// 4. إنشاء واجهة المستخدم لإدارة دفعات المنتجات والصلاحية
function createBatchModal() {
    const modalHtml = `
    <div class="modal" id="batch-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>إدارة دفعات المنتج</h2>
                <button class="modal-close" id="close-batch-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div id="product-batch-info">
                    <h3 id="batch-product-name"></h3>
                    <p>المخزون الحالي: <span id="batch-product-inventory"></span></p>
                </div>
                
                <div class="form-group" id="batch-list-container">
                    <label>الدفعات الحالية:</label>
                    <table class="inventory-list">
                        <thead>
                            <tr>
                                <th>رقم الدفعة</th>
                                <th>الكمية</th>
                                <th>تاريخ الاستلام</th>
                                <th>تاريخ الانتهاء</th>
                                <th>ملاحظات</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="batch-list">
                            <!-- ستتم إضافة الدفعات هنا بواسطة JavaScript -->
                        </tbody>
                    </table>
                </div>
                
                <div class="form-group">
                    <label>إضافة دفعة جديدة:</label>
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="batch-number">رقم الدفعة</label>
                                <input type="text" class="form-control" id="batch-number" placeholder="رقم الدفعة">
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="batch-quantity">الكمية</label>
                                <input type="number" class="form-control" id="batch-quantity" min="1">
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="batch-received-date">تاريخ الاستلام</label>
                                <input type="date" class="form-control" id="batch-received-date">
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="batch-expiry-date">تاريخ الانتهاء</label>
                                <input type="date" class="form-control" id="batch-expiry-date">
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="batch-notes">ملاحظات</label>
                        <textarea class="form-control" id="batch-notes" rows="2"></textarea>
                    </div>
                </div>
                <input type="hidden" id="batch-product-id">
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="add-batch">إضافة الدفعة</button>
                <button class="btn" id="close-batch">إغلاق</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 5. تعديل واجهة مستخدم المنتج لإضافة خيارات المورد والتخزين التلقائي
function enhanceProductModal() {
    // إضافة حقول جديدة إلى نموذج المنتج
    const productModalBody = document.querySelector('#add-product-modal .modal-body');
    
    // إضافة حقل للتكلفة بعد حقل السعر
    const priceField = document.querySelector('.form-group:has(#product-price)');
    if (priceField) {
        const costPriceHtml = `
        <div class="form-group">
            <label for="product-cost">تكلفة الشراء</label>
            <input type="number" class="form-control" id="product-cost" min="0" step="0.01" placeholder="تكلفة شراء المنتج">
        </div>`;
        priceField.insertAdjacentHTML('afterend', costPriceHtml);
    }
    
    // إضافة حقل المورد والإعدادات
    const inventoryField = document.querySelector('.form-group:has(#product-inventory)');
    if (inventoryField) {
        const suppliersHtml = `
        <div class="form-group">
            <label for="product-supplier">المورد</label>
            <select class="form-control" id="product-supplier">
                <option value="">-- اختر المورد --</option>
                <!-- سيتم إضافة الموردين هنا بواسطة JavaScript -->
            </select>
        </div>
        <div class="form-group">
            <label><input type="checkbox" id="product-expiry"> تتبع تاريخ انتهاء الصلاحية</label>
        </div>
        <div class="form-group">
            <label><input type="checkbox" id="product-auto-restock"> طلب إعادة التخزين تلقائياً</label>
        </div>`;
        inventoryField.insertAdjacentHTML('afterend', suppliersHtml);
    }
    
    // إضافة زر لإدارة الدفعات
    const actionButtonsContainer = document.querySelector('#add-product-modal .modal-footer');
    if (actionButtonsContainer) {
        const batchButtonHtml = `
        <button class="btn" id="manage-batches" style="display: none;">إدارة الدفعات</button>`;
        actionButtonsContainer.insertAdjacentHTML('afterbegin', batchButtonHtml);
    }
}

// 6. تعديل واجهة مستخدم إدارة المخزون لتضمين المزيد من الخيارات
function enhanceInventoryModal() {
    // إضافة زر إدارة الموردين إلى نافذة إدارة المخزون
    const inventoryModalFooter = document.querySelector('#inventory-modal .modal-footer');
    if (inventoryModalFooter) {
        const suppliersButtonHtml = `
        <button class="btn btn-primary" id="manage-suppliers">
            <i class="fas fa-truck"></i>
            إدارة الموردين
        </button>`;
        
        const alertsButtonHtml = `
        <button class="btn btn-primary" id="view-inventory-alerts">
            <i class="fas fa-bell"></i>
            تنبيهات المخزون
        </button>`;
        
        // إضافة الأزرار قبل زر الإغلاق
        inventoryModalFooter.insertBefore(
            document.createRange().createContextualFragment(suppliersButtonHtml + alertsButtonHtml),
            document.getElementById('close-inventory')
        );
    }
    
    // إضافة زر إدارة الدفعات إلى قائمة الإجراءات في كل صف
    const inventoryItemActionsTemplate = document.querySelector('#inventory-items .inventory-actions');
    if (inventoryItemActionsTemplate) {
        const actionTemplate = `
        <button class="inventory-actions-btn batches" title="إدارة الدفعات">
            <i class="fas fa-layer-group"></i>
        </button>`;
        inventoryItemActionsTemplate.insertAdjacentHTML('beforeend', actionTemplate);
    }
}

// 7. عرض الموردين في نموذج المنتج
function populateSupplierDropdown() {
    const supplierSelect = document.getElementById('product-supplier');
    if (supplierSelect) {
        // مسح الخيارات الحالية باستثناء الخيار الافتراضي
        while (supplierSelect.options.length > 1) {
            supplierSelect.remove(1);
        }
        
        // إضافة الموردين
        inventoryManager.suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            supplierSelect.appendChild(option);
        });
    }
}

// 8. عرض قائمة الموردين
function displaySuppliers() {
    const suppliersList = document.getElementById('suppliers-list');
    if (!suppliersList) return;
    
    let html = '';
    
    if (inventoryManager.suppliers.length === 0) {
        html = '<tr><td colspan="6" style="text-align: center;">لا يوجد موردين حالياً</td></tr>';
    } else {
        inventoryManager.suppliers.forEach(supplier => {
            // حساب عدد المنتجات المرتبطة بهذا المورد
            const linkedProducts = products.filter(p => p.supplierId === supplier.id).length;
            
            html += `
            <tr>
                <td>${supplier.name}</td>
                <td>${supplier.contactPerson || '-'}</td>
                <td>${supplier.phone || '-'}</td>
                <td>${supplier.email || '-'}</td>
                <td>${linkedProducts}</td>
                <td class="inventory-actions">
                    <button class="inventory-actions-btn edit-supplier" data-id="${supplier.id}" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="inventory-actions-btn delete-supplier" data-id="${supplier.id}" title="حذف">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
        });
    }
    
    suppliersList.innerHTML = html;
    
    // إضافة مستمعي الأحداث للأزرار
    document.querySelectorAll('.edit-supplier').forEach(btn => {
        btn.addEventListener('click', function() {
            const supplierId = this.getAttribute('data-id');
            editSupplier(supplierId);
        });
    });
    
    document.querySelectorAll('.delete-supplier').forEach(btn => {
        btn.addEventListener('click', function() {
            const supplierId = this.getAttribute('data-id');
            
            // التحقق من عدم وجود منتجات مرتبطة
            const linkedProducts = products.filter(p => p.supplierId === supplierId).length;
            if (linkedProducts > 0) {
                showNotification(`لا يمكن حذف المورد. هناك ${linkedProducts} منتج مرتبط به.`, 'error');
                return;
            }
            
            if (confirm('هل أنت متأكد من رغبتك في حذف هذا المورد؟')) {
                const deleted = inventoryManager.deleteSupplier(supplierId);
                if (deleted) {
                    showNotification('تم حذف المورد بنجاح', 'success');
                    displaySuppliers();
                } else {
                    showNotification('حدث خطأ أثناء حذف المورد', 'error');
                }
            }
        });
    });
}

// 9. تعديل بيانات المورد
function editSupplier(supplierId) {
    const supplier = inventoryManager.getSupplierById(supplierId);
    if (!supplier) return;
    
    // إنشاء نموذج التعديل
    createSupplierForm(supplier);
    
    // عرض النموذج
    document.getElementById('supplier-form-modal').style.display = 'flex';
    
    // إضافة مستمعي الأحداث
    document.getElementById('close-supplier-form-modal').addEventListener('click', function() {
        document.getElementById('supplier-form-modal').remove();
    });
    
    document.getElementById('cancel-supplier-form').addEventListener('click', function() {
        document.getElementById('supplier-form-modal').remove();
    });
    
    document.getElementById('save-supplier').addEventListener('click', function() {
        saveSupplier();
    });
}

// 10. حفظ بيانات المورد (جديد أو تعديل)
function saveSupplier() {
    // جمع البيانات من النموذج
    const supplierId = document.getElementById('supplier-id').value;
    const name = document.getElementById('supplier-name').value;
    const contactPerson = document.getElementById('supplier-contact').value;
    const phone = document.getElementById('supplier-phone').value;
    const email = document.getElementById('supplier-email').value;
    const address = document.getElementById('supplier-address').value;
    const notes = document.getElementById('supplier-notes').value;
    const paymentTerms = document.getElementById('supplier-payment-terms').value;
    
    // التحقق من الحقول المطلوبة
    if (!name.trim()) {
        showNotification('يرجى إدخال اسم المورد', 'error');
        return;
    }
    
    const supplierData = {
        name,
        contactPerson,
        phone,
        email,
        address,
        notes,
        paymentTerms
    };
    
    let result;
    if (supplierId) {
        // تحديث مورد موجود
        result = inventoryManager.updateSupplier(supplierId, supplierData);
    } else {
        // إضافة مورد جديد
        result = inventoryManager.addSupplier(supplierData);
    }
    
    if (result) {
        showNotification(`تم ${supplierId ? 'تحديث' : 'إضافة'} المورد بنجاح`, 'success');
        document.getElementById('supplier-form-modal').remove();
        displaySuppliers();
        
        // تحديث قائمة الموردين في نموذج المنتج
        populateSupplierDropdown();
    } else {
        showNotification(`حدث خطأ أثناء ${supplierId ? 'تحديث' : 'إضافة'} المورد`, 'error');
    }
}

// 11. عرض التنبيهات النشطة
function displayActiveAlerts() {
    const alertsList = document.getElementById('active-alerts-list');
    const noAlertsMessage = document.getElementById('no-active-alerts');
    
    const activeAlerts = inventoryManager.getActiveAlerts();
    
    if (activeAlerts.length === 0) {
        alertsList.innerHTML = '';
        noAlertsMessage.style.display = 'block';
    } else {
        noAlertsMessage.style.display = 'none';
        
        let html = '';
        activeAlerts.forEach(alert => {
            const alertType = alert.type === 'out_of_stock' ? 
                '<span class="alert-badge alert-out">نفاذ المخزون</span>' : 
                '<span class="alert-badge alert-low">مخزون منخفض</span>';
            
            const alertDate = new Date(alert.createdAt).toLocaleDateString();
            
            html += `
            <tr>
                <td>${alert.productName}</td>
                <td>${alertType}</td>
                <td>${alert.currentStock}</td>
                <td>${alert.threshold}</td>
                <td>${alertDate}</td>
                <td class="inventory-actions">
                    <button class="btn btn-primary action-btn-sm restock-product" data-id="${alert.productId}">
                        إعادة تخزين
                    </button>
                    <button class="btn action-btn-sm dismiss-alert" data-id="${alert.id}">
                        تجاهل
                    </button>
                </td>
            </tr>`;
        });
        
        alertsList.innerHTML = html;
        
        // إضافة مستمعي الأحداث للأزرار
        document.querySelectorAll('.restock-product').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                createManualRestockOrder(productId);
            });
        });
        
        document.querySelectorAll('.dismiss-alert').forEach(btn => {
            btn.addEventListener('click', function() {
                const alertId = this.getAttribute('data-id');
                dismissAlert(alertId);
            });
        });
    }
}

// 12. عرض المنتجات القريبة من انتهاء الصلاحية
function displayExpiringProducts() {
    const expiryList = document.getElementById('expiry-alerts-list');
    const noExpiryMessage = document.getElementById('no-expiry-alerts');
    
    const expiringProducts = inventoryManager.checkExpiringProducts();
    
    if (expiringProducts.length === 0) {
        expiryList.innerHTML = '';
        noExpiryMessage.style.display = 'block';
    } else {
        noExpiryMessage.style.display = 'none';
        
        let html = '';
        expiringProducts.forEach(item => {
            const expiryDate = new Date(item.expiryDate).toLocaleDateString();
            
            let daysClass = 'days-ok';
            if (item.daysRemaining <= 7) {
                daysClass = 'days-critical';
            } else if (item.daysRemaining <= 15) {
                daysClass = 'days-warning';
            }
            
            html += `
            <tr>
                <td>${item.productName}</td>
                <td>${item.batchNumber}</td>
                <td>${item.quantity}</td>
                <td>${expiryDate}</td>
                <td class="${daysClass}">${item.daysRemaining} يوم</td>
                <td class="inventory-actions">
                    <button class="btn btn-primary action-btn-sm manage-batch" data-product="${item.productId}" data-batch="${item.batchId}">
                        إدارة الدفعة
                    </button>
                </td>
            </tr>`;
        });
        
        expiryList.innerHTML = html;
        
        // إضافة مستمعي الأحداث للأزرار
        document.querySelectorAll('.manage-batch').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-product');
                showBatchManagement(productId);
            });
        });
    }
}

// 13. عرض طلبات إعادة التخزين
function displayRestockOrders() {
    const ordersList = document.getElementById('restock-orders-list');
    const noOrdersMessage = document.getElementById('no-restock-orders');
    
    // الحصول على جميع طلبات إعادة التخزين وليس فقط المعلقة
    const restockOrders = inventoryManager.restockOrders;
    
    if (restockOrders.length === 0) {
        ordersList.innerHTML = '';
        noOrdersMessage.style.display = 'block';
    } else {
        noOrdersMessage.style.display = 'none';
        
        let html = '';
        restockOrders.forEach(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString();
            
            let statusBadge = '';
            switch (order.status) {
                case 'pending':
                    statusBadge = '<span class="restock-pending">معلق</span>';
                    break;
                case 'completed':
                    statusBadge = '<span class="restock-completed">مكتمل</span>';
                    break;
                case 'cancelled':
                    statusBadge = '<span class="restock-cancelled">ملغي</span>';
                    break;
            }
            
            html += `
            <tr>
                <td>${order.productName}</td>
                <td>${order.supplierName}</td>
                <td>${order.orderQuantity}</td>
                <td>${formatCurrency(order.estimatedCost)}</td>
                <td>${orderDate}</td>
                <td>${statusBadge}</td>
                <td class="inventory-actions">
                    ${order.status === 'pending' ? `
                    <button class="btn btn-primary action-btn-sm complete-order" data-id="${order.id}">
                        تأكيد الاستلام
                    </button>
                    <button class="btn action-btn-sm cancel-order" data-id="${order.id}">
                        إلغاء
                    </button>
                    ` : ''}
                </td>
            </tr>`;
        });
        
        ordersList.innerHTML = html;
        
        // إضافة مستمعي الأحداث للأزرار
        document.querySelectorAll('.complete-order').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.getAttribute('data-id');
                completeRestockOrder(orderId);
            });
        });
        
        document.querySelectorAll('.cancel-order').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.getAttribute('data-id');
                cancelRestockOrder(orderId);
            });
        });
    }
}

// 14. عرض تحليل المخزون
function displayInventoryAnalysis() {
    // الحصول على تحليل المخزون
    const analysis = inventoryManager.analyzeInventory();
    
    // تحديث القيم الإجمالية
    document.getElementById('inventory-total-value').textContent = formatCurrency(inventoryManager.getTotalInventoryValue());
    document.getElementById('out-of-stock-count').textContent = analysis.outOfStockItems.length;
    document.getElementById('low-stock-count').textContent = analysis.lowStockItems.length;
    
    // عرض توصيات إعادة التخزين
    const recommendationsList = document.getElementById('restock-recommendations-list');
    
    if (analysis.restockRecommendations.length === 0) {
        recommendationsList.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد توصيات إعادة تخزين حالياً</td></tr>';
    } else {
        let html = '';
        analysis.restockRecommendations.forEach(item => {
            html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.currentStock}</td>
                <td>${item.salesRate}</td>
                <td><strong>${item.recommendedOrder}</strong></td>
                <td class="inventory-actions">
                    <button class="btn btn-primary action-btn-sm restock-product" data-id="${item.id}" data-qty="${item.recommendedOrder}">
                        طلب
                    </button>
                </td>
            </tr>`;
        });
        
        recommendationsList.innerHTML = html;
        
        // إضافة مستمعي الأحداث لأزرار إعادة التخزين
        document.querySelectorAll('.restock-product').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const recommendedQty = parseInt(this.getAttribute('data-qty'));
                createManualRestockOrder(productId, recommendedQty);
            });
        });
    }
    
    // عرض المنتجات بطيئة الحركة
    const slowMovingList = document.getElementById('slow-moving-items-list');
    
    if (analysis.slowMovingItems.length === 0) {
        slowMovingList.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد منتجات بطيئة الحركة حالياً</td></tr>';
    } else {
        let html = '';
        analysis.slowMovingItems.forEach(item => {
            html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.currentStock}</td>
                <td>${item.salesRate}</td>
                <td>${item.weeksOfStock}</td>
                <td class="inventory-actions">
                    <button class="btn action-btn-sm" onclick="applyDiscount('${item.id}')">
                        عرض خاص
                    </button>
                </td>
            </tr>`;
        });
        
        slowMovingList.innerHTML = html;
    }
}

// 15. إنشاء طلب إعادة تخزين يدوي
function createManualRestockOrder(productId, recommendedQty = null) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('المنتج غير موجود', 'error');
        return;
    }
    
    // التحقق من وجود مورد للمنتج
    if (!product.supplierId) {
        showNotification('لم يتم تعيين مورد لهذا المنتج', 'error');
        return;
    }
    
    const supplier = inventoryManager.getSupplierById(product.supplierId);
    if (!supplier) {
        showNotification('المورد غير موجود', 'error');
        return;
    }
    
    // تحديد الكمية المقترحة
    const lowStockThreshold = parseInt(localStorage.getItem('lowStockThreshold')) || 10;
    const suggestedQuantity = recommendedQty || Math.max(lowStockThreshold * 2 - product.inventory, 1);
    
    // إنشاء نافذة منبثقة للطلب
    const modalHtml = `
    <div class="modal" id="restock-order-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>طلب إعادة تخزين</h2>
                <button class="modal-close" id="close-restock-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>المنتج:</label>
                    <p><strong>${product.name}</strong></p>
                </div>
                <div class="form-group">
                    <label>المورد:</label>
                    <p>${supplier.name}</p>
                </div>
                <div class="form-group">
                    <label>المخزون الحالي:</label>
                    <p>${product.inventory}</p>
                </div>
                <div class="form-group">
                    <label for="order-quantity">الكمية المطلوبة:</label>
                    <input type="number" class="form-control" id="order-quantity" min="1" value="${suggestedQuantity}">
                </div>
                <div class="form-group">
                    <label>التكلفة التقديرية:</label>
                    <p id="estimated-cost">${formatCurrency(suggestedQuantity * (product.costPrice || product.price * 0.7))}</p>
                </div>
                <div class="form-group">
                    <label for="expected-delivery">تاريخ التسليم المتوقع:</label>
                    <input type="date" class="form-control" id="expected-delivery">
                </div>
                <div class="form-group">
                    <label for="order-notes">ملاحظات:</label>
                    <textarea class="form-control" id="order-notes" rows="2"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="create-order" data-product-id="${productId}">إنشاء الطلب</button>
                <button class="btn" id="cancel-restock-form">إلغاء</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('restock-order-modal').style.display = 'flex';
    
    // تعيين تاريخ افتراضي للتسليم المتوقع (بعد أسبوع)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('expected-delivery').valueAsDate = nextWeek;
    
    // تحديث التكلفة التقديرية عند تغيير الكمية
    document.getElementById('order-quantity').addEventListener('input', function() {
        const quantity = parseInt(this.value) || 0;
        const cost = quantity * (product.costPrice || product.price * 0.7);
        document.getElementById('estimated-cost').textContent = formatCurrency(cost);
    });
    
    // إضافة مستمعي الأحداث للأزرار
    document.getElementById('close-restock-modal').addEventListener('click', function() {
        document.getElementById('restock-order-modal').remove();
    });
    
    document.getElementById('cancel-restock-form').addEventListener('click', function() {
        document.getElementById('restock-order-modal').remove();
    });
    
    document.getElementById('create-order').addEventListener('click', function() {
        // جمع البيانات من النموذج
        const productId = this.getAttribute('data-product-id');
        const quantity = parseInt(document.getElementById('order-quantity').value);
        const expectedDelivery = document.getElementById('expected-delivery').value;
        const notes = document.getElementById('order-notes').value;
        
        // التحقق من الحقول المطلوبة
        if (!quantity || quantity <= 0) {
            showNotification('يرجى إدخال كمية صحيحة', 'error');
            return;
        }
        
        const order = {
            id: Date.now().toString(),
            productId: productId,
            productName: product.name,
            supplierId: product.supplierId,
            supplierName: supplier.name,
            orderQuantity: quantity,
            estimatedCost: quantity * (product.costPrice || product.price * 0.7),
            status: 'pending',
            createdAt: new Date().toISOString(),
            expectedDeliveryDate: expectedDelivery,
            notes: notes,
            completedAt: null
        };
        
        // إضافة الطلب
        inventoryManager.restockOrders.push(order);
        inventoryManager.saveRestockOrders();
        
        showNotification('تم إنشاء طلب إعادة التخزين بنجاح', 'success');
        document.getElementById('restock-order-modal').remove();
        
        // تحديث عرض الطلبات
        if (document.getElementById('restock-orders-list')) {
            displayRestockOrders();
        }
    });
}

// 16. إكمال طلب إعادة التخزين
function completeRestockOrder(orderId) {
    if (confirm('هل تم استلام هذا الطلب؟')) {
        const updatedOrder = inventoryManager.updateRestockOrder(orderId, {
            status: 'completed'
        });
        
        if (updatedOrder) {
            showNotification('تم تحديث حالة الطلب بنجاح', 'success');
            displayRestockOrders();
        } else {
            showNotification('حدث خطأ أثناء تحديث حالة الطلب', 'error');
        }
    }
}

// 17. إلغاء طلب إعادة التخزين
function cancelRestockOrder(orderId) {
    if (confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟')) {
        const updatedOrder = inventoryManager.updateRestockOrder(orderId, {
            status: 'cancelled'
        });
        
        if (updatedOrder) {
            showNotification('تم إلغاء الطلب بنجاح', 'success');
            displayRestockOrders();
        } else {
            showNotification('حدث خطأ أثناء إلغاء الطلب', 'error');
        }
    }
}

// 18. تجاهل تنبيه
function dismissAlert(alertId) {
    const alertIndex = inventoryManager.inventoryAlerts.findIndex(a => a.id === alertId);
    if (alertIndex !== -1) {
        inventoryManager.inventoryAlerts[alertIndex].status = 'dismissed';
        inventoryManager.inventoryAlerts[alertIndex].dismissedAt = new Date().toISOString();
        inventoryManager.saveInventoryAlerts();
        
        showNotification('تم تجاهل التنبيه بنجاح', 'success');
        displayActiveAlerts();
    }
}

// 19. إدارة دفعات المنتج وتواريخ الصلاحية
function showBatchManagement(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // تحديث معلومات المنتج في النموذج
    document.getElementById('batch-product-name').textContent = product.name;
    document.getElementById('batch-product-inventory').textContent = product.inventory;
    document.getElementById('batch-product-id').value = productId;
    
    // تعيين التاريخ الافتراضي
    const today = new Date();
    document.getElementById('batch-received-date').valueAsDate = today;
    
    // تعيين تاريخ انتهاء افتراضي (بعد سنة)
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    document.getElementById('batch-expiry-date').valueAsDate = nextYear;
    
    // عرض الدفعات الحالية
    displayBatches(product);
    
    // عرض النموذج
    document.getElementById('batch-modal').style.display = 'flex';
}

// 20. عرض دفعات المنتج
function displayBatches(product) {
    const batchList = document.getElementById('batch-list');
    let html = '';
    
    if (!product.batches || product.batches.length === 0) {
        html = '<tr><td colspan="6" style="text-align: center;">لا توجد دفعات مسجلة لهذا المنتج</td></tr>';
    } else {
        product.batches.forEach(batch => {
            const receivedDate = new Date(batch.receivedDate).toLocaleDateString();
            const expiryDate = new Date(batch.expiryDate).toLocaleDateString();
            
            html += `
            <tr>
                <td>${batch.batchNumber}</td>
                <td>${batch.quantity}</td>
                <td>${receivedDate}</td>
                <td>${expiryDate}</td>
                <td>${batch.notes || '-'}</td>
                <td class="inventory-actions">
                    <button class="inventory-actions-btn remove-batch" data-id="${batch.id}" title="حذف">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
        });
    }
    
    batchList.innerHTML = html;
    
    // إضافة مستمعي الأحداث لأزرار الحذف
    document.querySelectorAll('.remove-batch').forEach(btn => {
        btn.addEventListener('click', function() {
            const batchId = this.getAttribute('data-id');
            removeBatch(product.id, batchId);
        });
    });
}

// 21. إضافة دفعة جديدة
function addBatch() {
    const productId = document.getElementById('batch-product-id').value;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // جمع البيانات من النموذج
    const batchNumber = document.getElementById('batch-number').value;
    const quantity = parseInt(document.getElementById('batch-quantity').value);
    const receivedDate = document.getElementById('batch-received-date').value;
    const expiryDate = document.getElementById('batch-expiry-date').value;
    const notes = document.getElementById('batch-notes').value;
    
    // التحقق من الحقول المطلوبة
    if (!quantity || quantity <= 0) {
        showNotification('يرجى إدخال كمية صحيحة', 'error');
        return;
    }
    
    if (!expiryDate) {
        showNotification('يرجى إدخال تاريخ انتهاء الصلاحية', 'error');
        return;
    }
    
    // إنشاء معلومات الدفعة
    const batchInfo = {
        quantity,
        expiryDate,
        batchNumber: batchNumber || `BATCH-${Date.now()}`,
        receivedDate: receivedDate || new Date().toISOString(),
        notes
    };
    
    // إضافة الدفعة
    const batch = inventoryManager.addExpiryDate(productId, batchInfo);
    
    if (batch) {
        showNotification('تم إضافة الدفعة بنجاح', 'success');
        
        // إعادة تعيين النموذج
        document.getElementById('batch-number').value = '';
        document.getElementById('batch-quantity').value = '';
        document.getElementById('batch-notes').value = '';
        
        // تحديث عرض الدفعات
        displayBatches(product);
        
        // تحديث عرض المخزون الحالي
        document.getElementById('batch-product-inventory').textContent = product.inventory;
    } else {
        showNotification('حدث خطأ أثناء إضافة الدفعة', 'error');
    }
}

// 22. حذف دفعة
function removeBatch(productId, batchId) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه الدفعة؟')) return;
    
    const product = products.find(p => p.id === productId);
    if (!product || !product.batches) return;
    
    // العثور على الدفعة
    const batchIndex = product.batches.findIndex(b => b.id === batchId);
    if (batchIndex === -1) return;
    
    const batch = product.batches[batchIndex];
    
    // تسجيل عملية تعديل المخزون
    inventoryManager.recordInventoryTransaction({
        type: 'out',
        productId: productId,
        quantity: batch.quantity,
        notes: `حذف دفعة: ${batch.batchNumber}`
    });
    
    // حذف الدفعة
    product.batches.splice(batchIndex, 1);
    saveProducts();
    
    showNotification('تم حذف الدفعة بنجاح', 'success');
    
    // تحديث العرض
    displayBatches(product);
    
    // تحديث عرض المخزون الحالي
    document.getElementById('batch-product-inventory').textContent = product.inventory;
}

// 23. تبديل علامات التبويب في نافذة التنبيهات
function setupAlertsTabs() {
    const tabs = document.querySelectorAll('.settings-tab[data-alert]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const panel = this.getAttribute('data-alert');
            
            // تغيير علامة التبويب النشطة
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // تغيير اللوحة النشطة
            document.querySelectorAll('.alerts-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`${panel}-alerts-panel`).classList.add('active');
            
            // تحديث محتوى اللوحة النشطة
            switch (panel) {
                case 'active':
                    displayActiveAlerts();
                    break;
                case 'expiry':
                    displayExpiringProducts();
                    break;
                case 'restock':
                    displayRestockOrders();
                    break;
                case 'analysis':
                    displayInventoryAnalysis();
                    break;
            }
        });
    });
}

// 24. تعديل نموذج المنتج لحفظ المعلومات الإضافية
const originalSaveProduct = window.saveProduct || function(){};
window.saveProduct = function() {
    // الحصول على القيم الإضافية قبل الحفظ
    const supplierId = document.getElementById('product-supplier')?.value || null;
    const costPrice = parseFloat(document.getElementById('product-cost')?.value) || null;
    const trackExpiry = document.getElementById('product-expiry')?.checked || false;
    const autoRestock = document.getElementById('product-auto-restock')?.checked || false;
    
    // إضافة هذه البيانات إلى نموذج المنتج
    const productId = document.getElementById('product-id').value;
    const product = productId ? products.find(p => p.id === productId) : null;
    
    if (product) {
        product.supplierId = supplierId;
        product.costPrice = costPrice;
        product.trackExpiry = trackExpiry;
        product.autoRestock = autoRestock;
    } else {
        // تخزين المعلومات مؤقتًا لاستخدامها عند إنشاء المنتج الجديد
        window.newProductAdditionalInfo = {
            supplierId,
            costPrice,
            trackExpiry,
            autoRestock
        };
    }
    
    // استدعاء وظيفة الحفظ الأصلية
    const result = originalSaveProduct.apply(this, arguments);
    
    // إذا كان منتجًا جديدًا وتم حفظه بنجاح، قم بإضافة المعلومات الإضافية
    if (!productId && window.newProductAdditionalInfo && products.length > 0) {
        const newProduct = products[products.length - 1];
        Object.assign(newProduct, window.newProductAdditionalInfo);
        delete window.newProductAdditionalInfo;
        saveProducts();
    }
    
    return result;
};

// 25. إعداد الأزرار والأحداث
function setupInventoryEnhancements() {
    // 1. إنشاء جميع النوافذ المنبثقة
    createSuppliersModal();
    createAlertsModal();
    createBatchModal();
    
    // 2. تعزيز واجهات المستخدم الحالية
    enhanceProductModal();
    enhanceInventoryModal();
    
    // 3. إضافة مستمعي الأحداث للأزرار الجديدة
    
    // زر إدارة الموردين
    document.getElementById('manage-suppliers').addEventListener('click', function() {
        document.getElementById('suppliers-modal').style.display = 'flex';
        displaySuppliers();
    });
    
    // زر إضافة مورد جديد
    document.getElementById('add-new-supplier').addEventListener('click', function() {
        createSupplierForm();
        document.getElementById('supplier-form-modal').style.display = 'flex';
        
        // إضافة مستمعي الأحداث
        document.getElementById('close-supplier-form-modal').addEventListener('click', function() {
            document.getElementById('supplier-form-modal').remove();
        });
        
        document.getElementById('cancel-supplier-form').addEventListener('click', function() {
            document.getElementById('supplier-form-modal').remove();
        });
        
        document.getElementById('save-supplier').addEventListener('click', function() {
            saveSupplier();
        });
    });
    
    // زر إغلاق نافذة الموردين
    document.getElementById('close-suppliers-modal').addEventListener('click', function() {
        document.getElementById('suppliers-modal').style.display = 'none';
    });
    
    document.getElementById('close-suppliers').addEventListener('click', function() {
        document.getElementById('suppliers-modal').style.display = 'none';
    });
    
    // زر تنبيهات المخزون
    document.getElementById('view-inventory-alerts').addEventListener('click', function() {
        document.getElementById('inventory-alerts-modal').style.display = 'flex';
        
        // عرض التنبيهات النشطة افتراضيًا
        displayActiveAlerts();
        
        // إعداد تبديل علامات التبويب
        setupAlertsTabs();
    });
    
    // أزرار إغلاق نافذة التنبيهات
    document.getElementById('close-inventory-alerts-modal').addEventListener('click', function() {
        document.getElementById('inventory-alerts-modal').style.display = 'none';
    });
    
    document.getElementById('close-inventory-alerts').addEventListener('click', function() {
        document.getElementById('inventory-alerts-modal').style.display = 'none';
    });
    
    // أزرار إدارة الدفعات
    document.getElementById('close-batch-modal').addEventListener('click', function() {
        document.getElementById('batch-modal').style.display = 'none';
    });
    
    document.getElementById('close-batch').addEventListener('click', function() {
        document.getElementById('batch-modal').style.display = 'none';
    });
    
    document.getElementById('add-batch').addEventListener('click', function() {
        addBatch();
    });
    
    // زر إدارة الدفعات في نموذج المنتج
    document.getElementById('manage-batches').addEventListener('click', function() {
        const productId = document.getElementById('product-id').value;
        if (productId) {
            showBatchManagement(productId);
        }
    });
    
    // تحميل البيانات الإضافية للمنتج عند فتح نموذج التعديل
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit')) {
            setTimeout(() => {
                const productId = document.getElementById('product-id').value;
                if (productId) {
                    const product = products.find(p => p.id === productId);
                    if (product) {
                        // ملء البيانات الإضافية
                        if (document.getElementById('product-cost')) {
                            document.getElementById('product-cost').value = product.costPrice || '';
                        }
                        
                        if (document.getElementById('product-supplier')) {
                            document.getElementById('product-supplier').value = product.supplierId || '';
                        }
                        
                        if (document.getElementById('product-expiry')) {
                            document.getElementById('product-expiry').checked = product.trackExpiry || false;
                        }
                        
                        if (document.getElementById('product-auto-restock')) {
                            document.getElementById('product-auto-restock').checked = product.autoRestock || false;
                        }
                        
                        // إظهار زر إدارة الدفعات إذا كان المنتج يتتبع تاريخ الصلاحية
                        if (document.getElementById('manage-batches')) {
                            document.getElementById('manage-batches').style.display = product.trackExpiry ? 'block' : 'none';
                        }
                    }
                }
            }, 100);
        }
    });
    
    // إعداد البحث عن الموردين
    document.getElementById('supplier-search').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#suppliers-list tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    // تحميل قائمة الموردين في القوائم المنسدلة
    populateSupplierDropdown();
}

// 26. إضافة تنبيه عند تحميل الصفحة إذا كانت هناك تنبيهات نشطة
function checkInventoryAlertsOnLoad() {
    setTimeout(() => {
        const activeAlerts = inventoryManager.getActiveAlerts();
        if (activeAlerts.length > 0) {
            const outOfStockCount = activeAlerts.filter(a => a.type === 'out_of_stock').length;
            const lowStockCount = activeAlerts.filter(a => a.type === 'low_stock').length;
            
            let message = '';
            if (outOfStockCount > 0 && lowStockCount > 0) {
                message = `هناك ${outOfStockCount} منتج نفد من المخزون و ${lowStockCount} منتج منخفض المخزون`;
            } else if (outOfStockCount > 0) {
                message = `هناك ${outOfStockCount} منتج نفد من المخزون`;
            } else if (lowStockCount > 0) {
                message = `هناك ${lowStockCount} منتج منخفض المخزون`;
            }
            
            if (message) {
                showNotification(message, 'warning', 10000);
            }
        }
        
        // التحقق من المنتجات القريبة من انتهاء الصلاحية
        const expiringProducts = inventoryManager.checkExpiringProducts(7); // المنتجات التي ستنتهي خلال 7 أيام
        if (expiringProducts.length > 0) {
            showNotification(`هناك ${expiringProducts.length} منتج على وشك انتهاء الصلاحية خلال أسبوع`, 'warning', 10000);
        }
    }, 2000);
}

// 27. تهيئة نظام إدارة المخزون المحسن
document.addEventListener('DOMContentLoaded', function() {
    setupInventoryEnhancements();
    checkInventoryAlertsOnLoad();
});