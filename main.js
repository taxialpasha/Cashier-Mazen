/**
 * نظام نقطة البيع المتكامل - الملف الرئيسي
 * ===================================
 * هذا الملف يقوم بتهيئة التطبيق وربط جميع المكونات معاً
 */

// المتغيرات العامة للتطبيق
let currentUser = null;
let currentBranch = null;
let appSettings = null;
let darkMode = false;
let dbRef = null;

// تحميل التطبيق عند اكتمال تحميل المستند
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة Firebase
    dbRef = firebase.database();
    
    // تحقق من حالة تسجيل الدخول
    checkAuthState();
    
    // إعداد مستمعي الأحداث للنماذج
    setupEventListeners();
});

/**
 * التحقق من حالة تسجيل الدخول
 */
function checkAuthState() {
    showLoading('جاري التحقق من حالة تسجيل الدخول...');
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // المستخدم مسجل الدخول
            getUserData(user.uid);
        } else {
            // المستخدم غير مسجل الدخول
            hideLoading();
            showLoginForm();
        }
    });
}

/**
 * الحصول على بيانات المستخدم
 * @param {string} userId معرف المستخدم
 */
function getUserData(userId) {
    dbRef.ref(`users/${userId}`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                currentUser = snapshot.val();
                currentUser.id = userId;
                
                // التحقق من الفرع المحدد
                if (currentUser.lastBranch) {
                    getBranchData(currentUser.lastBranch);
                } else {
                    // استخدام الفرع الرئيسي
                    dbRef.ref('branches').orderByChild('type').equalTo('main').once('value')
                        .then(branchSnapshot => {
                            let mainBranch = null;
                            branchSnapshot.forEach(childSnapshot => {
                                mainBranch = childSnapshot.val();
                                mainBranch.id = childSnapshot.key;
                                return true; // للخروج من الحلقة بعد العثور على أول فرع رئيسي
                            });
                            
                            if (mainBranch) {
                                getBranchData(mainBranch.id);
                            } else {
                                // إنشاء فرع رئيسي افتراضي إذا لم يوجد
                                createDefaultBranch();
                            }
                        })
                        .catch(error => {
                            console.error('خطأ في الحصول على بيانات الفرع الرئيسي:', error);
                            hideLoading();
                            showNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات الفرع. يرجى المحاولة مرة أخرى.', 'error');
                        });
                }
            } else {
                // المستخدم موجود في Firebase Auth ولكن ليس لديه بيانات في قاعدة البيانات
                signOut();
                showNotification('خطأ', 'لم يتم العثور على بيانات المستخدم. يرجى التواصل مع المسؤول.', 'error');
            }
        })
        .catch(error => {
            console.error('خطأ في الحصول على بيانات المستخدم:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات المستخدم. يرجى المحاولة مرة أخرى.', 'error');
        });
}

/**
 * الحصول على بيانات الفرع
 * @param {string} branchId معرف الفرع
 */
function getBranchData(branchId) {
    dbRef.ref(`branches/${branchId}`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                currentBranch = snapshot.val();
                currentBranch.id = branchId;
                
                // حفظ الفرع الأخير للمستخدم
                dbRef.ref(`users/${currentUser.id}`).update({
                    lastBranch: branchId,
                    lastLogin: new Date().toISOString()
                });
                
                // تحميل إعدادات التطبيق
                loadAppSettings();
            } else {
                // الفرع غير موجود
                hideLoading();
                showNotification('خطأ', 'لم يتم العثور على بيانات الفرع. يرجى التواصل مع المسؤول.', 'error');
            }
        })
        .catch(error => {
            console.error('خطأ في الحصول على بيانات الفرع:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات الفرع. يرجى المحاولة مرة أخرى.', 'error');
        });
}

/**
 * تحميل إعدادات التطبيق
 */
function loadAppSettings() {
    dbRef.ref('settings').once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                appSettings = snapshot.val();
            } else {
                // إنشاء إعدادات افتراضية إذا لم توجد
                appSettings = createDefaultSettings();
            }
            
            // تهيئة واجهة المستخدم
            initializeApp();
        })
        .catch(error => {
            console.error('خطأ في تحميل إعدادات التطبيق:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء تحميل إعدادات التطبيق. يرجى المحاولة مرة أخرى.', 'error');
        });
}

/**
 * إنشاء فرع رئيسي افتراضي
 */
function createDefaultBranch() {
    const defaultBranch = {
        name: 'الفرع الرئيسي',
        code: 'MAIN',
        address: 'الموقع الرئيسي',
        phone: '',
        manager: currentUser.id,
        type: 'main',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id
    };
    
    const newBranchRef = dbRef.ref('branches').push();
    newBranchRef.set(defaultBranch)
        .then(() => {
            defaultBranch.id = newBranchRef.key;
            currentBranch = defaultBranch;
            
            // حفظ الفرع الأخير للمستخدم
            dbRef.ref(`users/${currentUser.id}`).update({
                lastBranch: newBranchRef.key,
                lastLogin: new Date().toISOString()
            });
            
            // تحميل إعدادات التطبيق
            loadAppSettings();
        })
        .catch(error => {
            console.error('خطأ في إنشاء الفرع الافتراضي:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء إنشاء الفرع الافتراضي. يرجى المحاولة مرة أخرى.', 'error');
        });
}

/**
 * إنشاء إعدادات افتراضية للتطبيق
 */
function createDefaultSettings() {
    const defaultSettings = {
        general: {
            storeName: 'متجر السعادة',
            storePhone: '0123456789',
            storeAddress: 'العنوان الرئيسي',
            storeEmail: 'info@example.com',
            storeWebsite: 'www.example.com',
            currency: 'IQD',
            currencySymbol: 'دينار',
            currencyPosition: 'after',
            decimalSeparator: '.',
            thousandSeparator: ',',
            decimalPlaces: 0,
            fiscalYearStart: '2025-01-01'
        },
        pos: {
            defaultView: 'grid',
            defaultCategory: 'all',
            showStockWarning: true,
            allowSellOutOfStock: false,
            clearCartAfterSale: true,
            automaticBarcodesFocus: true,
            defaultTaxIncluded: true,
            lowStockThreshold: 10,
            defaultBarcodeType: 'EAN13',
            barcodePrefix: '200',
            productCodeLength: 8
        },
        invoices: {
            invoicePrefix: 'INV-',
            receiptSize: '80mm',
            receiptFooter: 'شكراً لتسوقكم معنا\nنتمنى لكم يوماً سعيداً',
            showTaxInReceipt: true,
            showCashierInReceipt: true,
            printReceiptAutomatically: false,
            saveReceiptPDF: true,
            defaultPrinter: 'default',
            printCopies: 1
        },
        tax: {
            enableTax: true,
            taxType: 'percentage',
            taxRate: 15,
            taxIncludedInPrice: true,
            applyTaxPerItem: false
        },
        customers: {
            enablePointsSystem: true,
            pointsPerCurrency: 0.1,
            pointsValue: 0.02,
            minimumPointsRedeem: 100,
            pointsExpiryDays: 365,
            enableCustomerReminders: false,
            reminderDays: 30,
            reminderMessage: 'مرحباً {اسم_العميل}، نود تذكيرك أنه لم نراك منذ فترة. نحن نقدم خصماً خاصاً {نسبة_الخصم}% على زيارتك القادمة. نتطلع لرؤيتك مرة أخرى!'
        },
        appearance: {
            themeMode: 'light',
            fontSize: 'medium',
            primaryColor: '#3498db',
            showAnimations: true,
            compactMode: false,
            defaultPage: 'pos'
        }
    };
    
    // حفظ الإعدادات الافتراضية في قاعدة البيانات
    dbRef.ref('settings').set(defaultSettings)
        .catch(error => {
            console.error('خطأ في حفظ الإعدادات الافتراضية:', error);
        });
    
    return defaultSettings;
}

