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
    
    // تفريغ القائمة وإضافة خيار التحميل
    branchSelection.innerHTML = '<option value="" disabled selected>جاري تحميل الفروع...</option>';
    
    // التأكد من تهيئة قاعدة البيانات
    if (!dbRef) {
        console.error('قاعدة البيانات غير متصلة');
        branchSelection.innerHTML = '<option value="">الفرع الرئيسي</option>';
        return;
    }
    
    // تحميل الفروع من قاعدة البيانات
    dbRef.ref('branches').once('value')
        .then(snapshot => {
            // تفريغ القائمة
            branchSelection.innerHTML = '';
            
            if (snapshot.exists()) {
                let branches = [];
                snapshot.forEach(childSnapshot => {
                    const branch = childSnapshot.val();
                    branch.id = childSnapshot.key;
                    branches.push(branch);
                });
                
                // إذا لم يتم العثور على أي فروع
                if (branches.length === 0) {
                    branchSelection.innerHTML = '<option value="">الفرع الرئيسي</option>';
                    return;
                }
                
                // إضافة الفروع إلى القائمة
                branches.forEach(branch => {
                    const option = document.createElement('option');
                    option.value = branch.id;
                    option.textContent = branch.name || 'فرع بدون اسم';
                    branchSelection.appendChild(option);
                });
            } else {
                // إضافة خيار افتراضي
                branchSelection.innerHTML = '<option value="">الفرع الرئيسي</option>';
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل الفروع:', error);
            branchSelection.innerHTML = '<option value="">الفرع الرئيسي</option>';
        });
}

firebase.auth().onAuthStateChanged(function() {
  // تحميل قائمة الفروع بعد تهيئة Firebase
  loadBranchesForLogin();
});

// إضافة فرع افتراضي إذا لم توجد فروع
function createDefaultBranch() {
    const defaultBranch = {
        name: 'الفرع الرئيسي',
        code: 'MAIN',
        type: 'main',
        address: 'العنوان الرئيسي',
        createdAt: new Date().toISOString()
    };
    
    return dbRef.ref('branches').push(defaultBranch);
}


// فحص الاتصال بـ Firebase
function checkFirebaseConnection() {
    const connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
            console.log("متصل بـ Firebase");
            loadBranchesForLogin();
        } else {
            console.log("غير متصل بـ Firebase");
            const branchSelection = document.getElementById('branch-selection');
            if (branchSelection) {
                branchSelection.innerHTML = '<option value="">الفرع الرئيسي (غير متصل)</option>';
            }
        }
    });
}


console.log('جاري تحميل الفروع...');
dbRef.ref('branches').once('value')
    .then(snapshot => {
        console.log('تم تحميل البيانات:', snapshot.val());
        // بقية الكود
    });
    
    
    function simpleBranchLoading() {
    const branchSelection = document.getElementById('branch-selection');
    if (branchSelection) {
        branchSelection.innerHTML = '';
        
        // إضافة خيار افتراضي للاختبار
        const option = document.createElement('option');
        option.value = 'default';
        option.textContent = 'الفرع الرئيسي (اختبار)';
        branchSelection.appendChild(option);
    }
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

/**
 * الحصول على حالة المخزون
 * @param {number} stock كمية المخزون
 * @returns {{class: string, text: string}} حالة المخزون
 */
function getStockStatus(stock) {
    const lowStockThreshold = appSettings?.pos?.lowStockThreshold || 10;
    
    if (stock <= 0) {
        return { class: 'out-of-stock', text: 'نفذ المخزون' };
    } else if (stock <= lowStockThreshold) {
        return { class: 'low-stock', text: 'مخزون منخفض' };
    } else {
        return { class: 'in-stock', text: 'متوفر' };
    }
}

/**
 * إضافة منتج إلى السلة
 * @param {Object} product المنتج المضاف
 */
function addToCart(product) {
    // التحقق من المخزون
    if (product.stock <= 0 && !appSettings?.pos?.allowSellOutOfStock) {
        showNotification('تنبيه', 'نفذ المخزون لهذا المنتج', 'warning');
        return;
    }
    
    // البحث عن المنتج في السلة
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        // التحقق من الكمية المتاحة
        if (existingItem.quantity < product.stock || appSettings?.pos?.allowSellOutOfStock) {
            existingItem.quantity += 1;
        } else {
            showNotification('تنبيه', 'الكمية المطلوبة غير متوفرة في المخزون', 'warning');
            return;
        }
    } else {
        // إضافة منتج جديد إلى السلة
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            barcode: product.barcode,
            category: product.category,
            productObj: product
        });
    }
    
    // تحديث عرض السلة
    renderCart();
    updateCartSummary();
    
    // تشغيل صوت الإضافة إذا كان متاحاً
    if (typeof Audio !== 'undefined') {
        try {
            const audio = new Audio('sounds/beep.mp3');
            audio.play();
        } catch (e) {
            console.log('لا يمكن تشغيل الصوت');
        }
    }
}

/**
 * عرض السلة
 */
function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    
    // تفريغ حاوية السلة
    cartItemsContainer.innerHTML = '';
    
    // التحقق من وجود منتجات في السلة
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">السلة فارغة</div>';
        return;
    }
    
    // عرض منتجات السلة
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id) || item.productObj;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${product ? product.stock : 999}">
                    <button class="quantity-btn plus">+</button>
                </div>
                <button class="remove-item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // إضافة مستمعي الأحداث لأزرار التحكم في الكمية
        const minusBtn = cartItem.querySelector('.minus');
        const plusBtn = cartItem.querySelector('.plus');
        const quantityInput = cartItem.querySelector('.quantity-input');
        const removeBtn = cartItem.querySelector('.remove-item');
        
        if (minusBtn) {
            minusBtn.addEventListener('click', function() {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                    quantityInput.value = item.quantity;
                    updateCartSummary();
                }
            });
        }
        
        if (plusBtn) {
            plusBtn.addEventListener('click', function() {
                if (product && (item.quantity < product.stock || appSettings?.pos?.allowSellOutOfStock)) {
                    item.quantity += 1;
                    quantityInput.value = item.quantity;
                    updateCartSummary();
                } else {
                    showNotification('تنبيه', 'الكمية المطلوبة غير متوفرة في المخزون', 'warning');
                }
            });
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('change', function() {
                const newQuantity = parseInt(this.value);
                
                if (isNaN(newQuantity) || newQuantity < 1) {
                    this.value = item.quantity;
                    return;
                }
                
                if (product && newQuantity > product.stock && !appSettings?.pos?.allowSellOutOfStock) {
                    showNotification('تنبيه', 'الكمية المطلوبة غير متوفرة في المخزون', 'warning');
                    this.value = item.quantity;
                    return;
                }
                
                item.quantity = newQuantity;
                updateCartSummary();
            });
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                removeFromCart(item.id);
            });
        }
        
        cartItemsContainer.appendChild(cartItem);
    });
}

/**
 * إزالة منتج من السلة
 * @param {string} productId معرف المنتج
 */
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
    updateCartSummary();
}

/**
 * تحديث ملخص السلة
 */
function updateCartSummary() {
    // حساب المجموع الفرعي
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // حساب الضريبة
    const taxRate = appSettings?.tax?.enableTax ? appSettings.tax.taxRate / 100 : 0.15;
    let tax = 0;
    
    if (appSettings?.tax?.applyTaxPerItem) {
        // حساب الضريبة لكل منتج على حدة
        tax = cart.reduce((total, item) => {
            const itemTax = item.price * item.quantity * taxRate;
            return total + itemTax;
        }, 0);
    } else {
        // حساب الضريبة على المجموع
        if (appSettings?.tax?.taxIncludedInPrice) {
            // الضريبة مشمولة في السعر
            tax = subtotal - (subtotal / (1 + taxRate));
        } else {
            // الضريبة غير مشمولة في السعر
            tax = subtotal * taxRate;
        }
    }
    
    // حساب الخصم
    let discount = 0;
    const discountValue = parseFloat(document.getElementById('discount-value').value) || 0;
    const discountType = document.getElementById('discount-type').value;
    
    if (discountValue > 0) {
        if (discountType === 'percentage') {
            discount = subtotal * (discountValue / 100);
        } else {
            discount = discountValue;
        }
    }
    
    // حساب المجموع النهائي
    let total = 0;
    
    if (appSettings?.tax?.taxIncludedInPrice) {
        // الضريبة مشمولة في السعر
        total = subtotal - discount;
    } else {
        // الضريبة غير مشمولة في السعر
        total = subtotal + tax - discount;
    }
    
    // تحديث العناصر في واجهة المستخدم
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('tax').textContent = formatCurrency(tax);
    document.getElementById('total').textContent = formatCurrency(total);
    
    // تحديث مجموع المشتريات في مودال الدفع
    document.getElementById('checkout-total').textContent = formatCurrency(total);
    
    // تفعيل/تعطيل أزرار الدفع وتعليق الطلب
    const checkoutBtn = document.getElementById('checkout');
    const holdOrderBtn = document.getElementById('hold-order');
    
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
    
    if (holdOrderBtn) {
        holdOrderBtn.disabled = cart.length === 0;
    }
}

/**
 * تفريغ السلة
 */
function clearCart() {
    if (cart.length === 0) return;
    
    Swal.fire({
        title: 'تأكيد',
        text: 'هل أنت متأكد من تفريغ السلة؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، تفريغ',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            cart = [];
            renderCart();
            updateCartSummary();
        }
    });
}

/**
 * إظهار مودال الدفع
 */
function showCheckoutModal() {
    if (cart.length === 0) return;
    
    // تحديث مجموع المشتريات
    const total = parseFloat(document.getElementById('total').textContent);
    document.getElementById('checkout-total').textContent = formatCurrency(total);
    
    // تعيين المبلغ المدفوع بشكل افتراضي
    const amountPaidInput = document.getElementById('amount-paid');
    if (amountPaidInput) {
        // استخراج الرقم من النص المنسق
        const totalValue = extractNumericValue(document.getElementById('total').textContent);
        amountPaidInput.value = totalValue;
        
        // تحديث المبلغ المتبقي
        updateRemainingAmount();
    }
    
    // إظهار المودال
    showModal('checkout-modal');
    
    // التركيز على حقل المبلغ المدفوع
    setTimeout(() => {
        if (amountPaidInput) {
            amountPaidInput.focus();
            amountPaidInput.select();
        }
    }, 300);
}

/**
 * استخراج القيمة الرقمية من نص منسق
 * @param {string} formattedText النص المنسق
 * @returns {number} القيمة الرقمية
 */
function extractNumericValue(formattedText) {
    // إزالة كل الأحرف غير الأرقام والعلامة العشرية
    const numericValue = formattedText.replace(/[^\d.,]/g, '');
    
    // استبدال الفاصلة بنقطة إذا لزم الأمر
    const normalizedValue = numericValue.replace(',', '.');
    
    return parseFloat(normalizedValue) || 0;
}

/**
 * تحديث المبلغ المتبقي في مودال الدفع
 */
function updateRemainingAmount() {
    const totalElement = document.getElementById('checkout-total');
    const amountPaidInput = document.getElementById('amount-paid');
    const remainingAmountElement = document.getElementById('remaining-amount');
    
    if (!totalElement || !amountPaidInput || !remainingAmountElement) return;
    
    // استخراج القيم الرقمية
    const total = extractNumericValue(totalElement.textContent);
    const paid = parseFloat(amountPaidInput.value) || 0;
    
    // حساب المبلغ المتبقي
    const remaining = total - paid;
    
    // تحديث العنصر
    remainingAmountElement.textContent = formatCurrency(Math.abs(remaining));
    
    // تغيير لون الرقم حسب قيمته
    if (remaining > 0) {
        remainingAmountElement.style.color = 'var(--danger-color)';
        document.getElementById('complete-checkout').disabled = selectedPaymentMethod === 'cash';
    } else {
        remainingAmountElement.style.color = 'var(--success-color)';
        document.getElementById('complete-checkout').disabled = false;
    }
}

/**
 * إتمام عملية الدفع
 */
function completeCheckout() {
    // استخراج القيم
    const total = extractNumericValue(document.getElementById('checkout-total').textContent);
    const paid = parseFloat(document.getElementById('amount-paid').value) || 0;
    const printReceipt = document.getElementById('print-receipt').checked;
    const emailReceipt = document.getElementById('email-receipt').checked;
    const smsReceipt = document.getElementById('sms-receipt').checked;
    const invoiceNotes = document.getElementById('invoice-notes').value;
    
    // التحقق من المبلغ المدفوع
    if (paid < total && selectedPaymentMethod === 'cash') {
        showNotification('خطأ', 'المبلغ المدفوع أقل من المجموع', 'error');
        return;
    }
    
    // عرض مؤشر التحميل
    showLoading('جاري إتمام عملية الدفع...');
    
    // إنشاء الفاتورة
    const invoice = createInvoice(total, paid);
    
    // حفظ الفاتورة في قاعدة البيانات
    dbRef.ref(`branches/${currentBranch.id}/invoices`).push(invoice)
        .then(snapshot => {
            // تحديث معرف الفاتورة
            invoice.id = snapshot.key;
            
            // تحديث مخزون المنتجات
            updateProductStock(invoice)
                .then(() => {
                    // إضافة النقاط للعميل إذا كان مختاراً
                    if (selectedCustomer && appSettings?.customers?.enablePointsSystem) {
                        addCustomerPoints(selectedCustomer, total);
                    }
                    
                    // تسجيل عملية البيع
                    logSale(invoice);
                    
                    // إغلاق مودال الدفع
                    hideModal('checkout-modal');
                    
                    // عرض الفاتورة
                    showReceipt(invoice);
                    
                    // طباعة الفاتورة إذا طلب ذلك
                    if (printReceipt) {
                        setTimeout(() => {
                            printInvoice(invoice);
                        }, 500);
                    }
                    
                    // إرسال الفاتورة بالبريد الإلكتروني إذا طلب ذلك
                    if (emailReceipt && selectedCustomer && selectedCustomer.email) {
                        sendInvoiceByEmail(invoice, selectedCustomer.email);
                    }
                    
                    // إرسال الفاتورة برسالة نصية إذا طلب ذلك
                    if (smsReceipt && selectedCustomer && selectedCustomer.phone) {
                        sendInvoiceBySMS(invoice, selectedCustomer.phone);
                    }
                    
                    // تفريغ السلة إذا كان الإعداد مفعلاً
                    if (appSettings?.pos?.clearCartAfterSale) {
                        cart = [];
                        renderCart();
                        updateCartSummary();
                        
                        // إزالة العميل المختار
                        if (selectedCustomer) {
                            removeCustomer();
                        }
                    }
                    
                    // إخفاء مؤشر التحميل
                    hideLoading();
                    
                    // عرض رسالة نجاح
                    showNotification('تم بنجاح', 'تم إتمام عملية البيع بنجاح', 'success');
                })
                .catch(error => {
                    console.error('خطأ في تحديث المخزون:', error);
                    hideLoading();
                    showNotification('خطأ', 'حدث خطأ أثناء تحديث المخزون', 'error');
                });
        })
        .catch(error => {
            console.error('خطأ في حفظ الفاتورة:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حفظ الفاتورة', 'error');
        });
}

/**
 * إنشاء فاتورة
 * @param {number} total المجموع
 * @param {number} paid المبلغ المدفوع
 * @returns {Object} الفاتورة
 */
function createInvoice(total, paid) {
    // إنشاء رقم الفاتورة
    const invoicePrefix = appSettings?.invoices?.invoicePrefix || 'INV-';
    const invoiceNumber = `${invoicePrefix}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    
    // تاريخ ووقت الفاتورة
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);
    
    // استخراج العناصر من السلة
    const items = cart.map(item => {
        return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
        };
    });
    
    // حساب الضريبة والخصم
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    const taxRate = appSettings?.tax?.enableTax ? appSettings.tax.taxRate / 100 : 0.15;
    let tax = 0;
    
    if (appSettings?.tax?.applyTaxPerItem) {
        tax = cart.reduce((total, item) => {
            const itemTax = item.price * item.quantity * taxRate;
            return total + itemTax;
        }, 0);
    } else {
        if (appSettings?.tax?.taxIncludedInPrice) {
            tax = subtotal - (subtotal / (1 + taxRate));
        } else {
            tax = subtotal * taxRate;
        }
    }
    
    const discountValue = parseFloat(document.getElementById('discount-value').value) || 0;
    const discountType = document.getElementById('discount-type').value;
    
    let discount = 0;
    if (discountValue > 0) {
        if (discountType === 'percentage') {
            discount = subtotal * (discountValue / 100);
        } else {
            discount = discountValue;
        }
    }
    
    // إنشاء كائن الفاتورة
    const invoice = {
        number: invoiceNumber,
        date: date,
        time: time,
        cashier: {
            id: currentUser.id,
            name: currentUser.fullName
        },
        branch: {
            id: currentBranch.id,
            name: currentBranch.name
        },
        customer: selectedCustomer ? {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
            email: selectedCustomer.email
        } : null,
        items: items,
        payment: {
            method: selectedPaymentMethod,
            total: total,
            paid: paid,
            change: Math.max(0, paid - total)
        },
        subtotal: subtotal,
        tax: tax,
        discount: discount,
        notes: document.getElementById('invoice-notes').value,
        timestamp: now.toISOString()
    };
    
    return invoice;
}

/**
 * تحديث مخزون المنتجات
 * @param {Object} invoice الفاتورة
 * @returns {Promise} وعد بالانتهاء
 */
function updateProductStock(invoice) {
    const updates = {};
    
    // تحديث المخزون لكل منتج
    invoice.items.forEach(item => {
        const productRef = `branches/${currentBranch.id}/products/${item.id}/stock`;
        
        // البحث عن المنتج في المصفوفة المحلية
        const product = products.find(p => p.id === item.id);
        
        if (product) {
            // تحديث المخزون
            const newStock = Math.max(0, product.stock - item.quantity);
            updates[productRef] = newStock;
            
            // تحديث المصفوفة المحلية
            product.stock = newStock;
        }
    });
    
    // تطبيق التحديثات دفعة واحدة
    return dbRef.ref().update(updates);
}

/**
 * إضافة نقاط للعميل
 * @param {Object} customer العميل
 * @param {number} amount المبلغ
 */
function addCustomerPoints(customer, amount) {
    // حساب النقاط
    const pointsPerCurrency = appSettings?.customers?.pointsPerCurrency || 0.1;
    const pointsEarned = Math.floor(amount * pointsPerCurrency);
    
    if (pointsEarned <= 0) return;
    
    // تحديث نقاط العميل
    dbRef.ref(`customers/${customer.id}`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const customerData = snapshot.val();
                const currentPoints = customerData.points || 0;
                const newPoints = currentPoints + pointsEarned;
                
                dbRef.ref(`customers/${customer.id}/points`).set(newPoints);
                
                // تسجيل عملية إضافة النقاط
                dbRef.ref(`customers/${customer.id}/points_history`).push({
                    type: 'earned',
                    amount: pointsEarned,
                    source: 'purchase',
                    sourceId: customer.id,
                    date: new Date().toISOString()
                });
            }
        })
        .catch(error => {
            console.error('خطأ في تحديث نقاط العميل:', error);
        });
}

/**
 * تسجيل عملية البيع
 * @param {Object} invoice الفاتورة
 */
function logSale(invoice) {
    // تسجيل نشاط المستخدم
    logUserActivity('sale', `إتمام عملية بيع بقيمة ${formatCurrency(invoice.payment.total)}`, {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        total: invoice.payment.total
    });
    
    // تحديث إحصائيات المبيعات
    const today = new Date().toISOString().split('T')[0];
    
    // تحديث إحصائيات اليوم
    dbRef.ref(`branches/${currentBranch.id}/stats/daily/${today}`).once('value')
        .then(snapshot => {
            let dailyStats = {
                totalSales: 0,
                totalInvoices: 0,
                totalItems: 0,
                totalTax: 0,
                totalDiscount: 0
            };
            
            if (snapshot.exists()) {
                dailyStats = snapshot.val();
            }
            
            // تحديث الإحصائيات
            dailyStats.totalSales += invoice.payment.total;
            dailyStats.totalInvoices += 1;
            dailyStats.totalItems += invoice.items.reduce((total, item) => total + item.quantity, 0);
            dailyStats.totalTax += invoice.tax;
            dailyStats.totalDiscount += invoice.discount;
            
            // حفظ الإحصائيات
            dbRef.ref(`branches/${currentBranch.id}/stats/daily/${today}`).set(dailyStats);
        })
        .catch(error => {
            console.error('خطأ في تحديث إحصائيات المبيعات:', error);
        });
    
    // تحديث إحصائيات المستخدم
    dbRef.ref(`users/${currentUser.id}/stats`).once('value')
        .then(snapshot => {
            let userStats = {
                totalSales: 0,
                totalInvoices: 0
            };
            
            if (snapshot.exists()) {
                userStats = snapshot.val();
            }
            
            // تحديث الإحصائيات
            userStats.totalSales += invoice.payment.total;
            userStats.totalInvoices += 1;
            
            // حفظ الإحصائيات
            dbRef.ref(`users/${currentUser.id}/stats`).set(userStats);
        })
        .catch(error => {
            console.error('خطأ في تحديث إحصائيات المستخدم:', error);
        });
}

/**
 * عرض الفاتورة
 * @param {Object} invoice الفاتورة
 */
function showReceipt(invoice) {
    // تعيين بيانات المتجر
    document.getElementById('receipt-store-name').textContent = appSettings?.general?.storeName || 'متجر السعادة';
    document.getElementById('receipt-store-address').textContent = appSettings?.general?.storeAddress || 'العنوان الرئيسي';
    document.getElementById('receipt-store-phone').textContent = `هاتف: ${appSettings?.general?.storePhone || '0123456789'}`;
    
    // تعيين بيانات الفاتورة
    document.getElementById('receipt-number').textContent = invoice.number;
    document.getElementById('receipt-date').textContent = invoice.date;
    document.getElementById('receipt-time').textContent = invoice.time;
    document.getElementById('receipt-cashier').textContent = invoice.cashier.name;
    document.getElementById('receipt-branch').textContent = invoice.branch.name;
    
    // بيانات العميل
    const receiptCustomer = document.getElementById('receipt-customer');
    if (invoice.customer) {
        receiptCustomer.style.display = 'block';
        document.getElementById('receipt-customer-name').textContent = invoice.customer.name;
        document.getElementById('receipt-customer-phone').textContent = invoice.customer.phone || '';
        
        // النقاط المكتسبة
        const pointsPerCurrency = appSettings?.customers?.pointsPerCurrency || 0.1;
        const pointsEarned = Math.floor(invoice.payment.total * pointsPerCurrency);
        document.getElementById('receipt-customer-points').textContent = pointsEarned;
    } else {
        receiptCustomer.style.display = 'none';
    }
    
    // إضافة عناصر الفاتورة
    const receiptItems = document.getElementById('receipt-items');
    receiptItems.innerHTML = '';
    
    invoice.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price * item.quantity)}</td>
        `;
        receiptItems.appendChild(tr);
    });
    
    // تعيين ملخص الفاتورة
    document.getElementById('receipt-subtotal').textContent = formatCurrency(invoice.subtotal);
    document.getElementById('receipt-tax').textContent = formatCurrency(invoice.tax);
    
    // الخصم
    const receiptDiscountRow = document.getElementById('receipt-discount-row');
    if (invoice.discount > 0) {
        receiptDiscountRow.style.display = 'flex';
        document.getElementById('receipt-discount').textContent = formatCurrency(invoice.discount);
    } else {
        receiptDiscountRow.style.display = 'none';
    }
    
    // المجموع والمدفوع والباقي
    document.getElementById('receipt-total').textContent = formatCurrency(invoice.payment.total);
    document.getElementById('receipt-paid').textContent = formatCurrency(invoice.payment.paid);
    document.getElementById('receipt-change').textContent = formatCurrency(invoice.payment.change);
    
    // طريقة الدفع
    let paymentMethod = '';
    switch (invoice.payment.method) {
        case 'cash':
            paymentMethod = 'نقدي';
            break;
        case 'card':
            paymentMethod = 'بطاقة ائتمان';
            break;
        case 'online':
            paymentMethod = 'دفع إلكتروني';
            break;
    }
    
    document.getElementById('receipt-payment-method').textContent = paymentMethod;
    
    // الملاحظات
    const receiptNotesSection = document.getElementById('receipt-notes-section');
    if (invoice.notes) {
        receiptNotesSection.style.display = 'block';
        document.getElementById('receipt-notes-content').textContent = invoice.notes;
    } else {
        receiptNotesSection.style.display = 'none';
    }
    
    // إنشاء باركود للفاتورة
    const barcodeElement = document.getElementById('receipt-barcode');
    if (barcodeElement) {
        try {
            JsBarcode(barcodeElement, invoice.number, {
                format: "CODE128",
                lineColor: "#000",
                width: 1.5,
                height: 40,
                displayValue: true
            });
        } catch (e) {
            console.error('خطأ في إنشاء الباركود:', e);
            barcodeElement.style.display = 'none';
        }
    }
    
    // إظهار مودال الفاتورة
    showModal('receipt-modal');
}

