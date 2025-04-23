// نظام ولاء العملاء
// يضاف هذا الكود إلى ملف index.js

// 1. إضافة قاعدة بيانات العملاء
let customers = JSON.parse(localStorage.getItem('customers')) || [];

// 2. وظائف إدارة العملاء
const customerManager = {
    // إضافة عميل جديد
    addCustomer: function(customer) {
        // إضافة رقم تعريفي فريد وتاريخ التسجيل
        customer.id = Date.now().toString();
        customer.registrationDate = new Date().toISOString();
        customer.points = 0;
        customer.totalSpent = 0;
        customer.visits = 0;
        customer.loyaltyTier = 'عادي'; // مستويات: عادي، فضي، ذهبي، ماسي
        
        customers.push(customer);
        this.saveCustomers();
        return customer;
    },
    
    // البحث عن عميل
    findCustomer: function(searchTerm) {
        return customers.filter(c => 
            c.phone.includes(searchTerm) || 
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    },
    
    // البحث عن عميل بالرقم التعريفي
    getCustomerById: function(id) {
        return customers.find(c => c.id === id);
    },
    
    // البحث عن عميل برقم الهاتف
    getCustomerByPhone: function(phone) {
        return customers.find(c => c.phone === phone);
    },
    
    // تحديث بيانات العميل
    updateCustomer: function(customerId, updatedData) {
        const index = customers.findIndex(c => c.id === customerId);
        if (index !== -1) {
            customers[index] = { ...customers[index], ...updatedData };
            this.saveCustomers();
            return customers[index];
        }
        return null;
    },
    
    // إضافة نقاط للعميل
    addPoints: function(customerId, points, transaction) {
        const customer = this.getCustomerById(customerId);
        if (customer) {
            customer.points += points;
            customer.totalSpent += transaction.totalAmount;
            customer.visits += 1;
            customer.lastVisit = new Date().toISOString();
            
            // إضافة سجل الصفقة للعميل
            if (!customer.transactions) customer.transactions = [];
            customer.transactions.push({
                date: new Date().toISOString(),
                amount: transaction.totalAmount,
                pointsEarned: points,
                receipt: transaction.receiptNumber
            });
            
            // تحديث مستوى الولاء بناءً على إجمالي النقاط
            this.updateLoyaltyTier(customer);
            
            this.saveCustomers();
            return customer;
        }
        return null;
    },
    
    // استبدال النقاط
    redeemPoints: function(customerId, pointsToRedeem) {
        const customer = this.getCustomerById(customerId);
        if (customer && customer.points >= pointsToRedeem) {
            customer.points -= pointsToRedeem;
            
            // إضافة سجل الاستبدال
            if (!customer.redemptions) customer.redemptions = [];
            customer.redemptions.push({
                date: new Date().toISOString(),
                pointsRedeemed: pointsToRedeem
            });
            
            this.saveCustomers();
            return true;
        }
        return false;
    },
    
    // حساب الخصم المتاح بناءً على النقاط
    calculateAvailableDiscount: function(customerId) {
        const customer = this.getCustomerById(customerId);
        if (customer) {
            // مثال: كل 100 نقطة = 1 دينار خصم
            const discountAmount = Math.floor(customer.points / 100);
            return discountAmount;
        }
        return 0;
    },
    
    // تحديث مستوى الولاء
    updateLoyaltyTier: function(customer) {
        if (customer.totalSpent >= 1000000) {
            customer.loyaltyTier = 'ماسي';
        } else if (customer.totalSpent >= 500000) {
            customer.loyaltyTier = 'ذهبي';
        } else if (customer.totalSpent >= 200000) {
            customer.loyaltyTier = 'فضي';
        } else {
            customer.loyaltyTier = 'عادي';
        }
    },
    
    // احتساب النقاط لصفقة جديدة
    calculatePointsForPurchase: function(amount) {
        // مثال: كل 1000 دينار = 1 نقطة
        return Math.floor(amount / 1000);
    },
    
    // الحصول على قائمة أفضل العملاء
    getTopCustomers: function(limit = 10) {
        return [...customers]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);
    },
    
    // حفظ بيانات العملاء في التخزين المحلي
    saveCustomers: function() {
        localStorage.setItem('customers', JSON.stringify(customers));
    }
};

