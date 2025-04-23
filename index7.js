// نظام تقارير أداء الموظفين
// يضاف هذا الكود إلى ملف index.js

// 1. توسيع نظام تقارير الموظفين
const employeeReports = {
    // تقرير الأداء بين موظفين في فترة زمنية محددة
    getPerformanceReport: function(startDate, endDate) {
        // الحصول على بيانات مبيعات الموظفين
        const salesData = employeeManager.getEmployeeSalesInPeriod(startDate, endDate);
        
        // حساب إجمالي المبيعات
        const totalSales = salesData.reduce((sum, emp) => sum + emp.periodSales, 0);
        
        // إضافة بيانات إضافية لكل موظف
        const report = salesData.map(emp => {
            // حساب نسبة المساهمة في المبيعات
            const salesPercentage = totalSales > 0 ? (emp.periodSales / totalSales * 100) : 0;
            
            // حساب متوسط قيمة الطلب
            const averageOrderValue = emp.periodOrders > 0 ? emp.periodSales / emp.periodOrders : 0;
            
            return {
                ...emp,
                salesPercentage: salesPercentage.toFixed(2),
                averageOrderValue
            };
        });
        
        return {
            employees: report,
            totalSales,
            startDate,
            endDate
        };
    },
    
    // تقرير النمو في أداء الموظفين (مقارنة بين فترتين)
    // تقرير النمو في أداء الموظفين (مقارنة بين فترتين)
getGrowthReport: function(currentStartDate, currentEndDate, previousStartDate, previousEndDate) {
    // الحصول على بيانات الفترة الحالية
    const currentPeriodData = employeeManager.getEmployeeSalesInPeriod(currentStartDate, currentEndDate);
    
    // الحصول على بيانات الفترة السابقة
    const previousPeriodData = employeeManager.getEmployeeSalesInPeriod(previousStartDate, previousEndDate);
    
    // إعداد التقرير
    const report = [];
    
    // إنشاء قائمة بجميع الموظفين الفريدين من كلا الفترتين
    const allEmployeeIds = new Set();
    currentPeriodData.forEach(emp => allEmployeeIds.add(emp.id));
    previousPeriodData.forEach(emp => allEmployeeIds.add(emp.id));
    
    // لكل موظف، حساب الفرق بين الفترتين
    allEmployeeIds.forEach(empId => {
        const currentData = currentPeriodData.find(emp => emp.id === empId) || { 
            name: employeeManager.getEmployeeById(empId)?.name || 'موظف غير نشط', 
            periodSales: 0, 
            periodOrders: 0 
        };
        
        const previousData = previousPeriodData.find(emp => emp.id === empId) || { 
            periodSales: 0, 
            periodOrders: 0 
        };
        
        // حساب نسبة النمو في المبيعات
        const salesGrowth = previousData.periodSales > 0 ? 
            ((currentData.periodSales - previousData.periodSales) / previousData.periodSales * 100) : 
            (currentData.periodSales > 0 ? 100 : 0);
        
        // حساب نسبة النمو في عدد الطلبات
        const ordersGrowth = previousData.periodOrders > 0 ? 
            ((currentData.periodOrders - previousData.periodOrders) / previousData.periodOrders * 100) : 
            (currentData.periodOrders > 0 ? 100 : 0);
        
        report.push({
            id: empId,
            name: currentData.name,
            currentSales: currentData.periodSales,
            previousSales: previousData.periodSales,
            salesGrowth: salesGrowth.toFixed(2),
            currentOrders: currentData.periodOrders,
            previousOrders: previousData.periodOrders,
            ordersGrowth: ordersGrowth.toFixed(2)
        });
    });
    
    // ترتيب التقرير حسب نسبة النمو في المبيعات (تنازلياً)
    report.sort((a, b) => parseFloat(b.salesGrowth) - parseFloat(a.salesGrowth));
    
    return {
        employees: report,
        currentPeriod: { start: currentStartDate, end: currentEndDate },
        previousPeriod: { start: previousStartDate, end: previousEndDate }
    };
},

// تقرير ساعات العمل للموظفين
getWorkingHoursReport: function(startDate, endDate) {
    // في بيئة حقيقية، ستحتاج إلى تتبع ساعات الدخول والخروج للموظفين
    // هنا نقوم بمحاكاة هذه البيانات اعتماداً على المبيعات المسجلة
    
    const report = [];
    const activeEmployees = employeeManager.getActiveEmployees();
    
    activeEmployees.forEach(employee => {
        // محاكاة ساعات العمل بناءً على عدد المبيعات
        const salesData = employee.salesHistory || [];
        const salesInPeriod = salesData.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });
        
        // محاكاة: كل عملية بيع تستغرق حوالي 15 دقيقة (0.25 ساعة)
        const estimatedHours = salesInPeriod.length * 0.25;
        
        // افتراض ساعات عمل يومية ثابتة للموظفين (8 ساعات) إذا لم يكن لديهم مبيعات
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const daysDiff = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
        const workingDays = Math.min(daysDiff, getWorkingDaysCount(startDateObj, endDateObj));
        
        // إجمالي ساعات العمل المفترضة
        const expectedHours = workingDays * 8;
        
        // ساعات العمل الفعلية (محاكاة: الأعلى من المقدرة والمتوقعة)
        const actualHours = Math.max(estimatedHours, expectedHours * 0.8);
        
        report.push({
            id: employee.id,
            name: employee.name,
            role: employee.role,
            workingDays,
            expectedHours,
            actualHours: actualHours.toFixed(2),
            efficiency: ((actualHours / expectedHours) * 100).toFixed(2),
            sales: salesInPeriod.length,
            salesPerHour: (salesInPeriod.length / actualHours).toFixed(2)
        });
    });
    
    // ترتيب التقرير حسب الكفاءة (تنازلياً)
    report.sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency));
    
    return {
        employees: report,
        startDate,
        endDate,
        totalWorkingDays: getWorkingDaysCount(new Date(startDate), new Date(endDate))
    };
},