/**
 * طباعة الفاتورة
 * @param {Object} invoice الفاتورة
 */
function printInvoice(invoice) {
    const receiptContent = document.getElementById('receipt');
    if (!receiptContent) return;
    
    // فتح نافذة الطباعة
    const printWindow = window.open('', '', 'width=600,height=600');
    
    // إنشاء محتوى الصفحة
    printWindow.document.write(`
        <html>
            <head>
                <title>فاتورة - ${invoice.number}</title>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Tajawal', Arial, sans-serif;
                        direction: rtl;
                        padding: 10mm;
                        margin: 0;
                    }
                    
                    .receipt {
                        width: ${appSettings?.invoices?.receiptSize === '80mm' ? '80mm' : '100%'};
                        margin: 0 auto;
                    }
                    
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 10mm;
                    }
                    
                    .store-logo {
                        font-size: 24pt;
                        margin-bottom: 5mm;
                    }
                    
                    .store-info h2 {
                        margin-bottom: 2mm;
                    }
                    
                    .receipt-details, 
                    .receipt-customer {
                        border-top: 1px dashed #ccc;
                        border-bottom: 1px dashed #ccc;
                        padding: 3mm 0;
                        margin-bottom: 5mm;
                    }
                    
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 2mm;
                    }
                    
                    .receipt-items {
                        margin-bottom: 5mm;
                    }
                    
                    .receipt-items table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    
                    .receipt-items th {
                        border-bottom: 1px solid #ccc;
                        padding: 2mm;
                        text-align: right;
                    }
                    
                    .receipt-items td {
                        border-bottom: 1px dashed #ccc;
                        padding: 2mm;
                    }
                    
                    .receipt-summary {
                        margin-top: 5mm;
                        margin-bottom: 5mm;
                    }
                    
                    .receipt-payment {
                        margin-bottom: 5mm;
                        padding: 3mm 0;
                        border-top: 1px dashed #ccc;
                        border-bottom: 1px dashed #ccc;
                        display: flex;
                        justify-content: space-between;
                    }
                    
                    .receipt-notes {
                        margin-bottom: 5mm;
                        padding: 3mm 0;
                        border-bottom: 1px dashed #ccc;
                    }
                    
                    .receipt-footer {
                        text-align: center;
                    }
                    
                    .barcode {
                        margin-top: 5mm;
                        text-align: center;
                    }
                    
                    @media print {
                        body {
                            padding: 0;
                        }
                        
                        .receipt {
                            width: 100%;
                        }
                    }
                </style>
            </head>
            <body>
                ${receiptContent.outerHTML}
            </body>
        </html>
    `);
    
    // إغلاق مستند الطباعة
    printWindow.document.close();
    
    // انتظار تحميل الصفحة ثم طباعتها
    printWindow.onload = function() {
        setTimeout(function() {
            printWindow.print();
            printWindow.close();
        }, 500);
    };
}

/**
 * إرسال الفاتورة بالبريد الإلكتروني
 * @param {Object} invoice الفاتورة
 * @param {string} email البريد الإلكتروني
 */
function sendInvoiceByEmail(invoice, email) {
    // هذه الدالة تحتاج إلى خدمة بريد إلكتروني في الخلفية
    console.log('إرسال الفاتورة بالبريد الإلكتروني:', email);
    
    // عرض إشعار
    showNotification('إرسال الفاتورة', `تم إرسال الفاتورة إلى ${email}`, 'success');
}

/**
 * إرسال الفاتورة برسالة نصية
 * @param {Object} invoice الفاتورة
 * @param {string} phone رقم الهاتف
 */
function sendInvoiceBySMS(invoice, phone) {
    // هذه الدالة تحتاج إلى خدمة رسائل نصية في الخلفية
    console.log('إرسال الفاتورة برسالة نصية:', phone);
    
    // عرض إشعار
    showNotification('إرسال الفاتورة', `تم إرسال الفاتورة إلى ${phone}`, 'success');
}

/**
 * تعليق الطلب الحالي
 */
function holdCurrentOrder() {
    if (cart.length === 0) return;
    
    // عرض مؤشر التحميل
    showLoading('جاري تعليق الطلب...');
    
    // إنشاء كائن الطلب المعلق
    const heldOrder = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        customer: selectedCustomer ? { ...selectedCustomer } : null,
        subtotal: parseFloat(document.getElementById('subtotal').textContent),
        tax: parseFloat(document.getElementById('tax').textContent),
        discount: {
            value: parseFloat(document.getElementById('discount-value').value) || 0,
            type: document.getElementById('discount-type').value
        },
        total: parseFloat(document.getElementById('total').textContent),
        cashier: {
            id: currentUser.id,
            name: currentUser.fullName
        },
        branch: {
            id: currentBranch.id,
            name: currentBranch.name
        },
        timestamp: new Date().toISOString()
    };
    
    // حفظ الطلب في قاعدة البيانات
    dbRef.ref(`branches/${currentBranch.id}/held_orders`).push(heldOrder)
        .then(() => {
            // تفريغ السلة
            cart = [];
            renderCart();
            updateCartSummary();
            
            // إزالة العميل المختار
            if (selectedCustomer) {
                removeCustomer();
            }
            
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم تعليق الطلب بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('hold_order', 'تعليق طلب', { orderId: heldOrder.id });
        })
        .catch(error => {
            console.error('خطأ في تعليق الطلب:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء تعليق الطلب', 'error');
        });
}

/**
 * عرض قائمة الطلبات المعلقة
 */
function showHeldOrders() {
    // عرض مؤشر التحميل
    showLoading('جاري تحميل الطلبات المعلقة...');
    
    // تحميل الطلبات المعلقة من قاعدة البيانات
    dbRef.ref(`branches/${currentBranch.id}/held_orders`).once('value')
        .then(snapshot => {
            // تفريغ القائمة
            const heldOrdersList = document.getElementById('held-orders-list');
            heldOrdersList.innerHTML = '';
            
            // إخفاء مؤشر التحميل
            hideLoading();
            
            if (snapshot.exists()) {
                heldOrders = [];
                
                snapshot.forEach(childSnapshot => {
                    const order = childSnapshot.val();
                    order.id = childSnapshot.key;
                    heldOrders.push(order);
                    
                    // إنشاء عنصر الطلب
                    const orderItem = document.createElement('div');
                    orderItem.className = 'held-order-item';
                    orderItem.dataset.id = order.id;
                    
                    // حساب عدد المنتجات
                    const totalItems = order.items.reduce((total, item) => total + item.quantity, 0);
                    
                    // تنسيق الوقت
                    const time = new Date(order.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
                    
                    orderItem.innerHTML = `
                        <div class="held-order-header">
                            <div class="held-order-info">
                                ${order.customer ? `<strong>${order.customer.name}</strong> - ` : ''}
                                <span class="held-order-time">${time}</span>
                            </div>
                            <div class="held-order-actions">
                                <button class="action-btn delete" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="held-order-items">
                            ${totalItems} منتج
                        </div>
                        <div class="held-order-total">
                            ${formatCurrency(order.total)}
                        </div>
                    `;
                    
                    // إضافة مستمع حدث النقر
                    orderItem.addEventListener('click', function(e) {
                        // تجاهل النقر على زر الحذف
                        if (e.target.closest('.delete')) return;
                        
                        recallHeldOrder(order.id);
                    });
                    
                    // إضافة مستمع حدث للحذف
                    const deleteBtn = orderItem.querySelector('.delete');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            deleteHeldOrder(order.id);
                        });
                    }
                    
                    heldOrdersList.appendChild(orderItem);
                });
                
                // إظهار المودال
                showModal('held-orders-modal');
            } else {
                heldOrders = [];
                
                // عرض رسالة فارغة
                const heldOrdersList = document.getElementById('held-orders-list');
                heldOrdersList.innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-pause-circle"></i>
                        <p>لا توجد طلبات معلقة</p>
                    </div>
                `;
                
                // إظهار المودال
                showModal('held-orders-modal');
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل الطلبات المعلقة:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء تحميل الطلبات المعلقة', 'error');
        });
}

/**
 * استرجاع طلب معلق
 * @param {string} orderId معرف الطلب
 */
function recallHeldOrder(orderId) {
    // التحقق من وجود طلب معلق في السلة
    if (cart.length > 0) {
        Swal.fire({
            title: 'تنبيه',
            text: 'توجد منتجات في السلة الحالية. هل تريد استبدالها بالطلب المعلق؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، استبدال',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                loadHeldOrder(orderId);
            }
        });
    } else {
        loadHeldOrder(orderId);
    }
}

/**
 * تحميل طلب معلق
 * @param {string} orderId معرف الطلب
 */
function loadHeldOrder(orderId) {
    // البحث عن الطلب في المصفوفة المحلية
    const order = heldOrders.find(o => o.id === orderId);
    
    if (!order) {
        showNotification('خطأ', 'لم يتم العثور على الطلب المعلق', 'error');
        return;
    }
    
    // عرض مؤشر التحميل
    showLoading('جاري استرجاع الطلب...');
    
    // استبدال السلة بالطلب المعلق
    cart = [...order.items];
    
    // استعادة العميل إذا كان موجوداً
    if (order.customer) {
        selectedCustomer = { ...order.customer };
        
        // عرض بيانات العميل
        document.getElementById('selected-customer').style.display = 'flex';
        document.getElementById('add-customer').style.display = 'none';
        document.querySelector('.customer-name').textContent = selectedCustomer.name;
        document.querySelector('.customer-points').textContent = `النقاط: ${selectedCustomer.points || 0}`;
    } else {
        // إزالة العميل الحالي
        removeCustomer();
    }
    
    // استعادة الخصم
    document.getElementById('discount-value').value = order.discount.value;
    document.getElementById('discount-type').value = order.discount.type;
    
    // تحديث السلة
    renderCart();
    updateCartSummary();
    
    // حذف الطلب من قاعدة البيانات
    dbRef.ref(`branches/${currentBranch.id}/held_orders/${orderId}`).remove()
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // إغلاق المودال
            hideModal('held-orders-modal');
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم استرجاع الطلب بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('recall_order', 'استرجاع طلب معلق', { orderId: orderId });
        })
        .catch(error => {
            console.error('خطأ في حذف الطلب المعلق:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حذف الطلب المعلق', 'error');
        });
}

/**
 * حذف طلب معلق
 * @param {string} orderId معرف الطلب
 */
function deleteHeldOrder(orderId) {
    Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد من حذف هذا الطلب المعلق؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، حذف',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            // عرض مؤشر التحميل
            showLoading('جاري حذف الطلب...');
            
            // حذف الطلب من قاعدة البيانات
            dbRef.ref(`branches/${currentBranch.id}/held_orders/${orderId}`).remove()
                .then(() => {
                    // إزالة الطلب من المصفوفة المحلية
                    heldOrders = heldOrders.filter(o => o.id !== orderId);
                    
                    // إزالة الطلب من واجهة المستخدم
                    const orderItem = document.querySelector(`.held-order-item[data-id="${orderId}"]`);
                    if (orderItem) {
                        orderItem.remove();
                    }
                    
                    // التحقق مما إذا كانت القائمة فارغة
                    if (heldOrders.length === 0) {
                        const heldOrdersList = document.getElementById('held-orders-list');
                        heldOrdersList.innerHTML = `
                            <div class="empty-message">
                                <i class="fas fa-pause-circle"></i>
                                <p>لا توجد طلبات معلقة</p>
                            </div>
                        `;
                    }
                    
                    // إخفاء مؤشر التحميل
                    hideLoading();
                    
                    // عرض رسالة نجاح
                    showNotification('تم بنجاح', 'تم حذف الطلب المعلق بنجاح', 'success');
                    
                    // تسجيل النشاط
                    logUserActivity('delete_held_order', 'حذف طلب معلق', { orderId: orderId });
                })
                .catch(error => {
                    console.error('خطأ في حذف الطلب المعلق:', error);
                    hideLoading();
                    showNotification('خطأ', 'حدث خطأ أثناء حذف الطلب المعلق', 'error');
                });
        }
    });
}

/**
 * تحميل العملاء
 */
function loadCustomers() {
    // تحميل العملاء من قاعدة البيانات
    dbRef.ref('customers').once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                customers = [];
                
                snapshot.forEach(childSnapshot => {
                    const customer = childSnapshot.val();
                    customer.id = childSnapshot.key;
                    customers.push(customer);
                });
            } else {
                // إنشاء عملاء افتراضيين
                createDefaultCustomers();
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل العملاء:', error);
            showNotification('خطأ', 'حدث خطأ أثناء تحميل العملاء', 'error');
        });
}

/**
 * إنشاء عملاء افتراضيين
 */
function createDefaultCustomers() {
    const defaultCustomers = [
        { name: 'أحمد محمد', phone: '0501234567', email: 'ahmed@example.com', points: 150 },
        { name: 'سارة علي', phone: '0557891234', email: 'sara@example.com', points: 320 },
        { name: 'خالد عبدالله', phone: '0534567890', email: 'khaled@example.com', points: 75 }
    ];
    
    // إضافة العملاء إلى قاعدة البيانات
    const customersRef = dbRef.ref('customers');
    
    const promises = defaultCustomers.map(customer => {
        return customersRef.push({
            ...customer,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        });
    });
    
    Promise.all(promises)
        .then(() => {
            // إعادة تحميل العملاء
            loadCustomers();
        })
        .catch(error => {
            console.error('خطأ في إنشاء العملاء الافتراضيين:', error);
        });
}

/**
 * عرض مودال إضافة عميل
 */
function showAddCustomerModal() {
    // تفريغ حقل البحث
    document.getElementById('customer-search').value = '';
    
    // عرض قائمة العملاء
    renderCustomersList();
    
    // إظهار المودال
    showModal('add-customer-modal');
    
    // التركيز على حقل البحث
    setTimeout(() => {
        document.getElementById('customer-search').focus();
    }, 300);
}

/**
 * عرض قائمة العملاء
 * @param {string} searchTerm مصطلح البحث
 */
function renderCustomersList(searchTerm = '') {
    const customersList = document.getElementById('customers-list');
    if (!customersList) return;
    
    // تفريغ القائمة
    customersList.innerHTML = '';
    
    // تصفية العملاء حسب البحث
    let filteredCustomers = [...customers];
    
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredCustomers = customers.filter(customer => 
            customer.name.toLowerCase().includes(searchLower) || 
            customer.phone.includes(searchTerm) || 
            (customer.email && customer.email.toLowerCase().includes(searchLower))
        );
    }
    
    // عرض العملاء
    if (filteredCustomers.length === 0) {
        customersList.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-users"></i>
                <p>لا يوجد عملاء${searchTerm ? ' مطابقين للبحث' : ''}</p>
            </div>
        `;
        return;
    }
    
    filteredCustomers.forEach(customer => {
        const customerItem = document.createElement('div');
        customerItem.className = 'customer-item';
        
        customerItem.innerHTML = `
            <div class="customer-item-info">
                <div class="customer-item-name">${customer.name}</div>
                <div class="customer-item-phone">${customer.phone}</div>
            </div>
            <div class="customer-item-points">${customer.points || 0} نقطة</div>
        `;
        
        customerItem.addEventListener('click', function() {
            selectCustomer(customer);
            hideModal('add-customer-modal');
        });
        
        customersList.appendChild(customerItem);
    });
}

/**
 * تحديد عميل
 * @param {Object} customer العميل
 */
function selectCustomer(customer) {
    selectedCustomer = customer;
    
    // عرض بيانات العميل
    document.getElementById('selected-customer').style.display = 'flex';
    document.getElementById('add-customer').style.display = 'none';
    
    document.querySelector('.customer-name').textContent = customer.name;
    document.querySelector('.customer-points').textContent = `النقاط: ${customer.points || 0}`;
}

/**
 * إزالة العميل المحدد
 */
function removeCustomer() {
    selectedCustomer = null;
    
    document.getElementById('selected-customer').style.display = 'none';
    document.getElementById('add-customer').style.display = 'block';
}

/**
 * عرض مودال إضافة عميل جديد
 */
function showNewCustomerModal() {
    // إخفاء مودال العملاء
    document.getElementById('add-customer-modal').style.display = 'none';
    
    // تفريغ النموذج
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-email').value = '';
    document.getElementById('customer-address').value = '';
    document.getElementById('customer-notes').value = '';
    
    // إظهار مودال عميل جديد
    showModal('new-customer-modal');
    
    // التركيز على حقل الاسم
    setTimeout(() => {
        document.getElementById('customer-name').focus();
    }, 300);
}

/**
 * إضافة عميل جديد
 */