/**
 * تهيئة التطبيق
 */
function initializeApp() {
    // تعيين اسم المستخدم وصلاحيته
    document.getElementById('current-user-name').textContent = `مرحباً، ${currentUser.fullName}`;
    document.getElementById('current-user-role').textContent = getCurrentRoleName(currentUser.role);
    
    // تعيين اسم الفرع الحالي
    document.getElementById('current-branch-name').textContent = currentBranch.name;
    
    // تحميل البيانات الأساسية
    loadCategories();
    loadProducts();
    loadCustomers();
    
    // تهيئة الواجهة حسب صلاحيات المستخدم
    setupUserInterface();
    
    // إخفاء شاشة تسجيل الدخول وإظهار التطبيق
    hideLoading();
    hideLoginForm();
    showAppContainer();
    
    // تسجيل النشاط
    logUserActivity('login', 'تسجيل الدخول إلى النظام');
    
    // عرض رسالة ترحيب
    showNotification('مرحباً', `مرحباً بك ${currentUser.fullName} في نظام نقطة البيع`, 'success');
}

/**
 * إعداد واجهة المستخدم حسب صلاحيات المستخدم
 */
function setupUserInterface() {
    // إخفاء العناصر حسب صلاحيات المستخدم
    if (currentUser.role !== 'admin') {
        // إخفاء لوحة الإدارة للمستخدمين غير المدراء
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // تطبيق وضع الظلام إذا كان مفعلاً
    if (appSettings.appearance.themeMode === 'dark' || 
        (appSettings.appearance.themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        toggleDarkMode(true);
    }
    
    // تعيين الصفحة الافتراضية
    const defaultPage = appSettings.appearance.defaultPage || 'pos';
    const defaultPageButton = document.querySelector(`.nav-link[data-page="${defaultPage}"]`);
    if (defaultPageButton) {
        changePage(defaultPage);
    }
}

/**
 * الحصول على اسم الصلاحية
 * @param {string} role رمز الصلاحية
 * @returns {string} اسم الصلاحية
 */
function getCurrentRoleName(role) {
    switch (role) {
        case 'admin':
            return 'مدير';
        case 'manager':
            return 'مشرف';
        case 'cashier':
            return 'كاشير';
        case 'inventory':
            return 'مسؤول مخزون';
        default:
            return 'مستخدم';
    }
}

/**
 * إعداد مستمعي الأحداث للتطبيق
 */
function setupEventListeners() {
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // أزرار التنقل
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const page = this.dataset.page;
            changePage(page);
        });
    });
    
    // زر تبديل الإشعارات
    const notificationBtn = document.getElementById('notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            showModal('notifications-modal');
            loadNotifications();
        });
    }
    
    // قائمة المستخدم المنسدلة
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function() {
            userDropdown.classList.toggle('show');
        });
        
        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', function(event) {
            if (!userMenuBtn.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
    
    // زر إعدادات الملف الشخصي
    const profileSettingsBtn = document.getElementById('profile-settings-btn');
    if (profileSettingsBtn) {
        profileSettingsBtn.addEventListener('click', function() {
            showProfileModal();
            userDropdown.classList.remove('show');
        });
    }
    
    // زر إعدادات النظام
    const systemSettingsBtn = document.getElementById('system-settings-btn');
    if (systemSettingsBtn) {
        systemSettingsBtn.addEventListener('click', function() {
            showSettingsModal();
            userDropdown.classList.remove('show');
        });
    }
    
    // زر النسخ الاحتياطي
    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', function() {
            showModal('backup-modal');
            loadBackupHistory();
            userDropdown.classList.remove('show');
        });
    }
    
    // أزرار إغلاق المودال
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    // النقر على خلفية المودال
    const modalBackdrop = document.querySelector('.modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', function() {
            closeAllModals();
        });
    }
    
    // تمرير الأحداث إلى الوحدات المتخصصة
    setupPosEventListeners();
    setupInventoryEventListeners();
    setupCustomersEventListeners();
    setupReportsEventListeners();
    setupAdminEventListeners();
    setupSettingsEventListeners();
}

/**
 * معالجة تسجيل الدخول
 * @param {Event} event حدث النموذج
 */
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const branchId = document.getElementById('branch-selection').value;
    
    if (!username || !password) {
        showNotification('خطأ', 'يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }
    
    showLoading('جاري تسجيل الدخول...');
    
    // البحث عن المستخدم في قاعدة البيانات
    dbRef.ref('users').orderByChild('username').equalTo(username).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                let userId = null;
                let userData = null;
                
                snapshot.forEach(childSnapshot => {
                    userId = childSnapshot.key;
                    userData = childSnapshot.val();
                });
                
                // التسجيل باستخدام Firebase Auth
                return firebase.auth().signInWithEmailAndPassword(userData.email, password)
                    .then(() => {
                        // تحديث بيانات الفرع المحدد
                        if (branchId) {
                            dbRef.ref(`users/${userId}`).update({
                                lastBranch: branchId,
                                lastLogin: new Date().toISOString()
                            });
                        }
                    })
                    .catch(error => {
                        console.error('خطأ في تسجيل الدخول:', error);
                        hideLoading();
                        
                        if (error.code === 'auth/wrong-password') {
                            showNotification('خطأ', 'كلمة المرور غير صحيحة', 'error');
                        } else if (error.code === 'auth/user-not-found') {
                            showNotification('خطأ', 'البريد الإلكتروني غير مسجل', 'error');
                        } else {
                            showNotification('خطأ', 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.', 'error');
                        }
                    });
            } else {
                hideLoading();
                showNotification('خطأ', 'اسم المستخدم غير موجود', 'error');
            }
        })
        .catch(error => {
            console.error('خطأ في البحث عن المستخدم:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.', 'error');
        });
}

/**
 * معالجة تسجيل الخروج
 */
function handleLogout() {
    showLoading('جاري تسجيل الخروج...');
    
    // تسجيل النشاط
    logUserActivity('logout', 'تسجيل الخروج من النظام')
        .then(() => {
            // تسجيل الخروج من Firebase
            return firebase.auth().signOut();
        })
        .then(() => {
            hideLoading();
            hideAppContainer();
            showLoginForm();
            showNotification('تسجيل الخروج', 'تم تسجيل الخروج بنجاح', 'info');
        })
        .catch(error => {
            console.error('خطأ في تسجيل الخروج:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.', 'error');
        });
}

