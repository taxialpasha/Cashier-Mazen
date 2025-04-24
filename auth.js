/**
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