function addNewCustomer() {
    // الحصول على بيانات العميل
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const email = document.getElementById('customer-email').value;
    const address = document.getElementById('customer-address').value;
    const notes = document.getElementById('customer-notes').value;
    
    // التحقق من البيانات
    if (!name || !phone) {
        showNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // عرض مؤشر التحميل
    showLoading('جاري إضافة العميل...');
    
    // إنشاء كائن العميل
    const newCustomer = {
        name: name,
        phone: phone,
        email: email,
        address: address,
        notes: notes,
        points: 0,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id
    };
    
    // إضافة العميل إلى قاعدة البيانات
    dbRef.ref('customers').push(newCustomer)
        .then(snapshot => {
            // إضافة معرف العميل
            newCustomer.id = snapshot.key;
            
            // إضافة العميل إلى المصفوفة المحلية
            customers.push(newCustomer);
            
            // اختيار العميل الجديد
            selectCustomer(newCustomer);
            
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // إغلاق المودال
            hideModal('new-customer-modal');
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم إضافة العميل بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('add_customer', 'إضافة عميل جديد', { customerId: newCustomer.id });
        })
        .catch(error => {
            console.error('خطأ في إضافة العميل:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء إضافة العميل', 'error');
        });
}

/**
 * البحث عن منتج حسب كلمة البحث
 * @param {string} searchTerm مصطلح البحث
 */
function searchProducts(searchTerm) {
    if (!searchTerm) {
        // عرض جميع المنتجات
        filterProductsByCategory('all');
        return;
    }
    
    // تصفية المنتجات
    const searchLower = searchTerm.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) || 
        product.barcode.includes(searchTerm) || 
        (product.description && product.description.toLowerCase().includes(searchLower))
    );
    
    // عرض المنتجات المصفاة
    const productsContainer = document.getElementById('products-container');
    productsContainer.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-products">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على منتجات مطابقة</p>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        renderProduct(product, productsContainer);
    });
}

function addProductByBarcode(barcode) {
    if (!barcode) return;
    
    // البحث عن المنتج بالباركود
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
        // إضافة المنتج إلى السلة
        addToCart(product);
        
        // تشغيل صوت الباركود
        if (typeof Audio !== 'undefined') {
            try {
                const audio = new Audio('sounds/barcode-scan.mp3');
                audio.play();
            } catch (e) {
                console.log('لا يمكن تشغيل الصوت');
            }
        }
    } else {
        showNotification('خطأ', 'المنتج غير موجود', 'error');
    }
}

/**
 * إعداد مستمعي الأحداث لنقطة البيع
 */
function setupPosEventListeners() {
    // قائمة الأحداث والمستمعين
    
    // أزرار عرض المنتجات
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', function() {
            // إزالة الفئة النشطة من زر القائمة
            listViewBtn.classList.remove('active');
            // إضافة الفئة النشطة لزر الشبكة
            this.classList.add('active');
            
            // تغيير طريقة العرض
            const productsContainer = document.getElementById('products-container');
            productsContainer.classList.add('grid-view');
            productsContainer.classList.remove('list-view');
            
            // إعادة عرض المنتجات
            const activeCategory = document.querySelector('.category-item.active');
            if (activeCategory) {
                filterProductsByCategory(activeCategory.dataset.category);
            } else {
                filterProductsByCategory('all');
            }
        });
    }
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', function() {
            // إزالة الفئة النشطة من زر الشبكة
            gridViewBtn.classList.remove('active');
            // إضافة الفئة النشطة لزر القائمة
            this.classList.add('active');
            
            // تغيير طريقة العرض
            const productsContainer = document.getElementById('products-container');
            productsContainer.classList.add('list-view');
            productsContainer.classList.remove('grid-view');
            
            // إعادة عرض المنتجات
            const activeCategory = document.querySelector('.category-item.active');
            if (activeCategory) {
                filterProductsByCategory(activeCategory.dataset.category);
            } else {
                filterProductsByCategory('all');
            }
        });
    }
    
    // بحث المنتجات
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        productSearch.addEventListener('input', function() {
            searchProducts(this.value);
        });
    }
    
    // ماسح الباركود
    const barcodeInput = document.getElementById('barcode-input');
    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addProductByBarcode(this.value);
                this.value = '';
            }
        });
    }
    
    const scanBtn = document.getElementById('scan-btn');
    if (scanBtn) {
        scanBtn.addEventListener('click', function() {
            const barcodeInput = document.getElementById('barcode-input');
            addProductByBarcode(barcodeInput.value);
            barcodeInput.value = '';
        });
    }
    
    // زر تفريغ السلة
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    // حقول الخصم
    const discountValue = document.getElementById('discount-value');
    const discountType = document.getElementById('discount-type');
    
    if (discountValue) {
        discountValue.addEventListener('input', updateCartSummary);
    }
    
    if (discountType) {
        discountType.addEventListener('change', updateCartSummary);
    }
    
    // أزرار طرق الدفع
    const paymentBtns = document.querySelectorAll('.payment-btn');
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            paymentBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedPaymentMethod = this.dataset.payment;
            
            // تحديث مودال الدفع
            const amountPaid = document.getElementById('amount-paid');
            if (amountPaid) {
                updateRemainingAmount();
            }
        });
    });
    
    // زر إتمام الطلب
    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', showCheckoutModal);
    }
    
    // زر تعليق الطلب
    const holdOrderBtn = document.getElementById('hold-order');
    if (holdOrderBtn) {
        holdOrderBtn.addEventListener('click', holdCurrentOrder);
    }
    
    // زر الطلبات المعلقة
    const heldOrdersBtn = document.getElementById('held-orders-btn');
    if (heldOrdersBtn) {
        heldOrdersBtn.addEventListener('click', showHeldOrders);
    }
    
    // زر إضافة عميل
    const addCustomerBtn = document.getElementById('add-customer');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', showAddCustomerModal);
    }
    
    // زر إزالة العميل
    const removeCustomerBtn = document.getElementById('remove-customer');
    if (removeCustomerBtn) {
        removeCustomerBtn.addEventListener('click', removeCustomer);
    }
    
    // زر إضافة عميل جديد
    const newCustomerBtn = document.getElementById('new-customer');
    if (newCustomerBtn) {
        newCustomerBtn.addEventListener('click', showNewCustomerModal);
    }
    
    // بحث العملاء
    const customerSearch = document.getElementById('customer-search');
    if (customerSearch) {
        customerSearch.addEventListener('input', function() {
            renderCustomersList(this.value);
        });
    }
    
    // نموذج إضافة عميل جديد
    const newCustomerForm = document.getElementById('new-customer-form');
    if (newCustomerForm) {
        newCustomerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewCustomer();
        });
    }
    
    // زر إلغاء إضافة عميل جديد
    const cancelNewCustomerBtn = document.getElementById('cancel-new-customer');
    if (cancelNewCustomerBtn) {
        cancelNewCustomerBtn.addEventListener('click', function() {
            hideModal('new-customer-modal');
            showModal('add-customer-modal');
        });
    }
    
    // تحديث المبلغ المتبقي في مودال الدفع
    const amountPaid = document.getElementById('amount-paid');
    if (amountPaid) {
        amountPaid.addEventListener('input', updateRemainingAmount);
    }
    
    // زر إلغاء الدفع
    const cancelCheckoutBtn = document.getElementById('cancel-checkout');
    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', function() {
            hideModal('checkout-modal');
        });
    }
    
    // زر تأكيد الدفع
    const completeCheckoutBtn = document.getElementById('complete-checkout');
    if (completeCheckoutBtn) {
        completeCheckoutBtn.addEventListener('click', completeCheckout);
    }
    
    // أزرار الفاتورة
    const printReceiptBtn = document.getElementById('print-receipt-btn');
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', function() {
            printInvoice();
        });
    }
    
    const downloadReceiptBtn = document.getElementById('download-receipt-btn');
    if (downloadReceiptBtn) {
        downloadReceiptBtn.addEventListener('click', function() {
            // هذه الوظيفة تحتاج إلى مكتبة PDF
            showNotification('تنبيه', 'جاري تحميل الفاتورة بصيغة PDF', 'info');
        });
    }
    
    const emailReceiptBtn = document.getElementById('email-receipt-btn');
    if (emailReceiptBtn) {
        emailReceiptBtn.addEventListener('click', function() {
            if (!selectedCustomer || !selectedCustomer.email) {
                showNotification('خطأ', 'لا يوجد بريد إلكتروني للعميل', 'error');
                return;
            }
            
            showNotification('تنبيه', `جاري إرسال الفاتورة إلى ${selectedCustomer.email}`, 'info');
        });
    }
    
    const whatsappReceiptBtn = document.getElementById('whatsapp-receipt-btn');
    if (whatsappReceiptBtn) {
        whatsappReceiptBtn.addEventListener('click', function() {
            if (!selectedCustomer || !selectedCustomer.phone) {
                showNotification('خطأ', 'لا يوجد رقم هاتف للعميل', 'error');
                return;
            }
            
            showNotification('تنبيه', `جاري إرسال الفاتورة عبر واتساب إلى ${selectedCustomer.phone}`, 'info');
        });
    }
    
    // التركيز التلقائي على حقل الباركود
    if (appSettings?.pos?.automaticBarcodesFocus && barcodeInput) {
        // التركيز عند تحميل الصفحة
        setTimeout(() => {
            barcodeInput.focus();
        }, 500);
        
        // استعادة التركيز عند النقر في أي مكان في الصفحة
        document.addEventListener('click', function(e) {
            // تجاهل النقر على العناصر التي تأخذ التركيز بشكل طبيعي
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') {
                return;
            }
            
            // تجاهل النقر داخل المودالات
            if (e.target.closest('.modal')) {
                return;
            }
            
            // التركيز على حقل الباركود
            barcodeInput.focus();
        });
    }
}

/**
 * تحديث صفحة نقطة البيع
 */
function refreshPosPage() {
    // تحديث قائمة المنتجات
    if (products.length > 0) {
        filterProductsByCategory('all');
    } else {
        loadProducts();
    }
    
    // تحديث السلة
    renderCart();
    updateCartSummary();
    
    // تحديث العملاء
    if (customers.length === 0) {
        loadCustomers();
    }
    
    // التركيز على حقل الباركود
    if (appSettings?.pos?.automaticBarcodesFocus) {
        setTimeout(() => {
            const barcodeInput = document.getElementById('barcode-input');
            if (barcodeInput) {
                barcodeInput.focus();
            }
        }, 500);
    }
}

// ---------------- وظائف إدارة المخزون ----------------

/**
 * تحديث صفحة المخزون
 */
function refreshInventoryPage() {
    // تحميل المنتجات والأقسام
    if (products.length === 0) {
        loadProducts();
    } else {
        renderInventoryTable();
    }
    
    if (categories.length === 0) {
        loadCategories();
    } else {
        renderCategoryFilter();
    }
}

/**
 * عرض جدول المخزون
 * @param {Array} filteredProducts المنتجات المصفاة
 * @param {number} page رقم الصفحة
 * @param {number} pageSize حجم الصفحة
 */
function renderInventoryTable(filteredProducts = null, page = 1, pageSize = 10) {
    const inventoryTable = document.getElementById('inventory-table-body');
    if (!inventoryTable) return;
    
    // تفريغ الجدول
    inventoryTable.innerHTML = '';
    
    // تحديد المنتجات المعروضة
    const productsToShow = filteredProducts || products;
    
    // حساب الصفحات
    const totalPages = Math.ceil(productsToShow.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, productsToShow.length);
    
    // إذا لم توجد منتجات
    if (productsToShow.length === 0) {
        inventoryTable.innerHTML = '<tr><td colspan="8" class="empty-table">لا توجد منتجات</td></tr>';
        return;
    }
    
    // عرض المنتجات
    for (let i = startIndex; i < endIndex; i++) {
        const product = productsToShow[i];
        const category = categories.find(c => c.id === product.category) || { name: 'غير محدد' };
        const stockStatus = getStockStatus(product.stock);
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="product-image-small">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}">` : `<i class="fas ${product.icon}"></i>`}
                </div>
            </td>
            <td>${product.name}</td>
            <td>${product.barcode}</td>
            <td>${category.name}</td>
            <td>${formatCurrency(product.price)}</td>
            <td><span class="stock-badge ${stockStatus.class}">${product.stock}</span></td>
            <td>${product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString() : 'غير محدد'}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit" data-id="${product.id}" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn view" data-id="${product.id}" title="عرض">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn delete" data-id="${product.id}" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // إضافة مستمعي الأحداث
        const editBtn = row.querySelector('.edit');
        const viewBtn = row.querySelector('.view');
        const deleteBtn = row.querySelector('.delete');
        
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                editProduct(product.id);
            });
        }
        
        if (viewBtn) {
            viewBtn.addEventListener('click', function() {
                viewProduct(product.id);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                confirmDeleteProduct(product.id);
            });
        }
        
        inventoryTable.appendChild(row);
    }
    
    // إنشاء ترقيم الصفحات
    createPagination('inventory-pagination', page, totalPages, (newPage) => {
        renderInventoryTable(filteredProducts, newPage, pageSize);
    });
}

/**
 * عرض تصفية الأقسام
 */
function renderCategoryFilter() {
    const categoryFilter = document.getElementById('inventory-category-filter');
    if (!categoryFilter) return;
    
    // الاحتفاظ بالقيمة المحددة
    const selectedValue = categoryFilter.value;
    
    // تفريغ القائمة
    categoryFilter.innerHTML = '<option value="all">الكل</option>';
    
    // إضافة الأقسام
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
    
    // استعادة القيمة المحددة
    if (selectedValue) {
        categoryFilter.value = selectedValue;
    }
}

/**
 * تصفية المنتجات في جدول المخزون
 */
function filterInventory() {
    const searchTerm = document.getElementById('inventory-search').value;
    const categoryFilter = document.getElementById('inventory-category-filter').value;
    const stockFilter = document.getElementById('inventory-stock-filter').value;
    
    // تصفية المنتجات
    let filteredProducts = [...products];
    
    // تصفية حسب البحث
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchLower) || 
            product.barcode.includes(searchTerm) || 
            (product.description && product.description.toLowerCase().includes(searchLower))
        );
    }
    
    // تصفية حسب القسم
    if (categoryFilter && categoryFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
    }
    
    // تصفية حسب المخزون
    if (stockFilter !== 'all') {
        const lowStockThreshold = appSettings?.pos?.lowStockThreshold || 10;
        
        switch (stockFilter) {
            case 'in-stock':
                filteredProducts = filteredProducts.filter(product => product.stock > lowStockThreshold);
                break;
            case 'low-stock':
                filteredProducts = filteredProducts.filter(product => product.stock > 0 && product.stock <= lowStockThreshold);
                break;
            case 'out-of-stock':
                filteredProducts = filteredProducts.filter(product => product.stock <= 0);
                break;
        }
    }
    
    // عرض المنتجات المصفاة
    renderInventoryTable(filteredProducts);
}

/**
 * عرض نموذج تعديل المنتج
 * @param {string} productId معرف المنتج
 */
function editProduct(productId) {
    // البحث عن المنتج
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification('خطأ', 'لم يتم العثور على المنتج', 'error');
        return;
    }
    
    // تعبئة نموذج المنتج
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-barcode').value = product.barcode;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-description').value = product.description || '';
    
    // إظهار المودال
    showModal('add-product-modal');
}

/**
 * عرض تفاصيل المنتج
 * @param {string} productId معرف المنتج
 */
function viewProduct(productId) {
    // البحث عن المنتج
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification('خطأ', 'لم يتم العثور على المنتج', 'error');
        return;
    }
    
    // الحصول على اسم القسم
    const category = categories.find(c => c.id === product.category) || { name: 'غير محدد' };
    
    // عرض المعلومات
    Swal.fire({
        title: product.name,
        html: `
            <div class="product-details" style="text-align: right;">
                <p><strong>السعر:</strong> ${formatCurrency(product.price)}</p>
                <p><strong>القسم:</strong> ${category.name}</p>
                <p><strong>الباركود:</strong> ${product.barcode}</p>
                <p><strong>المخزون:</strong> ${product.stock}</p>
                <p><strong>الوصف:</strong> ${product.description || 'لا يوجد وصف'}</p>
            </div>
        `,
        imageUrl: product.image,
        imageAlt: product.name,
        confirmButtonText: 'إغلاق'
    });
}

/**
 * تأكيد حذف المنتج
 * @param {string} productId معرف المنتج
 */
function confirmDeleteProduct(productId) {
    Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد من حذف هذا المنتج؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، حذف',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteProduct(productId);
        }
    });
}

/**
 * حذف المنتج
 * @param {string} productId معرف المنتج
 */
function deleteProduct(productId) {
    // عرض مؤشر التحميل
    showLoading('جاري حذف المنتج...');
    
    // حذف المنتج من قاعدة البيانات
    dbRef.ref(`branches/${currentBranch.id}/products/${productId}`).remove()
        .then(() => {
            // حذف المنتج من المصفوفة المحلية
            products = products.filter(p => p.id !== productId);
            
            // تحديث جدول المخزون
            renderInventoryTable();
            
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم حذف المنتج بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('delete_product', 'حذف منتج', { productId });
        })
        .catch(error => {
            console.error('خطأ في حذف المنتج:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حذف المنتج', 'error');
        });
}

/**
 * إعداد مستمعي الأحداث لصفحة المخزون
 */
function setupInventoryEventListeners() {
    // أحداث تصفية المخزون
    const inventorySearch = document.getElementById('inventory-search');
    const categoryFilter = document.getElementById('inventory-category-filter');
    const stockFilter = document.getElementById('inventory-stock-filter');
    
    if (inventorySearch) {
        inventorySearch.addEventListener('input', filterInventory);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterInventory);
    }
    
    if (stockFilter) {
        stockFilter.addEventListener('change', filterInventory);
    }
    
    // إضافة منتج جديد
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            // تفريغ النموذج
            document.getElementById('product-name').value = '';
            document.getElementById('product-price').value = '';
            document.getElementById('product-category').value = '';
            document.getElementById('product-barcode').value = '';
            document.getElementById('product-stock').value = '';
            document.getElementById('product-description').value = '';
            
            // إظهار المودال
            showModal('add-product-modal');
        });
    }
    
    // نموذج إضافة منتج
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addOrUpdateProduct();
        });
    }
    
    // زر توليد الباركود
    const generateBarcodeBtn = document.getElementById('generate-barcode-btn');
    if (generateBarcodeBtn) {
        generateBarcodeBtn.addEventListener('click', function() {
            const barcodeInput = document.getElementById('product-barcode');
            barcodeInput.value = generateBarcode(appSettings?.pos?.defaultBarcodeType || 'EAN13');
        });
    }
    
    // زر استيراد المخزون
    const importInventoryBtn = document.getElementById('import-inventory-btn');
    if (importInventoryBtn) {
        importInventoryBtn.addEventListener('click', function() {
            showNotification('تنبيه', 'جاري تحضير ميزة استيراد المخزون...', 'info');
        });
    }
    
    // زر تصدير المخزون
    const exportInventoryBtn = document.getElementById('export-inventory-btn');
    if (exportInventoryBtn) {
        exportInventoryBtn.addEventListener('click', function() {
            showNotification('تنبيه', 'جاري تحضير ميزة تصدير المخزون...', 'info');
        });
    }
    
    // زر طباعة المخزون
    const printInventoryBtn = document.getElementById('print-inventory-btn');
    if (printInventoryBtn) {
        printInventoryBtn.addEventListener('click', function() {
            showNotification('تنبيه', 'جاري تحضير ميزة طباعة المخزون...', 'info');
        });
    }
}

/**
 * إضافة أو تحديث منتج
 */
