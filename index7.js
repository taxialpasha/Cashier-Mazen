// نظام إدارة الموظفين للكاشير
// يضاف هذا الملف إلى ملفات JavaScript الأخرى

// 1. إدارة الموظفين
const employeeManager = {
    // قائمة الموظفين
    employees: JSON.parse(localStorage.getItem('pos_employees')) || [],
    
    // الموظف الحالي المسجل دخوله
    currentEmployee: JSON.parse(localStorage.getItem('pos_current_employee')) || null,
    
    // سجلات المبيعات للموظفين
    salesRecords: JSON.parse(localStorage.getItem('pos_employee_sales')) || [],
    
    // إضافة موظف جديد
    addEmployee: function(employeeData) {
        // التحقق من عدم تكرار اسم المستخدم
        if (this.employees.some(emp => emp.username === employeeData.username)) {
            showNotification('اسم المستخدم موجود بالفعل', 'error');
            return false;
        }
        
        // إنشاء الموظف مع معرف فريد ورقم موظف
        const newEmployee = {
            id: Date.now().toString(),
            employeeNumber: this.generateEmployeeNumber(),
            name: employeeData.name,
            username: employeeData.username,
            password: employeeData.password,
            role: employeeData.role || 'cashier',
            phone: employeeData.phone || '',
            address: employeeData.address || '',
            notes: employeeData.notes || '',
            isActive: true,
            creationDate: new Date().toISOString(),
            permissions: this.getDefaultPermissions(employeeData.role)
        };
        
        this.employees.push(newEmployee);
        this.saveEmployees();
        return true;
    },
    
    // تعديل موظف موجود
    updateEmployee: function(employeeId, employeeData) {
        const index = this.employees.findIndex(emp => emp.id === employeeId);
        if (index === -1) return false;
        
        // التحقق من عدم تكرار اسم المستخدم (إذا كان تم تغييره)
        if (employeeData.username !== this.employees[index].username && 
            this.employees.some(emp => emp.username === employeeData.username)) {
            showNotification('اسم المستخدم موجود بالفعل', 'error');
            return false;
        }
        
        // تحديث بيانات الموظف
        this.employees[index] = {
            ...this.employees[index],
            name: employeeData.name,
            username: employeeData.username,
            role: employeeData.role || this.employees[index].role,
            phone: employeeData.phone || this.employees[index].phone,
            address: employeeData.address || this.employees[index].address,
            notes: employeeData.notes || this.employees[index].notes,
            isActive: employeeData.isActive !== undefined ? employeeData.isActive : this.employees[index].isActive,
            permissions: this.getDefaultPermissions(employeeData.role)
        };
        
        // تحديث كلمة المرور إذا تم تقديمها
        if (employeeData.password) {
            this.employees[index].password = employeeData.password;
        }
        
        // تحديث الموظف الحالي إذا كان هو المتأثر
        if (this.currentEmployee && this.currentEmployee.id === employeeId) {
            this.currentEmployee = this.employees[index];
            localStorage.setItem('pos_current_employee', JSON.stringify(this.currentEmployee));
        }
        
        this.saveEmployees();
        return true;
    },
    
    // تغيير حالة موظف (نشط/غير نشط)
    toggleEmployeeStatus: function(employeeId) {
        const index = this.employees.findIndex(emp => emp.id === employeeId);
        if (index === -1) return false;
        
        this.employees[index].isActive = !this.employees[index].isActive;
        
        // تسجيل خروج الموظف إذا تم تعطيله وكان مسجل دخوله
        if (!this.employees[index].isActive && this.currentEmployee && this.currentEmployee.id === employeeId) {
            this.logoutCurrentEmployee();
        }
        
        this.saveEmployees();
        return true;
    },
    
    // البحث عن موظفين
    searchEmployees: function(searchTerm = '') {
        if (!searchTerm) return this.employees;
        
        searchTerm = searchTerm.toLowerCase();
        
        return this.employees.filter(emp => 
            emp.name.toLowerCase().includes(searchTerm) ||
            emp.username.toLowerCase().includes(searchTerm) ||
            emp.employeeNumber.includes(searchTerm) ||
            (emp.phone && emp.phone.includes(searchTerm))
        );
    },
    
    // الحصول على موظف بالمعرف
    getEmployeeById: function(employeeId) {
        return this.employees.find(emp => emp.id === employeeId);
    },
    
    // تسجيل دخول موظف
    loginEmployee: function(username, password) {
        const employee = this.employees.find(emp => 
            emp.username === username && 
            emp.password === password &&
            emp.isActive
        );
        
        if (employee) {
            this.currentEmployee = employee;
            localStorage.setItem('pos_current_employee', JSON.stringify(employee));
            return employee;
        }
        
        return null;
    },
    
    // تسجيل خروج الموظف الحالي
    logoutCurrentEmployee: function() {
        this.currentEmployee = null;
        localStorage.removeItem('pos_current_employee');
        return true;
    },
    
    // إضافة سجل بيع للموظف الحالي
    addSaleRecord: function(saleData) {
        if (!this.currentEmployee) return false;
        
        const saleRecord = {
            id: Date.now().toString(),
            employeeId: this.currentEmployee.id,
            employeeName: this.currentEmployee.name,
            timestamp: new Date().toISOString(),
            ...saleData
        };
        
        this.salesRecords.push(saleRecord);
        this.saveSalesRecords();
        return true;
    },
    
    // الحصول على سجلات مبيعات موظف محدد
    getEmployeeSales: function(employeeId, startDate, endDate) {
        let salesRecords = this.salesRecords;
        
        // تطبيق تصفية حسب معرف الموظف
        if (employeeId && employeeId !== 'all') {
            salesRecords = salesRecords.filter(record => record.employeeId === employeeId);
        }
        
        // تطبيق تصفية حسب النطاق الزمني
        if (startDate) {
            const start = new Date(startDate);
            salesRecords = salesRecords.filter(record => new Date(record.timestamp) >= start);
        }
        
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // نهاية اليوم
            salesRecords = salesRecords.filter(record => new Date(record.timestamp) <= end);
        }
        
        return salesRecords;
    },
    
    // الحصول على تقرير أداء الموظفين
    getEmployeePerformanceReport: function(startDate, endDate) {
        // جمع بيانات المبيعات حسب الفترة المحددة
        const salesRecords = this.getEmployeeSales(null, startDate, endDate);
        
        // إنشاء قاموس لتجميع إحصائيات كل موظف
        const employeeStats = {};
        
        // تجميع بيانات كل موظف
        salesRecords.forEach(record => {
            if (!employeeStats[record.employeeId]) {
                // الحصول على بيانات الموظف
                const employee = this.getEmployeeById(record.employeeId) || { 
                    id: record.employeeId,
                    name: record.employeeName || 'موظف غير معروف',
                    role: 'غير محدد'
                };
                
                employeeStats[record.employeeId] = {
                    id: employee.id,
                    name: employee.name,
                    role: employee.role,
                    totalSales: 0,
                    receiptCount: 0,
                    averageReceipt: 0
                };
            }
            
            // إضافة بيانات المبيعات
            employeeStats[record.employeeId].totalSales += record.total;
            employeeStats[record.employeeId].receiptCount += 1;
        });
        
        // حساب المتوسطات
        Object.values(employeeStats).forEach(stats => {
            stats.averageReceipt = stats.receiptCount > 0 ? 
                stats.totalSales / stats.receiptCount : 0;
        });
        
        // تحويل القاموس إلى مصفوفة
        return Object.values(employeeStats);
    },
    
    // التحقق من صلاحيات الموظف الحالي
    currentEmployeeHasPermission: function(permission) {
        if (!this.currentEmployee) return false;
        
        return this.currentEmployee.permissions[permission] === true;
    },
    
    // الحصول على الصلاحيات الافتراضية حسب دور الموظف
    getDefaultPermissions: function(role) {
        const basePermissions = {
            sell: false,              // إجراء عمليات البيع
            apply_discount: false,    // تطبيق الخصومات
            cancel_order: false,      // إلغاء الطلبات
            manage_products: false,   // إدارة المنتجات
            manage_inventory: false,  // إدارة المخزون
            reports: false,           // الوصول إلى التقارير
            manage_employees: false,  // إدارة الموظفين
            settings: false           // تعديل إعدادات النظام
        };
        
        switch (role) {
            case 'admin':
                // المسؤول لديه جميع الصلاحيات
                Object.keys(basePermissions).forEach(key => {
                    basePermissions[key] = true;
                });
                break;
                
            case 'manager':
                basePermissions.sell = true;
                basePermissions.apply_discount = true;
                basePermissions.cancel_order = true;
                basePermissions.manage_products = true;
                basePermissions.manage_inventory = true;
                basePermissions.reports = true;
                basePermissions.manage_employees = true;
                break;
                
            case 'supervisor':
                basePermissions.sell = true;
                basePermissions.apply_discount = true;
                basePermissions.cancel_order = true;
                basePermissions.manage_inventory = true;
                basePermissions.reports = true;
                break;
                
            case 'cashier':
                basePermissions.sell = true;
                break;
        }
        
        return basePermissions;
    },
    
    // إنشاء رقم موظف جديد
    generateEmployeeNumber: function() {
        // البحث عن أكبر رقم موظف موجود
        let maxNumber = 1000; // البداية الافتراضية
        
        this.employees.forEach(emp => {
            const empNumber = parseInt(emp.employeeNumber);
            if (!isNaN(empNumber) && empNumber > maxNumber) {
                maxNumber = empNumber;
            }
        });
        
        // إنشاء رقم جديد (الرقم التالي)
        return (maxNumber + 1).toString();
    },
    
    // حفظ بيانات الموظفين في التخزين المحلي
    saveEmployees: function() {
        localStorage.setItem('pos_employees', JSON.stringify(this.employees));
    },
    
    // حفظ سجلات المبيعات في التخزين المحلي
    saveSalesRecords: function() {
        localStorage.setItem('pos_employee_sales', JSON.stringify(this.salesRecords));
    }
};

