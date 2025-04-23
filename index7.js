// نظام إدارة الموظفين للكاشير
// يضاف هذا الملف كجزء من نظام الكاشير

// 1. إدارة الموظفين
const employeeManager = {
    // قائمة الموظفين
    employees: JSON.parse(localStorage.getItem('pos_employees')) || [],
    
    // الموظف الحالي المسجل دخوله
    currentEmployee: JSON.parse(localStorage.getItem('pos_current_employee')) || null,
    
    // إضافة موظف جديد
    addEmployee: function(employeeData) {
        // التحقق من وجود اسم مستخدم مكرر
        if (this.employees.some(e => e.username === employeeData.username)) {
            console.error('اسم المستخدم موجود بالفعل');
            return false;
        }
        
        // إنشاء معرف فريد وتاريخ الإنشاء
        const newEmployee = {
            id: Date.now().toString(),
            employeeNumber: this.generateEmployeeNumber(),
            creationDate: new Date().toISOString(),
            isActive: true,
            permissions: this.getDefaultPermissions(employeeData.role),
            salesHistory: [],
            ...employeeData
        };
        
        this.employees.push(newEmployee);
        this.saveEmployees();
        return newEmployee;
    },
    
    // تحديث بيانات موظف
    updateEmployee: function(employeeId, employeeData) {
        const index = this.employees.findIndex(e => e.id === employeeId);
        if (index === -1) return false;
        
        // التحقق من تكرار اسم المستخدم
        if (employeeData.username && 
            employeeData.username !== this.employees[index].username &&
            this.employees.some(e => e.username === employeeData.username)) {
            console.error('اسم المستخدم موجود بالفعل');
            return false;
        }
        
        // تحديث البيانات
        this.employees[index] = {
            ...this.employees[index],
            ...employeeData
        };
        
        // تحديث الموظف الحالي إذا كان هو المحدث
        if (this.currentEmployee && this.currentEmployee.id === employeeId) {
            this.currentEmployee = this.employees[index];
            localStorage.setItem('pos_current_employee', JSON.stringify(this.currentEmployee));
        }
        
        this.saveEmployees();
        return this.employees[index];
    },
    
    // تغيير حالة موظف (نشط/غير نشط)
    toggleEmployeeStatus: function(employeeId) {
        const index = this.employees.findIndex(e => e.id === employeeId);
        if (index === -1) return false;
        
        this.employees[index].isActive = !this.employees[index].isActive;
        
        // تسجيل خروج الموظف الحالي إذا تم تعطيله
        if (!this.employees[index].isActive && this.currentEmployee && this.currentEmployee.id === employeeId) {
            this.logoutCurrentEmployee();
        }
        
        this.saveEmployees();
        return true;
    },
    
    // محاولة تسجيل دخول موظف
    loginEmployee: function(username, password) {
        const employee = this.employees.find(e => 
            e.username === username && 
            e.password === password &&
            e.isActive
        );
        
        if (employee) {
            this.currentEmployee = { ...employee };
            localStorage.setItem('pos_current_employee', JSON.stringify(this.currentEmployee));
            
            // تسجيل وقت تسجيل الدخول
            const loginTime = new Date().toISOString();
            this.updateEmployee(employee.id, { lastLogin: loginTime });
        }
        
        return employee;
    },
    
    // تسجيل خروج الموظف الحالي
    logoutCurrentEmployee: function() {
        if (this.currentEmployee) {
            // تسجيل وقت تسجيل الخروج
            const logoutTime = new Date().toISOString();
            this.updateEmployee(this.currentEmployee.id, { lastLogout: logoutTime });
            
            // تسجيل خروج
            this.currentEmployee = null;
            localStorage.removeItem('pos_current_employee');
            return true;
        }
        return false;
    },
    
    // البحث عن موظفين
    searchEmployees: function(searchTerm = '') {
        if (!searchTerm) return [...this.employees];
        
        searchTerm = searchTerm.toLowerCase();
        return this.employees.filter(employee => 
            employee.name.toLowerCase().includes(searchTerm) ||
            employee.username.toLowerCase().includes(searchTerm) ||
            employee.employeeNumber.includes(searchTerm) ||
            (employee.phone && employee.phone.includes(searchTerm))
        );
    },
    
    // الحصول على موظف حسب المعرف
    getEmployeeById: function(employeeId) {
        return this.employees.find(e => e.id === employeeId);
    },
    
    // تسجيل عملية بيع للموظف الحالي
    addSaleRecord: function(saleData) {
        if (!this.currentEmployee) return false;
        
        const employeeIndex = this.employees.findIndex(e => e.id === this.currentEmployee.id);
        if (employeeIndex === -1) return false;
        
        // إضافة سجل البيع
        if (!this.employees[employeeIndex].salesHistory) {
            this.employees[employeeIndex].salesHistory = [];
        }
        
        const saleRecord = {
            ...saleData,
            employeeId: this.currentEmployee.id,
            timestamp: new Date().toISOString()
        };
        
        this.employees[employeeIndex].salesHistory.push(saleRecord);
        this.saveEmployees();
        return true;
    },
    
    // الحصول على تقرير أداء الموظفين
    getEmployeePerformanceReport: function(startDate, endDate) {
        // تحويل التواريخ إلى كائنات Date
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // تعيين نهاية اليوم
        
        const report = [];
        
        this.employees.forEach(employee => {
            if (!employee.isActive) return; // تجاهل الموظفين غير النشطين
            
            // فلترة المبيعات حسب الفترة الزمنية
            const sales = (employee.salesHistory || []).filter(sale => {
                const saleDate = new Date(sale.timestamp);
                return saleDate >= start && saleDate <= end;
            });
            
            // حساب الإحصائيات
            const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
            const receiptCount = sales.length;
            const averageReceipt = receiptCount > 0 ? totalSales / receiptCount : 0;
            
            report.push({
                id: employee.id,
                name: employee.name,
                role: employee.role,
                totalSales,
                receiptCount,
                averageReceipt
            });
        });
        
        // ترتيب التقرير حسب إجمالي المبيعات (تنازلياً)
        return report.sort((a, b) => b.totalSales - a.totalSales);
    },
    
    // الحصول على مبيعات موظف محدد
    getEmployeeSales: function(employeeId, startDate, endDate) {
        const employee = this.getEmployeeById(employeeId);
        if (!employee || !employee.salesHistory) return [];
        
        // تحويل التواريخ إلى كائنات Date
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // تعيين نهاية اليوم
        
        // فلترة المبيعات حسب الفترة الزمنية
        return employee.salesHistory.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            return saleDate >= start && saleDate <= end;
        });
    },
    
    // التحقق من صلاحيات الموظف الحالي
    currentEmployeeHasPermission: function(permission) {
        if (!this.currentEmployee) return false;
        return this.currentEmployee.permissions && this.currentEmployee.permissions[permission];
    },
    
    // حفظ بيانات الموظفين
    saveEmployees: function() {
        localStorage.setItem('pos_employees', JSON.stringify(this.employees));
    },
    
    // إنشاء رقم موظف فريد
    generateEmployeeNumber: function() {
        // البحث عن أكبر رقم موظف حالي
        const numbers = this.employees.map(e => parseInt(e.employeeNumber.substring(3)));
        const maxNum = Math.max(0, ...numbers);
        
        // إنشاء رقم جديد
        return 'EMP' + (maxNum + 1).toString().padStart(3, '0');
    },
    
    // الحصول على الصلاحيات الافتراضية حسب دور الموظف
    getDefaultPermissions: function(role) {
        switch (role) {
            case 'admin':
                return {
                    manage_products: true,
                    manage_inventory: true,
                    manage_categories: true,
                    process_sales: true,
                    process_returns: true,
                    apply_discounts: true,
                    reports: true,
                    manage_employees: true,
                    settings: true,
                    manage_customers: true
                };
            case 'manager':
                return {
                    manage_products: true,
                    manage_inventory: true,
                    manage_categories: true,
                    process_sales: true,
                    process_returns: true,
                    apply_discounts: true,
                    reports: true,
                    manage_employees: true,
                    settings: false,
                    manage_customers: true
                };
            case 'supervisor':
                return {
                    manage_products: true,
                    manage_inventory: true,
                    manage_categories: false,
                    process_sales: true,
                    process_returns: true,
                    apply_discounts: true,
                    reports: true,
                    manage_employees: false,
                    settings: false,
                    manage_customers: true
                };
            case 'cashier':
            default:
                return {
                    manage_products: false,
                    manage_inventory: false,
                    manage_categories: false,
                    process_sales: true,
                    process_returns: false,
                    apply_discounts: false,
                    reports: false,
                    manage_employees: false,
                    settings: false,
                    manage_customers: true
                };
        }
    }
};

