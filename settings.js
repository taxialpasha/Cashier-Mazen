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
                    <input type="text" id="tax-category-name" class="swal2-input" value="${<label for="tax-category-name">القسم</label>
                    <input type="text" id="tax-category-name" class="swal2-input" value="${category.name}" readonly style="width: 100%;">
                </div>
                <div class="form-group">
                    <label for="tax-category-rate">نسبة الضريبة</label>
                    <input type="number" id="tax-category-rate" class="swal2-input" value="${category.rate}" min="0" max="100" step="0.01" style="width: 100%;">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'حفظ',
        cancelButtonText: 'إلغاء',
        focusConfirm: false,
        preConfirm: () => {
            const rate = parseFloat(document.getElementById('tax-category-rate').value);
            
            if (isNaN(rate) || rate < 0 || rate > 100) {
                Swal.showValidationMessage('يرجى إدخال نسبة ضريبة صحيحة بين 0 و 100');
                return false;
            }
            
            return { rate };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateTaxCategory(index, result.value.rate);
        }
    });
}

/**
 * تحديث فئة ضريبية
 * @param {number} index فهرس الفئة
 * @param {number} rate نسبة الضريبة الجديدة
 */
function updateTaxCategory(index, rate) {
    // تحديث الفئة
    appSettings.tax.categories[index].rate = rate;
    
    // حفظ التغييرات
    dbRef.ref('settings/tax/categories').set(appSettings.tax.categories)
        .then(() => {
            // تحديث جدول الفئات
            loadTaxCategories();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم تحديث فئة الضريبة بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('update_tax_category', 'تحديث فئة ضريبية', { 
                category: appSettings.tax.categories[index].name, 
                rate 
            });
        })
        .catch(error => {
            console.error('خطأ في تحديث فئة الضريبة:', error);
            showNotification('خطأ', 'حدث خطأ أثناء تحديث فئة الضريبة', 'error');
        });
}

/**
 * حذف فئة ضريبية
 * @param {number} index فهرس الفئة
 */
function deleteTaxCategory(index) {
    // الحصول على الفئة
    const category = appSettings.tax.categories[index];
    
    if (!category) {
        showNotification('خطأ', 'الفئة غير موجودة', 'error');
        return;
    }
    
    // تأكيد الحذف
    Swal.fire({
        title: 'تأكيد الحذف',
        text: `هل أنت متأكد من حذف فئة الضريبة لـ "${category.name}"؟`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، حذف',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            // حذف الفئة
            appSettings.tax.categories.splice(index, 1);
            
            // حفظ التغييرات
            dbRef.ref('settings/tax/categories').set(appSettings.tax.categories)
                .then(() => {
                    // تحديث جدول الفئات
                    loadTaxCategories();
                    
                    // عرض رسالة نجاح
                    showNotification('تم بنجاح', 'تم حذف فئة الضريبة بنجاح', 'success');
                    
                    // تسجيل النشاط
                    logUserActivity('delete_tax_category', 'حذف فئة ضريبية', { category: category.name });
                })
                .catch(error => {
                    console.error('خطأ في حذف فئة الضريبة:', error);
                    showNotification('خطأ', 'حدث خطأ أثناء حذف فئة الضريبة', 'error');
                });
        }
    });
}

/**
 * تنزيل النسخة الاحتياطية
 */
function downloadSystemBackup() {
    // عرض مؤشر التحميل
    showLoading('جاري إنشاء النسخة الاحتياطية...');
    
    // تحديد البيانات المطلوب نسخها
    const options = {
        products: document.getElementById('backup-products').checked,
        customers: document.getElementById('backup-customers').checked,
        invoices: document.getElementById('backup-sales').checked,
        settings: document.getElementById('backup-settings').checked,
        users: document.getElementById('backup-users').checked
    };
    
    // اسم النسخة الاحتياطية
    const backupName = document.getElementById('backup-name').value || `نسخة-احتياطية-${new Date().toISOString().split('T')[0]}`;
    
    // إنشاء النسخة الاحتياطية
    createBackup(backupName, options)
        .then(backupRecord => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // تحديث سجل النسخ الاحتياطي
            loadBackupHistory();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم إنشاء النسخة الاحتياطية بنجاح', 'success');
            
            // تنزيل النسخة الاحتياطية
            setTimeout(() => {
                window.open(backupRecord.url, '_blank');
            }, 1000);
        })
        .catch(error => {
            console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء إنشاء النسخة الاحتياطية', 'error');
        });
}

/**
 * إعداد مستمعي أحداث النسخ الاحتياطي
 */