/**
 * تسجيل نشاط المستخدم
 * @param {string} activityType نوع النشاط
 * @param {string} description وصف النشاط
 * @param {Object} data بيانات إضافية
 */
function logUserActivity(activityType, description, data = {}) {
    if (!currentUser) return Promise.resolve();
    
    const activity = {
        type: activityType,
        description: description,
        userId: currentUser.id,
        username: currentUser.username,
        branchId: currentBranch ? currentBranch.id : null,
        branchName: currentBranch ? currentBranch.name : null,
        timestamp: new Date().toISOString(),
        data: data
    };
    
    return dbRef.ref('activity_logs').push(activity);
}

/**
 * تغيير الصفحة الحالية
 * @param {string} pageName اسم الصفحة
 */
function changePage(pageName) {
    // إزالة الفئة النشطة من جميع أزرار التنقل
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // إضافة الفئة النشطة للزر المحدد
    const activeNavLink = document.querySelector(`.nav-link[data-page="${pageName}"]`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
    
    // إخفاء جميع الصفحات
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار الصفحة المحددة
    const activePage = document.getElementById(`${pageName}-page`);
    if (activePage) {
        activePage.classList.add('active');
        
        // استدعاء دالة التحميل الخاصة بالصفحة إذا كانت موجودة
        switch (pageName) {
            case 'pos':
                refreshPosPage();
                break;
            case 'inventory':
                refreshInventoryPage();
                break;
            case 'reports':
                refreshReportsPage();
                break;
            case 'customers':
                refreshCustomersPage();
                break;
            case 'admin':
                refreshAdminPage();
                break;
        }
    }
}

/**
 * تحميل قائمة الفروع في نموذج تسجيل الدخول
 */
function loadBranchesForLogin() {
    const branchSelection = document.getElementById('branch-selection');
    if (!branchSelection) return;
    
    // تفريغ القائمة
    branchSelection.innerHTML = '';
    
    // إضافة عنصر تحميل
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'جاري تحميل الفروع...';
    branchSelection.appendChild(loadingOption);
    
    // تحميل الفروع من قاعدة البيانات
    dbRef.ref('branches').once('value')
        .then(snapshot => {
            // تفريغ القائمة
            branchSelection.innerHTML = '';
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const branch = childSnapshot.val();
                    const option = document.createElement('option');
                    option.value = childSnapshot.key;
                    option.textContent = branch.name;
                    branchSelection.appendChild(option);
                });
            } else {
                // إضافة عنصر افتراضي
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'الفرع الرئيسي';
                branchSelection.appendChild(defaultOption);
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل الفروع:', error);
            
            // تفريغ القائمة وإضافة عنصر افتراضي
            branchSelection.innerHTML = '';
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = 'خطأ في تحميل الفروع';
            branchSelection.appendChild(errorOption);
        });
}

/**
 * تبديل وضع الظلام
 * @param {boolean} enable تفعيل/تعطيل وضع الظلام
 */
function toggleDarkMode(enable) {
    if (enable) {
        document.body.classList.add('dark-mode');
        darkMode = true;
    } else {
        document.body.classList.remove('dark-mode');
        darkMode = false;
    }
    
    // تحديث الإعدادات إذا كان المستخدم مسجل الدخول
    if (currentUser && appSettings) {
        appSettings.appearance.themeMode = darkMode ? 'dark' : 'light';
        dbRef.ref('settings/appearance').update({
            themeMode: appSettings.appearance.themeMode
        });
    }
}

/**
 * إظهار نموذج تسجيل الدخول
 */
function showLoginForm() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
        loginContainer.style.display = 'flex';
    }
    
    // تحميل قائمة الفروع
    loadBranchesForLogin();
    
    // تنفيذ بعض إعدادات نموذج تسجيل الدخول
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
}

/**
 * إخفاء نموذج تسجيل الدخول
 */
function hideLoginForm() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
        loginContainer.style.display = 'none';
    }
}

/**
 * إظهار حاوية التطبيق
 */
function showAppContainer() {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.style.display = 'flex';
    }
}

/**
 * إخفاء حاوية التطبيق
 */
function hideAppContainer() {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.style.display = 'none';
    }
}

/**
 * إظهار مؤشر التحميل
 * @param {string} message رسالة التحميل
 */
function showLoading(message = 'جاري التحميل...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    if (loadingOverlay && loadingText) {
        loadingText.textContent = message;
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * إخفاء مؤشر التحميل
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        
        }
}

/**
 * إظهار إشعار للمستخدم
 * @param {string} title عنوان الإشعار
 * @param {string} message رسالة الإشعار
 * @param {string} type نوع الإشعار (success, error, warning, info)
 */