// 2. إضافة مؤشر الموظف الحالي إلى واجهة المستخدم
function createCurrentEmployeeIndicator() {
    // إنشاء العنصر
    const indicator = document.createElement('div');
    indicator.id = 'current-employee-indicator';
    indicator.className = 'current-employee';
    indicator.style.display = 'none'; // سيتم إظهاره عند تسجيل الدخول
    
    indicator.innerHTML = `
        <div class="employee-info">
            <i class="fas fa-user-circle"></i>
            <span id="current-employee-name"></span>
        </div>
        <button id="employee-logout-btn" title="تسجيل الخروج">
            <i class="fas fa-sign-out-alt"></i>
        </button>
    `;
    
    // إضافة CSS خاص بمؤشر الموظف
    const style = document.createElement('style');
    style.textContent = `
        .current-employee {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: #f0f2f5;
            padding: 5px 10px;
            border-radius: 5px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .employee-info {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        #employee-logout-btn {
            border: none;
            background: none;
            color: #e74c3c;
            cursor: pointer;
            font-size: 16px;
        }
        
        #employee-logout-btn:hover {
            color: #c0392b;
        }
    `;
    
    document.head.appendChild(style);
    
    // إضافة العنصر في بداية السلة
    const cart = document.querySelector('.cart');
    cart.insertBefore(indicator, cart.firstChild);
}

// 3. إنشاء واجهة مستخدم نافذة تسجيل الدخول
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
                <div class="alert alert-danger" id="login-error" style="display: none; color: #e74c3c; margin-top: 10px; padding: 10px; border: 1px solid #e74c3c; border-radius: 5px;"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="login-button">تسجيل الدخول</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 4. إنشاء واجهة مستخدم نافذة إدارة الموظفين