function setupBackupEventListeners() {
    // زر إنشاء نسخة احتياطية
    const createBackupBtn = document.getElementById('create-backup-btn');
    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', downloadSystemBackup);
    }
    
    // زر جدولة النسخ الاحتياطي
    const scheduleBackupBtn = document.getElementById('schedule-backup-btn');
    if (scheduleBackupBtn) {
        scheduleBackupBtn.addEventListener('click', showScheduleBackupModal);
    }
    
    // زر اختيار ملف النسخة الاحتياطية
    const selectBackupFileBtn = document.getElementById('select-backup-file');
    if (selectBackupFileBtn) {
        selectBackupFileBtn.addEventListener('click', function() {
            document.getElementById('backup-file').click();
        });
    }
    
    // مراقبة تغيير ملف النسخة الاحتياطية
    const backupFile = document.getElementById('backup-file');
    if (backupFile) {
        backupFile.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                // إظهار خيارات الاستعادة
                document.getElementById('restore-options').style.display = 'block';
                
                // عرض اسم الملف
                const fileName = this.files[0].name;
                this.nextElementSibling.textContent = fileName;
            }
        });
    }
    
    // زر استعادة النسخة الاحتياطية
    const restoreBackupBtn = document.getElementById('restore-backup-btn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', restoreSystemBackup);
    }
}

/**
 * عرض مودال جدولة النسخ الاحتياطي
 */