function showNotification(title, message, type = 'info') {
    // استخدام مكتبة SweetAlert2 لعرض الإشعارات
    Swal.fire({
        title: title,
        text: message,
        icon: type,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
    
    // تسجيل الإشعار في النظام إذا كان مهماً
    if (type === 'error' || type === 'warning') {
        saveNotification(title, message, type);
    }
}

/**
 * حفظ الإشعار في قاعدة البيانات
 * @param {string} title عنوان الإشعار
 * @param {string} message رسالة الإشعار
 * @param {string} type نوع الإشعار
 */
function saveNotification(title, message, type) {
    if (!currentUser) return;
    
    const notification = {
        title: title,
        message: message,
        type: type,
        userId: currentUser.id,
        branchId: currentBranch ? currentBranch.id : null,
        isRead: false,
        timestamp: new Date().toISOString()
    };
    
    dbRef.ref('notifications').push(notification)
        .catch(error => {
            console.error('خطأ في حفظ الإشعار:', error);
        });
}

/**
 * تحميل الإشعارات للمستخدم الحالي
 */
function loadNotifications() {
    if (!currentUser) return;
    
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) return;
    
    // عرض رسالة تحميل
    notificationsList.innerHTML = '<div class="loading-message">جاري تحميل الإشعارات...</div>';
    
    // تحميل الإشعارات من قاعدة البيانات
    dbRef.ref('notifications')
        .orderByChild('userId')
        .equalTo(currentUser.id)
        .limitToLast(50)
        .once('value')
        .then(snapshot => {
            notificationsList.innerHTML = '';
            
            if (snapshot.exists()) {
                let notifications = [];
                
                snapshot.forEach(childSnapshot => {
                    const notification = childSnapshot.val();
                    notification.id = childSnapshot.key;
                    notifications.push(notification);
                });
                
                // ترتيب الإشعارات حسب التاريخ (الأحدث أولاً)
                notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // عرض الإشعارات
                notifications.forEach(notification => {
                    const notificationElement = createNotificationElement(notification);
                    notificationsList.appendChild(notificationElement);
                });
                
                // تحديث عدد الإشعارات غير المقروءة
                updateUnreadNotificationsCount();
            } else {
                notificationsList.innerHTML = '<div class="empty-message">لا توجد إشعارات</div>';
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل الإشعارات:', error);
            notificationsList.innerHTML = '<div class="error-message">حدث خطأ أثناء تحميل الإشعارات</div>';
        });
}

/**
 * إنشاء عنصر إشعار
 * @param {Object} notification بيانات الإشعار
 * @returns {HTMLElement} عنصر الإشعار
 */
function createNotificationElement(notification) {
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item ${notification.isRead ? '' : 'unread'}`;
    notificationItem.dataset.id = notification.id;
    
    // تحديد الأيقونة حسب نوع الإشعار
    let iconClass = 'fa-info-circle';
    switch (notification.type) {
        case 'success':
            iconClass = 'fa-check-circle';
            break;
        case 'error':
            iconClass = 'fa-times-circle';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle';
            break;
    }
    
    // تنسيق التاريخ
    const date = new Date(notification.timestamp);
    const formattedDate = formatDate(date);
    
    notificationItem.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formattedDate}</div>
        </div>
        <div class="notification-actions">
            <button class="action-btn mark-read" title="تعيين كمقروء" ${notification.isRead ? 'style="display:none"' : ''}>
                <i class="fas fa-check"></i>
            </button>
            <button class="action-btn delete" title="حذف">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // إضافة مستمعي الأحداث
    const markReadBtn = notificationItem.querySelector('.mark-read');
    const deleteBtn = notificationItem.querySelector('.delete');
    
    if (markReadBtn) {
        markReadBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            markNotificationAsRead(notification.id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteNotification(notification.id);
        });
    }
    
    // تعيين الإشعار كمقروء عند النقر عليه
    notificationItem.addEventListener('click', function() {
        if (!notification.isRead) {
            markNotificationAsRead(notification.id);
        }
    });
    
    return notificationItem;
}

/**
 * تعيين إشعار كمقروء
 * @param {string} notificationId معرف الإشعار
 */
function markNotificationAsRead(notificationId) {
    dbRef.ref(`notifications/${notificationId}`).update({
        isRead: true
    })
    .then(() => {
        const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.classList.remove('unread');
            const markReadBtn = notificationItem.querySelector('.mark-read');
            if (markReadBtn) {
                markReadBtn.style.display = 'none';
            }
        }
        
        // تحديث عدد الإشعارات غير المقروءة
        updateUnreadNotificationsCount();
    })
    .catch(error => {
        console.error('خطأ في تعيين الإشعار كمقروء:', error);
    });
}

/**
 * حذف إشعار
 * @param {string} notificationId معرف الإشعار
 */
function deleteNotification(notificationId) {
    dbRef.ref(`notifications/${notificationId}`).remove()
    .then(() => {
        const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.remove();
        }
        
        // تحديث عدد الإشعارات غير المقروءة
        updateUnreadNotificationsCount();
        
        // عرض رسالة "لا توجد إشعارات" إذا لم يتبق أي إشعارات
        const notificationsList = document.getElementById('notifications-list');
        if (notificationsList && notificationsList.childElementCount === 0) {
            notificationsList.innerHTML = '<div class="empty-message">لا توجد إشعارات</div>';
        }
    })
    .catch(error => {
        console.error('خطأ في حذف الإشعار:', error);
    });
}

/**
 * تحديث عدد الإشعارات غير المقروءة
 */
function updateUnreadNotificationsCount() {
    if (!currentUser) return;
    
    dbRef.ref('notifications')
        .orderByChild('userId')
        .equalTo(currentUser.id)
        .once('value')
        .then(snapshot => {
            let unreadCount = 0;
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const notification = childSnapshot.val();
                    if (!notification.isRead) {
                        unreadCount++;
                    }
                });
            }
            
            const notificationCount = document.getElementById('notification-count');
            if (notificationCount) {
                notificationCount.textContent = unreadCount;
                if (unreadCount > 0) {
                    notificationCount.style.display = 'flex';
                } else {
                    notificationCount.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('خطأ في تحديث عدد الإشعارات غير المقروءة:', error);
        });
}

/**
 * إظهار مودال
 * @param {string} modalId معرف المودال
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const modalBackdrop = document.querySelector('.modal-backdrop');
    
    if (modal && modalBackdrop) {
        modal.style.display = 'block';
        modalBackdrop.style.display = 'block';
    }
}

/**
 * إخفاء مودال
 * @param {string} modalId معرف المودال
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.style.display = 'none';
        
        // التحقق ما إذا كانت هناك مودالات أخرى مفتوحة
        const openModals = document.querySelectorAll('.modal[style="display: block;"]');
        if (openModals.length === 0) {
            // إخفاء خلفية المودال
            const modalBackdrop = document.querySelector('.modal-backdrop');
            if (modalBackdrop) {
                modalBackdrop.style.display = 'none';
            }
        }
    }
}

/**
 * إغلاق جميع المودالات
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    if (modalBackdrop) {
        modalBackdrop.style.display = 'none';
    }
}

/**
 * تنسيق التاريخ
 * @param {Date} date كائن التاريخ
 * @returns {string} التاريخ المنسق
 */
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diff / (1000 * 60));
    
    if (diffMinutes < 1) {
        return 'الآن';
    } else if (diffMinutes < 60) {
        return `منذ ${diffMinutes} دقيقة${diffMinutes > 1 ? '' : ''}`;
    } else if (diffHours < 24) {
        return `منذ ${diffHours} ساعة${diffHours > 1 ? '' : ''}`;
    } else if (diffDays < 30) {
        return `منذ ${diffDays} يوم${diffDays > 1 ? '' : ''}`;
    } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

/**
 * تنسيق العملة
 * @param {number} amount المبلغ
 * @returns {string} المبلغ المنسق
 */
function formatCurrency(amount) {
    if (!appSettings) return `${amount} دينار`;
    
    const { 
        currency, 
        currencySymbol, 
        currencyPosition, 
        decimalSeparator, 
        thousandSeparator, 
        decimalPlaces 
    } = appSettings.general;
    
    // تقريب المبلغ
    amount = parseFloat(amount).toFixed(decimalPlaces);
    
    // تقسيم المبلغ إلى جزء صحيح وجزء عشري
    let [integerPart, decimalPart] = amount.split('.');
    
    // إضافة فواصل الآلاف
    if (thousandSeparator) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    }
    
    // إعادة تكوين المبلغ
    amount = decimalPart !== undefined
        ? `${integerPart}${decimalSeparator}${decimalPart}`
        : integerPart;
    
    // إضافة رمز العملة
    return currencyPosition === 'before'
        ? `${currencySymbol} ${amount}`
        : `${amount} ${currencySymbol}`;
}

/**
 * توليد رقم عشوائي
 * @param {number} min القيمة الدنيا
 * @param {number} max القيمة القصوى
 * @returns {number} رقم عشوائي
 */
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * توليد رمز عشوائي
 * @param {number} length طول الرمز
 * @param {boolean} includeLetters تضمين الحروف
 * @param {boolean} includeNumbers تضمين الأرقام
 * @returns {string} رمز عشوائي
 */
function generateRandomCode(length, includeLetters = true, includeNumbers = true) {
    let chars = '';
    if (includeLetters) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
}

/**
 * توليد باركود عشوائي
 * @param {string} type نوع الباركود
 * @returns {string} باركود عشوائي
 */
function generateBarcode(type = 'EAN13') {
    let prefix = appSettings?.pos?.barcodePrefix || '200';
    let length = 0;
    
    switch (type) {
        case 'EAN13':
            length = 13;
            break;
        case 'CODE128':
        case 'CODE39':
            length = 12;
            break;
        case 'UPC':
            length = 12;
            prefix = '0';
            break;
        default:
            length = 13;
    }
    
    // توليد الأرقام العشوائية
    let barcode = prefix;
    for (let i = 0; i < length - prefix.length - 1; i++) {
        barcode += Math.floor(Math.random() * 10);
    }
    
    // حساب رقم التحقق (للرموز التي تحتاج إلى ذلك)
    if (type === 'EAN13' || type === 'UPC') {
        let sum = 0;
        for (let i = 0; i < barcode.length; i++) {
            sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        barcode += checkDigit;
    } else {
        // إضافة رقم عشوائي في حالة الرموز الأخرى
        barcode += Math.floor(Math.random() * 10);
    }
    
    return barcode;
}

/**
 * إنشاء ترقيم صفحات
 * @param {string} containerId معرف حاوية الترقيم
 * @param {number} currentPage الصفحة الحالية
 * @param {number} totalPages إجمالي عدد الصفحات
 * @param {Function} callback دالة الاستدعاء عند تغيير الصفحة
 */
function createPagination(containerId, currentPage, totalPages, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // زر الصفحة السابقة
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            callback(currentPage - 1);
        }
    });
    container.appendChild(prevBtn);
    
    // الصفحات
    const maxButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // إضافة زر الصفحة الأولى إذا لزم الأمر
    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.className = 'pagination-btn';
        firstPageBtn.textContent = '1';
        firstPageBtn.addEventListener('click', function() {
            callback(1);
        });
        container.appendChild(firstPageBtn);
        
        // إضافة زر الفاصل إذا لزم الأمر
        if (startPage > 2) {
            const ellipsisBtn = document.createElement('span');
            ellipsisBtn.className = 'pagination-ellipsis';
            ellipsisBtn.textContent = '...';
            container.appendChild(ellipsisBtn);
        }
    }
    
    // إضافة أزرار الصفحات
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', function() {
            callback(i);
        });
        container.appendChild(pageBtn);
    }
    
    // إضافة زر الصفحة الأخيرة إذا لزم الأمر
    if (endPage < totalPages) {
        // إضافة زر الفاصل إذا لزم الأمر
        if (endPage < totalPages - 1) {
            const ellipsisBtn = document.createElement('span');
            ellipsisBtn.className = 'pagination-ellipsis';
            ellipsisBtn.textContent = '...';
            container.appendChild(ellipsisBtn);
        }
        
        const lastPageBtn = document.createElement('button');
        lastPageBtn.className = 'pagination-btn';
        lastPageBtn.textContent = totalPages;
        lastPageBtn.addEventListener('click', function() {
            callback(totalPages);
        });
        container.appendChild(lastPageBtn);
    }
    
    // زر الصفحة التالية
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            callback(currentPage + 1);
        }
    });
    container.appendChild(nextBtn);
}

/**
 * تفعيل تبديل كلمة المرور
 */
function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });
}

/**
 * تحقق من قوة كلمة المرور
 * @param {string} password كلمة المرور
 * @returns {{score: number, message: string}} درجة القوة ورسالة
 */
function checkPasswordStrength(password) {
    let score = 0;
    let message = '';
    
    // التحقق من طول كلمة المرور
    if (password.length < 6) {
        return { score: 0, message: 'ضعيفة جداً' };
    } else if (password.length >= 10) {
        score += 2;
    } else {
        score += 1;
    }
    
    // التحقق من وجود أحرف كبيرة وصغيرة
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
        score += 1;
    }
    
    // التحقق من وجود أرقام
    if (/\d/.test(password)) {
        score += 1;
    }
    
    // التحقق من وجود رموز خاصة
    if (/[^a-zA-Z0-9]/.test(password)) {
        score += 1;
    }
    
    // تحديد الرسالة والدرجة
    if (score < 2) {
        message = 'ضعيفة';
    } else if (score < 3) {
        message = 'متوسطة';
    } else if (score < 5) {
        message = 'قوية';
    } else {
        message = 'قوية جداً';
    }
    
    return { score, message };
}

/**
 * تحديث مؤشر قوة كلمة المرور
 * @param {string} password كلمة المرور
 */
function updatePasswordStrength(password) {
    const strengthMeter = document.getElementById('password-strength-meter');
    const strengthText = document.getElementById('password-strength-text');
    
    if (!strengthMeter || !strengthText) return;
    
    const { score, message } = checkPasswordStrength(password);
    
    // تحديث النص
    strengthText.textContent = `قوة كلمة المرور: ${message}`;
    
    // تحديث شريط القوة
    strengthMeter.style.width = `${(score / 5) * 100}%`;
    
    // تحديث لون الشريط
    if (score < 2) {
        strengthMeter.style.backgroundColor = '#e74c3c';
    } else if (score < 3) {
        strengthMeter.style.backgroundColor = '#f39c12';
    } else if (score < 5) {
        strengthMeter.style.backgroundColor = '#2ecc71';
    } else {
        strengthMeter.style.backgroundColor = '#27ae60';
    }
}

/**
 * إظهار نموذج إعدادات الملف الشخصي
 */
function showProfileModal() {
    if (!currentUser) return;
    
    // تعبئة بيانات المستخدم
    document.getElementById('profile-name').textContent = currentUser.fullName;
    document.getElementById('profile-role').textContent = getCurrentRoleName(currentUser.role);
    
    document.getElementById('profile-fullname').value = currentUser.fullName;
    document.getElementById('profile-username').value = currentUser.username;
    document.getElementById('profile-email').value = currentUser.email;
    document.getElementById('profile-phone').value = currentUser.phone || '';
    
    // إظهار المودال
    showModal('profile-modal');
    
    // تفعيل تبديل كلمة المرور
    setupPasswordToggles();
    
    // إعداد مراقبة قوة كلمة المرور
    const newPasswordInput = document.getElementById('new-password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
}

/**
 * تحميل سجل النشاط للمستخدم
 * @param {string} dateRange نطاق التاريخ
 * @param {string} activityType نوع النشاط
 */
function loadUserActivity(dateRange = 'last-week', activityType = 'all') {
    if (!currentUser) return;
    
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // عرض رسالة تحميل
    activityList.innerHTML = '<div class="loading-message">جاري تحميل سجل النشاط...</div>';
    
    // تحديد نطاق التاريخ
    let startDate = new Date();
    let endDate = new Date();
    
    switch (dateRange) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'yesterday':
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(endDate.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'last-week':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'last-month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case 'custom':
            const fromDate = document.getElementById('activity-date-from').value;
            const toDate = document.getElementById('activity-date-to').value;
            
            if (fromDate) {
                startDate = new Date(fromDate);
                startDate.setHours(0, 0, 0, 0);
            }
            
            if (toDate) {
                endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999);
            }
            break;
    }
    
    // تحويل التواريخ إلى نص
    const startDateString = startDate.toISOString();
    const endDateString = endDate.toISOString();
    
    // إنشاء استعلام Firebase
    let query = dbRef.ref('activity_logs')
        .orderByChild('userId')
        .equalTo(currentUser.id);
    
    // تحميل البيانات
    query.once('value')
        .then(snapshot => {
            activityList.innerHTML = '';
            
            if (snapshot.exists()) {
                let activities = [];
                
                snapshot.forEach(childSnapshot => {
                    const activity = childSnapshot.val();
                    activity.id = childSnapshot.key;
                    
                    // تطبيق تصفية التاريخ
                    if (activity.timestamp < startDateString || activity.timestamp > endDateString) {
                        return;
                    }
                    
                    // تطبيق تصفية نوع النشاط
                    if (activityType !== 'all' && activity.type !== activityType) {
                        return;
                    }
                    
                    activities.push(activity);
                });
                
                // ترتيب الأنشطة حسب التاريخ (الأحدث أولاً)
                activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                if (activities.length === 0) {
                    activityList.innerHTML = '<div class="empty-message">لا توجد أنشطة</div>';
                    return;
                }
                
                // عرض الأنشطة
                activities.forEach(activity => {
                    const activityElement = createActivityElement(activity);
                    activityList.appendChild(activityElement);
                });
            } else {
                activityList.innerHTML = '<div class="empty-message">لا توجد أنشطة</div>';
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل سجل النشاط:', error);
            activityList.innerHTML = '<div class="error-message">حدث خطأ أثناء تحميل سجل النشاط</div>';
        });
}
/**
 * إنشاء عنصر نشاط
 * @param {Object} activity بيانات النشاط
 * @returns {HTMLElement} عنصر النشاط
 */
function createActivityElement(activity) {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    // تحديد الأيقونة حسب نوع النشاط
    let iconClass = 'fa-history';
    switch (activity.type) {
        case 'login':
            iconClass = 'fa-sign-in-alt';
            break;
        case 'logout':
            iconClass = 'fa-sign-out-alt';
            break;
        case 'sales':
            iconClass = 'fa-cash-register';
            break;
        case 'inventory':
            iconClass = 'fa-box';
            break;
        case 'settings':
            iconClass = 'fa-cog';
            break;
    }
    
    // تنسيق التاريخ
    const date = new Date(activity.timestamp);
    const formattedDate = formatDate(date);
    
    activityItem.innerHTML = `
        <div class="activity-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="activity-details">
            <p>${activity.description}</p>
            <div class="activity-time">
                <i class="far fa-clock"></i>
                <span>${formattedDate}</span>
            </div>
        </div>
    `;
    
    return activityItem;
}

/**
 * إظهار مودال الإعدادات
 */
function showSettingsModal() {
    if (!currentUser || !appSettings) return;
    
    // التحقق من صلاحية المستخدم
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
        showNotification('غير مصرح', 'ليس لديك صلاحية للوصول إلى إعدادات النظام', 'error');
        return;
    }
    
    // تعبئة بيانات الإعدادات العامة
    document.getElementById('store-name').value = appSettings.general.storeName;
    document.getElementById('store-phone').value = appSettings.general.storePhone;
    document.getElementById('store-address').value = appSettings.general.storeAddress;
    document.getElementById('store-email').value = appSettings.general.storeEmail;
    document.getElementById('store-website').value = appSettings.general.storeWebsite;
    document.getElementById('currency').value = appSettings.general.currency;
    document.getElementById('currency-position').value = appSettings.general.currencyPosition;
    document.getElementById('decimal-separator').value = appSettings.general.decimalSeparator;
    document.getElementById('thousand-separator').value = appSettings.general.thousandSeparator;
    document.getElementById('decimal-places').value = appSettings.general.decimalPlaces;
    document.getElementById('fiscal-year-start').value = appSettings.general.fiscalYearStart;
    
    // تعبئة بيانات إعدادات نقطة البيع
    document.getElementById('default-view').value = appSettings.pos.defaultView;
    document.getElementById('default-category').value = appSettings.pos.defaultCategory;
    document.getElementById('show-stock-warning').checked = appSettings.pos.showStockWarning;
    document.getElementById('allow-sell-out-of-stock').checked = appSettings.pos.allowSellOutOfStock;
    document.getElementById('clear-cart-after-sale').checked = appSettings.pos.clearCartAfterSale;
    document.getElementById('automatic-barcode-focus').checked = appSettings.pos.automaticBarcodesFocus;
    document.getElementById('default-tax-included').checked = appSettings.pos.defaultTaxIncluded;
    document.getElementById('low-stock-threshold').value = appSettings.pos.lowStockThreshold;
    document.getElementById('default-barcode-type').value = appSettings.pos.defaultBarcodeType;
    document.getElementById('barcode-prefix').value = appSettings.pos.barcodePrefix;
    document.getElementById('product-code-length').value = appSettings.pos.productCodeLength;
    
    // تعبئة بيانات إعدادات الفواتير
    document.getElementById('invoice-prefix').value = appSettings.invoices.invoicePrefix;
    document.getElementById('receipt-size').value = appSettings.invoices.receiptSize;
    document.getElementById('invoice-footer').value = appSettings.invoices.receiptFooter;
    document.getElementById('show-tax-in-receipt').checked = appSettings.invoices.showTaxInReceipt;
    document.getElementById('show-cashier-in-receipt').checked = appSettings.invoices.showCashierInReceipt;
    document.getElementById('print-receipt-automatically').checked = appSettings.invoices.printReceiptAutomatically;
    document.getElementById('save-receipt-pdf').checked = appSettings.invoices.saveReceiptPDF;
    document.getElementById('print-copies').value = appSettings.invoices.printCopies;
    
    // تعبئة بيانات إعدادات الضريبة
    document.getElementById('enable-tax').checked = appSettings.tax.enableTax;
    document.getElementById('tax-type').value = appSettings.tax.taxType;
    document.getElementById('tax-rate').value = appSettings.tax.taxRate;
    document.getElementById('tax-included-in-price').checked = appSettings.tax.taxIncludedInPrice;
    document.getElementById('apply-tax-per-item').checked = appSettings.tax.applyTaxPerItem;
    
    // تعبئة بيانات إعدادات العملاء
    document.getElementById('enable-points-system').checked = appSettings.customers.enablePointsSystem;
    document.getElementById('points-per-currency').value = appSettings.customers.pointsPerCurrency;
    document.getElementById('points-value').value = appSettings.customers.pointsValue;
    document.getElementById('minimum-points-redeem').value = appSettings.customers.minimumPointsRedeem;
    document.getElementById('points-expiry-days').value = appSettings.customers.pointsExpiryDays;
    document.getElementById('enable-customer-reminders').checked = appSettings.customers.enableCustomerReminders;
    document.getElementById('reminder-days').value = appSettings.customers.reminderDays;
    document.getElementById('reminder-message').value = appSettings.customers.reminderMessage;
    
    // تعبئة بيانات إعدادات المظهر
    document.getElementById('theme-mode').value = appSettings.appearance.themeMode;
    document.getElementById('font-size').value = appSettings.appearance.fontSize;
    document.getElementById('primary-color').value = appSettings.appearance.primaryColor;
    document.getElementById('show-animations').checked = appSettings.appearance.showAnimations;
    document.getElementById('compact-mode').checked = appSettings.appearance.compactMode;
    document.getElementById('default-page').value = appSettings.appearance.defaultPage;
    
    // تحميل فئات الضرائب
    loadTaxCategories();
    
    // إظهار المودال
    showModal('settings-modal');
}

/**
 * تحميل فئات الضرائب
 */
function loadTaxCategories() {
    const taxCategoriesBody = document.getElementById('tax-categories-body');
    if (!taxCategoriesBody) return;
    
    taxCategoriesBody.innerHTML = '';
    
    if (appSettings.tax.categories && appSettings.tax.categories.length > 0) {
        appSettings.tax.categories.forEach((category, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${category.name}</td>
                <td>${category.rate}%</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" data-index="${index}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            // إضافة مستمعي الأحداث
            const editBtn = row.querySelector('.edit');
            const deleteBtn = row.querySelector('.delete');
            
            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    editTaxCategory(index);
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    deleteTaxCategory(index);
                });
            }
            
            taxCategoriesBody.appendChild(row);
        });
    } else {
        taxCategoriesBody.innerHTML = '<tr><td colspan="3">لا توجد فئات ضريبية مخصصة</td></tr>';
    }
}

/**
 * تحرير فئة ضريبية
 * @param {number} index فهرس الفئة
 */
function editTaxCategory(index) {
    // يتم تنفيذ هذه الدالة في ملف settings.js
    console.log('تحرير فئة ضريبية:', index);
}

/**
 * حذف فئة ضريبية
 * @param {number} index فهرس الفئة
 */
function deleteTaxCategory(index) {
    // يتم تنفيذ هذه الدالة في ملف settings.js
    console.log('حذف فئة ضريبية:', index);
}

/**
 * تحميل سجل النسخ الاحتياطي
 */
function loadBackupHistory() {
    const backupHistoryBody = document.getElementById('backup-history-body');
    if (!backupHistoryBody) return;
    
    // عرض رسالة تحميل
    backupHistoryBody.innerHTML = '<tr><td colspan="6">جاري تحميل سجل النسخ الاحتياطي...</td></tr>';
    
    dbRef.ref('backup_history')
        .orderByChild('timestamp')
        .limitToLast(10)
        .once('value')
        .then(snapshot => {
            backupHistoryBody.innerHTML = '';
            
            if (snapshot.exists()) {
                let backups = [];
                
                snapshot.forEach(childSnapshot => {
                    const backup = childSnapshot.val();
                    backup.id = childSnapshot.key;
                    backups.push(backup);
                });
                
                // ترتيب النسخ حسب التاريخ (الأحدث أولاً)
                backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // عرض النسخ
                backups.forEach(backup => {
                    const row = document.createElement('tr');
                    
                    const date = new Date(backup.timestamp);
                    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    row.innerHTML = `
                        <td>${backup.name}</td>
                        <td>${formattedDate}</td>
                        <td>${formatFileSize(backup.size)}</td>
                        <td>${backup.userName}</td>
                        <td>${backup.type === 'auto' ? 'تلقائي' : 'يدوي'}</td>
                        <td>
                            <div class="table-actions">
                                <button class="action-btn download" data-id="${backup.id}" title="تنزيل">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="action-btn restore" data-id="${backup.id}" title="استعادة">
                                    <i class="fas fa-undo"></i>
                                </button>
                                <button class="action-btn delete" data-id="${backup.id}" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    
                    // إضافة مستمعي الأحداث
                    const downloadBtn = row.querySelector('.download');
                    const restoreBtn = row.querySelector('.restore');
                    const deleteBtn = row.querySelector('.delete');
                    
                    if (downloadBtn) {
                        downloadBtn.addEventListener('click', function() {
                            downloadBackup(backup.id);
                        });
                    }
                    
                    if (restoreBtn) {
                        restoreBtn.addEventListener('click', function() {
                            confirmRestoreBackup(backup.id);
                        });
                    }
                    
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function() {
                            confirmDeleteBackup(backup.id);
                        });
                    }
                    
                    backupHistoryBody.appendChild(row);
                });
            } else {
                backupHistoryBody.innerHTML = '<tr><td colspan="6">لا توجد نسخ احتياطية</td></tr>';
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل سجل النسخ الاحتياطي:', error);
            backupHistoryBody.innerHTML = '<tr><td colspan="6">حدث خطأ أثناء تحميل سجل النسخ الاحتياطي</td></tr>';
        });
}