// 3. إنشاء نافذة منبثقة لإدارة العملاء
function createLoyaltyModal() {
    const modalHtml = `
    <div class="modal" id="loyalty-modal">
        <div class="modal-content" style="width: 80%; max-width: 1000px;">
            <div class="modal-header">
                <h2>نظام ولاء العملاء</h2>
                <button class="modal-close" id="close-loyalty-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-tabs">
                    <div class="settings-tab active" data-loyalty="search">بحث عن عميل</div>
                    <div class="settings-tab" data-loyalty="add">إضافة عميل</div>
                    <div class="settings-tab" data-loyalty="top">كبار العملاء</div>
                    <div class="settings-tab" data-loyalty="settings">إعدادات النقاط</div>
                </div>

                <!-- بحث عن عميل -->
                <div class="loyalty-panel active" id="loyalty-search">
                    <div class="form-group">
                        <div class="search-bar" style="width: 100%; margin-bottom: 20px;">
                            <i class="fas fa-search"></i>
                            <input type="text" id="customer-search" placeholder="أدخل رقم الهاتف أو اسم العميل...">
                        </div>
                    </div>
                    <div id="customer-search-results" style="max-height: 400px; overflow-y: auto;">
                        <!-- نتائج البحث ستظهر هنا -->
                    </div>
                </div>

                <!-- إضافة عميل -->
                <div class="loyalty-panel" id="loyalty-add">
                    <div class="form-group">
                        <label for="new-customer-name">اسم العميل</label>
                        <input type="text" class="form-control" id="new-customer-name" placeholder="أدخل اسم العميل">
                    </div>
                    <div class="form-group">
                        <label for="new-customer-phone">رقم الهاتف</label>
                        <input type="text" class="form-control" id="new-customer-phone" placeholder="أدخل رقم الهاتف">
                    </div>
                    <div class="form-group">
                        <label for="new-customer-email">البريد الإلكتروني (اختياري)</label>
                        <input type="email" class="form-control" id="new-customer-email" placeholder="أدخل البريد الإلكتروني">
                    </div>
                    <div class="form-group">
                        <label for="new-customer-birthdate">تاريخ الميلاد (اختياري)</label>
                        <input type="date" class="form-control" id="new-customer-birthdate">
                    </div>
                    <div class="form-group">
                        <label for="new-customer-notes">ملاحظات (اختياري)</label>
                        <textarea class="form-control" id="new-customer-notes" rows="3" placeholder="أي ملاحظات إضافية..."></textarea>
                    </div>
                    <button class="btn btn-primary" id="add-new-customer">إضافة العميل</button>
                </div>

                <!-- كبار العملاء -->
                <div class="loyalty-panel" id="loyalty-top">
                    <div class="form-group">
                        <h3>أفضل العملاء</h3>
                        <table class="inventory-list">
                            <thead>
                                <tr>
                                    <th>اسم العميل</th>
                                    <th>مستوى الولاء</th>
                                    <th>النقاط</th>
                                    <th>الإنفاق الكلي</th>
                                    <th>عدد الزيارات</th>
                                    <th>آخر زيارة</th>
                                </tr>
                            </thead>
                            <tbody id="top-customers-list">
                                <!-- قائمة أفضل العملاء ستظهر هنا -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- إعدادات النقاط -->
                <div class="loyalty-panel" id="loyalty-settings">
                    <div class="form-group">
                        <label for="points-per-dinar">النقاط لكل 1000 دينار</label>
                        <input type="number" class="form-control" id="points-per-dinar" value="1" min="0.1" step="0.1">
                    </div>
                    <div class="form-group">
                        <label for="points-redemption-rate">قيمة النقطة بالدينار</label>
                        <input type="number" class="form-control" id="points-redemption-rate" value="10" min="1">
                    </div>
                    <div class="form-group">
                        <h3>مستويات الولاء</h3>
                        <table class="inventory-list">
                            <thead>
                                <tr>
                                    <th>المستوى</th>
                                    <th>الإنفاق المطلوب</th>
                                    <th>الخصم</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>عادي</td>
                                    <td>0 د.ع</td>
                                    <td>0%</td>
                                </tr>
                                <tr>
                                    <td>فضي</td>
                                    <td>200,000 د.ع</td>
                                    <td>2%</td>
                                </tr>
                                <tr>
                                    <td>ذهبي</td>
                                    <td>500,000 د.ع</td>
                                    <td>5%</td>
                                </tr>
                                <tr>
                                    <td>ماسي</td>
                                    <td>1,000,000 د.ع</td>
                                    <td>10%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- تفاصيل العميل -->
                <div class="loyalty-panel" id="loyalty-customer-details" style="display: none;">
                    <div id="customer-details-content">
                        <!-- تفاصيل العميل ستظهر هنا -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" id="close-loyalty">إغلاق</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // إضافة CSS للألوان والأشكال المختلفة لمستويات الولاء
    const loyaltyStyles = `
    <style>
        .loyalty-panel {
            display: none;
        }
        .loyalty-panel.active {
            display: block;
        }
        .customer-card {
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            cursor: pointer;
        }
        .customer-card:hover {
            background-color: #f9f9f9;
        }
        .loyalty-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 12px;
            color: white;
        }
        .loyalty-normal {
            background-color: #7f8c8d;
        }
        .loyalty-silver {
            background-color: #bdc3c7;
        }
        .loyalty-gold {
            background-color: #f1c40f;
        }
        .loyalty-diamond {
            background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
        }
        .customer-transactions {
            margin-top: 20px;
            max-height: 200px;
            overflow-y: auto;
        }
        .points-indicator {
            display: flex;
            align-items: center;
            margin: 15px 0;
        }
        .points-bar {
            flex-grow: 1;
            height: 12px;
            background-color: #eee;
            border-radius: 6px;
            margin: 0 10px;
            position: relative;
        }
        .points-bar-fill {
            height: 100%;
            border-radius: 6px;
            background-color: var(--primary-color);
        }
        .points-text {
            font-weight: bold;
            font-size: 14px;
        }
        .redeem-points-btn {
            background-color: var(--secondary-color);
            color: white;
            border: none;
            border-radius: 5px;
            padding: 8px 15px;
            cursor: pointer;
            margin-top: 10px;
        }
    </style>`;
    document.head.insertAdjacentHTML('beforeend', loyaltyStyles);
}

// 4. إضافة زر نظام ولاء العملاء إلى شريط القائمة
function addLoyaltyButtonToHeader() {
    const headerControls = document.querySelector('.header-controls');
    const loyaltyButton = document.createElement('button');
    loyaltyButton.id = 'btn-loyalty';
    loyaltyButton.innerHTML = '<i class="fas fa-award"></i> نظام الولاء';
    headerControls.insertBefore(loyaltyButton, headerControls.firstChild);
    
    // إضافة المستمع للزر
    loyaltyButton.addEventListener('click', openLoyaltyModal);
}

// 5. فتح نافذة نظام الولاء
function openLoyaltyModal() {
    const loyaltyModal = document.getElementById('loyalty-modal');
    loyaltyModal.style.display = 'flex';
    
    // عرض أفضل العملاء
    displayTopCustomers();
}

// 6. عرض أفضل العملاء
function displayTopCustomers() {
    const topCustomersList = document.getElementById('top-customers-list');
    const topCustomers = customerManager.getTopCustomers();
    
    let html = '';
    if (topCustomers.length === 0) {
        html = '<tr><td colspan="6" style="text-align: center;">لا يوجد عملاء بعد</td></tr>';
    } else {
        topCustomers.forEach(customer => {
            const lastVisit = customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'لم يزر بعد';
            html += `
            <tr>
                <td>${customer.name}</td>
                <td>
                    <span class="loyalty-badge loyalty-${getLoyaltyClass(customer.loyaltyTier)}">
                        ${customer.loyaltyTier}
                    </span>
                </td>
                <td>${customer.points}</td>
                <td>${formatCurrency(customer.totalSpent)}</td>
                <td>${customer.visits}</td>
                <td>${lastVisit}</td>
            </tr>`;
        });
    }
    
    topCustomersList.innerHTML = html;
}

// 7. الحصول على صنف CSS لمستوى الولاء
function getLoyaltyClass(tier) {
    switch (tier) {
        case 'فضي': return 'silver';
        case 'ذهبي': return 'gold';
        case 'ماسي': return 'diamond';
        default: return 'normal';
    }
}

// 8. التنسيق لعرض العملة
function formatCurrency(amount) {
    return amount.toLocaleString() + ' د.ع';
}

// 9. البحث عن العملاء
function setupCustomerSearch() {
    const searchInput = document.getElementById('customer-search');
    const resultsContainer = document.getElementById('customer-search-results');
    
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '<p>أدخل على الأقل حرفين للبحث</p>';
            return;
        }
        
        const results = customerManager.findCustomer(searchTerm);
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>لا توجد نتائج</p>';
        } else {
            let html = '';
            results.forEach(customer => {
                html += `
                <div class="customer-card" data-id="${customer.id}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>${customer.name}</h3>
                        <span class="loyalty-badge loyalty-${getLoyaltyClass(customer.loyaltyTier)}">
                            ${customer.loyaltyTier}
                        </span>
                    </div>
                    <p>رقم الهاتف: ${customer.phone}</p>
                    <p>النقاط: ${customer.points}</p>
                    <p>الإنفاق الكلي: ${formatCurrency(customer.totalSpent)}</p>
                </div>`;
            });
            resultsContainer.innerHTML = html;
            
            // إضافة مستمعي الأحداث للبطاقات
            document.querySelectorAll('.customer-card').forEach(card => {
                card.addEventListener('click', function() {
                    const customerId = this.getAttribute('data-id');
                    showCustomerDetails(customerId);
                });
            });
        }
    });
}

// 10. عرض تفاصيل العميل
function showCustomerDetails(customerId) {
    const customer = customerManager.getCustomerById(customerId);
    if (!customer) return;
    
    // تغيير إلى لوحة تفاصيل العميل
    document.querySelectorAll('.loyalty-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('loyalty-customer-details').classList.add('active');
    
    // حساب النسبة المئوية للوصول إلى المستوى التالي
    let nextTierName = 'ماسي+';
    let nextTierAmount = Infinity;
    let currentTierMinimum = 0;
    
    switch (customer.loyaltyTier) {
        case 'عادي':
            nextTierName = 'فضي';
            nextTierAmount = 200000;
            break;
        case 'فضي':
            nextTierName = 'ذهبي';
            nextTierAmount = 500000;
            currentTierMinimum = 200000;
            break;
        case 'ذهبي':
            nextTierName = 'ماسي';
            nextTierAmount = 1000000;
            currentTierMinimum = 500000;
            break;
        case 'ماسي':
            nextTierName = 'ماسي+';
            currentTierMinimum = 1000000;
            break;
    }
    
    const progress = customer.loyaltyTier === 'ماسي' ? 100 : 
        ((customer.totalSpent - currentTierMinimum) / (nextTierAmount - currentTierMinimum) * 100).toFixed(0);
    
    // إنشاء المحتوى
    const detailsContainer = document.getElementById('customer-details-content');
    let transactions = '';
    
    if (customer.transactions && customer.transactions.length > 0) {
        customer.transactions.slice(0, 10).forEach(transaction => {
            const date = new Date(transaction.date).toLocaleDateString();
            transactions += `
            <tr>
                <td>${date}</td>
                <td>${formatCurrency(transaction.amount)}</td>
                <td>${transaction.pointsEarned}</td>
                <td>${transaction.receipt}</td>
            </tr>`;
        });
    } else {
        transactions = '<tr><td colspan="4" style="text-align: center;">لا توجد معاملات سابقة</td></tr>';
    }
    
    detailsContainer.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
        <h2>${customer.name}</h2>
        <span class="loyalty-badge loyalty-${getLoyaltyClass(customer.loyaltyTier)}">
            ${customer.loyaltyTier}
        </span>
    </div>
    
    <div class="form-row">
        <div class="form-col">
            <div class="form-group">
                <label>رقم الهاتف:</label>
                <p>${customer.phone}</p>
            </div>
        </div>
        <div class="form-col">
            <div class="form-group">
                <label>البريد الإلكتروني:</label>
                <p>${customer.email || 'غير متوفر'}</p>
            </div>
        </div>
    </div>
    
    <div class="form-group">
        <label>النقاط المتاحة:</label>
        <div class="points-indicator">
            <span class="points-text">${customer.points}</span>
            <div class="points-bar">
                <div class="points-bar-fill" style="width: ${Math.min(customer.points / 10, 100)}%"></div>
            </div>
            <span class="points-text">${formatCurrency(Math.floor(customer.points / 10) * 10)}</span>
        </div>
        <button class="redeem-points-btn" id="redeem-points-btn" data-id="${customer.id}">
            استبدال النقاط
        </button>
    </div>
    
    <div class="form-group">
        <label>التقدم نحو المستوى التالي:</label>
        <div class="points-indicator">
            <span class="points-text">${customer.loyaltyTier}</span>
            <div class="points-bar">
                <div class="points-bar-fill" style="width: ${progress}%"></div>
            </div>
            <span class="points-text">${nextTierName}</span>
        </div>
        <p>الإنفاق المتبقي للمستوى التالي: ${
            customer.loyaltyTier === 'ماسي' ? 
            'لقد وصلت إلى أعلى مستوى!' : 
            formatCurrency(nextTierAmount - customer.totalSpent)
        }</p>
    </div>
    
    <div class="form-group">
        <label>معلومات العضوية:</label>
        <p>تاريخ التسجيل: ${new Date(customer.registrationDate).toLocaleDateString()}</p>
        <p>عدد الزيارات: ${customer.visits}</p>
        <p>آخر زيارة: ${customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'لم يزر بعد'}</p>
    </div>
    
    <div class="form-group">
        <label>آخر المعاملات:</label>
        <div class="customer-transactions">
            <table class="inventory-list">
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>المبلغ</th>
                        <th>النقاط المكتسبة</th>
                        <th>رقم الإيصال</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions}
                </tbody>
            </table>
        </div>
    </div>
    
    <div class="form-group" style="margin-top: 20px;">
        <button class="btn btn-primary" id="back-to-search">العودة إلى البحث</button>
        <button class="btn btn-primary" id="edit-customer" data-id="${customer.id}">تعديل بيانات العميل</button>
    </div>`;
    
    // إضافة مستمعي الأحداث للأزرار
    document.getElementById('back-to-search').addEventListener('click', () => {
        document.querySelectorAll('.loyalty-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById('loyalty-search').classList.add('active');
    });
    
    document.getElementById('redeem-points-btn').addEventListener('click', function() {
        redeemCustomerPoints(this.getAttribute('data-id'));
    });
    
    document.getElementById('edit-customer').addEventListener('click', function() {
        editCustomer(this.getAttribute('data-id'));
    });
}