function addOrUpdateProduct() {
    // الحصول على بيانات المنتج
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;
    const barcode = document.getElementById('product-barcode').value || generateBarcode();
    const stock = parseInt(document.getElementById('product-stock').value);
    const description = document.getElementById('product-description').value;
    
    // التحقق من البيانات
    if (!name || isNaN(price) || !category || isNaN(stock)) {
        showNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // الحصول على أيقونة القسم
    const categoryObj = categories.find(c => c.id === category);
    const icon = categoryObj ? categoryObj.icon : 'fa-box';
    
    // التحقق مما إذا كان المنتج موجوداً
    const existingProduct = products.find(p => p.barcode === barcode && (!selectedProduct || p.id !== selectedProduct.id));
    
    if (existingProduct) {
        showNotification('خطأ', 'يوجد منتج آخر بنفس الباركود', 'error');
        return;
    }
    
    // عرض مؤشر التحميل
    showLoading('جاري حفظ المنتج...');
    
    // إنشاء كائن المنتج
    const productData = {
        name: name,
        price: price,
        category: category,
        icon: icon,
        stock: stock,
        barcode: barcode,
        description: description,
        lastUpdated: new Date().toISOString()
    };
    
    // حفظ المنتج في قاعدة البيانات
    let promise;
    
    if (selectedProduct) {
        // تحديث منتج موجود
        promise = dbRef.ref(`branches/${currentBranch.id}/products/${selectedProduct.id}`).update(productData)
            .then(() => {
                // تحديث المنتج في المصفوفة المحلية
                const index = products.findIndex(p => p.id === selectedProduct.id);
                if (index !== -1) {
                    products[index] = { ...products[index], ...productData };
                }
                
                // تسجيل النشاط
                logUserActivity('update_product', 'تحديث منتج', { productId: selectedProduct.id });
                
                // إعادة تعيين المنتج المحدد
                selectedProduct = null;
            });
    } else {
        // إضافة منتج جديد
        promise = dbRef.ref(`branches/${currentBranch.id}/products`).push(productData)
            .then(snapshot => {
                // إضافة المنتج إلى المصفوفة المحلية
                const newProduct = { ...productData, id: snapshot.key };
                products.push(newProduct);
                
                // تسجيل النشاط
                logUserActivity('add_product', 'إضافة منتج جديد', { productId: snapshot.key });
                
                
                /**
 * ملف قاعدة البيانات
 * يحتوي على وظائف التعامل مع قاعدة بيانات Firebase
 */

// المتغيرات العامة
let db = null;
let auth = null;
let storage = null;

/**
 * تهيئة قاعدة البيانات
 */
function initDatabase() {
    try {
        // الحصول على مراجع لخدمات Firebase
        db = firebase.database();
        auth = firebase.auth();
        storage = firebase.storage();
        
        console.log('تم تهيئة قاعدة البيانات بنجاح');
        return true;
    } catch (error) {
        console.error('خطأ في تهيئة قاعدة البيانات:', error);
        return false;
    }
}

/**
 * استرجاع حالة المصادقة
 * @returns {Promise} وعد يحتوي على حالة المصادقة الحالية
 */
function getAuthState() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        }, error => {
            reject(error);
        });
    });
}

/**
 * تسجيل الدخول باستخدام اسم المستخدم وكلمة المرور
 * @param {string} username اسم المستخدم
 * @param {string} password كلمة المرور
 * @returns {Promise<Object>} وعد يحتوي على معلومات المستخدم
 */
function loginWithUsername(username, password) {
    return new Promise((resolve, reject) => {
        // البحث عن المستخدم في قاعدة البيانات
        db.ref('users').orderByChild('username').equalTo(username).once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    let userId = null;
                    let userData = null;
                    
                    snapshot.forEach(childSnapshot => {
                        userId = childSnapshot.key;
                        userData = childSnapshot.val();
                    });
                    
                    // تسجيل الدخول باستخدام Firebase Auth
                    return auth.signInWithEmailAndPassword(userData.email, password)
                        .then(() => {
                            // إضافة المعرف إلى بيانات المستخدم
                            userData.id = userId;
                            resolve(userData);
                        })
                        .catch(error => {
                            reject({
                                code: error.code,
                                message: error.message
                            });
                        });
                } else {
                    reject({
                        code: 'auth/user-not-found',
                        message: 'اسم المستخدم غير موجود'
                    });
                }
            })
            .catch(error => {
                reject({
                    code: 'database/error',
                    message: error.message
                });
            });
    });
}

/**
 * تسجيل الخروج
 * @returns {Promise} وعد يشير إلى نجاح تسجيل الخروج
 */
function logout() {
    return auth.signOut();
}

/**
 * الحصول على بيانات المستخدم الحالي
 * @param {string} userId معرف المستخدم
 * @returns {Promise<Object>} وعد يحتوي على بيانات المستخدم
 */
function getCurrentUser(userId) {
    return db.ref(`users/${userId}`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                userData.id = userId;
                return userData;
            } else {
                throw new Error('لم يتم العثور على بيانات المستخدم');
            }
        });
}

/**
 * الحصول على معلومات الفرع
 * @param {string} branchId معرف الفرع
 * @returns {Promise<Object>} وعد يحتوي على معلومات الفرع
 */
function getBranch(branchId) {
    return db.ref(`branches/${branchId}`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const branchData = snapshot.val();
                branchData.id = branchId;
                return branchData;
            } else {
                throw new Error('لم يتم العثور على بيانات الفرع');
            }
        });
}

/**
 * الحصول على قائمة الفروع
 * @returns {Promise<Array>} وعد يحتوي على قائمة الفروع
 */
function getBranches() {
    return db.ref('branches').once('value')
        .then(snapshot => {
            const branches = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const branch = childSnapshot.val();
                    branch.id = childSnapshot.key;
                    branches.push(branch);
                });
            }
            return branches;
        });
}

/**
 * الحصول على إعدادات التطبيق
 * @returns {Promise<Object>} وعد يحتوي على إعدادات التطبيق
 */
function getSettings() {
    return db.ref('settings').once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                return null;
            }
        });
}

/**
 * تحديث إعدادات التطبيق
 * @param {Object} settings إعدادات التطبيق الجديدة
 * @returns {Promise} وعد يشير إلى نجاح التحديث
 */
function updateSettings(settings) {
    return db.ref('settings').update(settings);
}

/**
 * إنشاء فرع جديد
 * @param {Object} branchData بيانات الفرع
 * @returns {Promise<string>} وعد يحتوي على معرف الفرع الجديد
 */
function createBranch(branchData) {
    const newBranchRef = db.ref('branches').push();
    return newBranchRef.set(branchData)
        .then(() => newBranchRef.key);
}

/**
 * تحديث بيانات فرع
 * @param {string} branchId معرف الفرع
 * @param {Object} branchData بيانات الفرع الجديدة
 * @returns {Promise} وعد يشير إلى نجاح التحديث
 */
function updateBranch(branchId, branchData) {
    return db.ref(`branches/${branchId}`).update(branchData);
}

/**
 * حذف فرع
 * @param {string} branchId معرف الفرع
 * @returns {Promise} وعد يشير إلى نجاح الحذف
 */
function deleteBranch(branchId) {
    return db.ref(`branches/${branchId}`).remove();
}

/**
 * إنشاء مستخدم جديد
 * @param {Object} userData بيانات المستخدم
 * @param {string} password كلمة المرور
 * @returns {Promise<string>} وعد يحتوي على معرف المستخدم الجديد
 */
function createUser(userData, password) {
    // إنشاء المستخدم في Firebase Auth
    return auth.createUserWithEmailAndPassword(userData.email, password)
        .then(result => {
            // الحصول على معرف المستخدم
            const userId = result.user.uid;
            
            // حفظ بيانات المستخدم في قاعدة البيانات
            return db.ref(`users/${userId}`).set(userData)
                .then(() => userId);
        });
}

/**
 * تحديث بيانات مستخدم
 * @param {string} userId معرف المستخدم
 * @param {Object} userData بيانات المستخدم الجديدة
 * @returns {Promise} وعد يشير إلى نجاح التحديث
 */
function updateUser(userId, userData) {
    return db.ref(`users/${userId}`).update(userData);
}

/**
 * حذف مستخدم
 * @param {string} userId معرف المستخدم
 * @returns {Promise} وعد يشير إلى نجاح الحذف
 */
function deleteUser(userId) {
    // حذف المستخدم من Firebase Auth
    const user = auth.currentUser;
    
    if (user.uid === userId) {
        return user.delete()
            .then(() => {
                // حذف بيانات المستخدم من قاعدة البيانات
                return db.ref(`users/${userId}`).remove();
            });
    } else {
        // المستخدم المطلوب حذفه ليس المستخدم الحالي
        // هذا يتطلب إعادة المصادقة، لذا سنكتفي بحذف البيانات من قاعدة البيانات
        return db.ref(`users/${userId}`).remove();
    }
}

/**
 * الحصول على قائمة المستخدمين
 * @returns {Promise<Array>} وعد يحتوي على قائمة المستخدمين
 */
function getUsers() {
    return db.ref('users').once('value')
        .then(snapshot => {
            const users = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const user = childSnapshot.val();
                    user.id = childSnapshot.key;
                    users.push(user);
                });
            }
            return users;
        });
}

/**
 * تغيير كلمة مرور المستخدم
 * @param {string} newPassword كلمة المرور الجديدة
 * @returns {Promise} وعد يشير إلى نجاح التغيير
 */
function changePassword(newPassword) {
    const user = auth.currentUser;
    if (user) {
        return user.updatePassword(newPassword);
    } else {
        return Promise.reject(new Error('المستخدم غير مسجل الدخول'));
    }
}

/**
 * الحصول على الفئات
 * @param {string} branchId معرف الفرع
 * @returns {Promise<Array>} وعد يحتوي على قائمة الفئات
 */
function getCategories(branchId) {
    return db.ref(`branches/${branchId}/categories`).once('value')
        .then(snapshot => {
            const categories = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const category = childSnapshot.val();
                    category.id = childSnapshot.key;
                    categories.push(category);
                });
            }
            return categories;
        });
}

/**
 * إنشاء فئة جديدة
 * @param {string} branchId معرف الفرع
 * @param {Object} categoryData بيانات الفئة
 * @returns {Promise<string>} وعد يحتوي على معرف الفئة الجديدة
 */
function createCategory(branchId, categoryData) {
    const newCategoryRef = db.ref(`branches/${branchId}/categories`).push();
    return newCategoryRef.set(categoryData)
        .then(() => newCategoryRef.key);
}

/**
 * تحديث بيانات فئة
 * @param {string} branchId معرف الفرع
 * @param {string} categoryId معرف الفئة
 * @param {Object} categoryData بيانات الفئة الجديدة
 * @returns {Promise} وعد يشير إلى نجاح التحديث
 */
function updateCategory(branchId, categoryId, categoryData) {
    return db.ref(`branches/${branchId}/categories/${categoryId}`).update(categoryData);
}

/**
 * حذف فئة
 * @param {string} branchId معرف الفرع
 * @param {string} categoryId معرف الفئة
 * @returns {Promise} وعد يشير إلى نجاح الحذف
 */
function deleteCategory(branchId, categoryId) {
    return db.ref(`branches/${branchId}/categories/${categoryId}`).remove();
}

/**
 * الحصول على المنتجات
 * @param {string} branchId معرف الفرع
 * @returns {Promise<Array>} وعد يحتوي على قائمة المنتجات
 */
function getProducts(branchId) {
    return db.ref(`branches/${branchId}/products`).once('value')
        .then(snapshot => {
            const products = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const product = childSnapshot.val();
                    product.id = childSnapshot.key;
                    products.push(product);
                });
            }
            return products;
        });
}

/**
 * إنشاء منتج جديد
 * @param {string} branchId معرف الفرع
 * @param {Object} productData بيانات المنتج
 * @returns {Promise<string>} وعد يحتوي على معرف المنتج الجديد
 */
function createProduct(branchId, productData) {
    const newProductRef = db.ref(`branches/${branchId}/products`).push();
    return newProductRef.set(productData)
        .then(() => newProductRef.key);
}

/**
 * تحديث بيانات منتج
 * @param {string} branchId معرف الفرع
 * @param {string} productId معرف المنتج
 * @param {Object} productData بيانات المنتج الجديدة
 * @returns {Promise} وعد يشير إلى نجاح التحديث
 */
function updateProduct(branchId, productId, productData) {
    return db.ref(`branches/${branchId}/products/${productId}`).update(productData);
}

/**
 * حذف منتج
 * @param {string} branchId معرف الفرع
 * @param {string} productId معرف المنتج
 * @returns {Promise} وعد يشير إلى نجاح الحذف
 */
function deleteProduct(branchId, productId) {
    return db.ref(`branches/${branchId}/products/${productId}`).remove();
}

/**
 * تحديث مخزون منتج
 * @param {string} branchId معرف الفرع
 * @param {string} productId معرف المنتج
 * @param {number} newStock المخزون الجديد
 * @returns {Promise} وعد يشير إلى نجاح التحديث
 */
function updateProductStock(branchId, productId, newStock) {
    return db.ref(`branches/${branchId}/products/${productId}/stock`).set(newStock);
}

/**
 * الحصول على العملاء
 * @returns {Promise<Array>} وعد يحتوي على قائمة العملاء
 */
function getCustomers() {
    return db.ref('customers').once('value')
        .then(snapshot => {
            const customers = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const customer = childSnapshot.val();
                    customer.id = childSnapshot.key;
                    customers.push(customer);
                });
            }
            return customers;
        });
}

/**
 * إنشاء عميل جديد
 * @param {Object} customerData بيانات العميل
 * @returns {Promise<string>} وعد يحتوي على معرف العميل الجديد
 */
function createCustomer(customerData) {
    const newCustomerRef = db.ref('customers').push();
    return newCustomerRef.set(customerData)
        .then(() => newCustomerRef.key);
}

/**
 * تحديث بيانات عميل
 * @param {string} customerId معرف العميل
 * @param {Object} customerData بيانات العميل الجديدة
 * @returns {Promise} وعد يشير إلى نجاح التحديث
 */
function updateCustomer(customerId, customerData) {
    return db.ref(`customers/${customerId}`).update(customerData);
}

/**
 * حذف عميل
 * @param {string} customerId معرف العميل
 * @returns {Promise} وعد يشير إلى نجاح الحذف
 */
function deleteCustomer(customerId) {
    return db.ref(`customers/${customerId}`).remove();
}

/**
 * تحديث نقاط العميل
 * @param {string} customerId معرف العميل
 * @param {number} newPoints النقاط الجديدة
 * @returns {Promise} وعد يشير إلى نجاح التحديث
 */
function updateCustomerPoints(customerId, newPoints) {
    return db.ref(`customers/${customerId}/points`).set(newPoints);
}

/**
 * إضافة سجل نقاط للعميل
 * @param {string} customerId معرف العميل
 * @param {Object} pointsEntry سجل النقاط
 * @returns {Promise<string>} وعد يحتوي على معرف السجل الجديد
 */
function addCustomerPointsEntry(customerId, pointsEntry) {
    const newEntryRef = db.ref(`customers/${customerId}/points_history`).push();
    return newEntryRef.set(pointsEntry)
        .then(() => newEntryRef.key);
}

/**
 * حفظ فاتورة جديدة
 * @param {string} branchId معرف الفرع
 * @param {Object} invoice بيانات الفاتورة
 * @returns {Promise<string>} وعد يحتوي على معرف الفاتورة الجديدة
 */
function saveInvoice(branchId, invoice) {
    const newInvoiceRef = db.ref(`branches/${branchId}/invoices`).push();
    return newInvoiceRef.set(invoice)
        .then(() => newInvoiceRef.key);
}

/**
 * الحصول على الفواتير
 * @param {string} branchId معرف الفرع
 * @param {Object} options خيارات الاستعلام
 * @returns {Promise<Array>} وعد يحتوي على قائمة الفواتير
 */
function getInvoices(branchId, options = {}) {
    let query = db.ref(`branches/${branchId}/invoices`);
    
    // تطبيق الخيارات
    if (options.startDate && options.endDate) {
        query = query.orderByChild('timestamp')
            .startAt(options.startDate)
            .endAt(options.endDate);
    } else if (options.limit) {
        query = query.limitToLast(options.limit);
    }
    
    return query.once('value')
        .then(snapshot => {
            const invoices = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const invoice = childSnapshot.val();
                    invoice.id = childSnapshot.key;
                    invoices.push(invoice);
                });
            }
            return invoices;
        });
}

/**
 * حفظ طلب معلق
 * @param {string} branchId معرف الفرع
 * @param {Object} heldOrder بيانات الطلب المعلق
 * @returns {Promise<string>} وعد يحتوي على معرف الطلب الجديد
 */
function saveHeldOrder(branchId, heldOrder) {
    const newOrderRef = db.ref(`branches/${branchId}/held_orders`).push();
    return newOrderRef.set(heldOrder)
        .then(() => newOrderRef.key);
}

/**
 * الحصول على الطلبات المعلقة
 * @param {string} branchId معرف الفرع
 * @returns {Promise<Array>} وعد يحتوي على قائمة الطلبات المعلقة
 */
function getHeldOrders(branchId) {
    return db.ref(`branches/${branchId}/held_orders`).once('value')
        .then(snapshot => {
            const orders = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const order = childSnapshot.val();
                    order.id = childSnapshot.key;
                    orders.push(order);
                });
            }
            return orders;
        });
}

/**
 * حذف طلب معلق
 * @param {string} branchId معرف الفرع
 * @param {string} orderId معرف الطلب
 * @returns {Promise} وعد يشير إلى نجاح الحذف
 */
function deleteHeldOrder(branchId, orderId) {
    return db.ref(`branches/${branchId}/held_orders/${orderId}`).remove();
}

/**
 * تسجيل نشاط
 * @param {Object} activity بيانات النشاط
 * @returns {Promise<string>} وعد يحتوي على معرف النشاط الجديد
 */
function logActivity(activity) {
    const newActivityRef = db.ref('activity_logs').push();
    return newActivityRef.set(activity)
        .then(() => newActivityRef.key);
}

/**
 * الحصول على سجل الأنشطة
 * @param {Object} options خيارات الاستعلام
 * @returns {Promise<Array>} وعد يحتوي على قائمة الأنشطة
 */
function getActivityLogs(options = {}) {
    let query = db.ref('activity_logs');
    
    // تطبيق الخيارات
    if (options.userId) {
        query = query.orderByChild('userId').equalTo(options.userId);
    } else if (options.startDate && options.endDate) {
        query = query.orderByChild('timestamp')
            .startAt(options.startDate)
            .endAt(options.endDate);
    } else if (options.limit) {
        query = query.limitToLast(options.limit);
    }
    
    return query.once('value')
        .then(snapshot => {
            const logs = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const log = childSnapshot.val();
                    log.id = childSnapshot.key;
                    logs.push(log);
                });
            }
            return logs;
        });
}

/**
 * رفع ملف إلى التخزين
 * @param {string} path مسار الملف
 * @param {File} file الملف
 * @param {Function} progressCallback دالة رد الاتصال للتقدم
 * @returns {Promise<string>} وعد يحتوي على رابط الملف المرفوع
 */
function uploadFile(path, file, progressCallback) {
    const storageRef = storage.ref(path);
    const uploadTask = storageRef.put(file);
    
    if (progressCallback) {
        uploadTask.on('state_changed', progressCallback);
    }
    
    return uploadTask.then(() => storageRef.getDownloadURL());
}

/**
 * حذف ملف من التخزين
 * @param {string} path مسار الملف
 * @returns {Promise} وعد يشير إلى نجاح الحذف
 */
function deleteFile(path) {
    const storageRef = storage.ref(path);
    return storageRef.delete();
}

/**
 * إنشاء نسخة احتياطية
 * @param {string} name اسم النسخة
 * @param {Object} options خيارات النسخ الاحتياطي
 * @param {boolean} options.products نسخ المنتجات
 * @param {boolean} options.customers نسخ العملاء
 * @param {boolean} options.invoices نسخ الفواتير
 * @param {boolean} options.settings نسخ الإعدادات
 * @param {boolean} options.users نسخ المستخدمين
 * @returns {Promise<Object>} وعد يحتوي على بيانات النسخة الاحتياطية
 */
function createBackup(name, options = {}) {
    const backup = {
        name: name,
        timestamp: new Date().toISOString(),
        data: {}
    };
    
    const promises = [];
    
    // جمع البيانات المطلوبة
    if (options.products) {
        promises.push(
            db.ref('branches').once('value')
                .then(snapshot => {
                    backup.data.branches = {};
                    if (snapshot.exists()) {
                        snapshot.forEach(childSnapshot => {
                            const branchId = childSnapshot.key;
                            const branch = childSnapshot.val();
                            
                            // استخراج المنتجات والفئات فقط
                            backup.data.branches[branchId] = {
                                categories: branch.categories || {},
                                products: branch.products || {}
                            };
                        });
                    }
                })
        );
    }
    
    if (options.customers) {
        promises.push(
            db.ref('customers').once('value')
                .then(snapshot => {
                    backup.data.customers = snapshot.val() || {};
                })
        );
    }
    
    if (options.invoices) {
        promises.push(
            db.ref('branches').once('value')
                .then(snapshot => {
                    if (!backup.data.branches) {
                        backup.data.branches = {};
                    }
                    
                    if (snapshot.exists()) {
                        snapshot.forEach(childSnapshot => {
                            const branchId = childSnapshot.key;
                            const branch = childSnapshot.val();
                            
                            // إضافة الفواتير فقط
                            if (!backup.data.branches[branchId]) {
                                backup.data.branches[branchId] = {};
                            }
                            
                            backup.data.branches[branchId].invoices = branch.invoices || {};
                        });
                    }
                })
        );
    }
    
    if (options.settings) {
        promises.push(
            db.ref('settings').once('value')
                .then(snapshot => {
                    backup.data.settings = snapshot.val() || {};
                })
        );
    }
    
    if (options.users) {
        promises.push(
            db.ref('users').once('value')
                .then(snapshot => {
                    backup.data.users = snapshot.val() || {};
                })
        );
    }
    
    // انتظار اكتمال جميع العمليات
    return Promise.all(promises)
        .then(() => {
            // تحويل البيانات إلى JSON
            const backupData = JSON.stringify(backup.data);
            
            // إنشاء Blob للتحميل
            const blob = new Blob([backupData], { type: 'application/json' });
            
            // رفع النسخة الاحتياطية إلى التخزين
            const path = `backups/${name}_${Date.now()}.json`;
            return uploadFile(path, blob)
                .then(downloadURL => {
                    // إنشاء سجل للنسخة الاحتياطية
                    const backupRecord = {
                        name: name,
                        path: path,
                        url: downloadURL,
                        timestamp: backup.timestamp,
                        size: backupData.length,
                        userId: auth.currentUser.uid,
                        userName: auth.currentUser.displayName || auth.currentUser.email,
                        type: 'manual',
                        options: options
                    };
                    
                    // حفظ سجل النسخة الاحتياطية
                    return db.ref('backup_history').push(backupRecord)
                        .then(() => backupRecord);
                });
        });
}

