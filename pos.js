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