/**
 * تنسيق حجم الملف
 * @param {number} bytes حجم الملف بالبايت
 * @returns {string} الحجم المنسق
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * تنزيل نسخة احتياطية
 * @param {string} backupId معرف النسخة
 */
function downloadBackup(backupId) {
    // يتم تنفيذ هذه الدالة في ملف backup.js
    console.log('تنزيل نسخة احتياطية:', backupId);
}

/**
 * تأكيد استعادة نسخة احتياطية
 * @param {string} backupId معرف النسخة
 */
function confirmRestoreBackup(backupId) {
    Swal.fire({
        title: 'تأكيد الاستعادة',
        text: 'سيتم استبدال البيانات الحالية بالبيانات من النسخة الاحتياطية. هل أنت متأكد من الاستمرار؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، استعادة',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            restoreBackup(backupId);
        }
    });
}

/**
 * استعادة نسخة احتياطية
 * @param {string} backupId معرف النسخة
 */
function restoreBackup(backupId) {
    // يتم تنفيذ هذه الدالة في ملف backup.js
    console.log('استعادة نسخة احتياطية:', backupId);
}

/**
 * تأكيد حذف نسخة احتياطية
 * @param {string} backupId معرف النسخة
 */
function confirmDeleteBackup(backupId) {
    Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد من حذف هذه النسخة الاحتياطية؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، حذف',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteBackup(backupId);
        }
    });
}