/**
 * استعادة نسخة احتياطية
 * @param {string} backupId معرف النسخة الاحتياطية
 * @param {Object} options خيارات الاستعادة
 * @returns {Promise} وعد يشير إلى نجاح الاستعادة
 */
function restoreBackup(backupId, options = {}) {
    // الحصول على معلومات النسخة الاحتياطية
    return db.ref(`backup_history/${backupId}`).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                throw new Error('النسخة الاحتياطية غير موجودة');
            }
            
            const backupRecord = snapshot.val();
            
            // تنزيل ملف النسخة الاحتياطية
            return fetch(backupRecord.url)
                .then(response => response.json())
                .then(backupData => {
                    const updates = {};
                    
                    // استعادة البيانات المطلوبة
                    if (options.products && backupData.branches) {
                        Object.keys(backupData.branches).forEach(branchId => {
                            if (backupObject.keys(backupData.branches).forEach(branchId => {
                            if (backupData.branches[branchId].categories) {
                                updates[`branches/${branchId}/categories`] = backupData.branches[branchId].categories;
                            }
                            
                            if (backupData.branches[branchId].products) {
                                updates[`branches/${branchId}/products`] = backupData.branches[branchId].products;
                            }
                        });
                    }
                    
                    if (options.customers && backupData.customers) {
                        updates['customers'] = backupData.customers;
                    }
                    
                    if (options.invoices && backupData.branches) {
                        Object.keys(backupData.branches).forEach(branchId => {
                            if (backupData.branches[branchId].invoices) {
                                updates[`branches/${branchId}/invoices`] = backupData.branches[branchId].invoices;
                            }
                        });
                    }
                    
                    if (options.settings && backupData.settings) {
                        updates['settings'] = backupData.settings;
                    }
                    
                    if (options.users && backupData.users) {
                        // لا نستطيع استعادة المستخدمين مباشرة بسبب تكامل Firebase Auth
                        // يمكن استعادة بيانات المستخدمين فقط
                        updates['users'] = backupData.users;
                    }
                    
                    // تطبيق التحديثات
                    return db.ref().update(updates)
                        .then(() => {
                            // تسجيل عملية الاستعادة
                            return logActivity({
                                type: 'restore_backup',
                                description: `استعادة نسخة احتياطية: ${backupRecord.name}`,
                                userId: auth.currentUser.uid,
                                userName: auth.currentUser.displayName || auth.currentUser.email,
                                timestamp: new Date().toISOString(),
                                data: {
                                    backupId: backupId,
                                    options: options
                                }
                            });
                        });
                });
        });
}

/**
 * حذف نسخة احتياطية
 * @param {string} backupId معرف النسخة الاحتياطية
 * @returns {Promise} وعد يشير إلى نجاح الحذف
 */
function deleteBackup(backupId) {
    // الحصول على معلومات النسخة الاحتياطية
    return db.ref(`backup_history/${backupId}`).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                throw new Error('النسخة الاحتياطية غير موجودة');
            }
            
            const backupRecord = snapshot.val();
            
            // حذف الملف من التخزين
            return deleteFile(backupRecord.path)
                .then(() => {
                    // حذف السجل من قاعدة البيانات
                    return db.ref(`backup_history/${backupId}`).remove();
                })
                .then(() => {
                    // تسجيل عملية الحذف
                    return logActivity({
                        type: 'delete_backup',
                        description: `حذف نسخة احتياطية: ${backupRecord.name}`,
                        userId: auth.currentUser.uid,
                        userName: auth.currentUser.displayName || auth.currentUser.email,
                        timestamp: new Date().toISOString(),
                        data: {
                            backupId: backupId,
                            backupName: backupRecord.name
                        }
                    });
                });
        });
}

/**
 * الحصول على سجل النسخ الاحتياطي
 * @returns {Promise<Array>} وعد يحتوي على سجل النسخ الاحتياطي
 */
function getBackupHistory() {
    return db.ref('backup_history').once('value')
        .then(snapshot => {
            const history = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const backup = childSnapshot.val();
                    backup.id = childSnapshot.key;
                    history.push(backup);
                });
            }
            return history;
        });
}

/**
 * إضافة إشعار
 * @param {Object} notification بيانات الإشعار
 * @returns {Promise<string>} وعد يحتوي على معرف الإشعار الجديد
 */
function addNotification(notification) {
    const newNotificationRef = db.ref('notifications').push();
    return newNotificationRef.set(notification)
        .then(() => newNotificationRef.key);
}

/**
 * الحصول على إشعارات المستخدم
 * @param {string} userId معرف المستخدم
 * @returns {Promise<Array>} وعد يحتوي على قائمة الإشعارات
 */
function getUserNotifications(userId) {
    return db.ref('notifications')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value')
        .then(snapshot => {
            const notifications = [];
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const notification = childSnapshot.val();
                    notification.id = childSnapshot.key;
                    notifications.push(notification);
                });
            }
            return notifications;
        });
}

/**
 * تعيين إشعار كمقروء
 * @param {string} notificationId معرف الإشعار
 * @returns {Promise} وعد يشير إلى نجاح التحديث
 */
function markNotificationAsRead(notificationId) {
    return db.ref(`notifications/${notificationId}`).update({
        isRead: true,
        readAt: new Date().toISOString()
    });
}

/**
 * حذف إشعار
 * @param {string} notificationId معرف الإشعار
 * @returns {Promise} وعد يشير إلى نجاح الحذف
 */
function deleteNotification(notificationId) {
    return db.ref(`notifications/${notificationId}`).remove();
}

/**
 * الحصول على إحصائيات المبيعات
 * @param {string} branchId معرف الفرع
 * @param {string} period الفترة (daily, monthly, yearly)
 * @param {Date} startDate تاريخ البداية
 * @param {Date} endDate تاريخ النهاية
 * @returns {Promise<Object>} وعد يحتوي على إحصائيات المبيعات
 */
function getSalesStats(branchId, period = 'daily', startDate = null, endDate = null) {
    let path = `branches/${branchId}/stats/${period}`;
    let query = db.ref(path);
    
    // تطبيق نطاق التاريخ إذا تم تحديده
    if (startDate && endDate) {
        const startKey = formatDateKey(startDate, period);
        const endKey = formatDateKey(endDate, period);
        
        query = query.orderByKey().startAt(startKey).endAt(endKey);
    }
    
    return query.once('value')
        .then(snapshot => {
            const stats = {};
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const key = childSnapshot.key;
                    const data = childSnapshot.val();
                    stats[key] = data;
                });
            }
            return stats;
        });
}

/**
 * تنسيق مفتاح التاريخ حسب الفترة
 * @param {Date} date التاريخ
 * @param {string} period الفترة (daily, monthly, yearly)
 * @returns {string} مفتاح التاريخ المنسق
 */
function formatDateKey(date, period) {
    const d = new Date(date);
    
    switch (period) {
        case 'daily':
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        case 'monthly':
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        case 'yearly':
            return `${d.getFullYear()}`;
        default:
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
}

/**
 * الاستماع لتغييرات الإشعارات
 * @param {string} userId معرف المستخدم
 * @param {Function} callback دالة رد الاتصال
 * @returns {Function} دالة لإلغاء الاستماع
 */
function listenToNotifications(userId, callback) {
    const query = db.ref('notifications')
        .orderByChild('userId')
        .equalTo(userId);
    
    query.on('value', snapshot => {
        const notifications = [];
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const notification = childSnapshot.val();
                notification.id = childSnapshot.key;
                notifications.push(notification);
            });
        }
        callback(notifications);
    });
    
    // إرجاع دالة لإلغاء الاستماع
    return () => query.off('value');
}

/**
 * الحصول على عدد الإشعارات غير المقروءة
 * @param {string} userId معرف المستخدم
 * @returns {Promise<number>} وعد يحتوي على عدد الإشعارات غير المقروءة
 */
function getUnreadNotificationsCount(userId) {
    return db.ref('notifications')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value')
        .then(snapshot => {
            let count = 0;
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const notification = childSnapshot.val();
                    if (!notification.isRead) {
                        count++;
                    }
                });
            }
            return count;
        });
}

/**
 * تصدير البيانات محلياً
 * @param {Object} data البيانات المراد تصديرها
 * @param {string} filename اسم الملف
 */
function exportDataToJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * تصدير البيانات إلى CSV
 * @param {Array} data مصفوفة البيانات
 * @param {Array} headers عناوين الأعمدة
 * @param {string} filename اسم الملف
 */
function exportDataToCSV(data, headers, filename) {
    const csvRows = [];
    
    // إضافة صف العناوين
    csvRows.push(headers.join(','));
    
    // إضافة صفوف البيانات
    data.forEach(item => {
        const values = headers.map(header => {
            const value = item[header];
            // التعامل مع القيم المختلفة
            if (value === null || value === undefined) {
                return '';
            } else if (typeof value === 'object') {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            } else {
                return `"${String(value).replace(/"/g, '""')}"`;
            }
        });
        csvRows.push(values.join(','));
    });
    
    // إنشاء محتوى CSV
    const csvContent = csvRows.join('\n');
    
    // إنشاء Blob وتنزيله
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

// تصدير الوظائف
return {
    initDatabase,
    getAuthState,
    loginWithUsername,
    logout,
    getCurrentUser,
    getBranch,
    getBranches,
    getSettings,
    updateSettings,
    createBranch,
    updateBranch,
    deleteBranch,
    createUser,
    updateUser,
    deleteUser,
    getUsers,
    changePassword,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerPoints,
    addCustomerPointsEntry,
    saveInvoice,
    getInvoices,
    saveHeldOrder,
    getHeldOrders,
    deleteHeldOrder,
    logActivity,
    getActivityLogs,
    uploadFile,
    deleteFile,
    createBackup,
    restoreBackup,
    deleteBackup,
    getBackupHistory,
    addNotification,
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification,
    getSalesStats,
    listenToNotifications,
    getUnreadNotificationsCount,
    exportDataToJSON,
    exportDataToCSV
};

/**
 * ملف إعدادات النظام
 * يحتوي على وظائف التعامل مع إعدادات النظام
 */

/**
 * تحميل إعدادات النظام
 */
function loadSystemSettings() {
    showLoading('جاري تحميل الإعدادات...');
    
    dbRef.ref('settings').once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                appSettings = snapshot.val();
            } else {
                // إنشاء إعدادات افتراضية
                appSettings = createDefaultSettings();
                // حفظ الإعدادات الافتراضية
                dbRef.ref('settings').set(appSettings);
            }
            
            // تطبيق الإعدادات
            applySettings();
            
            hideLoading();
        })
        .catch(error => {
            console.error('خطأ في تحميل الإعدادات:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء تحميل إعدادات النظام', 'error');
        });
}

/**
 * إنشاء إعدادات افتراضية
 * @returns {Object} الإعدادات الافتراضية
 */
function createDefaultSettings() {
    return {
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
            applyTaxPerItem: false,
            categories: []
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
        },
        backup: {
            enableAutoBackup: false,
            backupInterval: 'daily', // daily, weekly, monthly
            backupTime: '00:00',
            backupDay: 1, // 1-7 for weekly (الأحد-السبت), 1-31 for monthly
            backupItems: {
                products: true,
                customers: true,
                invoices: true,
                settings: true,
                users: false
            },
            maxBackups: 10
        },
        security: {
            lockTimeout: 15, // minutes
            requirePasswordOnResume: true,
            allowMultipleLogins: false,
            minPasswordLength: 8,
            requireStrongPassword: true,
            loginAttempts: 5,
            lockoutTime: 30 // minutes
        },
        notifications: {
            enablePushNotifications: false,
            enableSoundNotifications: true,
            notifyLowStock: true,
            notifyOutOfStock: true,
            notifyNewSale: true,
            notifyNewCustomer: false,
            notifyBackupComplete: true,
            notifySystemUpdates: true
        }
    };
}

/**
 * تطبيق الإعدادات على واجهة المستخدم
 */
function applySettings() {
    if (!appSettings) return;
    
    // تطبيق وضع الظلام
    if (appSettings.appearance.themeMode === 'dark' || 
        (appSettings.appearance.themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        toggleDarkMode(true);
    }
    
    // تطبيق حجم الخط
    document.documentElement.style.fontSize = getFontSizeValue(appSettings.appearance.fontSize);
    
    // تطبيق اللون الرئيسي
    applyPrimaryColor(appSettings.appearance.primaryColor);
    
    // تطبيق وضع الشاشة المدمج
    if (appSettings.appearance.compactMode) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
    
    // تطبيق التأثيرات المتحركة
    if (!appSettings.appearance.showAnimations) {
        document.body.classList.add('no-animations');
    } else {
        document.body.classList.remove('no-animations');
    }
    
    // تحديث معلومات المتجر في الشاشة الرئيسية
    updateStoreInfo();
}

/**
 * الحصول على قيمة حجم الخط
 * @param {string} size حجم الخط (small, medium, large)
 * @returns {string} قيمة حجم الخط CSS
 */
function getFontSizeValue(size) {
    switch (size) {
        case 'small':
            return '14px';
        case 'medium':
            return '16px';
        case 'large':
            return '18px';
        default:
            return '16px';
    }
}

/**
 * تطبيق اللون الرئيسي
 * @param {string} color اللون الرئيسي
 */
function applyPrimaryColor(color) {
    // إنشاء عنصر style
    let style = document.getElementById('custom-colors');
    
    if (!style) {
        style = document.createElement('style');
        style.id = 'custom-colors';
        document.head.appendChild(style);
    }
    
    // تحديد الألوان المشتقة
    const primaryDark = adjustColor(color, -20);
    const primaryLight = adjustColor(color, 20);
    
    // تحديث متغيرات CSS
    style.innerHTML = `
        :root {
            --secondary-color: ${color};
            --secondary-color-dark: ${primaryDark};
            --secondary-color-light: ${primaryLight};
        }
    `;
}

/**
 * ضبط درجة اللون
 * @param {string} hex لون HEX
 * @param {number} amount مقدار التغيير (-100 إلى 100)
 * @returns {string} اللون المعدل
 */
function adjustColor(hex, amount) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * تحديث معلومات المتجر في الشاشة الرئيسية
 */
function updateStoreInfo() {
    if (!appSettings?.general) return;
    
    // تحديث عناصر معلومات المتجر في الفاتورة
    document.getElementById('receipt-store-name').textContent = appSettings.general.storeName;
    document.getElementById('receipt-store-address').textContent = appSettings.general.storeAddress;
    document.getElementById('receipt-store-phone').textContent = `هاتف: ${appSettings.general.storePhone}`;
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
    
    // تحميل فئات الضرائب
    loadTaxCategories();
    
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
    
    // إظهار المودال
    showModal('settings-modal');
    
    // إعداد مستمعي أحداث التبويب
    setupSettingsTabs();
}

/**
 * إعداد مستمعي أحداث تبويب الإعدادات
 */
function setupSettingsTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const panels = document.querySelectorAll('.settings-panel');
    
    // إضافة مستمعي أحداث لأزرار التبويب
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // إزالة الفئة النشطة من جميع علامات التبويب
            tabs.forEach(t => t.classList.remove('active'));
            
            // إضافة الفئة النشطة للعلامة المحددة
            this.classList.add('active');
            
            // إخفاء جميع اللوحات
            panels.forEach(panel => panel.classList.remove('active'));
            
            // إظهار اللوحة المناسبة
            const tabId = this.dataset.tab;
            document.getElementById(`${tabId}-settings`).classList.add('active');
        });
    });
    
    // إعداد مستمعي أحداث النماذج
    setupSettingsForms();
}

/**
 * إعداد مستمعي أحداث نماذج الإعدادات
 */
function setupSettingsForms() {
    // نموذج الإعدادات العامة
    const generalSettingsForm = document.getElementById('general-settings-form');
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveGeneralSettings();
        });
    }
    
    // نموذج إعدادات نقطة البيع
    const posSettingsForm = document.getElementById('pos-settings-form');
    if (posSettingsForm) {
        posSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePosSettings();
        });
    }
    
    // نموذج إعدادات الفواتير
    const invoicesSettingsForm = document.getElementById('invoices-settings-form');
    if (invoicesSettingsForm) {
        invoicesSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveInvoicesSettings();
        });
    }
    
    // نموذج إعدادات الضريبة
    const taxSettingsForm = document.getElementById('tax-settings-form');
    if (taxSettingsForm) {
        taxSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTaxSettings();
        });
    }
    
    // نموذج إعدادات العملاء
    const customersSettingsForm = document.getElementById('customers-settings-form');
    if (customersSettingsForm) {
        customersSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveCustomersSettings();
        });
    }
    
    // نموذج إعدادات المظهر
    const appearanceSettingsForm = document.getElementById('appearance-settings-form');
    if (appearanceSettingsForm) {
        appearanceSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAppearanceSettings();
        });
    }
    
    // زر إضافة فئة ضريبية
    const addTaxCategoryBtn = document.getElementById('add-tax-category');
    if (addTaxCategoryBtn) {
        addTaxCategoryBtn.addEventListener('click', function() {
            showAddTaxCategoryModal();
        });
    }
    
    // زر استعادة إعدادات المظهر الافتراضية
    const resetAppearanceBtn = document.getElementById('reset-appearance');
    if (resetAppearanceBtn) {
        resetAppearanceBtn.addEventListener('click', function() {
            resetAppearanceSettings();
        });
    }
    
    // تغيير اللون الأساسي في الوقت الفعلي
    const primaryColorInput = document.getElementById('primary-color');
    if (primaryColorInput) {
        primaryColorInput.addEventListener('input', function() {
            applyPrimaryColor(this.value);
        });
    }
    
    // متابعة التغييرات في حقل رفع الشعار
    const storeLogoInput = document.getElementById('store-logo');
    const uploadLogoBtn = document.getElementById('upload-logo-btn');
    const logoPreview = document.getElementById('logo-preview');
    
    if (storeLogoInput && uploadLogoBtn && logoPreview) {
        uploadLogoBtn.addEventListener('click', function() {
            storeLogoInput.click();
        });
        
        storeLogoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    logoPreview.innerHTML = `<img src="${e.target.result}" alt="شعار المتجر">`;
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

/**
 * حفظ الإعدادات العامة
 */
function saveGeneralSettings() {
    // عرض مؤشر التحميل
    showLoading('جاري حفظ الإعدادات العامة...');
    
    // جمع البيانات من النموذج
    const generalSettings = {
        storeName: document.getElementById('store-name').value,
        storePhone: document.getElementById('store-phone').value,
        storeAddress: document.getElementById('store-address').value,
        storeEmail: document.getElementById('store-email').value,
        storeWebsite: document.getElementById('store-website').value,
        currency: document.getElementById('currency').value,
        currencyPosition: document.getElementById('currency-position').value,
        decimalSeparator: document.getElementById('decimal-separator').value,
        thousandSeparator: document.getElementById('thousand-separator').value,
        decimalPlaces: parseInt(document.getElementById('decimal-places').value),
        fiscalYearStart: document.getElementById('fiscal-year-start').value
    };
    
    // تحديث الإعدادات المحلية
    appSettings.general = generalSettings;
    
    // حفظ الإعدادات في قاعدة البيانات
    dbRef.ref('settings/general').update(generalSettings)
        .then(() => {
            // تطبيق الإعدادات
            updateStoreInfo();
            
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم حفظ الإعدادات العامة بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('update_settings', 'تحديث الإعدادات العامة');
        })
        .catch(error => {
            console.error('خطأ في حفظ الإعدادات العامة:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حفظ الإعدادات العامة', 'error');
        });
    
    // رفع شعار المتجر إذا تم تحديده
    const storeLogoInput = document.getElementById('store-logo');
    if (storeLogoInput.files && storeLogoInput.files[0]) {
        uploadStoreLogo(storeLogoInput.files[0]);
    }
}

/**
 * رفع شعار المتجر
 * @param {File} file ملف الشعار
 */
function uploadStoreLogo(file) {
    // عرض مؤشر التحميل
    showLoading('جاري رفع شعار المتجر...');
    
    // رفع الملف إلى التخزين
    const path = `store/logo.${file.name.split('.').pop()}`;
    
    // استخدام وظيفة رفع الملف من وحدة قاعدة البيانات
    uploadFile(path, file)
        .then(downloadURL => {
            // حفظ رابط الشعار في الإعدادات
            dbRef.ref('settings/general/logo').set(downloadURL)
                .then(() => {
                    // تحديث الإعدادات المحلية
                    appSettings.general.logo = downloadURL;
                    
                    // إخفاء مؤشر التحميل
                    hideLoading();
                    
                    // عرض رسالة نجاح
                    showNotification('تم بنجاح', 'تم رفع شعار المتجر بنجاح', 'success');
                })
                .catch(error => {
                    console.error('خطأ في حفظ رابط الشعار:', error);
                    hideLoading();
                    showNotification('خطأ', 'حدث خطأ أثناء حفظ رابط الشعار', 'error');
                });
        })
        .catch(error => {
            console.error('خطأ في رفع شعار المتجر:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء رفع شعار المتجر', 'error');
        });
}

/**
 * حفظ إعدادات نقطة البيع
 */
function savePosSettings() {
    // عرض مؤشر التحميل
    showLoading('جاري حفظ إعدادات نقطة البيع...');
    
    // جمع البيانات من النموذج
    const posSettings = {
        defaultView: document.getElementById('default-view').value,
        defaultCategory: document.getElementById('default-category').value,
        showStockWarning: document.getElementById('show-stock-warning').checked,
        allowSellOutOfStock: document.getElementById('allow-sell-out-of-stock').checked,
        clearCartAfterSale: document.getElementById('clear-cart-after-sale').checked,
        automaticBarcodesFocus: document.getElementById('automatic-barcode-focus').checked,
        defaultTaxIncluded: document.getElementById('default-tax-included').checked,
        lowStockThreshold: parseInt(document.getElementById('low-stock-threshold').value),
        defaultBarcodeType: document.getElementById('default-barcode-type').value,
        barcodePrefix: document.getElementById('barcode-prefix').value,
        productCodeLength: parseInt(document.getElementById('product-code-length').value)
    };
    
    // تحديث الإعدادات المحلية
    appSettings.pos = posSettings;
    
    // حفظ الإعدادات في قاعدة البيانات
    dbRef.ref('settings/pos').update(posSettings)
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم حفظ إعدادات نقطة البيع بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('update_settings', 'تحديث إعدادات نقطة البيع');
        })
        .catch(error => {
            console.error('خطأ في حفظ إعدادات نقطة البيع:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حفظ إعدادات نقطة البيع', 'error');
        });
}