function createEmployeeManagementModal() {
    const modalHtml = `
    <div class="modal" id="employee-management-modal">
        <div class="modal-content" style="width: 80%; max-width: 1200px;">
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
                        <!-- ستتم إضافة الموظفين هنا بواسطة JavaScript -->
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

// 5. إنشاء واجهة مستخدم نموذج إضافة/تعديل موظف
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
                <div class="form-group">
                    <label for="employee-name">اسم الموظف</label>
                    <input type="text" class="form-control" id="employee-name" value="${isEdit ? employee.name : ''}">
                </div>
                <div class="form-group">
                    <label for="employee-username">اسم المستخدم</label>
                    <input type="text" class="form-control" id="employee-username" value="${isEdit ? employee.username : ''}">
                </div>
                <div class="form-group">
                    <label for="employee-password">كلمة المرور</label>
                    <input type="password" class="form-control" id="employee-password" placeholder="${isEdit ? '●●●●●●●● (تُرك فارغة للاحتفاظ بنفس كلمة المرور)' : 'أدخل كلمة المرور'}">
                </div>
                <div class="form-group">
                    <label for="employee-role">الوظيفة</label>
                    <select class="form-control" id="employee-role">
                        <option value="cashier" ${isEdit && employee.role === 'cashier' ? 'selected' : ''}>كاشير</option>
                        <option value="supervisor" ${isEdit && employee.role === 'supervisor' ? 'selected' : ''}>مشرف</option>
                        <option value="manager" ${isEdit && employee.role === 'manager' ? 'selected' : ''}>مدير</option>
                        <option value="admin" ${isEdit && employee.role === 'admin' ? 'selected' : ''}>مسؤول النظام</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="employee-phone">رقم الهاتف</label>
                    <input type="text" class="form-control" id="employee-phone" value="${isEdit && employee.phone ? employee.phone : ''}">
                </div>
                <div class="form-group">
                    <label for="employee-address">العنوان</label>
                    <textarea class="form-control" id="employee-address" rows="2">${isEdit && employee.address ? employee.address : ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="employee-notes">ملاحظات</label>
                    <textarea class="form-control" id="employee-notes" rows="2">${isEdit && employee.notes ? employee.notes : ''}</textarea>
                </div>
                ${isEdit ? `
                <div class="form-group">
                    <label><input type="checkbox" id="employee-active" ${employee.isActive ? 'checked' : ''}> نشط</label>
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

// 6. إنشاء واجهة مستخدم نافذة تقارير أداء الموظفين
function createEmployeeReportsModal() {
    const modalHtml = `
    <div class="modal" id="employee-reports-modal">
        <div class="modal-content" style="width: 80%; max-width: 1200px;">
            <div class="modal-header">
                <h2>تقارير أداء الموظفين</h2>
                <button class="modal-close" id="close-employee-reports-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="report-employee">الموظف</label>
                            <select class="form-control" id="report-employee">
                                <option value="all">جميع الموظفين</option>
                                <!-- ستتم إضافة الموظفين هنا بواسطة JavaScript -->
                            </select>
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="report-period">الفترة الزمنية</label>
                            <select class="form-control" id="report-period">
                                <option value="today">اليوم</option>
                                <option value="yesterday">أمس</option>
                                <option value="thisWeek">هذا الأسبوع</option>
                                <option value="lastWeek">الأسبوع الماضي</option>
                                <option value="thisMonth">هذا الشهر</option>
                                <option value="lastMonth">الشهر الماضي</option>
                                <option value="custom">تحديد فترة مخصصة</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="form-row custom-date-range" style="display: none;">
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
                
                <div class="form-row">
                    <div class="report-card" style="flex: 1;">
                        <div class="report-title">إجمالي المبيعات</div>
                        <div class="report-content">
                            <div class="report-value" id="employee-total-sales">0 د.ع</div>
                            <div class="report-icon"><i class="fas fa-money-bill-wave"></i></div>
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
                            <div class="report-icon"><i class="fas fa-chart-line"></i></div>
                        </div>
                    </div>
                </div>
                
                <div class="report-card">
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
                            <!-- ستتم إضافة بيانات الأداء هنا بواسطة JavaScript -->
                        </tbody>
                    </table>
                </div>
                
                <div class="report-card">
                    <div class="report-title">رسم بياني لأداء الموظفين</div>
                    <canvas id="employee-performance-chart" width="800" height="300"></canvas>
                </div>
                
                <div class="report-card" id="employee-sales-details" style="display: none;">
                    <div class="report-title">تفاصيل مبيعات <span id="sales-detail-employee-name"></span></div>
                    <table class="inventory-list">
                        <thead>
                            <tr>
                                <th>رقم الفاتورة</th>
                                <th>التاريخ</th>
                                <th>عدد العناصر</th>
                                <th>المبلغ</th>
                                <th>طريقة الدفع</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="employee-sales-list">
                            <!-- ستتم إضافة تفاصيل المبيعات هنا بواسطة JavaScript -->
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

// 7. إضافة زر إدارة الموظفين إلى قائمة الإعدادات
function addEmployeeManagementButton() {
    // البحث عن علامة تبويب المستخدمين في الإعدادات
    const usersSettingsTab = document.getElementById('users-settings');
    if (!usersSettingsTab) return;
    
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

// 8. إضافة زر تقارير الموظفين إلى قائمة التقارير
function addEmployeeReportsButton() {
const reportsModalFooter = document.querySelector('#reports-modal .modal-footer');

if (reportsModalFooter) {
    const employeeReportsButton = document.createElement('button');
    employeeReportsButton.id = 'employee-reports-btn';
    employeeReportsButton.classList.add('btn', 'btn-primary');
    employeeReportsButton.innerHTML = '<i class="fas fa-user-chart"></i> تقارير الموظفين';
    
    // إضافة المستمع للزر
    employeeReportsButton.addEventListener('click', function() {
        // تأكد أن المستخدم الحالي لديه صلاحية عرض التقارير
        if (employeeManager.currentEmployeeHasPermission('reports')) {
            openEmployeeReportsModal();
        } else {
            showNotification('ليس لديك صلاحية عرض تقارير الموظفين', 'error');
        }
    });
    
    // إضافة الزر قبل زر الإغلاق
    reportsModalFooter.insertBefore(employeeReportsButton, document.getElementById('close-reports'));
}
}

// 9. تعديل وظيفة إتمام الدفع لتسجيل الموظف الذي قام بالبيع
const originalCompletePayment = window.completePayment || function(){};
window.completePayment = function() {
// استدعاء الوظيفة الأصلية
const result = originalCompletePayment.apply(this, arguments);

// إضافة سجل البيع للموظف الحالي
if (employeeManager.currentEmployee) {
    const receiptNumber = document.getElementById('receipt-number').textContent;
    const items = Array.from(document.querySelectorAll('#receipt-items .receipt-item')).length;
    const total = getTotalAmount();
    const subtotal = getSubtotalAmount();
    const tax = getTaxAmount();
    const discount = getDiscountAmount();
    const paymentMethod = document.getElementById('receipt-payment-method').textContent;
    
    // إنشاء كائن البيع
    const sale = {
        receiptNumber,
        items,
        total,
        subtotal,
        tax,
        discount,
        paymentMethod,
        date: new Date().toISOString()
    };
    
    // تسجيل البيع
    employeeManager.addSaleRecord(sale);
}

return result;
};

// 10. فتح نافذة تسجيل الدخول
function openLoginModal() {
// إنشاء النافذة إذا لم تكن موجودة
if (!document.getElementById('login-modal')) {
    createLoginModal();
    
    // إضافة مستمعي الأحداث للنموذج
    document.getElementById('login-button').addEventListener('click', attemptLogin);
    document.getElementById('login-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });
}

// عرض النافذة
document.getElementById('login-modal').style.display = 'flex';
document.getElementById('login-username').focus();
}

// 11. محاولة تسجيل الدخول
function attemptLogin() {
const username = document.getElementById('login-username').value;
const password = document.getElementById('login-password').value;

// التحقق من البيانات
if (!username || !password) {
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-error').textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
    return;
}

// محاولة تسجيل الدخول
const employee = employeeManager.loginEmployee(username, password);

if (employee) {
    // نجاح تسجيل الدخول
    document.getElementById('login-modal').style.display = 'none';
    
    // عرض معلومات الموظف في الواجهة
    updateCurrentEmployeeUI();
    
    showNotification(`مرحباً بك ${employee.name}!`, 'success');
} else {
    // فشل تسجيل الدخول
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-error').textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
}
}

// 12. تسجيل خروج الموظف الحالي
function logoutCurrentEmployee() {
if (employeeManager.logoutCurrentEmployee()) {
    // تحديث واجهة المستخدم
    updateCurrentEmployeeUI();
    
    // إظهار نافذة تسجيل الدخول مرة أخرى
    openLoginModal();
}
}

// 13. تحديث واجهة المستخدم بناءً على الموظف الحالي
function updateCurrentEmployeeUI() {
const indicator = document.getElementById('current-employee-indicator');
const nameElement = document.getElementById('current-employee-name');

if (employeeManager.currentEmployee) {
    // عرض مؤشر الموظف
    indicator.style.display = 'flex';
    nameElement.textContent = employeeManager.currentEmployee.name;
    
    // تحديث الصلاحيات في الواجهة
    updateUIPermissions();
} else {
    // إخفاء مؤشر الموظف
    indicator.style.display = 'none';
    nameElement.textContent = '';
    
    // تعطيل جميع العناصر التي تتطلب تسجيل الدخول
    disableUIElements();
}
}

// 14. تحديث الصلاحيات في واجهة المستخدم
function updateUIPermissions() {
// زر إدارة الموظفين
const manageEmployeesBtn = document.getElementById('manage-employees-btn');
if (manageEmployeesBtn) {
    manageEmployeesBtn.style.display = employeeManager.currentEmployeeHasPermission('manage_employees') ? 'block' : 'none';
}

// زر تقارير الموظفين
const employeeReportsBtn = document.getElementById('employee-reports-btn');
if (employeeReportsBtn) {
    employeeReportsBtn.style.display = employeeManager.currentEmployeeHasPermission('reports') ? 'inline-block' : 'none';
}

// أزرار أخرى بناءً على الصلاحيات...
// يمكن إضافة المزيد من العناصر هنا حسب متطلبات التطبيق
}

// 15. تعطيل عناصر واجهة المستخدم عندما لا يكون هناك موظف مسجل
function disableUIElements() {
// تعطيل أزرار إدارة الموظفين والتقارير
const manageEmployeesBtn = document.getElementById('manage-employees-btn');
if (manageEmployeesBtn) {
    manageEmployeesBtn.style.display = 'none';
}

const employeeReportsBtn = document.getElementById('employee-reports-btn');
if (employeeReportsBtn) {
    employeeReportsBtn.style.display = 'none';
}

// يمكن إضافة المزيد من العناصر للتعطيل هنا
}

// 16. فتح نافذة إدارة الموظفين
function openEmployeeManagementModal() {
// إنشاء النافذة إذا لم تكن موجودة
if (!document.getElementById('employee-management-modal')) {
    createEmployeeManagementModal();
    
    // إضافة مستمعي الأحداث للنافذة
    document.getElementById('close-employee-management-modal').addEventListener('click', function() {
        document.getElementById('employee-management-modal').style.display = 'none';
    });
    
    document.getElementById('close-employee-management').addEventListener('click', function() {
        document.getElementById('employee-management-modal').style.display = 'none';
    });
    
    document.getElementById('add-new-employee').addEventListener('click', function() {
        openEmployeeFormModal();
    });
    
    document.getElementById('employee-search').addEventListener('input', function() {
        displayEmployees(this.value);
    });
}

// عرض النافذة
document.getElementById('employee-management-modal').style.display = 'flex';

// عرض قائمة الموظفين
displayEmployees();
}

// 17. عرض قائمة الموظفين
function displayEmployees(searchTerm = '') {
const employeesList = document.getElementById('employees-list');

// البحث عن الموظفين
const employees = employeeManager.searchEmployees(searchTerm);

if (employees.length === 0) {
    employeesList.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا يوجد موظفين مطابقين</td></tr>';
    return;
}

let html = '';
employees.forEach(employee => {
    const hireDate = new Date(employee.creationDate).toLocaleDateString();
    
    // تحديد نص الوظيفة
    let roleText = '';
    switch (employee.role) {
        case 'cashier':
            roleText = 'كاشير';
            break;
        case 'supervisor':
            roleText = 'مشرف';
            break;
        case 'manager':
            roleText = 'مدير';
            break;
        case 'admin':
            roleText = 'مسؤول النظام';
            break;
        default:
            roleText = employee.role;
    }
    
    // تحديد نص ولون الحالة
    const statusClass = employee.isActive ? 'in-stock' : 'out-of-stock';
    const statusText = employee.isActive ? 'نشط' : 'غير نشط';
    
    html += `
    <tr>
        <td>${employee.employeeNumber}</td>
        <td>${employee.name}</td>
        <td>${employee.username}</td>
        <td>${roleText}</td>
        <td>${employee.phone || '-'}</td>
        <td>${hireDate}</td>
        <td><span class="stock-status ${statusClass}">${statusText}</span></td>
        <td class="inventory-actions">
            <button class="inventory-actions-btn edit-employee" data-id="${employee.id}" title="تعديل">
                <i class="fas fa-edit"></i>
            </button>
            <button class="inventory-actions-btn toggle-employee-status" data-id="${employee.id}" title="${employee.isActive ? 'تعطيل' : 'تفعيل'}">
                <i class="fas fa-${employee.isActive ? 'ban' : 'check-circle'}"></i>
            </button>
            <button class="inventory-actions-btn view-employee-performance" data-id="${employee.id}" title="عرض الأداء">
                <i class="fas fa-chart-line"></i>
            </button>
        </td>
    </tr>`;
});

employeesList.innerHTML = html;

// إضافة مستمعي الأحداث للأزرار
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

document.querySelectorAll('.view-employee-performance').forEach(btn => {
    btn.addEventListener('click', function() {
        const employeeId = this.getAttribute('data-id');
        viewEmployeePerformance(employeeId);
    });
});
}

// 18. فتح نافذة إضافة/تعديل موظف
function openEmployeeFormModal(employeeId = null) {
let employee = null;

if (employeeId) {
    employee = employeeManager.getEmployeeById(employeeId);
    if (!employee) return;
}

// إنشاء النموذج
createEmployeeFormModal(employee);

// إضافة مستمعي الأحداث
document.getElementById('close-employee-form-modal').addEventListener('click', function() {
    document.getElementById('employee-form-modal').remove();
});

document.getElementById('cancel-employee-form').addEventListener('click', function() {
    document.getElementById('employee-form-modal').remove();
});

document.getElementById('save-employee').addEventListener('click', saveEmployee);

// عرض النموذج
document.getElementById('employee-form-modal').style.display = 'flex';
}

// 19. تعديل بيانات موظف
function editEmployee(employeeId) {
openEmployeeFormModal(employeeId);
}

// 20. حفظ بيانات الموظف
function saveEmployee() {
// جمع البيانات من النموذج
const employeeId = document.getElementById('employee-id').value;
const name = document.getElementById('employee-name').value;
const username = document.getElementById('employee-username').value;
const password = document.getElementById('employee-password').value;
const role = document.getElementById('employee-role').value;
const phone = document.getElementById('employee-phone').value;
const address = document.getElementById('employee-address').value;
const notes = document.getElementById('employee-notes').value;

// التحقق من الحقول المطلوبة
if (!name || !username) {
    showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
    return;
}

// جمع البيانات في كائن
const employeeData = {
    name,
    username,
    role,
    phone,
    address,
    notes
};

// إضافة كلمة المرور إذا تم إدخالها (في حالة التعديل) أو كانت مطلوبة (في حالة الإضافة)
if (password || !employeeId) {
    if (!password && !employeeId) {
        showNotification('الرجاء إدخال كلمة المرور', 'error');
        return;
    }
    employeeData.password = password;
}

// إضافة الحالة في حالة التعديل
if (employeeId) {
    employeeData.isActive = document.getElementById('employee-active').checked;
}

let result;
if (employeeId) {
    // تحديث موظف موجود
    result = employeeManager.updateEmployee(employeeId, employeeData);
} else {
    // إضافة موظف جديد
    result = employeeManager.addEmployee(employeeData);
}

if (result) {
    showNotification(`تم ${employeeId ? 'تحديث' : 'إضافة'} الموظف بنجاح`, 'success');
    
    // إغلاق النموذج
    document.getElementById('employee-form-modal').remove();
    
    // تحديث قائمة الموظفين
    displayEmployees();
    
    // تحديث قائمة الموظفين في نافذة التقارير
    updateEmployeeSelectOptions();
} else {
    showNotification(`فشل ${employeeId ? 'تحديث' : 'إضافة'} الموظف`, 'error');
}
}

// 21. تغيير حالة موظف (نشط/غير نشط)
function toggleEmployeeStatus(employeeId) {
const employee = employeeManager.getEmployeeById(employeeId);
if (!employee) return;

const newStatus = !employee.isActive;
const confirmMessage = newStatus ? 
    `هل تريد تفعيل الموظف "${employee.name}"؟` : 
    `هل تريد تعطيل الموظف "${employee.name}"؟`;

if (confirm(confirmMessage)) {
    const result = employeeManager.toggleEmployeeStatus(employeeId);
    
    if (result) {
        showNotification(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} الموظف بنجاح`, 'success');
        
        // تحديث قائمة الموظفين
        displayEmployees();
    } else {
        showNotification('فشل تغيير حالة الموظف', 'error');
    }
}
}