/**
 * حذف نسخة احتياطية
 * @param {string} backupId معرف النسخة
 */
function deleteBackup(backupId) {
    // يتم تنفيذ هذه الدالة في ملف backup.js
    console.log('حذف نسخة احتياطية:', backupId);
}

// ---------------- وظائف نقطة البيع ----------------

// المتغيرات العامة لنقطة البيع
let categories = [];
let products = [];
let cart = [];
let customers = [];
let heldOrders = [];
let selectedCustomer = null;
let selectedPaymentMethod = 'cash';

/**
 * تحميل الأقسام
 */
function loadCategories() {
    const categoriesList = document.getElementById('categories-list');
    if (!categoriesList) return;
    
    // إضافة زر "جميع المنتجات"
    categoriesList.innerHTML = `
        <div class="category-item active" data-category="all">
            <i class="fas fa-border-all"></i>
            <span>جميع المنتجات</span>
        </div>
    `;
    
    // تحميل الأقسام من قاعدة البيانات
    dbRef.ref(`branches/${currentBranch.id}/categories`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                categories = [];
                
                snapshot.forEach(childSnapshot => {
                    const category = childSnapshot.val();
                    category.id = childSnapshot.key;
                    categories.push(category);
                    
                    const categoryItem = document.createElement('div');
                    categoryItem.className = 'category-item';
                    categoryItem.dataset.category = category.id;
                    categoryItem.innerHTML = `
                        <i class="fas ${category.icon}"></i>
                        <span>${category.name}</span>
                    `;
                    
                    categoryItem.addEventListener('click', function() {
                        // إزالة الفئة النشطة من جميع الأقسام
                        document.querySelectorAll('.category-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        
                        // إضافة الفئة النشطة للقسم المحدد
                        this.classList.add('active');
                        
                        // تصفية المنتجات حسب القسم
                        filterProductsByCategory(this.dataset.category);
                    });
                    
                    categoriesList.appendChild(categoryItem);
                });
                
                // تحميل المنتجات بعد تحميل الأقسام
                loadProducts();
            } else {
                // إنشاء بعض الأقسام الافتراضية إذا لم توجد
                createDefaultCategories();
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل الأقسام:', error);
            showNotification('خطأ', 'حدث خطأ أثناء تحميل الأقسام', 'error');
        });
}