/**
 * حفظ إعدادات الفواتير
 */
function saveInvoicesSettings() {
    // عرض مؤشر التحميل
    showLoading('جاري حفظ إعدادات الفواتير...');
    
    // جمع البيانات من النموذج
    const invoicesSettings = {
        invoicePrefix: document.getElementById('invoice-prefix').value,
        receiptSize: document.getElementById('receipt-size').value,
        receiptFooter: document.getElementById('invoice-footer').value,
        showTaxInReceipt: document.getElementById('show-tax-in-receipt').checked,
        showCashierInReceipt: document.getElementById('show-cashier-in-receipt').checked,
        printReceiptAutomatically: document.getElementById('print-receipt-automatically').checked,
        saveReceiptPDF: document.getElementById('save-receipt-pdf').checked,
        defaultPrinter: document.getElementById('default-printer')?.value || 'default',
        printCopies: parseInt(document.getElementById('print-copies').value)
    };
    
    // تحديث الإعدادات المحلية
    appSettings.invoices = invoicesSettings;
    
    // حفظ الإعدادات في قاعدة البيانات
    dbRef.ref('settings/invoices').update(invoicesSettings)
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم حفظ إعدادات الفواتير بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('update_settings', 'تحديث إعدادات الفواتير');
        })
        .catch(error => {
            console.error('خطأ في حفظ إعدادات الفواتير:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حفظ إعدادات الفواتير', 'error');
        });
}

/**
 * حفظ إعدادات الضريبة
 */
function saveTaxSettings() {
    // عرض مؤشر التحميل
    showLoading('جاري حفظ إعدادات الضريبة...');
    
    // جمع البيانات من النموذج
    const taxSettings = {
        enableTax: document.getElementById('enable-tax').checked,
        taxType: document.getElementById('tax-type').value,
        taxRate: parseFloat(document.getElementById('tax-rate').value),
        taxIncludedInPrice: document.getElementById('tax-included-in-price').checked,
        applyTaxPerItem: document.getElementById('apply-tax-per-item').checked,
        // الاحتفاظ بفئات الضريبة الحالية
        categories: appSettings.tax.categories || []
    };
    
    // تحديث الإعدادات المحلية
    appSettings.tax = taxSettings;
    
    // حفظ الإعدادات في قاعدة البيانات
    dbRef.ref('settings/tax').update(taxSettings)
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم حفظ إعدادات الضريبة بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('update_settings', 'تحديث إعدادات الضريبة');
        })
        .catch(error => {
            console.error('خطأ في حفظ إعدادات الضريبة:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حفظ إعدادات الضريبة', 'error');
        });
}

/**
 * حفظ إعدادات العملاء
 */
function saveCustomersSettings() {
    // عرض مؤشر التحميل
    showLoading('جاري حفظ إعدادات العملاء...');
    
    // جمع البيانات من النموذج
    const customersSettings = {
        enablePointsSystem: document.getElementById('enable-points-system').checked,
        pointsPerCurrency: parseFloat(document.getElementById('points-per-currency').value),
        pointsValue: parseFloat(document.getElementById('points-value').value),
        minimumPointsRedeem: parseInt(document.getElementById('minimum-points-redeem').value),
        pointsExpiryDays: parseInt(document.getElementById('points-expiry-days').value),
        enableCustomerReminders: document.getElementById('enable-customer-reminders').checked,
        reminderDays: parseInt(document.getElementById('reminder-days').value),
        reminderMessage: document.getElementById('reminder-message').value
    };
    
    // تحديث الإعدادات المحلية
    appSettings.customers = customersSettings;
    
    // حفظ الإعدادات في قاعدة البيانات
    dbRef.ref('settings/customers').update(customersSettings)
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم حفظ إعدادات العملاء بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('update_settings', 'تحديث إعدادات العملاء');
        })
        .catch(error => {
            console.error('خطأ في حفظ إعدادات العملاء:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حفظ إعدادات العملاء', 'error');
        });
}

/**
 * حفظ إعدادات المظهر
 */
function saveAppearanceSettings() {
    // عرض مؤشر التحميل
    showLoading('جاري حفظ إعدادات المظهر...');
    
    // جمع البيانات من النموذج
    const appearanceSettings = {
        themeMode: document.getElementById('theme-mode').value,
        fontSize: document.getElementById('font-size').value,
        primaryColor: document.getElementById('primary-color').value,
        showAnimations: document.getElementById('show-animations').checked,
        compactMode: document.getElementById('compact-mode').checked,
        defaultPage: document.getElementById('default-page').value
    };
    
    // تحديث الإعدادات المحلية
    appSettings.appearance = appearanceSettings;
    
    // حفظ الإعدادات في قاعدة البيانات
    dbRef.ref('settings/appearance').update(appearanceSettings)
        .then(() => {
            // تطبيق الإعدادات
            applySettings();
            
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم حفظ إعدادات المظهر بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('update_settings', 'تحديث إعدادات المظهر');
        })
        .catch(error => {
            console.error('خطأ في حفظ إعدادات المظهر:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حفظ إعدادات المظهر', 'error');
        });
}

/**
 * استعادة إعدادات المظهر الافتراضية
 */
function resetAppearanceSettings() {
    // تأكيد الاستعادة
    Swal.fire({
        title: 'تأكيد الاستعادة',
        text: 'هل أنت متأكد من استعادة إعدادات المظهر الافتراضية؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، استعادة',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            // إعدادات المظهر الافتراضية
            const defaultAppearance = {
                themeMode: 'light',
                fontSize: 'medium',
                primaryColor: '#3498db',
                showAnimations: true,
                compactMode: false,
                defaultPage: 'pos'
            };
            
            // تحديث الإعدادات المحلية
            appSettings.appearance = defaultAppearance;
            
            // تحديث النموذج
            document.getElementById('theme-mode').value = defaultAppearance.themeMode;
            document.getElementById('font-size').value = defaultAppearance.fontSize;
            document.getElementById('primary-color').value = defaultAppearance.primaryColor;
            document.getElementById('show-animations').checked = defaultAppearance.showAnimations;
            document.getElementById('compact-mode').checked = defaultAppearance.compactMode;
            document.getElementById('default-page').value = defaultAppearance.defaultPage;
            
            // تطبيق الإعدادات
            applySettings();
            
            // حفظ الإعدادات في قاعدة البيانات
            dbRef.ref('settings/appearance').set(defaultAppearance)
                .then(() => {
                    // عرض رسالة نجاح
                    showNotification('تم بنجاح', 'تم استعادة إعدادات المظهر الافتراضية بنجاح', 'success');
                    
                    // تسجيل النشاط
                    logUserActivity('reset_appearance', 'استعادة إعدادات المظهر الافتراضية');
                })
                .catch(error => {
                    console.error('خطأ في استعادة إعدادات المظهر الافتراضية:', error);
                    showNotification('خطأ', 'حدث خطأ أثناء استعادة إعدادات المظهر الافتراضية', 'error');
                });
        }
    });
}

/**
 * تحميل فئات الضريبة
 */