// 22. عرض أداء موظف محدد
function viewEmployeePerformance(employeeId) {
openEmployeeReportsModal(employeeId);
}

// 23. فتح نافذة تقارير أداء الموظفين
function openEmployeeReportsModal(specificEmployeeId = null) {
// إنشاء النافذة إذا لم تكن موجودة
if (!document.getElementById('employee-reports-modal')) {
    createEmployeeReportsModal();
    
    // إضافة مستمعي الأحداث للنافذة
    document.getElementById('close-employee-reports-modal').addEventListener('click', function() {
        document.getElementById('employee-reports-modal').style.display = 'none';
    });
    
    document.getElementById('close-employee-reports').addEventListener('click', function() {
        document.getElementById('employee-reports-modal').style.display = 'none';
    });
    
    document.getElementById('report-period').addEventListener('change', function() {
        const customDateRange = document.querySelector('.custom-date-range');
        if (this.value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';
            generateEmployeeReport();
        }
    });
    
    document.getElementById('report-employee').addEventListener('change', generateEmployeeReport);
    
    document.getElementById('apply-custom-date').addEventListener('click', generateEmployeeReport);
    
    document.getElementById('print-employee-report').addEventListener('click', printEmployeeReport);
    
    document.getElementById('export-employee-report').addEventListener('click', exportEmployeeReport);
}

// عرض النافذة
document.getElementById('employee-reports-modal').style.display = 'flex';

// تحديث قائمة الموظفين في القائمة المنسدلة
updateEmployeeSelectOptions();

// تحديد موظف محدد إذا تم تمريره
if (specificEmployeeId) {
    document.getElementById('report-employee').value = specificEmployeeId;
}

// توليد التقرير الأولي
generateEmployeeReport();
}

