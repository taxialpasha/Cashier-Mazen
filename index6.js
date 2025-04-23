// نظام إدارة الموظفين وتسجيل الدخول
// يضاف هذا الكود إلى ملف index.js

// 1. إدارة الموظفين
const employeeManager = {
    // قائمة الموظفين
    employees: JSON.parse(localStorage.getItem('employees')) || [],
    
    // الموظف الحالي المسجل دخوله
    currentEmployee: JSON.parse(localStorage.getItem('currentEmployee')) || null,
    
    // إضافة موظف جديد
    addEmployee: function(employee) {
        // إضافة معرف فريد وتاريخ التسجيل
        employee.id = Date.now().toString();
        employee.hireDate = new Date().toISOString();
        employee.active = true;
        
        // إعدادات افتراضية للصلاحيات
        employee.permissions = employee.permissions || {
            manageSales: true,
            manageProducts: false,
            manageInventory: false,
            manageEmployees: false,
            viewReports: false,
            applyDiscount: false,
            changeSettings: false
        };
        
        // إحصائيات المبيعات
        employee.sales = employee.sales || {
            totalSales: 0,
            totalOrders: 0,
            lastSaleDate: null
        };
        
        this.employees.push(employee);
        this.saveEmployees();
        return employee;
    },
    
    // تحديث بيانات موظف
    updateEmployee: function(employeeId, updatedData) {
        const index = this.employees.findIndex(e => e.id === employeeId);
        if (index !== -1) {
            // عدم السماح بتغيير المعرف وتاريخ التوظيف
            delete updatedData.id;
            delete updatedData.hireDate;
            
            this.employees[index] = { ...this.employees[index], ...updatedData };
            this.saveEmployees();
            
            // تحديث بيانات الموظف الحالي إذا كان هو نفسه
            if (this.currentEmployee && this.currentEmployee.id === employeeId) {
                this.currentEmployee = this.employees[index];
                this.saveCurrentEmployee();
            }
            
            return this.employees[index];
        }
        return null;
    },
    
    // تعطيل موظف (بدلاً من الحذف النهائي)
    deactivateEmployee: function(employeeId) {
        const employee = this.getEmployeeById(employeeId);
        if (employee) {
            employee.active = false;
            this.saveEmployees();
            return true;
        }
        return false;
    },
    
    // إعادة تفعيل موظف
    activateEmployee: function(employeeId) {
        const employee = this.getEmployeeById(employeeId);
        if (employee) {
            employee.active = true;
            this.saveEmployees();
            return true;
        }
        return false;
    },
    
    // الحصول على موظف بواسطة المعرف
    getEmployeeById: function(id) {
        return this.employees.find(e => e.id === id);
    },
    
    // الحصول على موظف بواسطة اسم المستخدم
    getEmployeeByUsername: function(username) {
        return this.employees.find(e => e.username === username);
    },
    
    // الحصول على قائمة الموظفين النشطين
    getActiveEmployees: function() {
        return this.employees.filter(e => e.active);
    },
    
    // حفظ قائمة الموظفين
    saveEmployees: function() {
        localStorage.setItem('employees', JSON.stringify(this.employees));
    },
    
    // تسجيل الدخول
    login: function(username, password) {
        const employee = this.getEmployeeByUsername(username);
        if (employee && employee.password === password && employee.active) {
            this.currentEmployee = employee;
            this.saveCurrentEmployee();
            return employee;
        }
        return null;
    },
    
    // تسجيل الخروج
    logout: function() {
        this.currentEmployee = null;
        localStorage.removeItem('currentEmployee');
        return true;
    },
    
    // حفظ بيانات الموظف الحالي
    saveCurrentEmployee: function() {
        localStorage.setItem('currentEmployee', JSON.stringify(this.currentEmployee));
    },
    
    // التحقق من صلاحية الموظف للقيام بعملية معينة
    hasPermission: function(permission) {
        if (!this.currentEmployee) return false;
        return this.currentEmployee.permissions[permission] || this.currentEmployee.role === 'admin';
    },
    
    // تسجيل عملية بيع للموظف الحالي
    recordSale: function(saleData) {
        if (!this.currentEmployee) return false;
        
        // البحث عن الموظف في القائمة للتأكد من تحديث البيانات
        const employee = this.getEmployeeById(this.currentEmployee.id);
        if (!employee) return false;
        
        // تحديث إحصائيات المبيعات
        employee.sales.totalSales += saleData.amount;
        employee.sales.totalOrders += 1;
        employee.sales.lastSaleDate = new Date().toISOString();
        
        // إضافة السجل إلى تاريخ المبيعات
        if (!employee.salesHistory) employee.salesHistory = [];
        
        employee.salesHistory.push({
            id: saleData.id,
            date: new Date().toISOString(),
            amount: saleData.amount,
            items: saleData.itemsCount,
            receiptNumber: saleData.receiptNumber
        });
        
        // تحديث بيانات الموظف الحالي
        this.currentEmployee = employee;
        
        // حفظ التغييرات
        this.saveEmployees();
        this.saveCurrentEmployee();
        
        return true;
    },
    
    // الحصول على مبيعات الموظفين في فترة زمنية معينة
    getEmployeeSalesInPeriod: function(startDate, endDate) {
        const results = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        this.employees.forEach(employee => {
            // تجاوز الموظفين غير النشطين
            if (!employee.active) return;
            
            // إذا لم يكن لديه سجل مبيعات، إضافة سجل فارغ
            if (!employee.salesHistory) {
                results.push({
                    id: employee.id,
                    name: employee.name,
                    totalSales: 0,
                    totalOrders: 0,
                    periodSales: 0,
                    periodOrders: 0
                });
                return;
            }
            
            // حساب المبيعات في الفترة المحددة
            let periodSales = 0;
            let periodOrders = 0;
            
            employee.salesHistory.forEach(sale => {
                const saleDate = new Date(sale.date);
                if (saleDate >= start && saleDate <= end) {
                    periodSales += sale.amount;
                    periodOrders += 1;
                }
            });
            
            results.push({
                id: employee.id,
                name: employee.name,
                totalSales: employee.sales.totalSales,
                totalOrders: employee.sales.totalOrders,
                periodSales,
                periodOrders
            });
        });
        
        // ترتيب النتائج حسب المبيعات في الفترة (تنازلياً)
        results.sort((a, b) => b.periodSales - a.periodSales);
        
        return results;
    },
    
    // الحصول على مبيعات الموظف الحالي في فترة زمنية معينة
    getCurrentEmployeeSalesInPeriod: function(startDate, endDate) {
        if (!this.currentEmployee) return null;
        
        const employee = this.getEmployeeById(this.currentEmployee.id);
        if (!employee || !employee.salesHistory) {
            return {
                periodSales: 0,
                periodOrders: 0,
                salesBreakdown: []
            };
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // حساب المبيعات في الفترة المحددة
        let periodSales = 0;
        let periodOrders = 0;
        const salesBreakdown = [];
        
        employee.salesHistory.forEach(sale => {
            const saleDate = new Date(sale.date);
            if (saleDate >= start && saleDate <= end) {
                periodSales += sale.amount;
                periodOrders += 1;
                salesBreakdown.push(sale);
            }
        });
        
        return {
            periodSales,
            periodOrders,
            salesBreakdown
        };
    },
    
    // إنشاء موظف افتراضي إذا لم يكن هناك موظفين
    createDefaultEmployees: function() {
        if (this.employees.length === 0) {
            // إنشاء حساب المدير الافتراضي
            this.addEmployee({
                name: 'المدير',
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                phone: '',
                email: '',
                permissions: {
                    manageSales: true,
                    manageProducts: true,
                    manageInventory: true,
                    manageEmployees: true,
                    viewReports: true,
                    applyDiscount: true,
                    changeSettings: true
                }
            });
            
            // إنشاء حساب كاشير افتراضي
            this.addEmployee({
                name: 'كاشير',
                username: 'cashier',
                password: 'cashier123',
                role: 'cashier',
                phone: '',
                email: '',
                permissions: {
                    manageSales: true,
                    manageProducts: false,
                    manageInventory: false,
                    manageEmployees: false,
                    viewReports: false,
                    applyDiscount: false,
                    changeSettings: false
                }
            });
        }
    }
};

// 2. إنشاء نافذة تسجيل الدخول
function createLoginModal() {
    const modalHtml = `
    <div class="modal" id="login-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>تسجيل الدخول</h2>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="login-username">اسم المستخدم</label>
                    <input type="text" class="form-control" id="login-username">
                </div>
                <div class="form-group">
                    <label for="login-password">كلمة المرور</label>
                    <input type="password" class="form-control" id="login-password">
                </div>
                <div id="login-error" class="error-message" style="color: red; display: none;"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="btn-login">تسجيل الدخول</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 3. إنشاء واجهة إدارة الموظفين
function createEmployeeManagerModal() {
    const modalHtml = `
    <div class="modal" id="employee-manager-modal">
        <div class="modal-content" style="width: 80%; max-width: 1000px;">
            <div class="modal-header">
                <h2>إدارة الموظفين</h2>
                <button class="modal-close" id="close-employee-manager-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <div class="search-bar" style="width: 100%; margin-bottom: 20px;">
                        <i class="fas fa-search"></i>
                        <input type="text" id="employee-search" placeholder="البحث عن موظف...">
                    </div>
                </div>
                <table class="inventory-list">
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>اسم المستخدم</th>
                            <th>الدور</th>
                            <th>تاريخ التوظيف</th>
                            <th>المبيعات</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="employees-list">
                        <!-- ستتم إضافة الموظفين هنا -->
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="add-new-employee">
                    <i class="fas fa-plus"></i>
                    إضافة موظف جديد
                </button>
                <button class="btn" id="close-employee-manager">إغلاق</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 4. إنشاء نموذج إضافة/تعديل موظف
function createEmployeeFormModal(employee = null) {
    const isEdit = employee !== null;
    const modalHtml = `
    <div class="modal" id="employee-form-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>${isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h2>
                <button class="modal-close" id="close-employee-form-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="employee-name">اسم الموظف</label>
                            <input type="text" class="form-control" id="employee-name" value="${isEdit ? employee.name : ''}">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="employee-role">الدور</label>
                            <select class="form-control" id="employee-role">
                                <option value="admin" ${isEdit && employee.role === 'admin' ? 'selected' : ''}>مدير</option>
                                <option value="supervisor" ${isEdit && employee.role === 'supervisor' ? 'selected' : ''}>مشرف</option>
                                <option value="cashier" ${isEdit && employee.role === 'cashier' ? 'selected' : ''}>كاشير</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="employee-username">اسم المستخدم</label>
                            <input type="text" class="form-control" id="employee-username" value="${isEdit ? employee.username : ''}">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="employee-password">كلمة المرور</label>
                            <input type="password" class="form-control" id="employee-password" ${isEdit ? 'placeholder="اتركه فارغاً إذا لم ترغب في تغييره"' : ''}>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="employee-phone">رقم الهاتف</label>
                            <input type="text" class="form-control" id="employee-phone" value="${isEdit && employee.phone ? employee.phone : ''}">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="employee-email">البريد الإلكتروني</label>
                            <input type="email" class="form-control" id="employee-email" value="${isEdit && employee.email ? employee.email : ''}">
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>الصلاحيات</label>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                        <label>
                            <input type="checkbox" id="perm-sales" ${isEdit && employee.permissions.manageSales ? 'checked' : ''}>
                            إدارة المبيعات
                        </label>
                        <label>
                            <input type="checkbox" id="perm-products" ${isEdit && employee.permissions.manageProducts ? 'checked' : ''}>
                            إدارة المنتجات
                        </label>
                        <label>
                            <input type="checkbox" id="perm-inventory" ${isEdit && employee.permissions.manageInventory ? 'checked' : ''}>
                            إدارة المخزون
                        </label>
                        <label>
                            <input type="checkbox" id="perm-employees" ${isEdit && employee.permissions.manageEmployees ? 'checked' : ''}>
                            إدارة الموظفين
                        </label>
                        <label>
                            <input type="checkbox" id="perm-reports" ${isEdit && employee.permissions.viewReports ? 'checked' : ''}>
                            عرض التقارير
                        </label>
                        <label>
                            <input type="checkbox" id="perm-discount" ${isEdit && employee.permissions.applyDiscount ? 'checked' : ''}>
                            تطبيق الخصومات
                        </label>
                        <label>
                            <input type="checkbox" id="perm-settings" ${isEdit && employee.permissions.changeSettings ? 'checked' : ''}>
                            تغيير الإعدادات
                        </label>
                    </div>
                </div>
                
                ${isEdit ? `
                <div class="form-group">
                    <label>الحالة</label>
                    <div style="margin-top: 10px;">
                        <label>
                            <input type="radio" name="employee-status" value="active" ${employee.active ? 'checked' : ''}>
                            نشط
                        </label>
                        <label style="margin-right: 20px;">
                            <input type="radio" name="employee-status" value="inactive" ${!employee.active ? 'checked' : ''}>
                            غير نشط
                        </label>
                    </div>
                </div>
                ` : ''}
                
                <input type="hidden" id="employee-id" value="${isEdit ? employee.id : ''}">
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="save-employee">${isEdit ? 'حفظ التغييرات' : 'إضافة الموظف'}</button>
                <button class="btn" id="cancel-employee-form">إلغاء</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 5. إنشاء نافذة إحصائيات الموظف
function createEmployeeStatsModal() {
    const modalHtml = `
    <div class="modal" id="employee-stats-modal">
        <div class="modal-content" style="width: 80%; max-width: 1000px;">
            <div class="modal-header">
                <h2>إحصائيات الموظف</h2>
                <button class="modal-close" id="close-employee-stats-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div id="employee-stats-header">
                    <h3 id="stats-employee-name"></h3>
                    <p id="stats-employee-role"></p>
                </div>
                
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="stats-date-from">من تاريخ</label>
                            <input type="date" class="form-control" id="stats-date-from">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="stats-date-to">إلى تاريخ</label>
                            <input type="date" class="form-control" id="stats-date-to">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <button class="btn btn-primary" id="load-employee-stats" style="width: 100%;">عرض</button>
                        </div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="report-card" style="flex: 1;">
                        <div class="report-title">إجمالي المبيعات</div>
                        <div class="report-content">
                            <div class="report-value" id="stats-total-sales">0 د.ع</div>
                            <div class="report-icon"><i class="fas fa-money-bill-wave"></i></div>
                        </div>
                    </div>
                    <div class="report-card" style="flex: 1;">
                        <div class="report-title">عدد الطلبات</div>
                        <div class="report-content">
                            <div class="report-value" id="stats-orders-count">0</div>
                            <div class="report-icon"><i class="fas fa-shopping-cart"></i></div>
                        </div>
                    </div>
                    <div class="report-card" style="flex: 1;">
                        <div class="report-title">متوسط قيمة الطلب</div>
                        <div class="report-content">
                            <div class="report-value" id="stats-average-order">0 د.ع</div>
                            <div class="report-icon"><i class="fas fa-chart-line"></i></div>
                        </div>
                    </div>
                </div>
                
                <div class="report-card" style="margin-top: 20px;">
                    <div class="report-title">تفاصيل المبيعات</div>
                    <table class="inventory-list">
                        <thead>
                            <tr>
                                <th>رقم الإيصال</th>
                                <th>التاريخ</th>
                                <th>المبلغ</th>
                                <th>عدد المنتجات</th>
                            </tr>
                        </thead>
                        <tbody id="sales-details-list">
                            <!-- ستتم إضافة تفاصيل المبيعات هنا -->
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="print-employee-stats">
                    <i class="fas fa-print"></i>
                    طباعة التقرير
                </button>
                <button class="btn" id="close-employee-stats">إغلاق</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 6. إنشاء مكون تعريف الموظف الحالي في الشريط العلوي
function createEmployeeIndicator() {
    // إنشاء مؤشر الموظف في الشريط العلوي
    const header = document.querySelector('.header');
    const indicator = document.createElement('div');
    indicator.className = 'employee-indicator';
    indicator.id = 'employee-indicator';
    indicator.innerHTML = `
        <div class="employee-info">
            <span class="employee-name">لم يتم تسجيل الدخول</span>
            <span class="employee-role"></span>
        </div>
        <button id="btn-employee-menu" class="employee-menu-toggle">
            <i class="fas fa-chevron-down"></i>
        </button>
        <div class="employee-menu" id="employee-menu">
            <div class="employee-menu-item" id="view-my-stats">
                <i class="fas fa-chart-bar"></i>
                إحصائياتي
            </div>
            <div class="employee-menu-item" id="manage-employees">
                <i class="fas fa-users"></i>
                إدارة الموظفين
            </div>
            <div class="employee-menu-item" id="logout">
                <i class="fas fa-sign-out-alt"></i>
                تسجيل الخروج
            </div>
        </div>
    `;
    
    // إدراج المؤشر بين الشعار وأزرار التحكم
    header.insertBefore(indicator, header.querySelector('.header-controls'));
    
    // إضافة CSS للمؤشر
    const style = document.createElement('style');
    style.textContent = `
        .employee-indicator {
            display: flex;
            align-items: center;
            position: relative;
            margin: 0 20px;
        }
        
        .employee-info {
            display: flex;
            flex-direction: column;
            margin-left: 10px;
        }
        
        .employee-name {
            font-weight: bold;
            color: white;
        }
        
        .employee-role {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .employee-menu-toggle {
            background: transparent;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 5px;
        }
        
        .employee-menu {
            position: absolute;
            top: 100%;
            left: 0;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            min-width: 200px;
            display: none;
        }
        
        .employee-menu-item {
            padding: 10px 15px;
            cursor: pointer;
            transition: background-color 0.3s;
            display: flex;
            align-items: center;
        }
        
        .employee-menu-item:hover {
            background-color: #f5f5f5;
        }
        
        .employee-menu-item i {
            margin-left: 10px;
            width: 16px;
        }
    `;
    
    document.head.appendChild(style);
}

// 7. عرض قائمة الموظفين
function displayEmployees() {
    const tbody = document.getElementById('employees-list');
    const employees = employeeManager.employees;
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا يوجد موظفين</td></tr>';
        return;
    }
    
    let html = '';
    employees.forEach(employee => {
        const hireDate = new Date(employee.hireDate).toLocaleDateString();
        const status = employee.active ? 
            '<span class="stock-status in-stock">نشط</span>' : 
            '<span class="stock-status out-of-stock">غير نشط</span>';
        
        const roleName = getRoleName(employee.role);
        
     html += `
        <tr>
            <td>${employee.name}</td>
            <td>${employee.username}</td>
            <td>${roleName}</td>
            <td>${hireDate}</td>
            <td>${formatCurrency(employee.sales.totalSales)}</td>
            <td>${status}</td>
            <td class="inventory-actions">
                <button class="inventory-actions-btn view-employee-stats" data-id="${employee.id}" title="إحصائيات">
                    <i class="fas fa-chart-bar"></i>
                </button>
                <button class="inventory-actions-btn edit-employee" data-id="${employee.id}" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="inventory-actions-btn toggle-employee-status" data-id="${employee.id}" title="${employee.active ? 'تعطيل' : 'تفعيل'}">
                    <i class="fas fa-${employee.active ? 'ban' : 'check'}"></i>
                </button>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    
    // إضافة مستمعي الأحداث للأزرار
    document.querySelectorAll('.view-employee-stats').forEach(btn => {
        btn.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            showEmployeeStats(employeeId);
        });
    });
    
    document.querySelectorAll('.edit-employee').forEach(btn => {
        btn.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            editEmployee(employeeId);
        });
    });
    
    document.querySelectorAll('.toggle-employee-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            toggleEmployeeStatus(employeeId);
        });
    });
}

// 8. الحصول على اسم الدور
function getRoleName(role) {
    switch (role) {
        case 'admin':
            return 'مدير';
        case 'supervisor':
            return 'مشرف';
        case 'cashier':
            return 'كاشير';
        default:
            return role;
    }
}

// 9. عرض إحصائيات الموظف
function showEmployeeStats(employeeId) {
    const employee = employeeManager.getEmployeeById(employeeId);
    if (!employee) return;
    
    // إنشاء نافذة الإحصائيات إذا لم تكن موجودة
    if (!document.getElementById('employee-stats-modal')) {
        createEmployeeStatsModal();
    }
    
    // تعيين بيانات الموظف
    document.getElementById('stats-employee-name').textContent = employee.name;
    document.getElementById('stats-employee-role').textContent = getRoleName(employee.role);
    
    // تعيين تواريخ افتراضية (الشهر الحالي)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('stats-date-from').valueAsDate = firstDayOfMonth;
    document.getElementById('stats-date-to').valueAsDate = today;
    
    // تحميل الإحصائيات
    loadEmployeeStats(employeeId);
    
    // إضافة مستمعي الأحداث
    document.getElementById('load-employee-stats').addEventListener('click', function() {
        loadEmployeeStats(employeeId);
    });
    
    document.getElementById('close-employee-stats-modal').addEventListener('click', function() {
        document.getElementById('employee-stats-modal').style.display = 'none';
    });
    
    document.getElementById('close-employee-stats').addEventListener('click', function() {
        document.getElementById('employee-stats-modal').style.display = 'none';
    });
    
    document.getElementById('print-employee-stats').addEventListener('click', function() {
        printEmployeeStats(employee.name);
    });
    
    // عرض النافذة
    document.getElementById('employee-stats-modal').style.display = 'flex';
}

// 10. تحميل إحصائيات الموظف
function loadEmployeeStats(employeeId) {
    const dateFrom = document.getElementById('stats-date-from').value;
    const dateTo = document.getElementById('stats-date-to').value;
    
    if (!dateFrom || !dateTo) {
        showNotification('يرجى تحديد نطاق التاريخ', 'error');
        return;
    }
    
    // تعديل تاريخ النهاية ليشمل اليوم كاملاً
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    
    const employee = employeeManager.getEmployeeById(employeeId);
    if (!employee) return;
    
    // البحث عن المبيعات في الفترة المحددة
    let totalSales = 0;
    let ordersCount = 0;
    const salesDetails = [];
    
    if (employee.salesHistory) {
        const startDate = new Date(dateFrom);
        
        employee.salesHistory.forEach(sale => {
            const saleDate = new Date(sale.date);
            if (saleDate >= startDate && saleDate <= endDate) {
                totalSales += sale.amount;
                ordersCount++;
                salesDetails.push(sale);
            }
        });
    }
    
    // تحديث الإحصائيات في الواجهة
    document.getElementById('stats-total-sales').textContent = formatCurrency(totalSales);
    document.getElementById('stats-orders-count').textContent = ordersCount;
    document.getElementById('stats-average-order').textContent = ordersCount > 0 ? 
        formatCurrency(totalSales / ordersCount) : 
        formatCurrency(0);
    
    // عرض تفاصيل المبيعات
    const tbody = document.getElementById('sales-details-list');
    
    if (salesDetails.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا توجد مبيعات في هذه الفترة</td></tr>';
        return;
    }
    
    // ترتيب المبيعات من الأحدث إلى الأقدم
    salesDetails.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    salesDetails.forEach(sale => {
        const saleDate = new Date(sale.date).toLocaleString();
        
        html += `
        <tr>
            <td>${sale.receiptNumber || 'غير متوفر'}</td>
            <td>${saleDate}</td>
            <td>${formatCurrency(sale.amount)}</td>
            <td>${sale.items || 0}</td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
}

// 11. طباعة إحصائيات الموظف
function printEmployeeStats(employeeName) {
    const printWindow = window.open('', '_blank');
    
    const dateFrom = document.getElementById('stats-date-from').value;
    const dateTo = document.getElementById('stats-date-to').value;
    
    const totalSales = document.getElementById('stats-total-sales').textContent;
    const ordersCount = document.getElementById('stats-orders-count').textContent;
    const averageOrder = document.getElementById('stats-average-order').textContent;
    
    // نسخ بيانات الجدول
    const salesTable = document.getElementById('sales-details-list').innerHTML;
    
    // إنشاء محتوى الطباعة
    const printContent = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>تقرير مبيعات ${employeeName}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                direction: rtl;
            }
            h1 {
                text-align: center;
                margin-bottom: 5px;
            }
            .subtitle {
                text-align: center;
                margin-bottom: 20px;
                color: #666;
            }
            .stats-container {
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .stat-item {
                text-align: center;
            }
            .stat-value {
                font-size: 18px;
                font-weight: bold;
                margin: 5px 0;
            }
            .stat-label {
                font-size: 14px;
                color: #666;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: right;
            }
            th {
                background-color: #f2f2f2;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <h1>تقرير مبيعات ${employeeName}</h1>
        <div class="subtitle">الفترة من ${dateFrom} إلى ${dateTo}</div>
        
        <div class="stats-container">
            <div class="stat-item">
                <div class="stat-value">${totalSales}</div>
                <div class="stat-label">إجمالي المبيعات</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${ordersCount}</div>
                <div class="stat-label">عدد الطلبات</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${averageOrder}</div>
                <div class="stat-label">متوسط قيمة الطلب</div>
            </div>
        </div>
        
        <h2>تفاصيل المبيعات</h2>
        <table>
            <thead>
                <tr>
                    <th>رقم الإيصال</th>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>عدد المنتجات</th>
                </tr>
            </thead>
            <tbody>
                ${salesTable}
            </tbody>
        </table>
        
        <div class="footer">
            تم إنشاء هذا التقرير في ${new Date().toLocaleString()}
        </div>
    </body>
    </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // انتظار تحميل المحتوى ثم طباعة
    printWindow.onload = function() {
        printWindow.print();
    };
}

// 12. تعديل بيانات موظف
function editEmployee(employeeId) {
    const employee = employeeManager.getEmployeeById(employeeId);
    if (!employee) return;
    
    // إنشاء نموذج تعديل الموظف
    createEmployeeFormModal(employee);
    
    // عرض النموذج
    document.getElementById('employee-form-modal').style.display = 'flex';
    
    // إضافة مستمعي الأحداث
    document.getElementById('close-employee-form-modal').addEventListener('click', function() {
        document.getElementById('employee-form-modal').remove();
    });
    
    document.getElementById('cancel-employee-form').addEventListener('click', function() {
        document.getElementById('employee-form-modal').remove();
    });
    
    document.getElementById('save-employee').addEventListener('click', function() {
        saveEmployee(employeeId);
    });
}

// 13. تغيير حالة موظف (تفعيل/تعطيل)
function toggleEmployeeStatus(employeeId) {
    const employee = employeeManager.getEmployeeById(employeeId);
    if (!employee) return;
    
    const action = employee.active ? 'تعطيل' : 'تفعيل';
    if (confirm(`هل أنت متأكد من رغبتك في ${action} هذا الموظف؟`)) {
        if (employee.active) {
            employeeManager.deactivateEmployee(employeeId);
            showNotification(`تم تعطيل الموظف ${employee.name} بنجاح`, 'success');
        } else {
            employeeManager.activateEmployee(employeeId);
            showNotification(`تم تفعيل الموظف ${employee.name} بنجاح`, 'success');
        }
        
        // تحديث قائمة الموظفين
        displayEmployees();
    }
}

// 14. إضافة/تعديل موظف
function saveEmployee(employeeId = null) {
    // جمع البيانات من النموذج
    const name = document.getElementById('employee-name').value;
    const username = document.getElementById('employee-username').value;
    const password = document.getElementById('employee-password').value;
    const role = document.getElementById('employee-role').value;
    const phone = document.getElementById('employee-phone').value;
    const email = document.getElementById('employee-email').value;
    
    // التحقق من الحقول المطلوبة
    if (!name || !username) {
        showNotification('يرجى ملء الحقول المطلوبة', 'error');
        return;
    }
    
    // التحقق من تكرار اسم المستخدم
    const existingEmployee = employeeManager.getEmployeeByUsername(username);
    if (existingEmployee && existingEmployee.id !== employeeId) {
        showNotification('اسم المستخدم مستخدم بالفعل', 'error');
        return;
    }
    
    // جمع الصلاحيات
    const permissions = {
        manageSales: document.getElementById('perm-sales').checked,
        manageProducts: document.getElementById('perm-products').checked,
        manageInventory: document.getElementById('perm-inventory').checked,
        manageEmployees: document.getElementById('perm-employees').checked,
        viewReports: document.getElementById('perm-reports').checked,
        applyDiscount: document.getElementById('perm-discount').checked,
        changeSettings: document.getElementById('perm-settings').checked
    };
    
    if (employeeId) {
        // تحديث موظف موجود
        const updatedData = {
            name,
            username,
            role,
            phone,
            email,
            permissions
        };
        
        // تحديث كلمة المرور فقط إذا تم إدخالها
        if (password) {
            updatedData.password = password;
        }
        
        // تحديث الحالة إذا كانت موجودة
        const statusRadios = document.getElementsByName('employee-status');
        if (statusRadios.length > 0) {
            for (const radio of statusRadios) {
                if (radio.checked) {
                    updatedData.active = radio.value === 'active';
                    break;
                }
            }
        }
        
        const updated = employeeManager.updateEmployee(employeeId, updatedData);
        if (updated) {
            showNotification(`تم تحديث بيانات الموظف ${name} بنجاح`, 'success');
            
            // تحديث مؤشر الموظف الحالي إذا كان هو نفس الموظف
            if (employeeManager.currentEmployee && employeeManager.currentEmployee.id === employeeId) {
                updateEmployeeIndicator();
            }
        } else {
            showNotification('حدث خطأ أثناء تحديث بيانات الموظف', 'error');
        }
    } else {
        // إضافة موظف جديد
        if (!password) {
            showNotification('يرجى إدخال كلمة المرور', 'error');
            return;
        }
        
        const employeeData = {
            name,
            username,
            password,
            role,
            phone,
            email,
            permissions
        };
        
        const added = employeeManager.addEmployee(employeeData);
        if (added) {
            showNotification(`تم إضافة الموظف ${name} بنجاح`, 'success');
        } else {
            showNotification('حدث خطأ أثناء إضافة الموظف', 'error');
        }
    }
    
    // إغلاق النموذج
    document.getElementById('employee-form-modal').remove();
    
    // تحديث قائمة الموظفين
    displayEmployees();
}

// 15. عرض نموذج تسجيل الدخول
function showLoginForm() {
    // إنشاء نافذة تسجيل الدخول إذا لم تكن موجودة
    if (!document.getElementById('login-modal')) {
        createLoginModal();
    }
    
    // إضافة مستمعي الأحداث
    document.getElementById('btn-login').addEventListener('click', attemptLogin);
    
    // السماح بتسجيل الدخول باستخدام مفتاح Enter
    document.getElementById('login-password').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            attemptLogin();
        }
    });
    
    // عرض النافذة
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('login-username').focus();
    
    // تعطيل النظام حتى يتم تسجيل الدخول
    disableSystem();
}

// 16. محاولة تسجيل الدخول
function attemptLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        document.getElementById('login-error').textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
        document.getElementById('login-error').style.display = 'block';
        return;
    }
    
    const employee = employeeManager.login(username, password);
    if (employee) {
        // إغلاق نافذة تسجيل الدخول
        document.getElementById('login-modal').style.display = 'none';
        
        // تحديث مؤشر الموظف
        updateEmployeeIndicator();
        
        // تفعيل النظام
        enableSystem();
        
        showNotification(`مرحباً، ${employee.name}!`, 'success');
    } else {
        document.getElementById('login-error').textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        document.getElementById('login-error').style.display = 'block';
    }
}