function loadTaxCategories() {
    const taxCategoriesBody = document.getElementById('tax-categories-body');
    if (!taxCategoriesBody) return;
    
    // تفريغ الجدول
    taxCategoriesBody.innerHTML = '';
    
    // التحقق من وجود فئات ضريبية
    if (appSettings.tax.categories && appSettings.tax.categories.length > 0) {
        // ترتيب الفئات حسب الاسم
        const sortedCategories = [...appSettings.tax.categories].sort((a, b) => a.name.localeCompare(b.name));
        
        // عرض الفئات
        sortedCategories.forEach((category, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${category.name}</td>
                <td>${category.rate}%</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" data-index="${index}" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" data-index="${index}" title="حذف">
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
        // عرض رسالة فارغة
        taxCategoriesBody.innerHTML = '<tr><td colspan="3" class="empty-table">لا توجد فئات ضريبية مخصصة</td></tr>';
    }
}

/**
 * عرض مودال إضافة فئة ضريبية
 */
function showAddTaxCategoryModal() {
    // التحقق من وجود أقسام
    if (categories.length === 0) {
        showNotification('تنبيه', 'يجب إضافة أقسام أولاً', 'warning');
        return;
    }
    
    // إنشاء المودال
    Swal.fire({
        title: 'إضافة فئة ضريبية',
        html: `
            <div class="swal-form" style="text-align: right;">
                <div class="form-group">
                    <label for="tax-category-name">القسم</label>
                    <select id="tax-category-name" class="swal2-input" style="width: 100%;">
                        ${categories.map(category => `<option value="${category.id}">${category.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="tax-category-rate">نسبة الضريبة</label>
                    <input type="number" id="tax-category-rate" class="swal2-input" value="15" min="0" max="100" step="0.01" style="width: 100%;">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'إضافة',
        cancelButtonText: 'إلغاء',
        focusConfirm: false,
        preConfirm: () => {
            const categoryId = document.getElementById('tax-category-name').value;
            const rate = parseFloat(document.getElementById('tax-category-rate').value);
            
            if (!categoryId) {
                Swal.showValidationMessage('يرجى اختيار القسم');
                return false;
            }
            
            if (isNaN(rate) || rate < 0 || rate > 100) {
                Swal.showValidationMessage('يرجى إدخال نسبة ضريبة صحيحة بين 0 و 100');
                return false;
            }
            
            return { categoryId, rate };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            addTaxCategory(result.value.categoryId, result.value.rate);
        }
    });
}

/**
 * إضافة فئة ضريبية
 * @param {string} categoryId معرف القسم
 * @param {number} rate نسبة الضريبة
 */
function addTaxCategory(categoryId, rate) {
    // البحث عن القسم
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) {
        showNotification('خطأ', 'القسم غير موجود', 'error');
        return;
    }
    
    // التحقق مما إذا كان القسم موجوداً بالفعل
    const existingIndex = appSettings.tax.categories.findIndex(c => c.id === categoryId);
    
    if (existingIndex !== -1) {
        // تحديث الفئة الموجودة
        appSettings.tax.categories[existingIndex].rate = rate;
    } else {
        // إضافة فئة جديدة
        appSettings.tax.categories.push({
            id: categoryId,
            name: category.name,
            rate: rate
        });
    }
    
    // حفظ التغييرات
    dbRef.ref('settings/tax/categories').set(appSettings.tax.categories)
        .then(() => {
            // تحديث جدول الفئات
            loadTaxCategories();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم إضافة فئة الضريبة بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('add_tax_category', 'إضافة فئة ضريبية', { category: category.name, rate });
        })
        .catch(error => {
            console.error('خطأ في إضافة فئة الضريبة:', error);
            showNotification('خطأ', 'حدث خطأ أثناء إضافة فئة الضريبة', 'error');
        });
}

/**
 * تحرير فئة ضريبية
 * @param {number} index فهرس الفئة
 */
function editTaxCategory(index) {
    // الحصول على الفئة
    const category = appSettings.tax.categories[index];
    
    if (!category) {
        showNotification('خطأ', 'الفئة غير موجودة', 'error');
        return;
    }
    
    // عرض مودال التحرير
    Swal.fire({
        title: 'تحرير فئة ضريبية',
        html: `
            <div class="swal-form" style="text-align: right;">
                <div class="form-group">
                    <label for="tax-category-name">القسم</label>
                    <input type="text" id="tax-category-name" class="swal2-input" value="${/**
 * ملف المصادقة والأمان
 * يحتوي على وظائف إدارة المستخدمين وتسجيل الدخول
 */

// متغيرات عامة
let authFailCount = 0;
let passwordResetEmail = '';
let lastAuthActivity = Date.now();

/**
 * إعداد مصادقة المستخدم
 */
function setupAuthSystem() {
    // إعداد مراقبة حالة المصادقة
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // المستخدم مسجل الدخول
            handleUserSignedIn(user.uid);
        } else {
            // المستخدم غير مسجل الدخول
            handleUserSignedOut();
        }
    });
    
    // إعداد مستمعي أحداث نموذج تسجيل الدخول
    setupLoginFormListeners();
    
    // إعداد مراقبة الخمول
    setupIdleMonitor();
}

/**
 * معالجة حالة تسجيل الدخول
 * @param {string} userId معرف المستخدم
 */
function handleUserSignedIn(userId) {
    // عرض مؤشر التحميل
    showLoading('جاري تحميل بيانات المستخدم...');
    
    // إعادة تعيين عداد محاولات تسجيل الدخول الفاشلة
    authFailCount = 0;
    
    // الحصول على بيانات المستخدم
    dbRef.ref(`users/${userId}`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                // تخزين بيانات المستخدم
                currentUser = snapshot.val();
                currentUser.id = userId;
                
                // التحقق من حالة المستخدم
                if (currentUser.status === 'disabled') {
                    // المستخدم معطل
                    firebase.auth().signOut().then(() => {
                        hideLoading();
                        showNotification('حساب معطل', 'تم تعطيل حسابك. يرجى التواصل مع المسؤول.', 'error');
                    });
                    return;
                }
                
              // تحديث بيانات آخر تسجيل دخول
                dbRef.ref(`users/${userId}`).update({
                    lastLogin: new Date().toISOString(),
                    loginCount: (currentUser.loginCount || 0) + 1
                });
                
                // الحصول على الفرع المحدد أو آخر فرع تم استخدامه
                let branchId = sessionStorage.getItem('selectedBranch') || currentUser.lastBranch;
                
                // إذا لم يكن هناك فرع محدد، ابحث عن الفرع الرئيسي
                if (!branchId) {
                    return dbRef.ref('branches').orderByChild('type').equalTo('main').once('value')
                        .then(branchSnapshot => {
                            if (branchSnapshot.exists()) {
                                let foundMainBranch = false;
                                
                                branchSnapshot.forEach(childSnapshot => {
                                    if (!foundMainBranch) {
                                        branchId = childSnapshot.key;
                                        foundMainBranch = true;
                                    }
                                });
                                
                                if (branchId) {
                                    return dbRef.ref(`branches/${branchId}`).once('value');
                                } else {
                                    throw new Error('لم يتم العثور على أي فرع');
                                }
                            } else {
                                throw new Error('لم يتم العثور على أي فرع');
                            }
                        });
                } else {
                    return dbRef.ref(`branches/${branchId}`).once('value');
                }
            } else {
                // لم يتم العثور على بيانات المستخدم
                throw new Error('لم يتم العثور على بيانات المستخدم');
            }
        })
        .then(branchSnapshot => {
            if (branchSnapshot && branchSnapshot.exists()) {
                // تخزين بيانات الفرع
                currentBranch = branchSnapshot.val();
                currentBranch.id = branchSnapshot.key;
                
                // تحديث آخر فرع تم استخدامه
                dbRef.ref(`users/${currentUser.id}/lastBranch`).set(currentBranch.id);
                
                // تحميل إعدادات النظام
                return dbRef.ref('settings').once('value');
            } else {
                throw new Error('لم يتم العثور على بيانات الفرع');
            }
        })
        .then(settingsSnapshot => {
            if (settingsSnapshot.exists()) {
                // تخزين إعدادات النظام
                appSettings = settingsSnapshot.val();
            } else {
                // إنشاء إعدادات افتراضية
                appSettings = createDefaultSettings();
                
                // حفظ الإعدادات الافتراضية
                dbRef.ref('settings').set(appSettings);
            }
            
            // تسجيل نشاط تسجيل الدخول
            logUserActivity('login', 'تسجيل الدخول إلى النظام');
            
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // إخفاء نموذج تسجيل الدخول وإظهار التطبيق
            hideLoginForm();
            showAppContainer();
            
            // تطبيق الإعدادات على واجهة المستخدم
            applySettings();
            
            // تهيئة واجهة المستخدم
            initializeUIForUser();
            
            // تحميل البيانات الأساسية
            loadInitialData();
            
            // بدء التطبيق
            showNotification('مرحباً بك', `مرحباً بك ${currentUser.fullName} في نظام نقطة البيع`, 'success');
        })
        .catch(error => {
            console.error('خطأ في تسجيل الدخول:', error);
            hideLoading();
            
            // تسجيل الخروج في حالة وجود خطأ
            firebase.auth().signOut().then(() => {
                showLoginForm();
                showNotification('خطأ', error.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.', 'error');
            });
        });
}

/**
 * معالجة حالة تسجيل الخروج
 */
function handleUserSignedOut() {
    // إعادة تعيين المتغيرات العامة
    currentUser = null;
    currentBranch = null;
    
    // إخفاء التطبيق وإظهار نموذج تسجيل الدخول
    hideAppContainer();
    showLoginForm();
}

/**
 * إعداد مستمعي أحداث نموذج تسجيل الدخول
 */
function setupLoginFormListeners() {
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // زر تبديل كلمة المرور
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // تبديل الأيقونة
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }
    
    // تحميل قائمة الفروع
    loadBranchesForLogin();
}

/**
 * معالجة تقديم نموذج تسجيل الدخول
 * @param {Event} event حدث النموذج
 */
function handleLoginSubmit(event) {
    event.preventDefault();
    
    // الحصول على بيانات النموذج
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const branchId = document.getElementById('branch-selection').value;
    
    // التحقق من البيانات
    if (!username || !password) {
        showNotification('خطأ', 'يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }
    
    // حفظ الفرع المحدد في التخزين المؤقت
    if (branchId) {
        sessionStorage.setItem('selectedBranch', branchId);
    }
    
    // عرض مؤشر التحميل
    showLoading('جاري تسجيل الدخول...');
    
    // تسجيل الدخول
    loginWithUsername(username, password)
        .catch(error => {
            console.error('خطأ في تسجيل الدخول:', error);
            hideLoading();
            
            // زيادة عداد المحاولات الفاشلة
            authFailCount++;
            
            // التحقق من عدد المحاولات
            if (authFailCount >= (appSettings?.security?.loginAttempts || 5)) {
                // قفل تسجيل الدخول
                lockLogin();
            } else {
                // عرض رسالة الخطأ
                showLoginError(error);
            }
        });
}

/**
 * تسجيل الدخول باستخدام اسم المستخدم وكلمة المرور
 * @param {string} username اسم المستخدم
 * @param {string} password كلمة المرور
 * @returns {Promise} وعد بعملية تسجيل الدخول
 */
function loginWithUsername(username, password) {
    return new Promise((resolve, reject) => {
        // التحقق من قفل تسجيل الدخول
        if (isLoginLocked()) {
            reject({ code: 'auth/too-many-requests', message: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة مرة أخرى لاحقاً.' });
            return;
        }
        
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
                    
                    // التحقق من حالة المستخدم
                    if (userData.status === 'disabled') {
                        reject({ code: 'auth/user-disabled', message: 'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول.' });
                        return;
                    }
                    
                    // تسجيل الدخول باستخدام Firebase Auth
                    firebase.auth().signInWithEmailAndPassword(userData.email, password)
                        .then(result => {
                            // إعادة تعيين عداد المحاولات الفاشلة
                            authFailCount = 0;
                            
                            // حفظ وقت آخر نشاط
                            lastAuthActivity = Date.now();
                            
                            resolve(result);
                        })
                        .catch(error => {
                            // التحقق من نوع الخطأ
                            if (error.code === 'auth/wrong-password') {
                                reject({ code: error.code, message: 'كلمة المرور غير صحيحة' });
                            } else {
                                reject(error);
                            }
                        });
                } else {
                    reject({ code: 'auth/user-not-found', message: 'اسم المستخدم غير موجود' });
                }
            })
            .catch(error => {
                reject({ code: 'database/error', message: error.message || 'حدث خطأ أثناء البحث عن المستخدم' });
            });
    });
}

/**
 * عرض خطأ تسجيل الدخول
 * @param {Object} error كائن الخطأ
 */
function showLoginError(error) {
    let errorMessage = 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.';
    
    switch (error.code) {
        case 'auth/user-not-found':
            errorMessage = 'اسم المستخدم غير موجود';
            break;
        case 'auth/wrong-password':
            errorMessage = 'كلمة المرور غير صحيحة';
            break;
        case 'auth/user-disabled':
            errorMessage = 'تم تعطيل هذا الحساب. يرجى التواصل مع المسؤول.';
            break;
        case 'auth/too-many-requests':
            errorMessage = 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة مرة أخرى لاحقاً.';
            break;
    }
    
    showNotification('خطأ في تسجيل الدخول', errorMessage, 'error');
}

/**
 * قفل تسجيل الدخول
 */
function lockLogin() {
    // تخزين وقت القفل
    const lockTime = Date.now();
    localStorage.setItem('loginLockTime', lockTime);
    
    // عرض رسالة للمستخدم
    const lockoutTime = appSettings?.security?.lockoutTime || 30;
    showNotification('حظر تسجيل الدخول', `تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة مرة أخرى بعد ${lockoutTime} دقيقة.`, 'error');
    
    // تعطيل نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const inputs = loginForm.querySelectorAll('input, button, select');
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        // إعادة تفعيل النموذج بعد انتهاء مدة القفل
        setTimeout(() => {
            inputs.forEach(input => {
                input.disabled = false;
            });
            localStorage.removeItem('loginLockTime');
            authFailCount = 0;
        }, lockoutTime * 60 * 1000);
    }
}

/**
 * التحقق من قفل تسجيل الدخول
 * @returns {boolean} ما إذا كان تسجيل الدخول مقفلاً
 */
function isLoginLocked() {
    const lockTime = localStorage.getItem('loginLockTime');
    if (!lockTime) return false;
    
    const lockoutTime = appSettings?.security?.lockoutTime || 30;
    const lockoutDuration = lockoutTime * 60 * 1000;
    const now = Date.now();
    
    // التحقق من انتهاء مدة القفل
    if (now - parseInt(lockTime) >= lockoutDuration) {
        localStorage.removeItem('loginLockTime');
        return false;
    }
    
    return true;
}

/**
 * تسجيل الخروج
 */
function signOut() {
    // تأكيد تسجيل الخروج
    Swal.fire({
        title: 'تسجيل الخروج',
        text: 'هل أنت متأكد من تسجيل الخروج من النظام؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، تسجيل الخروج',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            // عرض مؤشر التحميل
            showLoading('جاري تسجيل الخروج...');
            
            // تسجيل نشاط تسجيل الخروج
            logUserActivity('logout', 'تسجيل الخروج من النظام')
                .then(() => {
                    // تسجيل الخروج من Firebase
                    return firebase.auth().signOut();
                })
                .then(() => {
                    // إعادة تعيين المتغيرات العامة
                    currentUser = null;
                    currentBranch = null;
                    
                    // إخفاء مؤشر التحميل
                    hideLoading();
                    
                    // عرض رسالة نجاح
                    showNotification('تم تسجيل الخروج', 'تم تسجيل الخروج بنجاح', 'success');
                })
                .catch(error => {
                    console.error('خطأ في تسجيل الخروج:', error);
                    hideLoading();
                    showNotification('خطأ', 'حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.', 'error');
                });
        }
    });
}

/**
 * إعداد مراقبة الخمول
 */
function setupIdleMonitor() {
    // تحديث وقت آخر نشاط عند التفاعل مع الصفحة
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, updateLastActivity, true);
    });
    
    // التحقق من الخمول بشكل دوري
    const idleCheckInterval = setInterval(() => {
        checkIdleTimeout();
    }, 60000); // التحقق كل دقيقة
    
    // إيقاف المراقبة عند إغلاق الصفحة
    window.addEventListener('beforeunload', () => {
        clearInterval(idleCheckInterval);
    });
}

/**
 * تحديث وقت آخر نشاط
 */
function updateLastActivity() {
    lastAuthActivity = Date.now();
}

/**
 * التحقق من تجاوز مدة الخمول
 */
function checkIdleTimeout() {
    // التحقق من وجود مستخدم مسجل الدخول
    if (!currentUser) return;
    
    const idleTimeout = (appSettings?.security?.lockTimeout || 15) * 60 * 1000; // تحويل الدقائق إلى مللي ثانية
    const now = Date.now();
    
    // التحقق من تجاوز مدة الخمول
    if (now - lastAuthActivity >= idleTimeout) {
        // عرض مودال قفل الشاشة
        showLockScreen();
    }
}

/**
 * عرض شاشة القفل
 */
function showLockScreen() {
    // التحقق من وجود مستخدم مسجل الدخول
    if (!currentUser) return;
    
    // إنشاء المودال
    Swal.fire({
        title: 'تم قفل الشاشة',
        html: `
            <div style="text-align: right;">
                <p>تم قفل الشاشة بسبب عدم النشاط.</p>
                <div class="form-group" style="margin-top: 20px;">
                    <label for="lock-password">كلمة المرور</label>
                    <input type="password" id="lock-password" class="swal2-input" placeholder="أدخل كلمة المرور للمتابعة">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'متابعة',
        cancelButtonText: 'تسجيل الخروج',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: true,
        preConfirm: () => {
            const password = document.getElementById('lock-password').value;
            
            if (!password) {
                Swal.showValidationMessage('يرجى إدخال كلمة المرور');
                return false;
            }
            
            // التحقق من كلمة المرور
            return verifyPassword(password)
                .then(() => {
                    return true;
                })
                .catch(error => {
                    Swal.showValidationMessage(error.message || 'كلمة المرور غير صحيحة');
                    return false;
                });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // تحديث وقت آخر نشاط
            updateLastActivity();
            
            // تسجيل نشاط فتح القفل
            logUserActivity('unlock_screen', 'فتح قفل الشاشة');
        } else {
            // تسجيل الخروج
            firebase.auth().signOut();
        }
    });
}

/**
 * التحقق من كلمة المرور
 * @param {string} password كلمة المرور
 * @returns {Promise} وعد بعملية التحقق
 */
function verifyPassword(password) {
    return new Promise((resolve, reject) => {
        // التحقق من وجود مستخدم مسجل الدخول
        if (!currentUser || !currentUser.email) {
            reject(new Error('لم يتم العثور على بيانات المستخدم'));
            return;
        }
        
        // الحصول على المستخدم الحالي
        const user = firebase.auth().currentUser;
        
        if (!user) {
            reject(new Error('المستخدم غير مسجل الدخول'));
            return;
        }
        
        // إعادة المصادقة
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
        
        user.reauthenticateWithCredential(credential)
            .then(() => {
                resolve();
            })
            .catch(error => {
                console.error('خطأ في إعادة المصادقة:', error);
                reject(new Error('كلمة المرور غير صحيحة'));
            });
    });
}

/**
 * إنشاء مستخدم جديد
 * @param {Object} userData بيانات المستخدم
 * @param {string} password كلمة المرور
 * @returns {Promise} وعد بعملية إنشاء المستخدم
 */
function createNewUser(userData, password) {
    // عرض مؤشر التحميل
    showLoading('جاري إنشاء المستخدم...');
    
    // التحقق من قوة كلمة المرور
    if (appSettings?.security?.requireStrongPassword && !isStrongPassword(password)) {
        hideLoading();
        return Promise.reject(new Error('كلمة المرور ضعيفة. يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز خاصة، وأن تكون بطول 8 أحرف على الأقل.'));
    }
    
    // التحقق من الحد الأدنى لطول كلمة المرور
    const minPasswordLength = appSettings?.security?.minPasswordLength || 8;
    if (password.length < minPasswordLength) {
        hideLoading();
        return Promise.reject(new Error(`كلمة المرور قصيرة جداً. يجب أن تكون بطول ${minPasswordLength} أحرف على الأقل.`));
    }
    
    // التحقق من وجود بريد إلكتروني
    if (!userData.email) {
        hideLoading();
        return Promise.reject(new Error('البريد الإلكتروني مطلوب'));
    }
    
    // إنشاء المستخدم في Firebase Auth
    return firebase.auth().createUserWithEmailAndPassword(userData.email, password)
        .then(result => {
            // الحصول على معرف المستخدم
            const userId = result.user.uid;
            
            // إعداد بيانات المستخدم
            const user = {
                username: userData.username,
                fullName: userData.fullName,
                email: userData.email,
                phone: userData.phone || '',
                role: userData.role || 'cashier',
                status: 'active',
                createdAt: new Date().toISOString(),
                createdBy: currentUser ? currentUser.id : userId,
                lastBranch: userData.branchId || (currentBranch ? currentBranch.id : null),
                permissions: userData.permissions || getDefaultPermissions(userData.role),
                loginCount: 0
            };
            
            // حفظ بيانات المستخدم في قاعدة البيانات
            return dbRef.ref(`users/${userId}`).set(user)
                .then(() => {
                    // إخفاء مؤشر التحميل
                    hideLoading();
                    
                    // تسجيل النشاط
                    if (currentUser) {
                        logUserActivity('create_user', 'إنشاء مستخدم جديد', { userId, username: userData.username });
                    }
                    
                    return { ...user, id: userId };
                });
        })
        .catch(error => {
            console.error('خطأ في إنشاء المستخدم:', error);
            hideLoading();
            
            // ترجمة رسائل الخطأ
            let errorMessage = error.message;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'البريد الإلكتروني غير صالح';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'كلمة المرور ضعيفة';
                    break;
            }
            
            return Promise.reject(new Error(errorMessage));
        });
}

/**
 * تحقق من قوة كلمة المرور
 * @param {string} password كلمة المرور
 * @returns {boolean} ما إذا كانت كلمة المرور قوية
 */
function isStrongPassword(password) {
    // التحقق من طول كلمة المرور
    if (password.length < 8) return false;
    
    // التحقق من وجود حرف كبير
    if (!/[A-Z]/.test(password)) return false;
    
    // التحقق من وجود حرف صغير
    if (!/[a-z]/.test(password)) return false;
    
    // التحقق من وجود رقم
    if (!/[0-9]/.test(password)) return false;
    
    // التحقق من وجود رمز خاص
    if (!/[^A-Za-z0-9]/.test(password)) return false;
    
    return true;
}

/**
 * الحصول على الصلاحيات الافتراضية لدور
 * @param {string} role الدور
 * @returns {Object} الصلاحيات الافتراضية
 */
function getDefaultPermissions(role) {
    switch (role) {
        case 'admin':
            return {
                pos: { access: true, discount: true, return: true },
                inventory: { access: true, add: true, edit: true, delete: true },
                reports: { access: true, sales: true, export: true },
                customers: { access: true, add: true, edit: true, delete: true },
                admin: { access: true, users: true, branches: true, settings: true, backup: true }
            };
        case 'manager':
            return {
                pos: { access: true, discount: true, return: true },
                inventory: { access: true, add: true, edit: true, delete: false },
                reports: { access: true, sales: true, export: true },
                customers: { access: true, add: true, edit: true, delete: false },
                admin: { access: false, users: false, branches: false, settings: false, backup: false }
            };
        case 'cashier':
            return {
                pos: { access: true, discount: false, return: false },
                inventory: { access: false, add: false, edit: false, delete: false },
                reports: { access: false, sales: false, export: false },
                customers: { access: true, add: true, edit: false, delete: false },
                admin: { access: false, users: false, branches: false, settings: false, backup: false }
            };
        case 'inventory':
            return {
                pos: { access: false, discount: false, return: false },
                inventory: { access: true, add: true, edit: true, delete: false },
                reports: { access: true, sales: false, export: false },
                customers: { access: false, add: false, edit: false, delete: false },
                admin: { access: false, users: false, branches: false, settings: false, backup: false }
            };
        default:
            return {
                pos: { access: true, discount: false, return: false },
                inventory: { access: false, add: false, edit: false, delete: false },
                reports: { access: false, sales: false, export: false },
                customers: { access: false, add: false, edit: false, delete: false },
                admin: { access: false, users: false, branches: false, settings: false, backup: false }
            };
    }
}

/**
 * تحديث مستخدم موجود
 * @param {string} userId معرف المستخدم
 * @param {Object} userData بيانات المستخدم الجديدة
 * @returns {Promise} وعد بعملية تحديث المستخدم
 */
function updateUser(userId, userData) {
    // عرض مؤشر التحميل
    showLoading('جاري تحديث المستخدم...');
    
    // إعداد بيانات التحديث
    const updates = {
        fullName: userData.fullName,
        phone: userData.phone || '',
        role: userData.role || 'cashier',
        status: userData.status || 'active',
        lastBranch: userData.branchId || (currentUser ? currentUser.lastBranch : null),
        permissions: userData.permissions || getDefaultPermissions(userData.role),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser ? currentUser.id : userId
    };
    
// تحديث البريد الإلكتروني إذا تغير
    if (userData.email && userData.email !== userData.currentEmail) {
        // التحقق من وجود مستخدم
        const user = firebase.auth().currentUser;
        
        if (user && (user.uid === userId || user.email === userData.currentEmail)) {
            // تحديث البريد الإلكتروني في Firebase Auth
            return user.updateEmail(userData.email)
                .then(() => {
                    // تحديث البريد الإلكتروني في قاعدة البيانات
                    updates.email = userData.email;
                    
                    return dbRef.ref(`users/${userId}`).update(updates);
                })
                .then(() => {
                    // إخفاء مؤشر التحميل
                    hideLoading();
                    
                    // تسجيل النشاط
                    logUserActivity('update_user', 'تحديث بيانات مستخدم', { userId, username: userData.username });
                    
                    return { ...updates, id: userId };
                })
                .catch(error => {
                    console.error('خطأ في تحديث البريد الإلكتروني:', error);
                    hideLoading();
                    
                    // ترجمة رسائل الخطأ
                    let errorMessage = error.message;
                    switch (error.code) {
                        case 'auth/email-already-in-use':
                            errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                            break;
                        case 'auth/invalid-email':
                            errorMessage = 'البريد الإلكتروني غير صالح';
                            break;
                        case 'auth/requires-recent-login':
                            errorMessage = 'تحتاج إلى إعادة تسجيل الدخول لتغيير البريد الإلكتروني';
                            break;
                    }
                    
                    return Promise.reject(new Error(errorMessage));
                });
        }
    }
    
    // تحديث بيانات المستخدم فقط
    return dbRef.ref(`users/${userId}`).update(updates)
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // تسجيل النشاط
            logUserActivity('update_user', 'تحديث بيانات مستخدم', { userId, username: userData.username });
            
            return { ...updates, id: userId };
        })
        .catch(error => {
            console.error('خطأ في تحديث المستخدم:', error);
            hideLoading();
            return Promise.reject(new Error(error.message || 'حدث خطأ أثناء تحديث المستخدم'));
        });
}

/**
 * تغيير كلمة مرور المستخدم
 * @param {string} userId معرف المستخدم
 * @param {string} currentPassword كلمة المرور الحالية
 * @param {string} newPassword كلمة المرور الجديدة
 * @returns {Promise} وعد بعملية تغيير كلمة المرور
 */
function changeUserPassword(userId, currentPassword, newPassword) {
    // عرض مؤشر التحميل
    showLoading('جاري تغيير كلمة المرور...');
    
    // التحقق من قوة كلمة المرور
    if (appSettings?.security?.requireStrongPassword && !isStrongPassword(newPassword)) {
        hideLoading();
        return Promise.reject(new Error('كلمة المرور ضعيفة. يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز خاصة، وأن تكون بطول 8 أحرف على الأقل.'));
    }
    
    // التحقق من الحد الأدنى لطول كلمة المرور
    const minPasswordLength = appSettings?.security?.minPasswordLength || 8;
    if (newPassword.length < minPasswordLength) {
        hideLoading();
        return Promise.reject(new Error(`كلمة المرور قصيرة جداً. يجب أن تكون بطول ${minPasswordLength} أحرف على الأقل.`));
    }
    
    // الحصول على بيانات المستخدم
    return dbRef.ref(`users/${userId}`).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                throw new Error('المستخدم غير موجود');
            }
            
            const userData = snapshot.val();
            
            // التحقق من وجود المستخدم الحالي
            const user = firebase.auth().currentUser;
            
            if (!user) {
                throw new Error('المستخدم غير مسجل الدخول');
            }
            
            // إعادة المصادقة إذا كان المستخدم الحالي هو نفسه المطلوب تغيير كلمة مروره
            if (user.uid === userId) {
                const credential = firebase.auth.EmailAuthProvider.credential(userData.email, currentPassword);
                
                return user.reauthenticateWithCredential(credential)
                    .then(() => {
                        // تغيير كلمة المرور
                        return user.updatePassword(newPassword);
                    });
            } else if (currentUser && currentUser.role === 'admin') {
                // المسؤول يغير كلمة مرور مستخدم آخر
                // هذا يتطلب API خاصة في الخلفية للتعامل مع تغيير كلمة المرور
                
                // ملاحظة: هذا مجرد محاكاة، يجب استبداله بكود حقيقي
                console.log('المسؤول يغير كلمة مرور المستخدم', userId);
                return Promise.resolve();
            } else {
                throw new Error('ليس لديك صلاحية لتغيير كلمة مرور هذا المستخدم');
            }
        })
        .then(() => {
            // تحديث تاريخ تغيير كلمة المرور
            return dbRef.ref(`users/${userId}`).update({
                passwordChangedAt: new Date().toISOString(),
                passwordChangedBy: currentUser ? currentUser.id : userId
            });
        })
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // تسجيل النشاط
            logUserActivity('change_password', 'تغيير كلمة المرور', { userId });
            
            return true;
        })
        .catch(error => {
            console.error('خطأ في تغيير كلمة المرور:', error);
            hideLoading();
            
            // ترجمة رسائل الخطأ
            let errorMessage = error.message;
            switch (error.code) {
                case 'auth/wrong-password':
                    errorMessage = 'كلمة المرور الحالية غير صحيحة';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'كلمة المرور الجديدة ضعيفة';
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = 'تحتاج إلى إعادة تسجيل الدخول لتغيير كلمة المرور';
                    break;
            }
            
            return Promise.reject(new Error(errorMessage));
        });
}

/**
 * تعطيل حساب مستخدم
 * @param {string} userId معرف المستخدم
 * @returns {Promise} وعد بعملية تعطيل الحساب
 */
function disableUser(userId) {
    // عرض مؤشر التحميل
    showLoading('جاري تعطيل الحساب...');
    
    // التحقق من أن المستخدم ليس المستخدم الحالي
    if (currentUser && currentUser.id === userId) {
        hideLoading();
        return Promise.reject(new Error('لا يمكنك تعطيل حسابك الحالي'));
    }
    
    // تحديث حالة المستخدم
    return dbRef.ref(`users/${userId}`).update({
        status: 'disabled',
        disabledAt: new Date().toISOString(),
        disabledBy: currentUser ? currentUser.id : null
    })
    .then(() => {
        // إخفاء مؤشر التحميل
        hideLoading();
        
        // تسجيل النشاط
        logUserActivity('disable_user', 'تعطيل حساب مستخدم', { userId });
        
        return true;
    })
    .catch(error => {
        console.error('خطأ في تعطيل الحساب:', error);
        hideLoading();
        return Promise.reject(new Error(error.message || 'حدث خطأ أثناء تعطيل الحساب'));
    });
}