/**
 * إنشاء أقسام افتراضية
 */
function createDefaultCategories() {
    const defaultCategories = [
        { name: 'الأطعمة', icon: 'fa-utensils', description: 'المنتجات الغذائية' },
        { name: 'المشروبات', icon: 'fa-coffee', description: 'المشروبات والعصائر' },
        { name: 'الإلكترونيات', icon: 'fa-mobile-alt', description: 'الأجهزة الإلكترونية' },
        { name: 'الملابس', icon: 'fa-tshirt', description: 'الملابس والأزياء' },
        { name: 'المنزل', icon: 'fa-home', description: 'مستلزمات المنزل' }
    ];
    
    // إنشاء الأقسام في قاعدة البيانات
    const categoriesRef = dbRef.ref(`branches/${currentBranch.id}/categories`);
    
    const promises = defaultCategories.map(category => {
        return categoriesRef.push(category);
    });
    
    Promise.all(promises)
        .then(() => {
            // إعادة تحميل الأقسام
            loadCategories();
        })
        .catch(error => {
            console.error('خطأ في إنشاء الأقسام الافتراضية:', error);
            showNotification('خطأ', 'حدث خطأ أثناء إنشاء الأقسام الافتراضية', 'error');
        });
}

/**
 * تحميل المنتجات
 */