// تقرير مقارنة الأقسام (للموظفين في نفس الدور)
getRoleComparisonReport: function(startDate, endDate) {
    // الحصول على بيانات مبيعات الموظفين
    const salesData = employeeManager.getEmployeeSalesInPeriod(startDate, endDate);
    
    // تقسيم البيانات حسب الدور
    const roleData = {};
    
    salesData.forEach(emp => {
        const employee = employeeManager.getEmployeeById(emp.id);
        if (!employee) return;
        
        const role = employee.role;
        if (!roleData[role]) {
            roleData[role] = {
                role: getRoleName(role),
                employees: [],
                totalSales: 0,
                totalOrders: 0,
                averageSales: 0
            };
        }
        
        roleData[role].employees.push(emp);
        roleData[role].totalSales += emp.periodSales;
        roleData[role].totalOrders += emp.periodOrders;
    });
    
    // حساب المتوسطات لكل دور
    Object.values(roleData).forEach(role => {
        role.averageSales = role.employees.length > 0 ? 
            role.totalSales / role.employees.length : 0;
        
        // ترتيب الموظفين حسب المبيعات
        role.employees.sort((a, b) => b.periodSales - a.periodSales);
        
        // تعيين الأفضل أداءً
        if (role.employees.length > 0) {
            role.topPerformer = {
                id: role.employees[0].id,
                name: role.employees[0].name,
                sales: role.employees[0].periodSales
            };
        }
    });
    
    return {
        roles: Object.values(roleData),
        startDate,
        endDate
    };
}
};