// 11. استبدال نقاط العميل
function redeemCustomerPoints(customerId) {
    const customer = customerManager.getCustomerById(customerId);
    if (!customer) return;
    
    // حساب الخصم المتاح
    const availableDiscount = customerManager.calculateAvailableDiscount(customerId);
    
    if (availableDiscount <= 0) {
        showNotification('لا توجد نقاط كافية للاستبدال', 'error');
        return;
    }
    
    // إنشاء نافذة منبثقة للاستبدال
    const redeemHtml = `
    <div class="modal" id="redeem-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>استبدال النقاط</h2>
                <button class="modal-close" id="close-redeem-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <p>رصيد النقاط الحالي: <strong>${customer.points}</strong></p>
                    <p>الخصم المتاح: <strong>${formatCurrency(availableDiscount)}</strong></p>
                </div>
                <div class="form-group">
                    <label for="redeem-amount">المبلغ المراد استبداله:</label>
                    <input type="number" class="form-control" id="redeem-amount" max="${availableDiscount}" value="${availableDiscount}">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="confirm-redeem" data-id="${customerId}">تأكيد الاستبدال</button>
                <button class="btn" id="cancel-redeem">إلغاء</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', redeemHtml);
    document.getElementById('redeem-modal').style.display = 'flex';
    
    // إضافة مستمعي الأحداث
    document.getElementById('close-redeem-modal').addEventListener('click', () => {
        document.getElementById('redeem-modal').remove();
    });
    
    document.getElementById('cancel-redeem').addEventListener('click', () => {
        document.getElementById('redeem-modal').remove();
    });
    
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