// 2. إنشاء واجهة المستخدم لإدارة الموظفين

// إنشاء مؤشر الموظف الحالي
function createCurrentEmployeeIndicator() {
    const header = document.querySelector('.header');
    const employeeIndicator = document.createElement('div');
    
    employeeIndicator.id = 'current-employee-indicator';
    employeeIndicator.style.cssText = `
        display: none;
        flex-direction: column;
        align-items: center;
        margin-left: 20px;
        background-color: rgba(255, 255, 255, 0.1);
        padding: 5px 15px;
        border-radius: 5px;
        cursor: pointer;
    `;
    
    employeeIndicator.innerHTML = `
        <div style="font-size: 12px; color: #ddd;">الموظف الحالي</div>
        <div style="display: flex; align-items: center;">
            <i class="fas fa-user" style="margin-left: 8px;"></i>
            <span id="current-employee-name" style="font-weight: bold;"></span>
            <button id="employee-logout-btn" style="background: none; border: none; color: #e74c3c; margin-right: 8px; cursor: pointer;">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        </div>
    `;
    
    // إضافة المؤشر إلى الترويسة
    header.insertBefore(employeeIndicator, header.firstChild);
    
    // إضافة CSS للنوافذ المنبثقة
    const employeeStyles = `
    <style>
        /* نمط شارة الموظف */
        .employee-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 15px;
            font-size: 12px;
            color: white;
            margin-right: 5px;
        }
        .employee-admin {
            background-color: #e74c3c;
        }
        .employee-manager {
            background-color: #3498db;
        }
        .employee-supervisor {
            background-color: #2ecc71;
        }
        .employee-cashier {
            background-color: #f39c12;
        }
        
        /* نوافذ الموظفين */
        #login-modal .modal-content {
            max-width: 400px;
        }
        #employee-form-modal .modal-content {
            max-width: 600px;
        }
        #employee-reports-modal .modal-content {
            width: 90%;
            max-width: 1200px;
        }
        .custom-date-range {
            display: none;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
        }
        #employee-sales-details {
            display: none;
            margin-top: 30px;
        }
        #employee-performance-chart {
            width: 100%;
            height: 300px;
            margin-top: 20px;
        }
        #login-error {
            color: #e74c3c;
            margin-top: 10px;
            display: none;
        }
    </style>`;
    
    document.head.insertAdjacentHTML('beforeend', employeeStyles);
}