function loadProducts() {
    // تحميل المنتجات من قاعدة البيانات
    dbRef.ref(`branches/${currentBranch.id}/products`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                products = [];
                
                snapshot.forEach(childSnapshot => {
                    const product = childSnapshot.val();
                    product.id = childSnapshot.key;
                    products.push(product);
                });
                
                // عرض جميع المنتجات
                filterProductsByCategory('all');
            } else {
                // إنشاء بعض المنتجات الافتراضية إذا لم توجد
                createDefaultProducts();
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل المنتجات:', error);
            showNotification('خطأ', 'حدث خطأ أثناء تحميل المنتجات', 'error');
        });
}

/**
 * إنشاء منتجات افتراضية
 */
function createDefaultProducts() {
    // التحقق من وجود أقسام
    if (categories.length === 0) {
        return;
    }
    
    // إنشاء بعض المنتجات الافتراضية
    const defaultProducts = [
        {
            name: 'لابتوب HP',
            price: 350000,
            category: categories.find(c => c.name === 'الإلكترونيات')?.id || categories[0].id,
            icon: 'fa-laptop',
            stock: 15,
            barcode: generateBarcode('EAN13'),
            description: 'لابتوب HP ProBook بمعالج Core i7 وذاكرة 16GB'
        },
        {
            name: 'هاتف سامسونج',
            price: 200000,
            category: categories.find(c => c.name === 'الإلكترونيات')?.id || categories[0].id,
            icon: 'fa-mobile-alt',
            stock: 25,
            barcode: generateBarcode('EAN13'),
            description: 'هاتف سامسونج جالاكسي S21 بذاكرة 128GB'
        },
        {
            name: 'قميص قطني',
            price: 15000,
            category: categories.find(c => c.name === 'الملابس')?.id || categories[0].id,
            icon: 'fa-tshirt',
            stock: 50,
            barcode: generateBarcode('EAN13'),
            description: 'قميص رجالي قطني 100% متعدد الألوان'
        },
        {
            name: 'قهوة عربية',
            price: 3000,
            category: categories.find(c => c.name === 'المشروبات')?.id || categories[0].id,
            icon: 'fa-coffee',
            stock: 100,
            barcode: generateBarcode('EAN13'),
            description: 'قهوة عربية أصلية بالهيل'
        },
        {
            name: 'عصير برتقال',
            price: 2000,
            category: categories.find(c => c.name === 'المشروبات')?.id || categories[0].id,
            icon: 'fa-glass-citrus',
            stock: 80,
            barcode: generateBarcode('EAN13'),
            description: 'عصير برتقال طازج 100% بدون إضافات'
        }
    ];
    
    // إضافة المنتجات إلى قاعدة البيانات
    const productsRef = dbRef.ref(`branches/${currentBranch.id}/products`);
    
    const promises = defaultProducts.map(product => {
        return productsRef.push(product);
    });
    
    Promise.all(promises)
        .then(() => {
            // إعادة تحميل المنتجات
            loadProducts();
        })
        .catch(error => {
            console.error('خطأ في إنشاء المنتجات الافتراضية:', error);
            showNotification('خطأ', 'حدث خطأ أثناء إنشاء المنتجات الافتراضية', 'error');
        });
}

/**
 * تصفية المنتجات حسب القسم
 * @param {string} categoryId معرف القسم
 */
function filterProductsByCategory(categoryId) {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;
    
    // تفريغ حاوية المنتجات
    productsContainer.innerHTML = '';
    
    // تصفية المنتجات
    let filteredProducts;
    
    if (categoryId === 'all') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category === categoryId);
    }
    
    // عرض المنتجات
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-box-open"></i>
                <h3>لا توجد منتجات</h3>
                <p>لا توجد منتجات في هذا القسم</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        renderProduct(product, productsContainer);
    });
}

/**
 * عرض منتج
 * @param {Object} product بيانات المنتج
 * @param {HTMLElement} container حاوية المنتج
 */
function renderProduct(product, container) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.id = product.id;
    productCard.dataset.barcode = product.barcode;
    
    // تحديد حالة المخزون
    const stockStatus = getStockStatus(product.stock);
    
    // تحديد طريقة العرض
    const viewMode = container.classList.contains('grid-view') ? 'grid' : 'list';
    
    if (viewMode === 'grid') {
        productCard.innerHTML = `
            <div class="product-image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}">` : `<i class="fas ${product.icon}"></i>`}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatCurrency(product.price)}</div>
                <div class="product-stock ${stockStatus.class}">${stockStatus.text}</div>
            </div>
        `;
    } else {
        productCard.innerHTML = `
            <div class="product-image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}">` : `<i class="fas ${product.icon}"></i>`}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatCurrency(product.price)}</div>
            </div>
            <div class="product-stock ${stockStatus.class}">${stockStatus.text}</div>
        `;
    }
    
    // إضافة حدث النقر
    productCard.addEventListener('click', function() {
        addToCart(product);
    });
    
    container.appendChild(productCard);
}