// 24. تحديث قائمة الموظفين في القائمة المنسدلة
function updateEmployeeSelectOptions() {
const selectElement = document.getElementById('report-employee');
if (!selectElement) return;

// الاحتفاظ بخيار "جميع الموظفين"
const allOption = selectElement.querySelector('option[value="all"]');
selectElement.innerHTML = '';
selectElement.appendChild(allOption);

// إضافة الموظفين
employeeManager.employees.forEach(employee => {
    if (employee.isActive) {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.name} (${employee.employeeNumber})`;
        selectElement.appendChild(option);
    }
});
}

// 25. توليد تقرير أداء الموظفين
function generateEmployeeReport() {
const employeeSelect = document.getElementById('report-employee');
const periodSelect = document.getElementById('report-period');

const selectedEmployeeId = employeeSelect.value;
const selectedPeriod = periodSelect.value;

// تحديد فترة التقرير
let startDate = null;
let endDate = null;

if (selectedPeriod === 'custom') {
    startDate = document.getElementById('report-start-date').value;
    endDate = document.getElementById('report-end-date').value;
    
    if (!startDate || !endDate) {
        showNotification('الرجاء تحديد فترة التقرير', 'error');
        return;
    }
} else {
    const dates = getPeriodDates(selectedPeriod);
    startDate = dates.startDate;
    endDate = dates.endDate;
}

// الحصول على تقرير الأداء
const performanceReport = employeeManager.getEmployeePerformanceReport(startDate, endDate);

// عرض الإحصائيات العامة
let totalSales = 0;
let totalReceipts = 0;

if (selectedEmployeeId === 'all') {
    // إجمالي جميع الموظفين
    performanceReport.forEach(emp => {
        totalSales += emp.totalSales;
        totalReceipts += emp.receiptCount;
    });
} else {
    // موظف محدد
    const employeeReport = performanceReport.find(emp => emp.id === selectedEmployeeId);
    if (employeeReport) {
        totalSales = employeeReport.totalSales;
        totalReceipts = employeeReport.receiptCount;
    }
}

const averageReceipt = totalReceipts > 0 ? totalSales / totalReceipts : 0;

document.getElementById('employee-total-sales').textContent = formatCurrency(totalSales);
document.getElementById('employee-receipt-count').textContent = totalReceipts;
document.getElementById('employee-average-receipt').textContent = formatCurrency(averageReceipt);

// عرض قائمة أداء الموظفين
displayEmployeePerformanceList(performanceReport, totalSales);

// عرض تفاصيل مبيعات موظف محدد
if (selectedEmployeeId !== 'all') {
    displayEmployeeSalesDetails(selectedEmployeeId, startDate, endDate);
} else {
    document.getElementById('employee-sales-details').style.display = 'none';
}

// رسم المخطط البياني
drawEmployeePerformanceChart(performanceReport);
}

// 26. عرض قائمة أداء الموظفين
function displayEmployeePerformanceList(performanceReport, totalSales) {
const performanceList = document.getElementById('employee-performance-list');

if (performanceReport.length === 0) {
    performanceList.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد بيانات لعرضها</td></tr>';
    return;
}

let html = '';
performanceReport.forEach(employee => {
    // تحديد نص الوظيفة
    let roleText = '';
    switch (employee.role) {
        case 'cashier':
            roleText = 'كاشير';
            break;
        case 'supervisor':
            roleText = 'مشرف';
            break;
        case 'manager':
            roleText = 'مدير';
            break;
        case 'admin':
            roleText = 'مسؤول النظام';
            break;
        default:
            roleText = employee.role;
    }
    
    // حساب النسبة المئوية من الإجمالي
    const percentage = totalSales > 0 ? (employee.totalSales / totalSales * 100).toFixed(1) : 0;
    
    html += `
    <tr>
        <td>${employee.name}</td>
        <td>${roleText}</td>
        <td>${employee.receiptCount}</td>
        <td>${formatCurrency(employee.totalSales)}</td>
        <td>${formatCurrency(employee.averageReceipt)}</td>
        <td>${percentage}%</td>
    </tr>`;
});

performanceList.innerHTML = html;
}

// 27. عرض تفاصيل مبيعات موظف محدد
function displayEmployeeSalesDetails(employeeId, startDate, endDate) {
const employeeSalesDetails = document.getElementById('employee-sales-details');
const employeeSalesList = document.getElementById('employee-sales-list');
const employee = employeeManager.getEmployeeById(employeeId);

if (!employee) {
    employeeSalesDetails.style.display = 'none';
    return;
}

// عرض اسم الموظف
document.getElementById('sales-detail-employee-name').textContent = employee.name;

// الحصول على مبيعات الموظف
const sales = employeeManager.getEmployeeSales(employeeId, startDate, endDate);

if (sales.length === 0) {
    employeeSalesList.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد مبيعات خلال هذه الفترة</td></tr>';
} else {
    let html = '';
    sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp).toLocaleString();
        
        html += `
        <tr>
            <td>${sale.receiptNumber}</td>
            <td>${saleDate}</td>
            <td>${sale.items}</td>
            <td>${formatCurrency(sale.total)}</td>
            <td>${sale.paymentMethod}</td>
            <td class="inventory-actions">
                <button class="inventory-actions-btn view-sale-details" data-receipt="${sale.receiptNumber}" title="عرض التفاصيل">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>`;
    });
    
    employeeSalesList.innerHTML = html;
    
    // إضافة مستمعي الأحداث لأزرار عرض التفاصيل
    document.querySelectorAll('.view-sale-details').forEach(btn => {
        btn.addEventListener('click', function() {
            const receiptNumber = this.getAttribute('data-receipt');
            viewReceiptDetails(receiptNumber);
        });
    });
}

employeeSalesDetails.style.display = 'block';
}

// 28. رسم المخطط البياني لأداء الموظفين
function drawEmployeePerformanceChart(performanceReport) {
    const canvas = document.getElementById('employee-performance-chart');
    const ctx = canvas.getContext('2d');
    
    // مسح المخطط السابق
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (performanceReport.length === 0) {
        return;
    }
    
    // تحديد البيانات
    const labels = performanceReport.map(emp => emp.name);
    const salesData = performanceReport.map(emp => emp.totalSales);
    
    // ترتيب البيانات (تصاعدياً) للعرض الأفضل
    const sortedIndices = [...Array(salesData.length).keys()].sort((a, b) => salesData[a] - salesData[b]);
    const sortedLabels = sortedIndices.map(i => labels[i]);
    const sortedSalesData = sortedIndices.map(i => salesData[i]);
    
    // حساب الأبعاد والهوامش
    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const width = canvas.width - margin.left - margin.right;
    const height = canvas.height - margin.top - margin.bottom;
    
    // تحديد المقاييس
    const maxSale = Math.max(...sortedSalesData) * 1.1; // إضافة هامش 10%
    const barWidth = Math.min(40, width / sortedLabels.length - 10);
    
    // رسم المخطط
    ctx.save();
    ctx.translate(margin.left, margin.top);
    
    // رسم محور Y (المبيعات)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // رسم علامات محور Y
    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i++) {
        const y = height - (i / yTickCount) * height;
        const value = (i / yTickCount) * maxSale;
        
        ctx.beginPath();
        ctx.moveTo(-5, y);
        ctx.lineTo(0, y);
        ctx.strokeStyle = '#333';
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.textAlign = 'right';
        ctx.fillText(formatCurrency(value), -10, y + 5);
    }
    
    // رسم محور X (الموظفين)
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // رسم الأعمدة والتسميات
    for (let i = 0; i < sortedLabels.length; i++) {
        const x = (i + 0.5) * (width / sortedLabels.length);
        const barHeight = (sortedSalesData[i] / maxSale) * height;
        
        // رسم العمود
        ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
        ctx.fillRect(x - barWidth / 2, height - barHeight, barWidth, barHeight);
        
      // إضافة تسمية الموظف
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x, height + 10);
        ctx.rotate(Math.PI / 4); // دوران النص للتسميات الطويلة
        ctx.fillText(sortedLabels[i], 0, 0);
        ctx.restore();
        
        // إضافة قيمة المبيعات فوق العمود
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText(formatCurrency(sortedSalesData[i]), x, height - barHeight - 5);
    }
    
    // إضافة عنوان المحور Y
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('إجمالي المبيعات', -height / 2, -60);
    ctx.restore();
    
    ctx.restore();
}

// 29. الحصول على تواريخ الفترة الزمنية
function getPeriodDates(period) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'yesterday':
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(endDate.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'thisWeek':
            const dayOfWeek = startDate.getDay(); // 0 = الأحد، 1 = الاثنين، ...
            const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // اعتبار بداية الأسبوع هي الإثنين
            startDate.setDate(startDate.getDate() - diff);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'lastWeek':
            const dayOfLastWeek = startDate.getDay();
            const diffLastWeek = (dayOfLastWeek === 0 ? 6 : dayOfLastWeek - 1);
            startDate.setDate(startDate.getDate() - diffLastWeek - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(endDate.getDate() - diffLastWeek - 1);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'thisMonth':
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'lastMonth':
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(0); // اليوم الأخير من الشهر السابق
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
    }
    
    return {
        startDate: startDate.toISOString().split('T')[0], // تنسيق YYYY-MM-DD
        endDate: endDate.toISOString().split('T')[0]
    };
}

// 30. طباعة تقرير أداء الموظفين
function printEmployeeReport() {
    window.print();
}

// 31. تصدير تقرير أداء الموظفين
function exportEmployeeReport() {
    // تحديد الفترة الزمنية
    const periodSelect = document.getElementById('report-period');
    const selectedPeriod = periodSelect.value;
    let periodText = '';
    
    switch (selectedPeriod) {
        case 'today':
            periodText = 'اليوم';
            break;
        case 'yesterday':
            periodText = 'الأمس';
            break;
        case 'thisWeek':
            periodText = 'هذا الأسبوع';
            break;
        case 'lastWeek':
            periodText = 'الأسبوع الماضي';
            break;
        case 'thisMonth':
            periodText = 'هذا الشهر';
            break;
        case 'lastMonth':
            periodText = 'الشهر الماضي';
            break;
        case 'custom':
            const startDate = document.getElementById('report-start-date').value;
            const endDate = document.getElementById('report-end-date').value;
            periodText = `الفترة من ${startDate} إلى ${endDate}`;
            break;
    }
    
    // إنشاء نص CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // إضافة العنوان
    csvContent += "تقرير أداء الموظفين - " + periodText + "\r\n\r\n";
    
    // إضافة رؤوس الأعمدة
    csvContent += "الموظف,الوظيفة,عدد الفواتير,إجمالي المبيعات,متوسط قيمة الفاتورة,النسبة من الإجمالي\r\n";
    
    // إضافة بيانات الموظفين
    const performanceRows = document.querySelectorAll('#employee-performance-list tr');
    
    performanceRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let rowData = [];
        
        cells.forEach(cell => {
            // تنظيف البيانات من أي فواصل
            let cellData = cell.textContent.replace(/,/g, ' ');
            rowData.push(cellData);
        });
        
        csvContent += rowData.join(',') + "\r\n";
    });
    
    // إنشاء رابط التنزيل
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "تقرير_أداء_الموظفين.csv");
    document.body.appendChild(link);
    
    // النقر على الرابط لبدء التنزيل
    link.click();
    
    // إزالة الرابط
    document.body.removeChild(link);
}

// 32. عرض تفاصيل الفاتورة
function viewReceiptDetails(receiptNumber) {
    showNotification(`عرض تفاصيل الفاتورة ${receiptNumber}`, 'info');
    // هنا يمكن إضافة رمز لعرض تفاصيل الفاتورة، مثل فتح نافذة منبثقة أو الانتقال إلى صفحة الفاتورة
}

// 33. التحقق مما إذا كان هناك موظف مسجل دخوله وطلب تسجيل الدخول إذا لم يكن كذلك
function checkEmployeeLogin() {
    if (!employeeManager.currentEmployee) {
        openLoginModal();
        return false;
    }
    return true;
}

// 34. تعديل وظيفة بدء البيع لطلب تسجيل الدخول
const originalStartSelling = window.startSelling || function(){};
window.startSelling = function() {
    // التحقق من تسجيل الدخول قبل بدء البيع
    if (!checkEmployeeLogin()) {
        return;
    }
    
    // استدعاء الوظيفة الأصلية
    return originalStartSelling.apply(this, arguments);
};

// 35. تهيئة نظام إدارة الموظفين
function initEmployeeSystem() {
    // إنشاء واجهة المستخدم
    createCurrentEmployeeIndicator();
    
    // إضافة أزرار إدارة الموظفين وتقارير الأداء
    addEmployeeManagementButton();
    addEmployeeReportsButton();
    
    // إضافة مستمع للخروج
    document.getElementById('employee-logout-btn').addEventListener('click', logoutCurrentEmployee);
    
    // التحقق مما إذا كان هناك موظف مسجل دخوله
    if (employeeManager.currentEmployee) {
        updateCurrentEmployeeUI();
    } else {
        // طلب تسجيل الدخول عند بدء التطبيق
        openLoginModal();
    }
}

// 36. إنشاء بعض بيانات الموظفين الافتراضية للاختبار
function createDefaultEmployees() {
    // التحقق مما إذا كان هناك موظفين بالفعل
    if (employeeManager.employees.length > 0) {
        return;
    }
    
    // إضافة مدير النظام الافتراضي
    employeeManager.addEmployee({
        name: 'مدير النظام',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        phone: '07700000000'
    });
    
    // إضافة بعض الموظفين للاختبار
    employeeManager.addEmployee({
        name: 'أحمد محمد',
        username: 'ahmed',
        password: 'ahmed123',
        role: 'cashier',
        phone: '07701111111'
    });
    
    employeeManager.addEmployee({
        name: 'فاطمة علي',
        username: 'fatima',
        password: 'fatima123',
        role: 'cashier',
        phone: '07702222222'
    });
    
    employeeManager.addEmployee({
        name: 'محمد حسين',
        username: 'mohammad',
        password: 'mohammad123',
        role: 'supervisor',
        phone: '07703333333'
    });
}

// 37. إضافة وظائف مساعدة لتسهيل الحصول على قيم الفاتورة
function getTotalAmount() {
    const totalElement = document.getElementById('total');
    if (totalElement) {
        return parseFloat(totalElement.textContent.replace(/[^\d.-]/g, '')) || 0;
    }
    return 0;
}

function getSubtotalAmount() {
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
        return parseFloat(subtotalElement.textContent.replace(/[^\d.-]/g, '')) || 0;
    }
    return 0;
}

function getTaxAmount() {
    const taxElement = document.getElementById('tax');
    if (taxElement) {
        return parseFloat(taxElement.textContent.replace(/[^\d.-]/g, '')) || 0;
    }
    return 0;
}

function getDiscountAmount() {
    const discountElement = document.getElementById('discount');
    if (discountElement) {
        return parseFloat(discountElement.textContent.replace(/[^\d.-]/g, '')) || 0;
    }
    return 0;
}

// 38. إضافة زر تبديل الموظف الحالي (لنظام متعدد المستخدمين)
function createEmployeeSwitcherButton() {
    // إنشاء زر التبديل
    const switcherButton = document.createElement('button');
    switcherButton.id = 'employee-switcher-btn';
    switcherButton.className = 'btn btn-primary';
    switcherButton.innerHTML = '<i class="fas fa-exchange-alt"></i> تبديل الموظف';
    
    // إضافة مستمع الحدث
    switcherButton.addEventListener('click', openEmployeeSwitcherModal);
    
    // إضافة الزر إلى مؤشر الموظف الحالي
    const employeeIndicator = document.getElementById('current-employee-indicator');
    if (employeeIndicator) {
        employeeIndicator.appendChild(switcherButton);
    }
    
    // إضافة CSS للزر
    const style = document.createElement('style');
    style.textContent = `
        #employee-switcher-btn {
            margin-right: 10px;
            padding: 5px 10px;
            font-size: 12px;
            background-color: transparent;
            border: 1px solid #3498db;
            color: #3498db;
        }
        
        #employee-switcher-btn:hover {
            background-color: #3498db;
            color: white;
        }
    `;
    document.head.appendChild(style);
}

// 39. فتح نافذة تبديل الموظف
function openEmployeeSwitcherModal() {
    // إنشاء النافذة إذا لم تكن موجودة
    if (!document.getElementById('employee-switcher-modal')) {
        const modalHtml = `
        <div class="modal" id="employee-switcher-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>تبديل الموظف</h2>
                    <button class="modal-close" id="close-employee-switcher-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="active-employee-select">اختر الموظف:</label>
                        <select class="form-control" id="active-employee-select">
                            <!-- ستتم إضافة الموظفين هنا بواسطة JavaScript -->
                        </select>
                    </div>
                    <div class="form-group" id="employee-login-required" style="display: none;">
                        <label for="employee-login-password">كلمة المرور:</label>
                        <input type="password" class="form-control" id="employee-login-password">
                    </div>
                    <div class="alert alert-danger" id="employee-switcher-error" style="display: none; color: #e74c3c; margin-top: 10px; padding: 10px; border: 1px solid #e74c3c; border-radius: 5px;"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="switch-employee-btn">تبديل</button>
                    <button class="btn" id="cancel-employee-switch">إلغاء</button>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // إضافة مستمعي الأحداث للنافذة
        document.getElementById('close-employee-switcher-modal').addEventListener('click', function() {
            document.getElementById('employee-switcher-modal').style.display = 'none';
        });
        
        document.getElementById('cancel-employee-switch').addEventListener('click', function() {
            document.getElementById('employee-switcher-modal').style.display = 'none';
        });
        
        document.getElementById('switch-employee-btn').addEventListener('click', switchToSelectedEmployee);
        
        document.getElementById('active-employee-select').addEventListener('change', function() {
            const selectedEmployeeId = this.value;
            const passwordField = document.getElementById('employee-login-required');
            
            if (selectedEmployeeId) {
                passwordField.style.display = 'block';
            } else {
                passwordField.style.display = 'none';
            }
        });
    }
    
    // تحديث قائمة الموظفين النشطين
    const selectElement = document.getElementById('active-employee-select');
    selectElement.innerHTML = '<option value="">-- اختر الموظف --</option>';
    
    employeeManager.employees.forEach(employee => {
        if (employee.isActive) {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = `${employee.name} (${employee.role === 'cashier' ? 'كاشير' : employee.role === 'supervisor' ? 'مشرف' : employee.role === 'manager' ? 'مدير' : 'مسؤول'})`;
            selectElement.appendChild(option);
        }
    });
    
    // إعادة تعيين حقول النافذة
    document.getElementById('employee-login-password').value = '';
    document.getElementById('employee-login-required').style.display = 'none';
    document.getElementById('employee-switcher-error').style.display = 'none';
    
    // عرض النافذة
    document.getElementById('employee-switcher-modal').style.display = 'flex';
}