// إضافة زر إدارة الموظفين إلى قائمة الإعدادات
function addEmployeeManagementButton() {
    // البحث عن تبويب المستخدمين في الإعدادات
    const usersSettingsTab = document.getElementById('users-settings');
    
    if (usersSettingsTab) {
        const manageEmployeesButton = document.createElement('button');
        manageEmployeesButton.id = 'manage-employees-btn';
        manageEmployeesButton.classList.add('btn', 'btn-primary');
        manageEmployeesButton.style.marginTop = '15px';
        manageEmployeesButton.innerHTML = '<i class="fas fa-users"></i> إدارة الموظفين';
        
        // إضافة المستمع للزر
        manageEmployeesButton.addEventListener('click', function() {
            // تأكد أن المستخدم الحالي لديه صلاحية إدارة الموظفين
            if (employeeManager.currentEmployeeHasPermission('manage_employees')) {
                openEmployeeManagementModal();
            } else {
                showNotification('ليس لديك صلاحية إدارة الموظفين', 'error');
            }
        });
        
        usersSettingsTab.appendChild(manageEmployeesButton);
    }
}

// 3. إنشاء النوافذ المنبثقة

// إنشاء نافذة تسجيل الدخول
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
                    <input type="text" class="form-control" id="login-username" placeholder="أدخل اسم المستخدم">
                </div>
                <div class="form-group">
                    <label for="login-password">كلمة المرور</label>
                    <input type="password" class="form-control" id="login-password" placeholder="أدخل كلمة المرور">
                </div>
                <div id="login-error"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="login-button">تسجيل الدخول</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// إنشاء نافذة إدارة الموظفين