// 17. تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
        employeeManager.logout();
        showNotification('تم تسجيل الخروج بنجاح', 'success');
        
        // إظهار نافذة تسجيل الدخول
        showLoginForm();
    }
}

// 18. تحديث مؤشر الموظف في الشريط العلوي
function updateEmployeeIndicator() {
    const employee = employeeManager.currentEmployee;
    
    if (employee) {
        document.querySelector('#employee-indicator .employee-name').textContent = employee.name;
        document.querySelector('#employee-indicator .employee-role').textContent = getRoleName(employee.role);
        
        // إخفاء/إظهار خيار إدارة الموظفين حسب الصلاحيات
        if (employee.role === 'admin' || employee.permissions.manageEmployees) {
            document.getElementById('manage-employees').style.display = 'flex';
        } else {
            document.getElementById('manage-employees').style.display = 'none';
        }
    } else {
        document.querySelector('#employee-indicator .employee-name').textContent = 'لم يتم تسجيل الدخول';
        document.querySelector('#employee-indicator .employee-role').textContent = '';
    }
}

// 19. تعطيل النظام
function disableSystem() {
    // إضافة طبقة فوق النظام لمنع التفاعل معه
    const overlay = document.createElement('div');
    overlay.id = 'system-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 900;
    `;
    
    document.body.appendChild(overlay);
}

// 20. تفعيل النظام
function enableSystem() {
    const overlay = document.getElementById('system-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 21. تسجيل عملية بيع للموظف الحالي
// (تعديل دالة إكمال الدفع الموجودة)
const originalCompletePayment = window.completePayment || function(){};
window.completePayment = function() {
    // استدعاء الوظيفة الأصلية
    const result = originalCompletePayment.apply(this, arguments);
    
    // التحقق من وجود موظف مسجل الدخول
    if (employeeManager.currentEmployee) {
        // الحصول على بيانات الدفع
        const totalAmount = getTotalAmount();
        const itemsCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        const receiptNumber = document.getElementById('receipt-number')?.textContent || '';
        
        // تسجيل المبيعات للموظف
        employeeManager.recordSale({
            id: Date.now().toString(),
            amount: totalAmount,
            itemsCount,
            receiptNumber
        });
    }
    
    return result;
};

// 22. إظهار إحصائيات الموظف الحالي
function showCurrentEmployeeStats() {
    if (!employeeManager.currentEmployee) return;
    
    showEmployeeStats(employeeManager.currentEmployee.id);
}

// 23. تهيئة نظام إدارة الموظفين
function initEmployeeSystem() {
    // إنشاء موظفين افتراضيين إذا لم يكن هناك موظفين
    employeeManager.createDefaultEmployees();
    
    // إنشاء واجهات المستخدم
    createEmployeeIndicator();
    createEmployeeManagerModal();
    
    // إضافة مستمعي الأحداث لمؤشر الموظف
    document.getElementById('btn-employee-menu').addEventListener('click', function(event) {
        const menu = document.getElementById('employee-menu');
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        event.stopPropagation();
    });
    
    document.getElementById('view-my-stats').addEventListener('click', function() {
        document.getElementById('employee-menu').style.display = 'none';
        showCurrentEmployeeStats();
    });
    
    document.getElementById('manage-employees').addEventListener('click', function() {
        document.getElementById('employee-menu').style.display = 'none';
        
        document.getElementById('employee-manager-modal').style.display = 'flex';
        displayEmployees();
    });
    
    document.getElementById('logout').addEventListener('click', function() {
        document.getElementById('employee-menu').style.display = 'none';
        logout();
    });
    
    // إضافة مستمعي الأحداث لنافذة إدارة الموظفين
    document.getElementById('close-employee-manager-modal').addEventListener('click', function() {
        document.getElementById('employee-manager-modal').style.display = 'none';
    });
    
    document.getElementById('close-employee-manager').addEventListener('click', function() {
        document.getElementById('employee-manager-modal').style.display = 'none';
    });
    
    document.getElementById('add-new-employee').addEventListener('click', function() {
        // إنشاء نموذج إضافة موظف جديد
        createEmployeeFormModal();
        
        document.getElementById('employee-form-modal').style.display = 'flex';
        
        // إضافة مستمعي الأحداث
        document.getElementById('close-employee-form-modal').addEventListener('click', function() {
            document.getElementById('employee-form-modal').remove();
        });
        
        document.getElementById('cancel-employee-form').addEventListener('click', function() {
            document.getElementById('employee-form-modal').remove();
        });
        
        document.getElementById('save-employee').addEventListener('click', function() {
            saveEmployee();
        });
    });
    
    // إضافة مستمع البحث في الموظفين
    document.getElementById('employee-search').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        const rows = document.querySelectorAll('#employees-list tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    // إخفاء قائمة الموظف عند النقر خارجها
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('employee-menu');
        const button = document.getElementById('btn-employee-menu');
        
        if (menu && menu.style.display === 'block' && !menu.contains(event.target) && event.target !== button) {
            menu.style.display = 'none';
        }
    });
    
    // التحقق من وجود موظف مسجل الدخول
    if (employeeManager.currentEmployee) {
        updateEmployeeIndicator();
    } else {
        // عرض نافذة تسجيل الدخول
        setTimeout(() => {
            showLoginForm();
        }, 500);
    }
}

// تهيئة نظام إدارة الموظفين عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initEmployeeSystem();
});