// 40. تبديل إلى الموظف المحدد
function switchToSelectedEmployee() {
    const employeeId = document.getElementById('active-employee-select').value;
    const password = document.getElementById('employee-login-password').value;
    
    if (!employeeId) {
        document.getElementById('employee-switcher-error').style.display = 'block';
        document.getElementById('employee-switcher-error').textContent = 'الرجاء اختيار موظف';
        return;
    }
    
    if (!password) {
        document.getElementById('employee-switcher-error').style.display = 'block';
        document.getElementById('employee-switcher-error').textContent = 'الرجاء إدخال كلمة المرور';
        return;
    }
    
    // البحث عن الموظف
    const employee = employeeManager.getEmployeeById(employeeId);
    if (!employee || employee.password !== password) {
        document.getElementById('employee-switcher-error').style.display = 'block';
        document.getElementById('employee-switcher-error').textContent = 'كلمة المرور غير صحيحة';
        return;
    }
    
    // تسجيل خروج الموظف الحالي
    employeeManager.logoutCurrentEmployee();
    
    // تسجيل دخول الموظف الجديد
    employeeManager.loginEmployee(employee.username, employee.password);
    
    // تحديث واجهة المستخدم
    updateCurrentEmployeeUI();
    
    // إغلاق النافذة
    document.getElementById('employee-switcher-modal').style.display = 'none';
    
    showNotification(`تم التبديل إلى الموظف ${employee.name}`, 'success');
}