function createEmployeeManagementModal() {
    const modalHtml = `
    <div class="modal" id="employee-management-modal">
        <div class="modal-content" style="width: 80%; max-width: 1000px;">
            <div class="modal-header">
                <h2>إدارة الموظفين</h2>
                <button class="modal-close" id="close-employee-management-modal">&times;</button>
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
                            <th>رقم الموظف</th>
                            <th>الاسم</th>
                            <th>اسم المستخدم</th>
                            <th>الوظيفة</th>
                            <th>رقم الهاتف</th>
                            <th>تاريخ التعيين</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="employees-list">
                        <!-- سيتم إضافة الموظفين هنا عن طريق JavaScript -->
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="add-new-employee">
                    <i class="fas fa-plus"></i>
                    إضافة موظف جديد
                </button>
                <button class="btn" id="close-employee-management">إغلاق</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// إنشاء نافذة إضافة/تعديل موظف
function createEmployeeFormModal(employee = null) {
    const isEdit = employee !== null;
    
    const modalHtml = `
    <div class="modal" id="employee-form-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>${isEdit ? 'تعديل الموظف' : 'إضافة موظف جديد'}</h2>
                <button class="modal-close" id="close-employee-form-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="employee-name">اسم الموظف</label>
                    <input type="text" class="form-control" id="employee-name" value="${isEdit ? employee.name : ''}">
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
                            <label for="employee-password">كلمة المرور ${isEdit ? '(اتركها فارغة للاحتفاظ بالحالية)' : ''}</label>
                            <input type="password" class="form-control" id="employee-password">
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="employee-role">الوظيفة</label>
                            <select class="form-control" id="employee-role">
                                <option value="cashier" ${isEdit && employee.role === 'cashier' ? 'selected' : ''}>كاشير</option>
                                <option value="supervisor" ${isEdit && employee.role === 'supervisor' ? 'selected' : ''}>مشرف</option>
                                <option value="manager" ${isEdit && employee.role === 'manager' ? 'selected' : ''}>مدير</option>
                                <option value="admin" ${isEdit && employee.role === 'admin' ? 'selected' : ''}>مسؤول النظام</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="employee-phone">رقم الهاتف</label>
                            <input type="text" class="form-control" id="employee-phone" value="${isEdit ? employee.phone || '' : ''}">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="employee-address">العنوان</label>
                    <input type="text" class="form-control" id="employee-address" value="${isEdit ? employee.address || '' : ''}">
                </div>
                <div class="form-group">
                    <label for="employee-notes">ملاحظات</label>
                    <textarea class="form-control" id="employee-notes" rows="2">${isEdit ? employee.notes || '' : ''}</textarea>
                </div>
                ${isEdit ? `
                <div class="form-group">
                    <label><input type="checkbox" id="employee-active" ${employee.isActive ? 'checked' : ''}> الموظف نشط</label>
                </div>` : ''}
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

// إنشاء نافذة تقارير أداء الموظفين
function createEmployeeReportsModal() {
    const modalHtml = `
    <div class="modal" id="employee-reports-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>تقارير أداء الموظفين</h2>
                <button class="modal-close" id="close-employee-reports-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="report-period">الفترة الزمنية</label>
                            <select class="form-control" id="report-period">
                                <option value="today">اليوم</option>
                                <option value="yesterday">الأمس</option>
                                <option value="thisWeek">هذا الأسبوع</option>
                                <option value="lastWeek">الأسبوع الماضي</option>
                                <option value="thisMonth" selected>هذا الشهر</option>
                                <option value="lastMonth">الشهر الماضي</option>
                                <option value="custom">تحديد فترة مخصصة</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="report-employee">الموظف</label>
                            <select class="form-control" id="report-employee">
                                <option value="all" selected>جميع الموظفين</option>
                                <!-- سيتم إضافة الموظفين هنا عن طريق JavaScript -->
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="custom-date-range">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="report-start-date">من تاريخ</label>
                            <input type="date" class="form-control" id="report-start-date">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="report-end-date">إلى تاريخ</label>
                            <input type="date" class="form-control" id="report-end-date">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <button class="btn btn-primary" id="apply-custom-date" style="width: 100%;">تطبيق</button>
                        </div>
                    </div>
                </div>
                
                <div class="form-row" style="margin-top: 20px;">
                    <div class="report-card" style="flex: 1;">
                        <div class="report-title">إجمالي المبيعات</div>
                        <div class="report-content">
                            <div class="report-value" id="employee-total-sales">0 د.ع</div>
                            <div class="report-icon"><i class="fas fa-cash-register"></i></div>
                        </div>
                    </div>
                    <div class="report-card" style="flex: 1;">
                        <div class="report-title">عدد الفواتير</div>
                        <div class="report-content">
                            <div class="report-value" id="employee-receipt-count">0</div>
                            <div class="report-icon"><i class="fas fa-receipt"></i></div>
                        </div>
                    </div>
                    <div class="report-card" style="flex: 1;">
                        <div class="report-title">متوسط قيمة الفاتورة</div>
                        <div class="report-content">
                            <div class="report-value" id="employee-average-receipt">0 د.ع</div>
                            <div class="report-icon"><i class="fas fa-calculator"></i></div>
                        </div>
                    </div>
                </div>
                
                <div class="report-card" style="margin-top: 20px;">
                    <div class="report-title">أداء الموظفين</div>
                    <table class="inventory-list">
                        <thead>
                            <tr>
                                <th>الموظف</th>
                                <th>الوظيفة</th>
                                <th>عدد الفواتير</th>
                                <th>إجمالي المبيعات</th>
                                <th>متوسط قيمة الفاتورة</th>
                                <th>النسبة من الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody id="employee-performance-list">
                            <!-- سيتم إضافة بيانات أداء الموظفين هنا عن طريق JavaScript -->
                        </tbody>
                    </table>
                </div>
                
                <canvas id="employee-performance-chart"></canvas>
                
                <div id="employee-sales-details">
                    <h3>تفاصيل مبيعات <span id="sales-detail-employee-name"></span></h3>
                    <table class="inventory-list">
                        <thead>
                            <tr>
                                <th>رقم الفاتورة</th>
                                <th>الوقت والتاريخ</th>
                                <th>عدد العناصر</th>
                                <th>الإجمالي</th>
                                <th>طريقة الدفع</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="employee-sales-list">
                            <!-- سيتم إضافة مبيعات الموظف هنا عن طريق JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="print-employee-report">
                    <i class="fas fa-print"></i>
                    طباعة التقرير
                </button>
                <button class="btn btn-primary" id="export-employee-report">
                    <i class="fas fa-file-export"></i>
                    تصدير التقرير
                </button>
                <button class="btn" id="close-employee-reports">إغلاق</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}