function showScheduleBackupModal() {
    // الحصول على إعدادات النسخ الاحتياطي
    const backupSettings = appSettings.backup || {
        enableAutoBackup: false,
        backupInterval: 'daily',
        backupTime: '00:00',
        backupDay: 1,
        backupItems: {
            products: true,
            customers: true,
            invoices: true,
            settings: true,
            users: false
        },
        maxBackups: 10
    };
    
    // إنشاء المودال
    Swal.fire({
        title: 'جدولة النسخ الاحتياطي',
        html: `
            <div class="swal-form" style="text-align: right;">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="enable-auto-backup" ${backupSettings.enableAutoBackup ? 'checked' : ''}>
                        تفعيل النسخ الاحتياطي التلقائي
                    </label>
                </div>
                
                <div class="backup-schedule-options" style="margin-top: 15px; ${backupSettings.enableAutoBackup ? '' : 'display: none;'}">
                    <div class="form-group">
                        <label for="backup-interval">الفترة</label>
                        <select id="backup-interval" class="swal2-input" style="width: 100%;">
                            <option value="daily" ${backupSettings.backupInterval === 'daily' ? 'selected' : ''}>يومي</option>
                            <option value="weekly" ${backupSettings.backupInterval === 'weekly' ? 'selected' : ''}>أسبوعي</option>
                            <option value="monthly" ${backupSettings.backupInterval === 'monthly' ? 'selected' : ''}>شهري</option>
                        </select>
                    </div>
                    
                    <div class="form-group backup-day-container" style="${backupSettings.backupInterval !== 'daily' ? '' : 'display: none;'}">
                        <label for="backup-day">اليوم</label>
                        <select id="backup-day" class="swal2-input" style="width: 100%;">
                            ${backupSettings.backupInterval === 'weekly' ?
                                `<option value="0" ${backupSettings.backupDay === 0 ? 'selected' : ''}>الأحد</option>
                                <option value="1" ${backupSettings.backupDay === 1 ? 'selected' : ''}>الإثنين</option>
                                <option value="2" ${backupSettings.backupDay === 2 ? 'selected' : ''}>الثلاثاء</option>
                                <option value="3" ${backupSettings.backupDay === 3 ? 'selected' : ''}>الأربعاء</option>
                                <option value="4" ${backupSettings.backupDay === 4 ? 'selected' : ''}>الخميس</option>
                                <option value="5" ${backupSettings.backupDay === 5 ? 'selected' : ''}>الجمعة</option>
                                <option value="6" ${backupSettings.backupDay === 6 ? 'selected' : ''}>السبت</option>` :
                                Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${backupSettings.backupDay === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')
                            }
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="backup-time">الوقت</label>
                        <input type="time" id="backup-time" class="swal2-input" value="${backupSettings.backupTime}" style="width: 100%;">
                    </div>
                    
                    <div class="form-group">
                        <label for="max-backups">الحد الأقصى للنسخ المحفوظة</label>
                        <input type="number" id="max-backups" class="swal2-input" value="${backupSettings.maxBackups}" min="1" max="100" style="width: 100%;">
                    </div>
                    
                    <div class="form-group">
                        <label>البيانات المطلوب نسخها</label>
                        <div style="margin-top: 10px;">
                            <label style="display: block; margin-bottom: 5px;">
                                <input type="checkbox" id="schedule-backup-products" ${backupSettings.backupItems.products ? 'checked' : ''}>
                                المنتجات والأقسام
                            </label>
                            <label style="display: block; margin-bottom: 5px;">
                                <input type="checkbox" id="schedule-backup-customers" ${backupSettings.backupItems.customers ? 'checked' : ''}>
                                العملاء
                            </label>
                            <label style="display: block; margin-bottom: 5px;">
                                <input type="checkbox" id="schedule-backup-invoices" ${backupSettings.backupItems.invoices ? 'checked' : ''}>
                                المبيعات والفواتير
                            </label>
                            <label style="display: block; margin-bottom: 5px;">
                                <input type="checkbox" id="schedule-backup-settings" ${backupSettings.backupItems.settings ? 'checked' : ''}>
                                الإعدادات
                            </label>
                            <label style="display: block;">
                                <input type="checkbox" id="schedule-backup-users" ${backupSettings.backupItems.users ? 'checked' : ''}>
                                المستخدمين والصلاحيات
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'حفظ',
        cancelButtonText: 'إلغاء',
        didOpen: () => {
            // إضافة مستمع حدث لتبديل خيارات الجدولة
            const enableAutoBackup = document.getElementById('enable-auto-backup');
            const backupScheduleOptions = document.querySelector('.backup-schedule-options');
            
            enableAutoBackup.addEventListener('change', function() {
                backupScheduleOptions.style.display = this.checked ? 'block' : 'none';
            });
            
            // إضافة مستمع حدث لتبديل خيارات اليوم
            const backupInterval = document.getElementById('backup-interval');
            const backupDayContainer = document.querySelector('.backup-day-container');
            const backupDay = document.getElementById('backup-day');
            
            backupInterval.addEventListener('change', function() {
                backupDayContainer.style.display = this.value !== 'daily' ? 'block' : 'none';
                
                // تحديث خيارات اليوم
                if (this.value === 'weekly') {
                    // أيام الأسبوع
                    backupDay.innerHTML = `
                        <option value="0">الأحد</option>
                        <option value="1">الإثنين</option>
                        <option value="2">الثلاثاء</option>
                        <option value="3">الأربعاء</option>
                        <option value="4">الخميس</option>
                        <option value="5">الجمعة</option>
                        <option value="6">السبت</option>
                    `;
                } else if (this.value === 'monthly') {
                    // أيام الشهر
                    backupDay.innerHTML = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
                }
            });
        },
        preConfirm: () => {
            const enableAutoBackup = document.getElementById('enable-auto-backup').checked;
            const backupInterval = document.getElementById('backup-interval').value;
            const backupTime = document.getElementById('backup-time').value;
            const maxBackups = parseInt(document.getElementById('max-backups').value);
            
            let backupDay = 1;
            if (backupInterval !== 'daily') {
                backupDay = parseInt(document.getElementById('backup-day').value);
            }
            
            if (!backupTime) {
                Swal.showValidationMessage('يرجى تحديد وقت النسخ الاحتياطي');
                return false;
            }
            
            if (isNaN(maxBackups) || maxBackups < 1 || maxBackups > 100) {
                Swal.showValidationMessage('يرجى تحديد الحد الأقصى للنسخ بين 1 و 100');
                return false;
            }
            
            const backupItems = {
                products: document.getElementById('schedule-backup-products').checked,
                customers: document.getElementById('schedule-backup-customers').checked,
                invoices: document.getElementById('schedule-backup-invoices').checked,
                settings: document.getElementById('schedule-backup-settings').checked,
                users: document.getElementById('schedule-backup-users').checked
            };
            
            return {
                enableAutoBackup,
                backupInterval,
                backupDay,
                backupTime,
                backupItems,
                maxBackups
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            saveBackupSchedule(result.value);
        }
    });
}

/**
 * حفظ جدولة النسخ الاحتياطي
 * @param {Object} schedule إعدادات الجدولة
 */
function saveBackupSchedule(schedule) {
    // عرض مؤشر التحميل
    showLoading('جاري حفظ إعدادات النسخ الاحتياطي...');
    
    // تحديث الإعدادات المحلية
    appSettings.backup = schedule;
    
    // حفظ الإعدادات في قاعدة البيانات
    dbRef.ref('settings/backup').set(schedule)
        .then(() => {
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم حفظ إعدادات النسخ الاحتياطي بنجاح', 'success');
            
            // تسجيل النشاط
            logUserActivity('update_backup_settings', 'تحديث إعدادات النسخ الاحتياطي');
        })
        .catch(error => {
            console.error('خطأ في حفظ إعدادات النسخ الاحتياطي:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء حفظ إعدادات النسخ الاحتياطي', 'error');
        });
}

/**
 * استعادة النسخة الاحتياطية
 */
function restoreSystemBackup() {
    // الحصول على الملف
    const backupFile = document.getElementById('backup-file').files[0];
    
    if (!backupFile) {
        showNotification('خطأ', 'يرجى اختيار ملف النسخة الاحتياطية', 'error');
        return;
    }
    
    // الحصول على خيارات الاستعادة
    const options = {
        products: document.getElementById('restore-products').checked,
        customers: document.getElementById('restore-customers').checked,
        invoices: document.getElementById('restore-sales').checked,
        settings: document.getElementById('restore-settings').checked,
        users: document.getElementById('restore-users').checked
    };
    
    // التحقق من اختيار خيار واحد على الأقل
    if (!options.products && !options.customers && !options.invoices && !options.settings && !options.users) {
        showNotification('خطأ', 'يرجى اختيار نوع واحد على الأقل من البيانات لاستعادتها', 'error');
        return;
    }
    
    // تأكيد الاستعادة
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
            // عرض مؤشر التحميل
            showLoading('جاري استعادة النسخة الاحتياطية...');
            
            // قراءة الملف
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    // تحليل البيانات
                    const backupData = JSON.parse(e.target.result);
                    
                    // استعادة البيانات
                    restoreFromBackupData(backupData, options);
                } catch (error) {
                    console.error('خطأ في قراءة ملف النسخة الاحتياطية:', error);
                    hideLoading();
                    showNotification('خطأ', 'الملف غير صالح. يرجى اختيار ملف نسخة احتياطية صحيح', 'error');
                }
            };
            
            reader.onerror = function() {
                hideLoading();
                showNotification('خطأ', 'حدث خطأ أثناء قراءة الملف', 'error');
            };
            
            reader.readAsText(backupFile);
        }
    });
}

/**
 * استعادة البيانات من ملف النسخة الاحتياطية
 * @param {Object} backupData بيانات النسخة الاحتياطية
 * @param {Object} options خيارات الاستعادة
 */
function restoreFromBackupData(backupData, options) {
    // التحقق من صحة البيانات
    if (!backupData || typeof backupData !== 'object') {
        hideLoading();
        showNotification('خطأ', 'بيانات النسخة الاحتياطية غير صالحة', 'error');
        return;
    }
    
    // إنشاء مجموعة من التحديثات
    const updates = {};
    
    // استعادة المنتجات والأقسام
    if (options.products && backupData.branches) {
        Object.keys(backupData.branches).forEach(branchId => {
            if (backupData.branches[branchId].categories) {
                updates[`branches/${branchId}/categories`] = backupData.branches[branchId].categories;
            }
            
            if (backupData.branches[branchId].products) {
                updates[`branches/${branchId}/products`] = backupData.branches[branchId].products;
            }
        });
    }
    
    // استعادة العملاء
    if (options.customers && backupData.customers) {
        updates['customers'] = backupData.customers;
    }
    
    // استعادة المبيعات والفواتير
    if (options.invoices && backupData.branches) {
        Object.keys(backupData.branches).forEach(branchId => {
            if (backupData.branches[branchId].invoices) {
                updates[`branches/${branchId}/invoices`] = backupData.branches[branchId].invoices;
            }
        });
    }
    
    // استعادة الإعدادات
    if (options.settings && backupData.settings) {
        updates['settings'] = backupData.settings;
    }
    
    // استعادة المستخدمين
    if (options.users && backupData.users) {
        updates['users'] = backupData.users;
    }
    
    // تطبيق التحديثات
    dbRef.ref().update(updates)
        .then(() => {
            // إعادة تحميل البيانات
            if (options.settings) {
                loadSystemSettings();
            }
            
            if (options.products) {
                loadCategories();
                loadProducts();
            }
            
            if (options.customers) {
                loadCustomers();
            }
            
            // إخفاء مؤشر التحميل
            hideLoading();
            
            // عرض رسالة نجاح
            showNotification('تم بنجاح', 'تم استعادة النسخة الاحتياطية بنجاح', 'success');
            
            // إعادة تحميل الصفحة بعد فترة
            setTimeout(() => {
                window.location.reload();
            }, 3000);
            
            // تسجيل النشاط
            logUserActivity('restore_backup', 'استعادة نسخة احتياطية', { options });
        })
        .catch(error => {
            console.error('خطأ في استعادة النسخة الاحتياطية:', error);
            hideLoading();
            showNotification('خطأ', 'حدث خطأ أثناء استعادة النسخة الاحتياطية', 'error');
        });
}

/**
 * إعداد مستمعي أحداث الإعدادات
 */
function setupSettingsEventListeners() {
    // إعداد مستمعي أحداث النسخ الاحتياطي
    setupBackupEventListeners();
}