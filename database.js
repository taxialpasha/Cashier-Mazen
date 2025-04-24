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