// 41. إضافة التحقق من الموظف قبل الدفع
const originalCompletePaymentWithCheck = window.completePayment;
window.completePayment = function() {
    // التأكد من وجود موظف مسجل دخوله
    if (!employeeManager.currentEmployee) {
        showNotification('يجب تسجيل دخول موظف لإتمام عملية الدفع', 'error');
        openLoginModal();
        return false;
    }
    
    // استدعاء وظيفة إتمام الدفع الأصلية
    return originalCompletePaymentWithCheck.apply(this, arguments);
};

// 42. تنفيذ النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إنشاء بيانات الموظفين الافتراضية
    createDefaultEmployees();
    
    // تهيئة نظام إدارة الموظفين
    initEmployeeSystem();
    
    // إضافة زر تبديل الموظف
    createEmployeeSwitcherButton();
    
    // إضافة مستمع للضغط على مفتاح Escape لإغلاق النوافذ
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const loginModal = document.getElementById('login-modal');
            if (loginModal && loginModal.style.display === 'flex') {
                // لا نغلق نافذة تسجيل الدخول بالـ Escape
                return;
            }
            
            const employeeManagementModal = document.getElementById('employee-management-modal');
            if (employeeManagementModal && employeeManagementModal.style.display === 'flex') {
                employeeManagementModal.style.display = 'none';
            }
            
            const employeeFormModal = document.getElementById('employee-form-modal');
            if (employeeFormModal) {
                employeeFormModal.remove();
            }
            
            const employeeReportsModal = document.getElementById('employee-reports-modal');
            if (employeeReportsModal && employeeReportsModal.style.display === 'flex') {
                employeeReportsModal.style.display = 'none';
            }
            
            const employeeSwitcherModal = document.getElementById('employee-switcher-modal');
            if (employeeSwitcherModal && employeeSwitcherModal.style.display === 'flex') {
                employeeSwitcherModal.style.display = 'none';
            }
        }
    });
});