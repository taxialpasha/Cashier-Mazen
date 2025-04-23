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

// تهيئة نظام إدارة الموظفين عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إنشاء بيانات الموظفين الافتراضية
    createDefaultEmployees();
    
    // تهيئة نظام إدارة الموظفين
    initEmployeeSystem();
    
    // إضافة مستمع للضغط على مفتاح Escape لإغلاق نوافذ تسجيل الدخول وإدارة الموظفين
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
        }
    });
});