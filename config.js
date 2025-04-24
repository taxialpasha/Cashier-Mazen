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