// 2. إنشاء واجهة تقارير الموظفين
function createEmployeeReportsModal() {
    const modalHtml = `
    <div class="modal" id="employee-reports-modal">
        <div class="modal-content" style="width: 90%; max-width: 1200px;">
            <div class="modal-header">
                <h2>تقارير أداء الموظفين</h2>
                <button class="modal-close" id="close-employee-reports-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-tabs">
                    <div class="settings-tab active" data-report="performance">الأداء العام</div>
                    <div class="settings-tab" data-report="growth">النمو</div>
                    <div class="settings-tab" data-report="hours">ساعات العمل</div>
                    <div class="settings-tab" data-report="roles">مقارنة الأدوار</div>
                </div>
                
                <div class="form-row" style="margin: 20px 0;">
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
                    <div class="form-col" id="previous-period-container" style="display: none;">
                        <div class="form-group">
                            <label for="report-previous-start">الفترة السابقة من</label>
                            <input type="date" class="form-control" id="report-previous-start">
                        </div>
                    </div>
                    <div class="form-col" id="previous-period-end-container" style="display: none;">
                        <div class="form-group">
                            <label for="report-previous-end">الفترة السابقة إلى</label>
                            <input type="date" class="form-control" id="report-previous-end">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <button class="btn btn-primary" id="generate-emp-report" style="width: 100%;">عرض التقرير</button>
                        </div>
                    </div>
                </div>
                
                <!-- تقرير الأداء العام -->
                <div class="report-panel active" id="performance-report-panel">
                    <div class="form-row">
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">إجمالي المبيعات</div>
                            <div class="report-content">
                                <div class="report-value" id="performance-total-sales">0 د.ع</div>
                                <div class="report-icon"><i class="fas fa-money-bill-wave"></i></div>
                            </div>
                        </div>
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">متوسط مبيعات الموظف</div>
                            <div class="report-content">
                                <div class="report-value" id="performance-avg-sales">0 د.ع</div>
                                <div class="report-icon"><i class="fas fa-user-tie"></i></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="report-card" style="margin-top: 20px;">
                        <div class="report-title">أداء الموظفين</div>
                        <table class="inventory-list">
                            <thead>
                                <tr>
                                    <th>الموظف</th>
                                    <th>المبيعات</th>
                                    <th>عدد الطلبات</th>
                                    <th>متوسط قيمة الطلب</th>
                                    <th>النسبة من إجمالي المبيعات</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="performance-report-list">
                                <!-- سيتم إضافة بيانات الموظفين هنا -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="performance-chart-container" style="margin-top: 20px; height: 300px;">
                        <!-- سيتم إضافة الرسم البياني هنا -->
                    </div>
                </div>
                
                <!-- تقرير النمو -->
                <div class="report-panel" id="growth-report-panel">
                    <div class="report-card">
                        <div class="report-title">مقارنة النمو بين الفترتين</div>
                        <table class="inventory-list">
                            <thead>
                                <tr>
                                    <th>الموظف</th>
                                    <th>مبيعات الفترة الحالية</th>
                                    <th>مبيعات الفترة السابقة</th>
                                    <th>نسبة النمو (المبيعات)</th>
                                    <th>طلبات الفترة الحالية</th>
                                    <th>طلبات الفترة السابقة</th>
                                    <th>نسبة النمو (الطلبات)</th>
                                </tr>
                            </thead>
                            <tbody id="growth-report-list">
                                <!-- سيتم إضافة بيانات النمو هنا -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="growth-chart-container" style="margin-top: 20px; height: 300px;">
                        <!-- سيتم إضافة الرسم البياني هنا -->
                    </div>
                </div>
                
                <!-- تقرير ساعات العمل -->
                <div class="report-panel" id="hours-report-panel">
                    <div class="form-row">
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">إجمالي أيام العمل</div>
                            <div class="report-content">
                                <div class="report-value" id="hours-total-days">0</div>
                                <div class="report-icon"><i class="fas fa-calendar-alt"></i></div>
                            </div>
                        </div>
                        <div class="report-card" style="flex: 1;">
                            <div class="report-title">متوسط ساعات العمل</div>
                            <div class="report-content">
                                <div class="report-value" id="hours-avg-hours">0</div>
                                <div class="report-icon"><i class="fas fa-clock"></i></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="report-card" style="margin-top: 20px;">
                        <div class="report-title">ساعات عمل الموظفين</div>
                        <table class="inventory-list">
                            <thead>
                                <tr>
                                    <th>الموظف</th>
                                    <th>الدور</th>
                                    <th>أيام العمل</th>
                                    <th>الساعات المتوقعة</th>
                                    <th>الساعات الفعلية</th>
                                    <th>الكفاءة</th>
                                    <th>المبيعات/الساعة</th>
                                </tr>
                            </thead>
                            <tbody id="hours-report-list">
                                <!-- سيتم إضافة بيانات ساعات العمل هنا -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- تقرير مقارنة الأدوار -->
                <div class="report-panel" id="roles-report-panel">
                    <div id="roles-chart-container" style="margin-bottom: 20px; height: 300px;">
                        <!-- سيتم إضافة الرسم البياني هنا -->
                    </div>
                    
                    <div class="report-card">
                        <div class="report-title">أداء الأدوار</div>
                        <table class="inventory-list">
                            <thead>
                                <tr>
                                    <th>الدور</th>
                                    <th>عدد الموظفين</th>
                                    <th>إجمالي المبيعات</th>
                                    <th>متوسط المبيعات للموظف</th>
                                    <th>أفضل موظف</th>
                                </tr>
                            </thead>
                            <tbody id="roles-report-list">
                                <!-- سيتم إضافة بيانات الأدوار هنا -->
                            </tbody>
                        </table>
                    </div>
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
    
    // إضافة CSS للتقارير
    const reportsStyles = `
    <style>
        .report-panel {
            display: none;
            margin-top: 20px;
        }
        .report-panel.active {
            display: block;
        }
        .growth-positive {
            color: #27ae60;
            font-weight: bold;
        }
        .growth-negative {
            color: #e74c3c;
            font-weight: bold;
        }
        .performance-bar {
            height: 20px;
            background-color: var(--primary-color);
            border-radius: 3px;
        }
        .chart-container {
            width: 100%;
            max-width: 100%;
        }
    </style>`;
    
    document.head.insertAdjacentHTML('beforeend', reportsStyles);
}

// 3. حساب أيام العمل (استبعاد العطل الأسبوعية)
function getWorkingDaysCount(startDate, endDate) {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        // استبعاد أيام الجمعة والسبت (5, 6)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 5 && dayOfWeek !== 6) {
            count++;
        }
        
        // الانتقال إلى اليوم التالي
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
}

// 4. إعداد تبويبات التقارير
function setupReportTabs() {
    const tabs = document.querySelectorAll('.settings-tab[data-report]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const panel = this.getAttribute('data-report');
            
            // تغيير علامة التبويب النشطة
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // تغيير اللوحة النشطة
            document.querySelectorAll('.report-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`${panel}-report-panel`).classList.add('active');
            
            // إظهار/إخفاء حقول الفترة السابقة حسب نوع التقرير
            if (panel === 'growth') {
                document.getElementById('previous-period-container').style.display = 'block';
                document.getElementById('previous-period-end-container').style.display = 'block';
            } else {
                document.getElementById('previous-period-container').style.display = 'none';
                document.getElementById('previous-period-end-container').style.display = 'none';
            }
        });
    });
}

// 5. عرض تقرير الأداء العام
function displayPerformanceReport(report) {
    // تحديث القيم الإجمالية
    document.getElementById('performance-total-sales').textContent = formatCurrency(report.totalSales);
    const avgSales = report.employees.length > 0 ? report.totalSales / report.employees.length : 0;
    document.getElementById('performance-avg-sales').textContent = formatCurrency(avgSales);
    
    // عرض قائمة الموظفين
    const tbody = document.getElementById('performance-report-list');
    
    if (report.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد بيانات متاحة</td></tr>';
        return;
    }
    
    let html = '';
    report.employees.forEach(emp => {
        html += `
        <tr>
            <td>${emp.name}</td>
            <td>${formatCurrency(emp.periodSales)}</td>
            <td>${emp.periodOrders}</td>
            <td>${formatCurrency(emp.averageOrderValue)}</td>
            <td>
                <div class="performance-bar" style="width: ${emp.salesPercentage}%"></div>
                ${emp.salesPercentage}%
            </td>
            <td class="inventory-actions">
                <button class="inventory-actions-btn view-employee-stats" data-id="${emp.id}" title="عرض التفاصيل">
                    <i class="fas fa-chart-line"></i>
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
    
    // إنشاء رسم بياني للمقارنة (باستخدام div بسيط كمثال)
    const chartContainer = document.getElementById('performance-chart-container');
    chartContainer.innerHTML = '';
    
    const chartHtml = `
    <div style="display: flex; height: 100%; align-items: flex-end; justify-content: space-around; margin-top: 20px;">
        ${report.employees.map(emp => `
            <div style="display: flex; flex-direction: column; align-items: center; width: ${100 / report.employees.length}%;">
                <div style="height: ${emp.periodSales / report.totalSales * 250}px; width: 40px; background-color: var(--primary-color); border-radius: 5px 5px 0 0;"></div>
                <div style="margin-top: 10px; text-align: center; font-size: 12px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${emp.name}</div>
            </div>
        `).join('')}
    </div>`;
    
    chartContainer.innerHTML = chartHtml;
}