/**
 * تفعيل حساب مستخدم
 * @param {string} userId معرف المستخدم
 * @returns {Promise} وعد بعملية تفعيل الحساب
 */
function enableUser(userId) {
    // عرض مؤشر التحميل
    showLoading('جاري تفعيل الحساب...');
    
    // تحديث حالة المستخدم
    return dbRef.ref(`users/${userId}`).update({
        status: 'active',
        enabledAt: new Date().toISOString(),
        enabledBy: currentUser ? currentUser.id : null
    })
    .then(() => {
        // إخفاء مؤشر التحميل
        hideLoading();
        
        // تسجيل النشاط
        logUserActivity('enable_user', 'تفعيل حساب مستخدم', { userId });
        
        return true;
    })
    .catch(error => {
        console.error('خطأ في تفعيل الحساب:', error);
        hideLoading();
        return Promise.reject(new Error(error.message || 'حدث خطأ أثناء تفعيل الحساب'));
    });
}

/**
 * حذف مستخدم
 * @param {string} userId معرف المستخدم
 * @returns {Promise} وعد بعملية حذف المستخدم
 */
function deleteUser(userId) {
    // عرض مؤشر التحميل
    showLoading('جاري حذف المستخدم...');
    
    // التحقق من أن المستخدم ليس المستخدم الحالي
    if (currentUser && currentUser.id === userId) {
        hideLoading();
        return Promise.reject(new Error('لا يمكنك حذف حسابك الحالي'));
    }
    
    // الحصول على بيانات المستخدم
    return dbRef.ref(`users/${userId}`).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                throw new Error('المستخدم غير موجود');
            }
            
            const userData = snapshot.val();
            
            // حذف المستخدم من Firebase Auth
            // ملاحظة: هذا يتطلب API خاصة في الخلفية
            // يمكن استخدام Firebase Admin SDK لحذف المستخدم
            
            // ملاحظة: هذا مجرد محاكاة، يجب استبداله بكود حقيقي
            console.log('حذف المستخدم من Firebase Auth', userId);
            
            // حذف بيانات المستخدم من قاعدة البيانات
            return dbRef.ref(`users/${userId}`).remove();
        })
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // تسجيل النشاط
            logUserActivity('delete_user', 'حذف مستخدم', { userId });
            
            return true;
        })
        .catch(error => {
            console.error('خطأ في حذف المستخدم:', error);
            hideLoading();
            return Promise.reject(new Error(error.message || 'حدث خطأ أثناء حذف المستخدم'));
        });
}

/**
 * إعادة تعيين كلمة مرور مستخدم
 * @param {string} email البريد الإلكتروني
 * @returns {Promise} وعد بعملية إعادة تعيين كلمة المرور
 */
function resetPassword(email) {
    // عرض مؤشر التحميل
    showLoading('جاري إرسال رابط إعادة تعيين كلمة المرور...');
    
    // حفظ البريد الإلكتروني للاستخدام لاحقاً
    passwordResetEmail = email;
    
    // إرسال رابط إعادة تعيين كلمة المرور
    return firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // تسجيل النشاط
            logUserActivity('reset_password', 'طلب إعادة تعيين كلمة المرور', { email });
            
            return true;
        })
        .catch(error => {
            console.error('خطأ في إرسال رابط إعادة تعيين كلمة المرور:', error);
            hideLoading();
            
            // ترجمة رسائل الخطأ
            let errorMessage = error.message;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'لم يتم العثور على حساب بهذا البريد الإلكتروني';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'البريد الإلكتروني غير صالح';
                    break;
            }
            
            return Promise.reject(new Error(errorMessage));
        });
}

/**
 * التحقق من صلاحية الوصول
 * @param {string} section القسم
 * @param {string} action الإجراء
 * @returns {boolean} ما إذا كان المستخدم له صلاحية
 */
function hasPermission(section, action) {
    // إذا كان المستخدم مسؤولاً، فله جميع الصلاحيات
    if (currentUser && currentUser.role === 'admin') {
        return true;
    }
    
    // التحقق من وجود صلاحيات
    if (currentUser && currentUser.permissions && currentUser.permissions[section]) {
        return currentUser.permissions[section][action] === true;
    }
    
    return false;
}

/**
 * التحقق من صلاحيات المستخدم لصفحة
 * @param {string} page الصفحة
 * @returns {boolean} ما إذا كان المستخدم له صلاحية
 */
function checkPagePermission(page) {
    switch (page) {
        case 'pos':
            return hasPermission('pos', 'access');
        case 'inventory':
            return hasPermission('inventory', 'access');
        case 'reports':
            return hasPermission('reports', 'access');
        case 'customers':
            return hasPermission('customers', 'access');
        case 'admin':
            return hasPermission('admin', 'access');
        default:
            return false;
    }
}

/**
 * تهيئة واجهة المستخدم حسب صلاحيات المستخدم
 */
function setupUIBasedOnPermissions() {
    // التحقق من وجود مستخدم مسجل الدخول
    if (!currentUser) return;
    
    // إخفاء الصفحات التي ليس للمستخدم صلاحية الوصول إليها
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const page = link.dataset.page;
        
        if (!checkPagePermission(page)) {
            link.style.display = 'none';
        } else {
            link.style.display = 'flex';
        }
    });
    
    // التحقق من الصفحة الحالية
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageId = activePage.id.replace('-page', '');
        
        if (!checkPagePermission(pageId)) {
            // تغيير الصفحة إلى الصفحة الافتراضية المسموحة
            const defaultPage = getDefaultPageForUser();
            changePage(defaultPage);
        }
    }
    
    // إخفاء أزرار الإجراءات التي ليس للمستخدم صلاحية استخدامها
    
    // نقطة البيع - الخصم
    const discountInput = document.getElementById('discount-value');
    const discountType = document.getElementById('discount-type');
    
    if (discountInput && discountType && !hasPermission('pos', 'discount')) {
        discountInput.disabled = true;
        discountType.disabled = true;
        
        // إضافة تلميح
        const discountWrapper = discountInput.closest('.discount-input');
        if (discountWrapper) {
            discountWrapper.title = 'ليس لديك صلاحية منح خصومات';
        }
    }
    
    // المخزون - إضافة/تعديل/حذف المنتجات
    if (!hasPermission('inventory', 'add')) {
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.style.display = 'none';
        }
    }
    
    // لوحة الإدارة - التحكم في المستخدمين
    if (!hasPermission('admin', 'users')) {
        const adminTab = document.querySelector('.admin-tab[data-tab="users"]');
        if (adminTab) {
            adminTab.style.display = 'none';
        }
    }
    
    // لوحة الإدارة - التحكم في الفروع
    if (!hasPermission('admin', 'branches')) {
        const adminTab = document.querySelector('.admin-tab[data-tab="branches"]');
        if (adminTab) {
            adminTab.style.display = 'none';
        }
    }
    
    // لوحة الإدارة - التحكم في الإعدادات
    if (!hasPermission('admin', 'settings')) {
        const adminTab = document.querySelector('.admin-tab[data-tab="settings"]');
        if (adminTab) {
            adminTab.style.display = 'none';
        }
    }
    
    // لوحة الإدارة - التحكم في النسخ الاحتياطي
    if (!hasPermission('admin', 'backup')) {
        const adminTab = document.querySelector('.admin-tab[data-tab="backup"]');
        if (adminTab) {
            adminTab.style.display = 'none';
        }
    }
}

/**
 * الحصول على الصفحة الافتراضية للمستخدم
 * @returns {string} الصفحة الافتراضية
 */
function getDefaultPageForUser() {
    // التحقق من صلاحيات المستخدم
    if (hasPermission('pos', 'access')) {
        return 'pos';
    } else if (hasPermission('inventory', 'access')) {
        return 'inventory';
    } else if (hasPermission('reports', 'access')) {
        return 'reports';
    } else if (hasPermission('customers', 'access')) {
        return 'customers';
    } else if (hasPermission('admin', 'access')) {
        return 'admin';
    }
    
    // إذا لم يكن للمستخدم أي صلاحيات، أظهر صفحة "غير مصرح"
    return 'unauthorized';
}

/**
 * تحميل قائمة الفروع في نموذج تسجيل الدخول
 */
function loadBranchesForLogin() {
    const branchSelection = document.getElementById('branch-selection');
    if (!branchSelection) return;
    
    // تفريغ القائمة
    branchSelection.innerHTML = '<option value="" disabled selected>جاري تحميل الفروع...</option>';
    
    // تحميل الفروع من قاعدة البيانات
    dbRef.ref('branches').once('value')
        .then(snapshot => {
            // تفريغ القائمة
            branchSelection.innerHTML = '';
            
            if (snapshot.exists()) {
                let branches = [];
                
                snapshot.forEach(childSnapshot => {
                    const branch = childSnapshot.val();
                    branch.id = childSnapshot.key;
                    branches.push(branch);
                });
                
                // ترتيب الفروع: الرئيسي أولاً ثم حسب الاسم
                branches.sort((a, b) => {
                    if (a.type === 'main' && b.type !== 'main') return -1;
                    if (a.type !== 'main' && b.type === 'main') return 1;
                    return a.name.localeCompare(b.name);
                });
                
                // إضافة الفروع إلى القائمة
                branches.forEach(branch => {
                    const option = document.createElement('option');
                    option.value = branch.id;
                    option.textContent = branch.name;
                    
                    // تحديد الفرع الرئيسي افتراضياً
                    if (branch.type === 'main') {
                        option.selected = true;
                    }
                    
                    branchSelection.appendChild(option);
                });
            } else {
                // إضافة خيار افتراضي
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'الفرع الرئيسي';
                branchSelection.appendChild(defaultOption);
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل الفروع:', error);
            
            // تفريغ القائمة وإضافة خيار افتراضي
            branchSelection.innerHTML = '';
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = 'خطأ في تحميل الفروع';
            branchSelection.appendChild(errorOption);
        });
}

/**
 * ملف الإعدادات الأساسية للنظام
 * يحتوي على الإعدادات الثابتة والتهيئة الأولية
 */

// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf1n1TrAzwEMiAI",
    authDomain: "messageemeapp.firebaseapp.com",
    databaseURL: "https://messageemeapp-default-rtdb.firebaseio.com",
    projectId: "messageemeapp",
    storageBucket: "messageemeapp.appspot.com",
    messagingSenderId: "255034474844",
    appId: "1:255034474844:web:5e3b7a6bc4b2fb94cc4199"
};

// معلومات النظام
const systemInfo = {
    name: "نظام نقطة البيع المتكامل",
    version: "2.0.0",
    releaseDate: "2025-04-24",
    currency: "IQD",
    currencyName: "دينار عراقي",
    currencySymbol: "دينار",
    developer: "شركة التطوير البرمجي",
    website: "www.example.com",
    email: "support@example.com",
    phone: "0123456789"
};

// قائمة العملات المدعومة
const supportedCurrencies = [
    { code: "IQD", name: "دينار عراقي", symbol: "دينار" },
    { code: "SAR", name: "ريال سعودي", symbol: "ر.س" },
    { code: "AED", name: "درهم إماراتي", symbol: "د.إ" },
    { code: "USD", name: "دولار أمريكي", symbol: "$" },
    { code: "EUR", name: "يورو", symbol: "€" },
    { code: "GBP", name: "جنيه إسترليني", symbol: "£" },
    { code: "JOD", name: "دينار أردني", symbol: "د.أ" },
    { code: "KWD", name: "دينار كويتي", symbol: "د.ك" },
    { code: "QAR", name: "ريال قطري", symbol: "ر.ق" },
    { code: "BHD", name: "دينار بحريني", symbol: "د.ب" },
    { code: "EGP", name: "جنيه مصري", symbol: "ج.م" },
    { code: "LBP", name: "ليرة لبنانية", symbol: "ل.ل" },
    { code: "OMR", name: "ريال عماني", symbol: "ر.ع" },
    { code: "SYP", name: "ليرة سورية", symbol: "ل.س" }
];

// بيانات الباركود المدعومة
const barcodeTypes = [
    { type: "EAN13", name: "EAN-13", length: 13 },
    { type: "EAN8", name: "EAN-8", length: 8 },
    { type: "CODE128", name: "CODE 128", length: 0 },
    { type: "CODE39", name: "CODE 39", length: 0 },
    { type: "UPC", name: "UPC", length: 12 }
];

// مجموعة الأيقونات المتاحة للأقسام
const categoryIcons = [
    { icon: "fa-box", name: "صندوق" },
    { icon: "fa-utensils", name: "أطعمة" },
    { icon: "fa-coffee", name: "مشروبات" },
    { icon: "fa-mobile-alt", name: "إلكترونيات" },
    { icon: "fa-tshirt", name: "ملابس" },
    { icon: "fa-home", name: "منزل" },
    { icon: "fa-gift", name: "هدية" },
    { icon: "fa-book", name: "كتاب" },
    { icon: "fa-tools", name: "أدوات" },
    { icon: "fa-heartbeat", name: "صحة" },
    { icon: "fa-tablets", name: "أدوية" },
    { icon: "fa-car", name: "سيارات" },
    { icon: "fa-baby", name: "أطفال" },
    { icon: "fa-store", name: "متجر" },
    { icon: "fa-gem", name: "مجوهرات" },
    { icon: "fa-hockey-puck", name: "رياضة" },
    { icon: "fa-cookie", name: "حلويات" },
    { icon: "fa-gamepad", name: "ألعاب" },
    { icon: "fa-bolt", name: "طاقة" },
    { icon: "fa-suitcase", name: "سفر" }
];

// قائمة صلاحيات المستخدمين
const userRoles = [
    { 
        id: "admin", 
        name: "مدير", 
        description: "صلاحيات كاملة للنظام" 
    },
    { 
        id: "manager", 
        name: "مشرف", 
        description: "إدارة المبيعات والمخزون والتقارير" 
    },
    { 
        id: "cashier", 
        name: "كاشير", 
        description: "إدارة المبيعات فقط" 
    },
    { 
        id: "inventory", 
        name: "مسؤول
        
        { 
        id: "inventory", 
        name: "مسؤول مخزون", 
        description: "إدارة المخزون والمنتجات" 
    },
    { 
        id: "accountant", 
        name: "محاسب", 
        description: "الاطلاع على التقارير والمبيعات" 
    },
    { 
        id: "viewer", 
        name: "مراقب", 
        description: "الاطلاع فقط دون تعديل" 
    }
];

// أنواع طرق الدفع المدعومة
const paymentMethods = [
    { 
        id: "cash", 
        name: "نقدي", 
        icon: "fa-money-bill-wave",
        enabled: true,
        requiresChange: true
    },
    { 
        id: "card", 
        name: "بطاقة ائتمان", 
        icon: "fa-credit-card",
        enabled: true,
        requiresChange: false
    },
    { 
        id: "online", 
        name: "دفع إلكتروني", 
        icon: "fa-globe",
        enabled: true,
        requiresChange: false
    },
    { 
        id: "bank", 
        name: "تحويل بنكي", 
        icon: "fa-university",
        enabled: false,
        requiresChange: false
    },
    {
        id: "check",
        name: "شيك",
        icon: "fa-money-check-alt",
        enabled: false,
        requiresChange: false
    },
    {
        id: "points",
        name: "نقاط",
        icon: "fa-award",
        enabled: false,
        requiresChange: false
    }
];

// تكوين قاعدة البيانات
const databaseSchema = {
    users: {
        uid: "string", // معرف المستخدم
        username: "string", // اسم المستخدم
        fullName: "string", // الاسم الكامل
        email: "string", // البريد الإلكتروني
        phone: "string", // رقم الهاتف
        role: "string", // الصلاحية
        status: "string", // الحالة (active, disabled)
        permissions: "object", // الصلاحيات التفصيلية
        lastLogin: "timestamp", // تاريخ آخر تسجيل دخول
        createdAt: "timestamp", // تاريخ الإنشاء
        createdBy: "string", // منشئ الحساب
        lastBranch: "string", // آخر فرع تم استخدامه
        loginCount: "number", // عدد مرات تسجيل الدخول
        passwordChangedAt: "timestamp" // تاريخ آخر تغيير لكلمة المرور
    },
    branches: {
        id: "string", // معرف الفرع
        name: "string", // اسم الفرع
        code: "string", // رمز الفرع
        address: "string", // عنوان الفرع
        phone: "string", // رقم هاتف الفرع
        email: "string", // بريد إلكتروني الفرع
        type: "string", // نوع الفرع (main, branch, warehouse)
        manager: "string", // مدير الفرع
        status: "string", // حالة الفرع (active, inactive)
        createdAt: "timestamp", // تاريخ الإنشاء
        createdBy: "string", // منشئ الفرع
        categories: "object", // فئات الفرع
        products: "object", // منتجات الفرع
        inventory: "object", // مخزون الفرع
        invoices: "object", // فواتير الفرع
        held_orders: "object", // الطلبات المعلقة
        stats: "object" // إحصائيات الفرع
    },
    customers: {
        id: "string", // معرف العميل
        name: "string", // اسم العميل
        phone: "string", // رقم هاتف العميل
        email: "string", // بريد إلكتروني العميل
        address: "string", // عنوان العميل
        points: "number", // نقاط العميل
        totalSpent: "number", // إجمالي الإنفاق
        purchaseCount: "number", // عدد عمليات الشراء
        notes: "string", // ملاحظات
        createdAt: "timestamp", // تاريخ الإنشاء
        createdBy: "string", // منشئ العميل
        lastPurchase: "timestamp", // تاريخ آخر عملية شراء
        points_history: "object" // سجل النقاط
    },
    settings: {
        general: "object", // الإعدادات العامة
        pos: "object", // إعدادات نقطة البيع
        invoices: "object", // إعدادات الفواتير
        tax: "object", // إعدادات الضريبة
        customers: "object", // إعدادات العملاء
        appearance: "object", // إعدادات المظهر
        backup: "object", // إعدادات النسخ الاحتياطي
        security: "object", // إعدادات الأمان
        notifications: "object" // إعدادات الإشعارات
    },
    activity_logs: {
        id: "string", // معرف النشاط
        type: "string", // نوع النشاط
        description: "string", // وصف النشاط
        userId: "string", // معرف المستخدم
        username: "string", // اسم المستخدم
        branchId: "string", // معرف الفرع
        branchName: "string", // اسم الفرع
        timestamp: "timestamp", // تاريخ النشاط
        data: "object" // بيانات إضافية
    },
    notifications: {
        id: "string", // معرف الإشعار
        title: "string", // عنوان الإشعار
        message: "string", // نص الإشعار
        type: "string", // نوع الإشعار (success, error, warning, info)
        userId: "string", // معرف المستخدم المستهدف
        branchId: "string", // معرف الفرع
        isRead: "boolean", // حالة القراءة
        timestamp: "timestamp", // تاريخ الإشعار
        readAt: "timestamp" // تاريخ القراءة
    },
    backup_history: {
        id: "string", // معرف النسخة الاحتياطية
        name: "string", // اسم النسخة الاحتياطية
        path: "string", // مسار الملف
        url: "string", // رابط التنزيل
        timestamp: "timestamp", // تاريخ النسخة
        size: "number", // حجم الملف
        userId: "string", // معرف المستخدم
        userName: "string", // اسم المستخدم
        type: "string", // نوع النسخة (manual, auto)
        options: "object" // خيارات النسخ
    }
};

// تحقق من وجود الشبكة
function checkNetworkConnection() {
    return navigator.onLine;
}

// تحقق من دعم التخزين المحلي
function checkLocalStorageSupport() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        return false;
    }
}

// تهيئة الإعدادات الأولية
function initConfig() {
    console.log('تهيئة نظام نقطة البيع الإصدار: ' + systemInfo.version);
    
    // تحقق من متطلبات التشغيل
    const networkAvailable = checkNetworkConnection();
    const localStorageSupported = checkLocalStorageSupport();
    
    if (!networkAvailable) {
        console.warn('تحذير: لا يوجد اتصال بالإنترنت. بعض الوظائف قد لا تعمل.');
    }
    
    if (!localStorageSupported) {
        console.error('خطأ: التخزين المحلي غير مدعوم. النظام قد لا يعمل بشكل صحيح.');
    }
    
    // تهيئة Firebase
    try {
        firebase.initializeApp(firebaseConfig);
        console.log('تم تهيئة Firebase بنجاح');
    } catch (error) {
        console.error('خطأ في تهيئة Firebase:', error);
    }
    
    return {
        networkAvailable,
        localStorageSupported,
        firebaseInitialized: firebase.apps.length > 0
    };
}

// تصدير الإعدادات
const config = {
    firebase: firebaseConfig,
    system: systemInfo,
    currencies: supportedCurrencies,
    barcodeTypes: barcodeTypes,
    categoryIcons: categoryIcons,
    userRoles: userRoles,
    paymentMethods: paymentMethods,
    dbSchema: databaseSchema,
    init: initConfig
};