// 6. عرض تقرير النمو
function displayGrowthReport(report) {
    // عرض قائمة الموظفين
    const tbody = document.getElementById('growth-report-list');
    
    if (report.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد بيانات متاحة</td></tr>';
        return;
    }
    
    let html = '';
    report.employees.forEach(emp => {
        const salesGrowthClass = parseFloat(emp.salesGrowth) >= 0 ? 'growth-positive' : 'growth-negative';
        const ordersGrowthClass = parseFloat(emp.ordersGrowth) >= 0 ? 'growth-positive' : 'growth-negative';
        
        html += `
        <tr>
            <td>${emp.name}</td>
            <td>${formatCurrency(emp.currentSales)}</td>
            <td>${formatCurrency(emp.previousSales)}</td>
            <td class="${salesGrowthClass}">${parseFloat(emp.salesGrowth) >= 0 ? '+' : ''}${emp.salesGrowth}%</td>
            <td>${emp.currentOrders}</td>
            <td>${emp.previousOrders}</td>
            <td class="${ordersGrowthClass}">${parseFloat(emp.ordersGrowth) >= 0 ? '+' : ''}${emp.ordersGrowth}%</td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    
    // إنشاء رسم بياني للنمو (باستخدام div بسيط كمثال)
    const chartContainer = document.getElementById('growth-chart-container');
    chartContainer.innerHTML = '';
    
    const chartHtml = `
    <div style="display: flex; height: 100%; align-items: center; justify-content: space-around; margin-top: 20px;">
        ${report.employees.slice(0, 5).map(emp => `
            <div style="display: flex; flex-direction: column; align-items: center; width: ${100 / Math.min(report.employees.length, 5)}%;">
                <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                    <div style="font-size: 12px; text-align: center; margin-bottom: 5px;">${emp.name}</div>
                    <div style="position: relative; width: 100%; height: 250px;">
                        <div style="position: absolute; bottom: 50%; right: calc(50% - 40px); height: ${Math.min(Math.abs(parseFloat(emp.salesGrowth)), 100) * 1.5}px; width: 30px; background-color: ${parseFloat(emp.salesGrowth) >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)'}; border-radius: 5px 5px 0 0; transform: ${parseFloat(emp.salesGrowth) >= 0 ? '' : 'rotate(180deg)'}; transform-origin: bottom;"></div>
                        <div style="position: absolute; bottom: 50%; left: calc(50% - 40px); height: ${Math.min(Math.abs(parseFloat(emp.ordersGrowth)), 100) * 1.5}px; width: 30px; background-color: ${parseFloat(emp.ordersGrowth) >= 0 ? 'var(--primary-color)' : '#e74c3c'}; border-radius: 5px 5px 0 0; transform: ${parseFloat(emp.ordersGrowth) >= 0 ? '' : 'rotate(180deg)'}; transform-origin: bottom;"></div>
                        <div style="position: absolute; bottom: 50%; right: 0; left: 0; height: 1px; background-color: #999;"></div>
                    </div>
                    <div style="display: flex; width: 100%; justify-content: space-around; margin-top: 5px; font-size: 10px;">
                        <div style="display: flex; align-items: center;"><div style="width: 10px; height: 10px; background-color: var(--secondary-color); margin-left: 5px;"></div> المبيعات</div>
                        <div style="display: flex; align-items: center;"><div style="width: 10px; height: 10px; background-color: var(--primary-color); margin-left: 5px;"></div> الطلبات</div>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>`;
    
    chartContainer.innerHTML = chartHtml;
}

// 7. عرض تقرير ساعات العمل
function displayHoursReport(report) {
    // تحديث القيم الإجمالية
    document.getElementById('hours-total-days').textContent = report.totalWorkingDays;
    
    const totalHours = report.employees.reduce((sum, emp) => sum + parseFloat(emp.actualHours), 0);
    const avgHours = report.employees.length > 0 ? (totalHours / report.employees.length).toFixed(2) : 0;
    document.getElementById('hours-avg-hours').textContent = avgHours;
    
    // عرض قائمة الموظفين
const tbody = document.getElementById('hours-report-list');
    
if (report.employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد بيانات متاحة</td></tr>';
    return;
}

let html = '';
report.employees.forEach(emp => {
    // تحديد لون خلية الكفاءة بناءً على القيمة
    let efficiencyClass = '';
    const efficiency = parseFloat(emp.efficiency);
    if (efficiency >= 100) {
        efficiencyClass = 'growth-positive';
    } else if (efficiency >= 90) {
        efficiencyClass = 'stock-status in-stock';
    } else if (efficiency >= 70) {
        efficiencyClass = 'stock-status low-stock';
    } else {
        efficiencyClass = 'growth-negative';
    }
    
    html += `
    <tr>
        <td>${emp.name}</td>
        <td>${getRoleName(emp.role)}</td>
        <td>${emp.workingDays}</td>
        <td>${emp.expectedHours}</td>
        <td>${emp.actualHours}</td>
        <td class="${efficiencyClass}">${emp.efficiency}%</td>
        <td>${emp.salesPerHour}</td>
    </tr>`;
});

tbody.innerHTML = html;
}

// 8. عرض تقرير مقارنة الأدوار
function displayRolesReport(report) {
    // عرض قائمة الأدوار
    const tbody = document.getElementById('roles-report-list');
    
    if (report.roles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد بيانات متاحة</td></tr>';
        return;
    }
    
    let html = '';
    report.roles.forEach(role => {
        html += `
        <tr>
            <td>${role.role}</td>
            <td>${role.employees.length}</td>
            <td>${formatCurrency(role.totalSales)}</td>
            <td>${formatCurrency(role.averageSales)}</td>
            <td>${role.topPerformer ? role.topPerformer.name + ' (' + formatCurrency(role.topPerformer.sales) + ')' : '-'}</td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    
    // إنشاء رسم بياني للأدوار (باستخدام div بسيط كمثال)
    const chartContainer = document.getElementById('roles-chart-container');
    chartContainer.innerHTML = '';
    
    // حساب أقصى قيمة للمبيعات بين الأدوار
    const maxSales = Math.max(...report.roles.map(role => role.totalSales));
    
    const chartHtml = `
    <div style="display: flex; height: 100%; align-items: flex-end; justify-content: space-around; margin-top: 20px;">
        ${report.roles.map((role, index) => {
            // تحديد لون مختلف لكل دور
            const colors = ['var(--primary-color)', 'var(--secondary-color)', '#e74c3c', '#f39c12', '#9b59b6'];
            const color = colors[index % colors.length];
            
            return `
            <div style="display: flex; flex-direction: column; align-items: center; width: ${100 / report.roles.length}%;">
                <div style="height: ${role.totalSales / maxSales * 250}px; width: 80px; background-color: ${color}; border-radius: 5px 5px 0 0;"></div>
                <div style="margin-top: 10px; text-align: center;">${role.role}</div>
                <div style="margin-top: 5px; text-align: center; font-size: 12px;">${formatCurrency(role.totalSales)}</div>
            </div>`;
        }).join('')}
    </div>`;
    
    chartContainer.innerHTML = chartHtml;
}

// 9. توليد وعرض التقرير المناسب
function generateEmployeeReport() {
    // الحصول على نوع التقرير النشط
    const activeTab = document.querySelector('.settings-tab[data-report].active');
    const reportType = activeTab.getAttribute('data-report');
    
    // الحصول على نطاق التاريخ
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    if (!startDate || !endDate) {
        showNotification('يرجى تحديد نطاق التاريخ', 'error');
        return;
    }
    
    // توليد التقرير المناسب
    switch (reportType) {
        case 'performance':
            const performanceReport = employeeReports.getPerformanceReport(startDate, endDate);
            displayPerformanceReport(performanceReport);
            break;
            
        case 'growth':
            const previousStart = document.getElementById('report-previous-start').value;
            const previousEnd = document.getElementById('report-previous-end').value;
            
            if (!previousStart || !previousEnd) {
                showNotification('يرجى تحديد نطاق الفترة السابقة', 'error');
                return;
            }
            
            const growthReport = employeeReports.getGrowthReport(startDate, endDate, previousStart, previousEnd);
            displayGrowthReport(growthReport);
            break;
            
        case 'hours':
            const hoursReport = employeeReports.getWorkingHoursReport(startDate, endDate);
            displayHoursReport(hoursReport);
            break;
            
        case 'roles':
            const rolesReport = employeeReports.getRoleComparisonReport(startDate, endDate);
            displayRolesReport(rolesReport);
            break;
    }
}

// 10. طباعة التقرير
function printEmployeeReport() {
    // الحصول على نوع التقرير النشط
    const activeTab = document.querySelector('.settings-tab[data-report].active');
    const reportType = activeTab.getAttribute('data-report');
    
    // الحصول على نطاق التاريخ
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    // تحديد عنوان التقرير
    let reportTitle = '';
    switch (reportType) {
        case 'performance':
            reportTitle = 'تقرير أداء الموظفين';
            break;
        case 'growth':
            reportTitle = 'تقرير نمو مبيعات الموظفين';
            break;
        case 'hours':
            reportTitle = 'تقرير ساعات عمل الموظفين';
            break;
        case 'roles':
            reportTitle = 'تقرير مقارنة أداء الأدوار';
            break;
    }
    
    // الحصول على محتوى الجدول
    const reportPanel = document.querySelector(`.report-panel.active`);
    const tableContent = reportPanel.querySelector('table').innerHTML;
    
    // فتح نافذة طباعة جديدة
    const printWindow = window.open('', '_blank');
    
    // إنشاء محتوى الطباعة
    const printContent = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
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
            .growth-positive {
                color: #27ae60;
                font-weight: bold;
            }
            .growth-negative {
                color: #e74c3c;
                font-weight: bold;
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
        <h1>${reportTitle}</h1>
        <div class="subtitle">الفترة من ${new Date(startDate).toLocaleDateString()} إلى ${new Date(endDate).toLocaleDateString()}</div>
        
        <table>
            ${tableContent}
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

// 11. إضافة زر تقارير الموظفين إلى نافذة التقارير الرئيسية
function addEmployeeReportsButton() {
    const reportsModalFooter = document.querySelector('#reports-modal .modal-footer');
    
    if (reportsModalFooter) {
        const employeeReportsButton = document.createElement('button');
        employeeReportsButton.className = 'btn btn-primary';
        employeeReportsButton.id = 'btn-employee-reports';
        employeeReportsButton.innerHTML = `
            <i class="fas fa-user-tie"></i>
            تقارير الموظفين
        `;
        
        // إضافة الزر قبل زر الإغلاق
        reportsModalFooter.insertBefore(employeeReportsButton, document.getElementById('close-reports'));
        
        // إضافة مستمع الأحداث للزر
        employeeReportsButton.addEventListener('click', function() {
            // إخفاء نافذة التقارير الرئيسية
            document.getElementById('reports-modal').style.display = 'none';
            
            // إظهار نافذة تقارير الموظفين
            showEmployeeReportsModal();
        });
    }
}

// 12. عرض نافذة تقارير الموظفين
function showEmployeeReportsModal() {
    // إنشاء النافذة إذا لم تكن موجودة
    if (!document.getElementById('employee-reports-modal')) {
        createEmployeeReportsModal();
        setupReportTabs();
        
        // إضافة مستمعي الأحداث
        document.getElementById('close-employee-reports-modal').addEventListener('click', function() {
            document.getElementById('employee-reports-modal').style.display = 'none';
        });
        
        document.getElementById('close-employee-reports').addEventListener('click', function() {
            document.getElementById('employee-reports-modal').style.display = 'none';
        });
        
        document.getElementById('generate-emp-report').addEventListener('click', generateEmployeeReport);
        
        document.getElementById('print-employee-report').addEventListener('click', printEmployeeReport);
    }
    
    // تعيين تواريخ افتراضية (الشهر الحالي)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('report-start-date').valueAsDate = firstDayOfMonth;
    document.getElementById('report-end-date').valueAsDate = today;
    
    // تعيين تواريخ الفترة السابقة (الشهر السابق)
    const firstDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    document.getElementById('report-previous-start').valueAsDate = firstDayOfPreviousMonth;
    document.getElementById('report-previous-end').valueAsDate = lastDayOfPreviousMonth;
    
    // عرض النافذة
    document.getElementById('employee-reports-modal').style.display = 'flex';
}

// 13. تهيئة نظام تقارير الموظفين
function initEmployeeReportsSystem() {
    // إضافة زر تقارير الموظفين إلى نافذة التقارير الرئيسية
    addEmployeeReportsButton();
}

// تهيئة نظام تقارير الموظفين عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initEmployeeReportsSystem();
});r