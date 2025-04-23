
        // متغيرات عامة
        let cart = [];
        let holdOrders = [];
        let currentCategoryId = null;
        let activeHoldId = null;
        let discountAmount = 0;
        let discountType = 'percentage';
        let discountReason = '';
        let selectedPaymentMethod = null;
        let receiptNumber = 1000;
        let taxRate = 15;
        let currency = 'د.ع';
        let settings = {
            storeName: 'متجر المستقبل',
            storeAddress: 'شارع الرشيد، بغداد',
            storePhone: '07700000000',
            currency: 'IQD',
            receiptHeader: 'متجر المستقبل\nشارع الرشيد، بغداد\nهاتف: 07700000000',
            receiptFooter: 'شكراً لزيارتكم!\nنتمنى لكم يوماً سعيداً',
            showTax: true,
            taxEnabled: true,
            taxRate: 15,
            taxIncluded: false,
            taxNumber: '',
            adminPassword: '123456',
            cashierPassword: '123456',
            lowStockThreshold: 10,
            theme: {
                color: 'blue',
                fontSize: 'medium',
                darkMode: 'light'
            }
        };

        // بيانات المبيعات والمخزون (يتم حفظها في التخزين المحلي)
        let salesData = [];
        let customersData = [];

        // بيانات الأقسام (يتم حفظها في التخزين المحلي)
        let categories = [
            { id: 1, name: 'مشروبات', icon: 'fas fa-coffee', description: 'جميع أنواع المشروبات' },
            { id: 2, name: 'وجبات سريعة', icon: 'fas fa-hamburger', description: 'الوجبات السريعة والمأكولات الخفيفة' },
            { id: 3, name: 'حلويات', icon: 'fas fa-birthday-cake', description: 'الحلويات والمعجنات والكيك' },
            { id: 4, name: 'إلكترونيات', icon: 'fas fa-laptop', description: 'الأجهزة الإلكترونية وملحقاتها' },
            { id: 5, name: 'ملابس', icon: 'fas fa-tshirt', description: 'الملابس والأحذية والإكسسوارات' },
            { id: 6, name: 'أدوات منزلية', icon: 'fas fa-home', description: 'مستلزمات المنزل والأدوات المنزلية' },
            { id: 7, name: 'منتجات العناية', icon: 'fas fa-pump-soap', description: 'منتجات العناية الشخصية ومستحضرات التجميل' },
            { id: 8, name: 'مأكولات بحرية', icon: 'fas fa-fish', description: 'الأسماك والمأكولات البحرية' }
        ];

        // بيانات المنتجات (يتم حفظها في التخزين المحلي)
        let products = [
            { id: 1, name: 'قهوة أمريكية', category_id: 1, price: 3500, barcode: '123456789', inventory: 100, icon: 'fas fa-mug-hot', description: 'قهوة أمريكية ساخنة' },
            { id: 2, name: 'شاي أخضر', category_id: 1, price: 2000, barcode: '223456789', inventory: 80, icon: 'fas fa-mug-hot', description: 'شاي أخضر منعش' },
            { id: 3, name: 'عصير برتقال', category_id: 1, price: 2500, barcode: '323456789', inventory: 75, icon: 'fas fa-glass-whiskey', description: 'عصير برتقال طازج 100%' },
            { id: 4, name: 'مياه معدنية', category_id: 1, price: 500, barcode: '423456789', inventory: 200, icon: 'fas fa-tint', description: 'مياه معدنية نقية' },
            { id: 5, name: 'برجر دجاج', category_id: 2, price: 6000, barcode: '523456789', inventory: 40, icon: 'fas fa-hamburger', description: 'برجر دجاج مع خضار طازجة' },
            { id: 6, name: 'برجر لحم', category_id: 2, price: 7500, barcode: '623456789', inventory: 35, icon: 'fas fa-hamburger', description: 'برجر لحم مشوي مع صلصة خاصة' },
            { id: 7, name: 'بطاطس', category_id: 2, price: 2000, barcode: '723456789', inventory: 100, icon: 'fas fa-utensils', description: 'بطاطس مقلية مقرمشة' },
            { id: 8, name: 'كيك شوكولاتة', category_id: 3, price: 4500, barcode: '823456789', inventory: 30, icon: 'fas fa-birthday-cake', description: 'كيك شوكولاتة غني' },
            { id: 9, name: 'آيس كريم', category_id: 3, price: 2000, barcode: '923456789', inventory: 50, icon: 'fas fa-ice-cream', description: 'آيس كريم متنوع النكهات' },
            { id: 10, name: 'دونات', category_id: 3, price: 1500, barcode: '103456789', inventory: 45, icon: 'fas fa-cookie', description: 'دونات طازجة ومتنوعة' },
            { id: 11, name: 'هاتف ذكي', category_id: 4, price: 350000, barcode: '113456789', inventory: 10, icon: 'fas fa-mobile-alt', description: 'هاتف ذكي حديث' },
            { id: 12, name: 'سماعات', category_id: 4, price: 25000, barcode: '123456780', inventory: 25, icon: 'fas fa-headphones', description: 'سماعات لاسلكية عالية الجودة' },
            { id: 13, name: 'شاحن هاتف', category_id: 4, price: 10000, barcode: '133456789', inventory: 60, icon: 'fas fa-plug', description: 'شاحن سريع متوافق مع جميع الأجهزة' },
            { id: 14, name: 'قميص رجالي', category_id: 5, price: 25000, barcode: '143456789', inventory: 30, icon: 'fas fa-tshirt', description: 'قميص رجالي أنيق' },
            { id: 15, name: 'بنطلون جينز', category_id: 5, price: 35000, barcode: '153456789', inventory: 25, icon: 'fas fa-tshirt', description: 'بنطلون جينز عالي الجودة' },
            { id: 16, name: 'حذاء رياضي', category_id: 5, price: 45000, barcode: '163456789', inventory: 20, icon: 'fas fa-shoe-prints', description: 'حذاء رياضي مريح' },
            { id: 17, name: 'وعاء طبخ', category_id: 6, price: 18000, barcode: '173456789', inventory: 15, icon: 'fas fa-utensil-spoon', description: 'وعاء طبخ ستانلس ستيل' },
            { id: 18, name: 'طقم أكواب', category_id: 6, price: 12000, barcode: '183456789', inventory: 20, icon: 'fas fa-glass-martini', description: 'طقم أكواب زجاجية فاخرة' },
            { id: 19, name: 'مكنسة كهربائية', category_id: 6, price: 85000, barcode: '193456789', inventory: 8, icon: 'fas fa-broom', description: 'مكنسة كهربائية قوية' },
            { id: 20, name: 'شامبو', category_id: 7, price: 5000, barcode: '203456789', inventory: 40, icon: 'fas fa-pump-soap', description: 'شامبو للشعر' },
            { id: 21, name: 'معجون أسنان', category_id: 7, price: 3000, barcode: '213456789', inventory: 50, icon: 'fas fa-tooth', description: 'معجون أسنان بمزايا متعددة' },
            { id: 22, name: 'صابون', category_id: 7, price: 1500, barcode: '223456780', inventory: 60, icon: 'fas fa-soap', description: 'صابون معطر' },
            { id: 23, name: 'سمك سلمون', category_id: 8, price: 18000, barcode: '233456789', inventory: 15, icon: 'fas fa-fish', description: 'سمك سلمون طازج' },
            { id: 24, name: 'روبيان', category_id: 8, price: 25000, barcode: '243456789', inventory: 12, icon: 'fas fa-fish', description: 'روبيان طازج' }
        ];

        // تهيئة الصفحة
        function initializePage() {
            // تحميل البيانات من التخزين المحلي
            loadSettings();

            // عرض الأقسام والمنتجات
            renderCategories();

            // تحديد فئة افتراضية
            if (categories.length > 0) {
                filterProductsByCategory(categories[0].id);
            }

            // عرض الطلبات المعلقة
            renderHoldOrders();

            // إعداد مستمعي الأحداث
            setupEventListeners();

            // إعداد دعم قارئ الباركود
            setupBarcodeScanner();
        }

        // تحميل البيانات من التخزين المحلي
        function loadFromLocalStorage() {
            // تحميل الإعدادات
            const savedSettings = localStorage.getItem('pos_settings');
            if (savedSettings) {
                settings = JSON.parse(savedSettings);
            }

            // تحميل الأقسام
            const savedCategories = localStorage.getItem('pos_categories');
            if (savedCategories) {
                categories = JSON.parse(savedCategories);
            }

            // تحميل المنتجات
            const savedProducts = localStorage.getItem('pos_products');
            if (savedProducts) {
                products = JSON.parse(savedProducts);
            }

            // تحميل بيانات المبيعات
            const savedSales = localStorage.getItem('pos_sales');
            if (savedSales) {
                salesData = JSON.parse(savedSales);
            }

            // تحميل بيانات العملاء
            const savedCustomers = localStorage.getItem('pos_customers');
            if (savedCustomers) {
                customersData = JSON.parse(savedCustomers);
            }

            // تحميل الطلبات المعلقة
            const savedOrders = localStorage.getItem('pos_hold_orders');
            if (savedOrders) {
                holdOrders = JSON.parse(savedOrders);
            }
        }

        // حفظ البيانات في التخزين المحلي
        function saveToLocalStorage() {
            // حفظ الإعدادات
            localStorage.setItem('pos_settings', JSON.stringify(settings));

            // حفظ الأقسام
            localStorage.setItem('pos_categories', JSON.stringify(categories));

            // حفظ المنتجات
            localStorage.setItem('pos_products', JSON.stringify(products));

            // حفظ بيانات المبيعات
            localStorage.setItem('pos_sales', JSON.stringify(salesData));

            // حفظ بيانات العملاء
            localStorage.setItem('pos_customers', JSON.stringify(customersData));

            // حفظ الطلبات المعلقة
            localStorage.setItem('pos_hold_orders', JSON.stringify(holdOrders));
        }

        // تحميل الإعدادات
        function loadSettings() {
            loadFromLocalStorage();
            applySettings();
        }

        // تطبيق الإعدادات
        function applySettings() {
            // تطبيق الإعدادات العامة
            taxRate = settings.taxRate;
            currency = getCurrencySymbol(settings.currency);

            // تطبيق إعدادات المظهر
            if (settings.theme) {
                applyTheme(settings.theme);
            }

            // تحديث الإعدادات في الواجهة
            updateCartSummary();
        }

        // تنسيق العملة
        function formatCurrency(amount) {
            return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " " + currency;
        }

        // الحصول على رمز العملة
        function getCurrencySymbol(currencyCode) {
            const currencies = {
                'IQD': 'د.ع',
                'USD': '$',
                'EUR': '€',
                'SAR': 'ر.س'
            };
            return currencies[currencyCode] || currencyCode;
        }

        // تطبيق السمة
        function applyTheme(theme) {
            const root = document.documentElement;

            // تطبيق لون السمة
            switch (theme.color) {
                case 'green':
                    root.style.setProperty('--primary-color', '#27ae60');
                    root.style.setProperty('--secondary-color', '#2ecc71');
                    break;
                case 'red':
                    root.style.setProperty('--primary-color', '#c0392b');
                    root.style.setProperty('--secondary-color', '#e74c3c');
                    break;
                case 'purple':
                    root.style.setProperty('--primary-color', '#8e44ad');
                    root.style.setProperty('--secondary-color', '#9b59b6');
                    break;
                case 'orange':
                    root.style.setProperty('--primary-color', '#d35400');
                    root.style.setProperty('--secondary-color', '#e67e22');
                    break;
                default: // blue
                    root.style.setProperty('--primary-color', '#3498db');
                    root.style.setProperty('--secondary-color', '#2ecc71');
            }

            // تطبيق حجم الخط
            switch (theme.fontSize) {
                case 'small':
                    root.style.fontSize = '14px';
                    break;
                case 'large':
                    root.style.fontSize = '18px';
                    break;
                default: // medium
                    root.style.fontSize = '16px';
            }

            // تطبيق الوضع الليلي
            if (theme.darkMode === 'dark') {
                document.body.classList.add('dark-mode');
                root.style.setProperty('--dark-color', '#1a1a1a');
                root.style.setProperty('--light-color', '#333333');
                root.style.color = '#f0f0f0';
                document.body.style.backgroundColor = '#2c2c2c';
            } else {
                document.body.classList.remove('dark-mode');
                root.style.setProperty('--dark-color', '#34495e');
                root.style.setProperty('--light-color', '#ecf0f1');
                root.style.color = '#333';
                document.body.style.backgroundColor = '#f5f7fa';
            }
        }

        // عرض الأقسام
        function renderCategories() {
            const categoryList = document.getElementById('category-list');
            categoryList.innerHTML = '';

            categories.forEach(category => {
                const categoryItem = document.createElement('div');
                categoryItem.className = 'category-item';
                if (category.id === currentCategoryId) {
                    categoryItem.classList.add('active');
                }

                categoryItem.innerHTML = `
            <i class="${category.icon}"></i>
            <span>${category.name}</span>
        `;

                categoryItem.addEventListener('click', () => {
                    filterProductsByCategory(category.id);
                });

                categoryList.appendChild(categoryItem);
            });

            // تحديث قائمة الأقسام في نموذج إضافة المنتج
            const productCategorySelect = document.getElementById('product-category');
            if (productCategorySelect) {
                productCategorySelect.innerHTML = '';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    productCategorySelect.appendChild(option);
                });
            }
        }

        // فلترة المنتجات حسب القسم
        function filterProductsByCategory(categoryId) {
            currentCategoryId = categoryId;

            // تحديث الفئة النشطة في القائمة
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
            });

            document.querySelectorAll('.category-item').forEach(item => {
                if (item.querySelector('span').textContent === categories.find(c => c.id === categoryId)?.name) {
                    item.classList.add('active');
                }
            });

            // فلترة المنتجات
            const filteredProducts = products.filter(product => product.category_id === categoryId);
            renderProducts(filteredProducts);
        }

        // عرض المنتجات
        function renderProducts(productsToShow) {
            const productGrid = document.getElementById('product-grid');
            const productList = document.getElementById('product-list');

            // تنظيف العرض الحالي
            productGrid.innerHTML = '';
            productList.innerHTML = '';

            productsToShow.forEach(product => {
                // إضافة منتج إلى عرض الشبكة
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
            <div class="product-image">
                <i class="${product.icon}"></i>
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatCurrency(product.price)}</div>
                <div class="product-inventory">${product.inventory} في المخزون</div>
            </div>
        `;

                productCard.addEventListener('click', () => {
                    addToCart(product);
                });

                productGrid.appendChild(productCard);

                // إضافة منتج إلى عرض القائمة
                const productListItem = document.createElement('div');
                productListItem.className = 'product-list-item';
                productListItem.innerHTML = `
            <div class="product-list-image">
                <i class="${product.icon}"></i>
            </div>
            <div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatCurrency(product.price)}</div>
                <div class="product-inventory">${product.inventory} في المخزون</div>
            </div>
            <div class="product-price">${formatCurrency(product.price)}</div>
        `;

                productListItem.addEventListener('click', () => {
                    addToCart(product);
                });

                productList.appendChild(productListItem);
            });
        }

        // إضافة منتج إلى سلة المشتريات
        function addToCart(product) {
            // التحقق من المخزون
            if (product.inventory <= 0) {
                showNotification('المنتج غير متوفر في المخزون', 'error');
                return;
            }

            // البحث عن المنتج في السلة
            const existingItemIndex = cart.findIndex(item => item.id === product.id);

            if (existingItemIndex !== -1) {
                // المنتج موجود في السلة - زيادة الكمية
                if (cart[existingItemIndex].quantity < product.inventory) {
                    cart[existingItemIndex].quantity += 1;
                    showNotification(`تم زيادة كمية ${product.name}`, 'success');
                } else {
                    showNotification('الكمية المطلوبة غير متوفرة في المخزون', 'error');
                    return;
                }
            } else {
                // المنتج غير موجود في السلة - إضافته
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    icon: product.icon
                });
                showNotification(`تم إضافة ${product.name} إلى السلة`, 'success');
            }

            // تحديث عرض السلة
            renderCart();
            updateCartSummary();
        }

        // عرض سلة المشتريات
        function renderCart() {
            const cartItems = document.getElementById('cart-items');
            cartItems.innerHTML = '';

            if (cart.length === 0) {
                cartItems.innerHTML = '<div class="empty-cart">السلة فارغة</div>';
                return;
            }

            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';

                cartItem.innerHTML = `
            <i class="${item.icon}"></i>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn decrease" data-index="${index}">-</button>
                <input type="number" min="1" class="quantity-input" value="${item.quantity}" data-index="${index}">
                <button class="quantity-btn increase" data-index="${index}">+</button>
            </div>
            <div class="cart-item-total">${formatCurrency(item.price * item.quantity)}</div>
            <div class="cart-item-remove" data-index="${index}">
                <i class="fas fa-times"></i>
            </div>
        `;

                cartItems.appendChild(cartItem);
            });

            // إضافة مستمعي الأحداث للكميات
            document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    decreaseCartItemQuantity(index);
                });
            });

            document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    increaseCartItemQuantity(index);
                });
            });

            document.querySelectorAll('.quantity-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    updateCartItemQuantity(index, parseInt(e.target.value));
                });
            });

            document.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.closest('.cart-item-remove').dataset.index);
                    removeCartItem(index);
                });
            });
        }

        // زيادة كمية منتج في السلة
        function increaseCartItemQuantity(index) {
            if (index >= 0 && index < cart.length) {
                const product = products.find(p => p.id === cart[index].id);

                if (product && cart[index].quantity < product.inventory) {
                    cart[index].quantity += 1;
                    renderCart();
                    updateCartSummary();
                } else {
                    showNotification('الكمية المطلوبة غير متوفرة في المخزون', 'error');
                }
            }
        }

        // تقليل كمية منتج في السلة
        function decreaseCartItemQuantity(index) {
            if (index >= 0 && index < cart.length) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                    renderCart();
                    updateCartSummary();
                } else {
                    removeCartItem(index);
                }
            }
        }

        // تحديث كمية منتج في السلة
        function updateCartItemQuantity(index, quantity) {
            if (index >= 0 && index < cart.length && quantity > 0) {
                const product = products.find(p => p.id === cart[index].id);

                if (product && quantity <= product.inventory) {
                    cart[index].quantity = quantity;
                    renderCart();
                    updateCartSummary();
                } else {
                    showNotification('الكمية المطلوبة غير متوفرة في المخزون', 'error');
                    renderCart(); // إعادة تحديث السلة بالقيم الصحيحة
                }
            }
        }

        // إزالة منتج من السلة
        function removeCartItem(index) {
            if (index >= 0 && index < cart.length) {
                const itemName = cart[index].name;
                cart.splice(index, 1);
                renderCart();
                updateCartSummary();
                showNotification(`تم إزالة ${itemName} من السلة`, 'success');
            }
        }

        // مسح السلة
        function clearCart() {
            if (cart.length === 0) return;

            if (confirm('هل أنت متأكد من رغبتك في حذف جميع العناصر من السلة؟')) {
                cart = [];
                renderCart();
                updateCartSummary();
                showNotification('تم مسح السلة بنجاح', 'success');
            }
        }

        // تحديث ملخص السلة
        function updateCartSummary() {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = settings.taxEnabled ? (subtotal * (taxRate / 100)) : 0;

            let discount = 0;
            if (discountAmount > 0) {
                if (discountType === 'percentage') {
                    discount = subtotal * (discountAmount / 100);
                } else {
                    discount = discountAmount;
                }
            }

            const total = subtotal + tax - discount;

            document.getElementById('subtotal').textContent = formatCurrency(subtotal);
            document.getElementById('tax').textContent = formatCurrency(tax);
            document.getElementById('discount').textContent = formatCurrency(discount);
            document.getElementById('total').textContent = formatCurrency(total);
        }

        // إعداد مستمعي الأحداث
        function setupEventListeners() {
            // أزرار الترويسة
            document.getElementById('btn-keyboard-shortcuts').addEventListener('click', openKeyboardShortcutsModal);
            document.getElementById('btn-inventory').addEventListener('click', openInventoryModal);
            document.getElementById('btn-reports').addEventListener('click', openReportsModal);
            document.getElementById('btn-hold-order').addEventListener('click', openHoldOrderModal);
            document.getElementById('btn-open-drawer').addEventListener('click', openCashDrawer);
            document.getElementById('btn-settings').addEventListener('click', openSettingsModal);

            // أزرار عرض المنتجات
            document.getElementById('grid-view').addEventListener('click', () => switchView('grid'));
            document.getElementById('list-view').addEventListener('click', () => switchView('list'));

            // البحث
            document.getElementById('search-input').addEventListener('input', (e) => {
                if (currentCategoryId === null) return;

                const searchTerm = e.target.value.trim().toLowerCase();
                if (searchTerm === '') {
                    filterProductsByCategory(currentCategoryId);
                    return;
                }

                const filteredProducts = products.filter(product =>
                    product.category_id === currentCategoryId &&
                    (product.name.toLowerCase().includes(searchTerm) ||
                        product.barcode.includes(searchTerm) ||
                        (product.description && product.description.toLowerCase().includes(searchTerm)))
                );

                renderProducts(filteredProducts);
            });

            // الباركود
            document.getElementById('scan-barcode').addEventListener('click', () => {
                const barcodeInput = document.getElementById('barcode-input');
                const barcode = barcodeInput.value.trim();

                if (barcode === '') return;

                const product = products.find(p => p.barcode === barcode);
                if (product) {
                    addToCart(product);
                    barcodeInput.value = '';
                } else {
                    showNotification('لم يتم العثور على منتج بهذا الباركود', 'error');
                }
            });

            document.getElementById('barcode-input').addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('scan-barcode').click();
                }
            });

            // أزرار السلة
            document.getElementById('clear-cart').addEventListener('click', clearCart);
            document.getElementById('btn-discount').addEventListener('click', openDiscountModal);
            document.getElementById('btn-payment').addEventListener('click', openPaymentModal);

            // نافذة الخصم
            document.getElementById('close-discount-modal').addEventListener('click', closeDiscountModal);
            document.getElementById('cancel-discount').addEventListener('click', closeDiscountModal);
            document.getElementById('apply-discount').addEventListener('click', applyDiscount);

            // نافذة الدفع
            document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
            document.getElementById('cancel-payment').addEventListener('click', closePaymentModal);
            document.getElementById('complete-payment').addEventListener('click', completePayment);
            document.getElementById('cash-amount').addEventListener('input', calculateChange);

            // طرق الدفع
            document.querySelectorAll('.payment-method').forEach(method => {
                method.addEventListener('click', () => {
                    selectPaymentMethod(method.dataset.method);
                });
            });

            // نافذة الفاتورة
            document.getElementById('close-receipt-modal').addEventListener('click', closeReceiptModal);
            document.getElementById('print-receipt').addEventListener('click', printReceipt);
            document.getElementById('email-receipt').addEventListener('click', emailReceipt);
            document.getElementById('sms-receipt').addEventListener('click', smsReceipt);

            // نافذة الإعدادات
            document.getElementById('close-settings-modal').addEventListener('click', closeSettingsModal);
            document.getElementById('cancel-settings').addEventListener('click', closeSettingsModal);
            document.getElementById('save-settings').addEventListener('click', saveSettings);

            document.querySelectorAll('.settings-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    switchSettingsTab(tab.dataset.tab);
                });
            });

            // نافذة اختصارات لوحة المفاتيح
            document.getElementById('close-shortcuts-modal').addEventListener('click', closeKeyboardShortcutsModal);

            // نافذة تعليق الطلب
            document.getElementById('close-hold-modal').addEventListener('click', closeHoldOrderModal);
            document.getElementById('cancel-hold').addEventListener('click', closeHoldOrderModal);
            document.getElementById('save-hold').addEventListener('click', saveHoldOrder);

            // نافذة إضافة منتج
            document.getElementById('btn-add-product').addEventListener('click', () => openAddProductModal());
            document.getElementById('close-add-product-modal').addEventListener('click', closeAddProductModal);
            document.getElementById('cancel-add-product').addEventListener('click', closeAddProductModal);
            document.getElementById('save-product').addEventListener('click', saveProduct);

            // نافذة إضافة قسم
            document.getElementById('btn-add-category').addEventListener('click', () => openAddCategoryModal());
            document.getElementById('close-add-category-modal').addEventListener('click', closeAddCategoryModal);
            document.getElementById('cancel-add-category').addEventListener('click', closeAddCategoryModal);
            document.getElementById('save-category').addEventListener('click', saveCategory);

            // نافذة إدارة الأقسام
            document.getElementById('btn-manage-categories').addEventListener('click', openManageCategoriesModal);
            document.getElementById('close-manage-categories-modal').addEventListener('click', closeManageCategoriesModal);
            document.getElementById('close-manage-categories').addEventListener('click', closeManageCategoriesModal);
            document.getElementById('add-new-category').addEventListener('click', () => {
                closeManageCategoriesModal();
                openAddCategoryModal();
            });

            // نافذة المخزون
            document.getElementById('close-inventory-modal').addEventListener('click', closeInventoryModal);
            document.getElementById('close-inventory').addEventListener('click', closeInventoryModal);
            document.getElementById('add-inventory-product').addEventListener('click', () => {
                closeInventoryModal();
                openAddProductModal();
            });
            document.getElementById('export-inventory').addEventListener('click', exportInventoryToExcel);
            document.getElementById('inventory-search').addEventListener('input', filterInventory);

            // نافذة التقارير
            document.getElementById('close-reports-modal').addEventListener('click', closeReportsModal);
            document.getElementById('close-reports').addEventListener('click', closeReportsModal);
            document.getElementById('generate-report').addEventListener('click', generateReport);
            document.getElementById('print-report').addEventListener('click', printCurrentReport);
            document.getElementById('export-report').addEventListener('click', exportCurrentReport);

            document.querySelectorAll('.settings-tab[data-report]').forEach(tab => {
                tab.addEventListener('click', () => {
                    switchReportTab(tab.dataset.report);
                });
            });

            // النسخ الاحتياطي
            document.getElementById('create-backup').addEventListener('click', createBackup);
            document.getElementById('btn-restore-backup').addEventListener('click', restoreBackup);

            // اختصارات لوحة المفاتيح
            document.addEventListener('keydown', (e) => {
                // تجاهل إذا كان التركيز على حقل إدخال
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                switch (e.key) {
                    case 'F2':
                        e.preventDefault();
                        openPaymentModal();
                        break;
                    case 'F3':
                        e.preventDefault();
                        openDiscountModal();
                        break;
                    case 'F4':
                        e.preventDefault();
                        clearCart();
                        break;
                    case 'F5':
                        e.preventDefault();
                        openHoldOrderModal();
                        break;
                    case 'F6':
                        e.preventDefault();
                        openSettingsModal();
                        break;
                    case 'F7':
                        e.preventDefault();
                        openInventoryModal();
                        break;
                    case 'F8':
                        e.preventDefault();
                        openAddProductModal();
                        break;
                }

                // Ctrl + F للبحث
                if (e.ctrlKey && e.key === 'f') {
                    e.preventDefault();
                    document.getElementById('search-input').focus();
                }

                // Ctrl + B للتركيز على الباركود
                if (e.ctrlKey && e.key === 'b') {
                    e.preventDefault();
                    document.getElementById('barcode-input').focus();
                }
            });
        }

        // تبديل طريقة العرض (شبكة/قائمة)
        function switchView(view) {
            const gridView = document.getElementById('grid-view');
            const listView = document.getElementById('list-view');
            const productGrid = document.getElementById('product-grid');
            const productList = document.getElementById('product-list');

            if (view === 'grid') {
                gridView.classList.add('active');
                listView.classList.remove('active');
                productGrid.style.display = 'grid';
                productList.style.display = 'none';
            } else {
                gridView.classList.remove('active');
                listView.classList.add('active');
                productGrid.style.display = 'none';
                productList.style.display = 'block';
            }
        }

        // فتح نافذة الخصم
        function openDiscountModal() {
            if (cart.length === 0) return;

            document.getElementById('discount-type').value = discountType;
            document.getElementById('discount-value').value = discountAmount;
            document.getElementById('discount-reason').value = discountReason;

            document.getElementById('discount-modal').style.display = 'flex';
        }

        // إغلاق نافذة الخصم
        function closeDiscountModal() {
            document.getElementById('discount-modal').style.display = 'none';
        }

        // تطبيق الخصم
        function applyDiscount() {
            discountType = document.getElementById('discount-type').value;
            discountAmount = parseFloat(document.getElementById('discount-value').value) || 0;
            discountReason = document.getElementById('discount-reason').value;

            // التحقق من صحة الخصم
            if (discountType === 'percentage' && discountAmount > 100) {
                showNotification('لا يمكن أن يتجاوز الخصم النسبي 100%', 'error');
                return;
            }

            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (discountType === 'fixed' && discountAmount > subtotal) {
                showNotification('لا يمكن أن يتجاوز الخصم الثابت المجموع الفرعي', 'error');
                return;
            }

            updateCartSummary();
            closeDiscountModal();

            if (discountAmount > 0) {
                showNotification(`تم تطبيق خصم بقيمة ${discountType === 'percentage' ? discountAmount + '%' : formatCurrency(discountAmount)}`, 'success');
            } else {
                showNotification('تم إلغاء الخصم', 'success');
            }
        }

        // فتح نافذة الدفع
        function openPaymentModal() {
            if (cart.length === 0) return;

            // إعادة تعيين النافذة
            document.querySelectorAll('.payment-method').forEach(method => {
                method.classList.remove('selected');
            });

            document.getElementById('cash-payment-details').style.display = 'none';
            document.getElementById('card-payment-details').style.display = 'none';
            document.getElementById('cash-amount').value = '';
            document.getElementById('change-amount').value = '';
            document.getElementById('customer-name').value = '';
            document.getElementById('customer-phone').value = '';

            selectedPaymentMethod = null;
            document.getElementById('payment-modal').style.display = 'flex';
        }

        // إغلاق نافذة الدفع
        function closePaymentModal() {
            document.getElementById('payment-modal').style.display = 'none';
        }

        // اختيار طريقة الدفع
        function selectPaymentMethod(method) {
            selectedPaymentMethod = method;

            // إزالة التحديد من جميع الطرق
            document.querySelectorAll('.payment-method').forEach(element => {
                element.classList.remove('selected');
            });

            // تحديد الطريقة المختارة
            document.querySelector(`.payment-method[data-method="${method}"]`).classList.add('selected');

            // إظهار تفاصيل الدفع المناسبة
            if (method === 'cash') {
                document.getElementById('cash-payment-details').style.display = 'block';
                document.getElementById('card-payment-details').style.display = 'none';
                document.getElementById('cash-amount').focus();

                // ملء المبلغ تلقائيًا بالإجمالي
                const totalText = document.getElementById('total').textContent;
                const total = parseFloat(totalText.replace(/[^\d.-]/g, ''));
                document.getElementById('cash-amount').value = total.toFixed(0);
                calculateChange();
            } else {
                document.getElementById('cash-payment-details').style.display = 'none';
                document.getElementById('card-payment-details').style.display = 'block';
            }
        }

        // حساب المبلغ المتبقي
        function calculateChange() {
            const totalElement = document.getElementById('total').textContent;
            const total = parseFloat(totalElement.replace(/[^\d.-]/g, ''));
            const cashAmount = parseFloat(document.getElementById('cash-amount').value) || 0;
            const change = cashAmount - total;

            document.getElementById('change-amount').value = change >= 0 ? formatCurrency(change) : 'المبلغ غير كافٍ';
        }

        // إتمام عملية الدفع
        function completePayment() {
            if (!selectedPaymentMethod) {
                showNotification('يرجى اختيار طريقة دفع', 'error');
                return;
            }

            if (selectedPaymentMethod === 'cash') {
                const cashAmount = parseFloat(document.getElementById('cash-amount').value) || 0;
                const totalText = document.getElementById('total').textContent;
                const total = parseFloat(totalText.replace(/[^\d.-]/g, ''));

                if (cashAmount < total) {
                    showNotification('المبلغ المدفوع أقل من الإجمالي', 'error');
                    return;
                }
            }

            // معلومات العميل
            const customerName = document.getElementById('customer-name').value;
            const customerPhone = document.getElementById('customer-phone').value;

            // تحديث المخزون
            updateInventory();

            // تسجيل المبيعات والعملاء
            recordSale(customerName, customerPhone);

            // إنشاء الفاتورة
            createReceipt(customerName, customerPhone);

            // إغلاق نافذة الدفع
            closePaymentModal();

            // فتح نافذة الفاتورة
            openReceiptModal();

            // إعادة تعيين السلة والخصم
            cart = [];
            discountAmount = 0;
            discountType = 'percentage';
            discountReason = '';

            // تحديث واجهة المستخدم
            renderCart();
            updateCartSummary();

            showNotification('تم إتمام عملية الدفع بنجاح', 'success');
        }

        // تحديث المخزون بعد عملية البيع
        function updateInventory() {
            cart.forEach(item => {
                const productIndex = products.findIndex(p => p.id === item.id);
                if (productIndex !== -1) {
                    products[productIndex].inventory -= item.quantity;
                }
            });

            // حفظ التغييرات في التخزين المحلي
            saveToLocalStorage();
        }

        // تسجيل المبيعات والعملاء
        function recordSale(customerName, customerPhone) {
            // حساب المجاميع
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = settings.taxEnabled ? (subtotal * (taxRate / 100)) : 0;
            let discount = 0;
            if (discountType === 'percentage') {
                discount = subtotal * (discountAmount / 100);
            } else {
                discount = discountAmount;
            }
            const total = subtotal + tax - discount;

            // إنشاء سجل المبيعات
            const sale = {
                id: Date.now(),
                date: new Date().toISOString(),
                items: [...cart],
                subtotal: subtotal,
                tax: tax,
                discount: discount,
                total: total,
                paymentMethod: selectedPaymentMethod,
                receiptNumber: receiptNumber,
                customer: {
                    name: customerName || 'زبون عام',
                    phone: customerPhone || ''
                }
            };

            // إضافة المبيعات إلى البيانات
            salesData.push(sale);

            // تسجيل العميل إذا كان جديدًا
            if (customerName && customerPhone) {
                const existingCustomerIndex = customersData.findIndex(c => c.phone === customerPhone);
                if (existingCustomerIndex !== -1) {
                    // تحديث بيانات العميل الموجود
                    customersData[existingCustomerIndex].visits.push({
                        date: new Date().toISOString(),
                        amount: total,
                        saleId: sale.id
                    });
                    customersData[existingCustomerIndex].totalSpent += total;
                } else {
                    // إضافة عميل جديد
                    customersData.push({
                        id: Date.now(),
                        name: customerName,
                        phone: customerPhone,
                        dateAdded: new Date().toISOString(),
                        visits: [{
                            date: new Date().toISOString(),
                            amount: total,
                            saleId: sale.id
                        }],
                        totalSpent: total
                    });
                }
            }

            // حفظ البيانات في التخزين المحلي
            saveToLocalStorage();
        }

        // إنشاء الفاتورة
        function createReceipt(customerName, customerPhone) {
            // زيادة رقم الفاتورة
            receiptNumber++;

            // تاريخ ووقت الفاتورة
            const now = new Date();
            const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
            const formattedTime = now.toLocaleTimeString();

            // إعداد معلومات الفاتورة
            document.getElementById('receipt-date').textContent = `التاريخ: ${formattedDate} ${formattedTime}`;
            document.getElementById('receipt-number').textContent = `رقم الفاتورة: #${receiptNumber}`;

            // معلومات العميل
            const customerInfoElement = document.getElementById('receipt-customer-info');
            if (customerName || customerPhone) {
                customerInfoElement.innerHTML = `
            <p>العميل: ${customerName || '-'}</p>
            <p>الهاتف: ${customerPhone || '-'}</p>
        `;
                customerInfoElement.style.display = 'block';
            } else {
                customerInfoElement.style.display = 'none';
            }

            // عناصر الفاتورة
            const receiptItemsElement = document.getElementById('receipt-items');
            receiptItemsElement.innerHTML = '';

            cart.forEach(item => {
                const receiptItem = document.createElement('div');
                receiptItem.className = 'receipt-item';
                receiptItem.innerHTML = `
            <span>${item.name} × ${item.quantity}</span>
            <span>${formatCurrency(item.price * item.quantity)}</span>
        `;
                receiptItemsElement.appendChild(receiptItem);
            });

            // المجاميع
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = settings.taxEnabled ? (subtotal * (taxRate / 100)) : 0;
            let discount = 0;
            if (discountType === 'percentage') {
                discount = subtotal * (discountAmount / 100);
            } else {
                discount = discountAmount;
            }
            const total = subtotal + tax - discount;

            document.getElementById('receipt-subtotal').textContent = formatCurrency(subtotal);
            document.getElementById('receipt-tax').textContent = formatCurrency(tax);
            document.getElementById('receipt-discount').textContent = formatCurrency(discount);
            document.getElementById('receipt-total').textContent = formatCurrency(total);

            // عرض صف الخصم فقط إذا كان هناك خصم
            document.getElementById('receipt-discount-row').style.display = discount > 0 ? 'flex' : 'none';

            // طريقة الدفع
            let paymentMethodText = '';
            switch (selectedPaymentMethod) {
                case 'cash':
                    paymentMethodText = 'نقداً';
                    break;
                case 'card':
                    paymentMethodText = 'بطاقة ائتمان';
                    break;
                case 'mada':
                    paymentMethodText = 'كي كارد';
                    break;
                default:
                    paymentMethodText = selectedPaymentMethod;
            }
            document.getElementById('receipt-payment-method').textContent = paymentMethodText;
        }

        // فتح نافذة الفاتورة
        function openReceiptModal() {
            document.getElementById('receipt-modal').style.display = 'flex';
        }

        // إغلاق نافذة الفاتورة
        function closeReceiptModal() {
            document.getElementById('receipt-modal').style.display = 'none';
        }

        // طباعة الفاتورة
        function printReceipt() {
            window.print();
        }

        // إرسال الفاتورة بالبريد الإلكتروني
        function emailReceipt() {
            const email = prompt('أدخل البريد الإلكتروني لإرسال الفاتورة:');
            if (email) {
                showNotification(`تم إرسال الفاتورة إلى ${email}`, 'success');
            }
        }

        // إرسال الفاتورة برسالة نصية
        function smsReceipt() {
            const phone = prompt('أدخل رقم الهاتف لإرسال الفاتورة:');
            if (phone) {
                showNotification(`تم إرسال الفاتورة إلى ${phone}`, 'success');
            }
        }

        // فتح نافذة إضافة منتج جديد
        function openAddProductModal(productToEdit = null) {
            // تحديث عنوان النافذة حسب العملية (إضافة/تعديل)
            document.getElementById('product-modal-title').textContent = productToEdit ? 'تعديل منتج' : 'إضافة منتج جديد';

            // ملء النموذج بمعلومات المنتج إذا كان تعديل
            if (productToEdit) {
                document.getElementById('product-id').value = productToEdit.id;
                document.getElementById('product-name').value = productToEdit.name;
                document.getElementById('product-category').value = productToEdit.category_id;
                document.getElementById('product-price').value = productToEdit.price;
                document.getElementById('product-barcode').value = productToEdit.barcode;
                document.getElementById('product-inventory').value = productToEdit.inventory;
                document.getElementById('product-icon').value = productToEdit.icon;
                document.getElementById('product-description').value = productToEdit.description || '';
                document.getElementById('low-stock-notification').checked = productToEdit.lowStockNotification || false;
            } else {
                // إعادة تعيين النموذج للإضافة
                document.getElementById('product-id').value = '';
                document.getElementById('product-name').value = '';
                document.getElementById('product-category').value = categories.length > 0 ? categories[0].id : '';
                document.getElementById('product-price').value = '';
                document.getElementById('product-barcode').value = '';
                document.getElementById('product-inventory').value = '';
                document.getElementById('product-icon').value = 'fas fa-box';
                document.getElementById('product-description').value = '';
                document.getElementById('low-stock-notification').checked = true;
            }

            // تحديث قائمة الأقسام
            const categorySelect = document.getElementById('product-category');
            categorySelect.innerHTML = '';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });

            // عرض النافذة
            document.getElementById('add-product-modal').style.display = 'flex';
        }

        // إغلاق نافذة إضافة منتج
        function closeAddProductModal() {
            document.getElementById('add-product-modal').style.display = 'none';
        }

        // حفظ منتج جديد أو تعديل منتج موجود
        function saveProduct() {
            // التحقق من إدخال المعلومات الأساسية
            const productName = document.getElementById('product-name').value.trim();
            const productPrice = parseFloat(document.getElementById('product-price').value);
            const productCategory = parseInt(document.getElementById('product-category').value);
            const productBarcode = document.getElementById('product-barcode').value.trim();

            if (!productName) {
                showNotification('يرجى إدخال اسم المنتج', 'error');
                return;
            }

            if (isNaN(productPrice) || productPrice <= 0) {
                showNotification('يرجى إدخال سعر صحيح للمنتج', 'error');
                return;
            }

            if (!productBarcode) {
                showNotification('يرجى إدخال الباركود', 'error');
                return;
            }

            // التحقق من عدم تكرار الباركود (باستثناء المنتج الحالي في حالة التعديل)
            const productId = document.getElementById('product-id').value;
            const duplicateBarcode = products.find(p => p.barcode === productBarcode && (!productId || p.id !== parseInt(productId)));

            if (duplicateBarcode) {
                showNotification('الباركود مستخدم بالفعل من قبل منتج آخر', 'error');
                return;
            }

            // جمع بيانات المنتج
            const productData = {
                name: productName,
                category_id: productCategory,
                price: productPrice,
                barcode: productBarcode,
                inventory: parseInt(document.getElementById('product-inventory').value) || 0,
                icon: document.getElementById('product-icon').value,
                description: document.getElementById('product-description').value.trim(),
                lowStockNotification: document.getElementById('low-stock-notification').checked
            };

            // حفظ المنتج (إضافة أو تعديل)
            if (productId) {
                // تعديل منتج موجود
                const productIndex = products.findIndex(p => p.id === parseInt(productId));
                if (productIndex !== -1) {
                    productData.id = parseInt(productId);
                    products[productIndex] = productData;
                    showNotification(`تم تعديل المنتج ${productName} بنجاح`, 'success');
                }
            } else {
                // إضافة منتج جديد
                productData.id = Date.now();
                products.push(productData);
                showNotification(`تم إضافة المنتج ${productName} بنجاح`, 'success');
            }

            // حفظ التغييرات في التخزين المحلي
            saveToLocalStorage();

            // تحديث عرض المنتجات
            if (currentCategoryId === productData.category_id) {
                filterProductsByCategory(currentCategoryId);
            }

            // إغلاق النافذة
            closeAddProductModal();
        }

        // فتح نافذة إضافة قسم جديد
        function openAddCategoryModal(categoryToEdit = null) {
            // تحديث عنوان النافذة حسب العملية (إضافة/تعديل)
            document.getElementById('category-modal-title').textContent = categoryToEdit ? 'تعديل قسم' : 'إضافة قسم جديد';

            // ملء النموذج بمعلومات القسم إذا كان تعديل
            if (categoryToEdit) {
                document.getElementById('category-id').value = categoryToEdit.id;
                document.getElementById('category-name').value = categoryToEdit.name;
                document.getElementById('category-icon').value = categoryToEdit.icon;
                document.getElementById('category-description').value = categoryToEdit.description || '';
            } else {
                // إعادة تعيين النموذج للإضافة
                document.getElementById('category-id').value = '';
                document.getElementById('category-name').value = '';
                document.getElementById('category-icon').value = 'fas fa-tag';
                document.getElementById('category-description').value = '';
            }

            // عرض النافذة
            document.getElementById('add-category-modal').style.display = 'flex';
        }

        // إغلاق نافذة إضافة قسم
        function closeAddCategoryModal() {
            document.getElementById('add-category-modal').style.display = 'none';
        }

        // حفظ قسم جديد أو تعديل قسم موجود
        function saveCategory() {
            // التحقق من إدخال المعلومات الأساسية
            const categoryName = document.getElementById('category-name').value.trim();

            if (!categoryName) {
                showNotification('يرجى إدخال اسم القسم', 'error');
                return;
            }

            // جمع بيانات القسم
            const categoryData = {
                name: categoryName,
                icon: document.getElementById('category-icon').value,
                description: document.getElementById('category-description').value.trim()
            };

            // حفظ القسم (إضافة أو تعديل)
            const categoryId = document.getElementById('category-id').value;
            if (categoryId) {
                // تعديل قسم موجود
                const categoryIndex = categories.findIndex(c => c.id === parseInt(categoryId));
                if (categoryIndex !== -1) {
                    categoryData.id = parseInt(categoryId);
                    categories[categoryIndex] = categoryData;
                    showNotification(`تم تعديل القسم ${categoryName} بنجاح`, 'success');
                }
            } else {
                // إضافة قسم جديد
                categoryData.id = Date.now();
                categories.push(categoryData);
                showNotification(`تم إضافة القسم ${categoryName} بنجاح`, 'success');
            }

            // حفظ التغييرات في التخزين المحلي
            saveToLocalStorage();

            // تحديث عرض الأقسام
            renderCategories();

            // إغلاق النوافذ
            closeAddCategoryModal();
            closeManageCategoriesModal();
        }

        // فتح نافذة إدارة الأقسام
        function openManageCategoriesModal() {
            // تحديث قائمة الأقسام
            renderCategoriesManagement();

            // عرض النافذة
            document.getElementById('manage-categories-modal').style.display = 'flex';
        }

        // إغلاق نافذة إدارة الأقسام
        function closeManageCategoriesModal() {
            document.getElementById('manage-categories-modal').style.display = 'none';
        }

        // عرض قائمة الأقسام في نافذة الإدارة
        function renderCategoriesManagement() {
            const categoriesList = document.getElementById('categories-management-list');
            categoriesList.innerHTML = '';

            categories.forEach(category => {
                const categoryItem = document.createElement('div');
                categoryItem.className = 'categories-list-item';
                categoryItem.innerHTML = `
            <div>
                <i class="${category.icon}"></i>
                <span>${category.name}</span>
            </div>
            <div class="inventory-actions">
                <button class="edit" title="تعديل" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                <button class="delete" title="حذف" data-id="${category.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;

                categoriesList.appendChild(categoryItem);
            });

            // إضافة مستمعي الأحداث
            document.querySelectorAll('#categories-management-list .edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const categoryId = parseInt(btn.dataset.id);
                    const category = categories.find(c => c.id === categoryId);
                    if (category) {
                        openAddCategoryModal(category);
                    }
                });
            });

            document.querySelectorAll('#categories-management-list .delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    const categoryId = parseInt(btn.dataset.id);
                    deleteCategory(categoryId);
                });
            });
        }

        // حذف قسم
        function deleteCategory(categoryId) {
            // التحقق من وجود منتجات في هذا القسم
            const productsInCategory = products.filter(p => p.category_id === categoryId);

            if (productsInCategory.length > 0) {
                if (!confirm(`يوجد ${productsInCategory.length} منتج في هذا القسم. هل تريد حذف القسم وجميع منتجاته؟`)) {
                    return;
                }

                // حذف المنتجات المرتبطة بالقسم
                products = products.filter(p => p.category_id !== categoryId);
            } else {
                if (!confirm('هل أنت متأكد من رغبتك في حذف هذا القسم؟')) {
                    return;
                }
            }

            // الحصول على اسم القسم قبل الحذف
            const category = categories.find(c => c.id === categoryId);
            const categoryName = category ? category.name : '';

            // حذف القسم
            categories = categories.filter(c => c.id !== categoryId);

            // حفظ التغييرات في التخزين المحلي
            saveToLocalStorage();

            // تحديث واجهة المستخدم
            renderCategories();
            renderCategoriesManagement();

            // إعادة تعيين القسم الحالي إذا تم حذفه
            if (currentCategoryId === categoryId) {
                currentCategoryId = categories.length > 0 ? categories[0].id : null;
                if (currentCategoryId) {
                    filterProductsByCategory(currentCategoryId);
                } else {
                    renderProducts([]);
                }
            }

            showNotification(`تم حذف القسم ${categoryName} بنجاح`, 'success');
        }

        // فتح نافذة المخزون
        function openInventoryModal() {
            // تحديث قائمة المخزون
            renderInventory();

            // عرض النافذة
            document.getElementById('inventory-modal').style.display = 'flex';
        }

        // إغلاق نافذة المخزون
        function closeInventoryModal() {
            document.getElementById('inventory-modal').style.display = 'none';
        }

        // عرض المخزون
        function renderInventory(filteredProducts = products) {
            const inventoryItems = document.getElementById('inventory-items');
            inventoryItems.innerHTML = '';

            filteredProducts.forEach(product => {
                // الحصول على اسم القسم
                const category = categories.find(c => c.id === product.category_id);
                const categoryName = category ? category.name : 'غير محدد';

                // تحديد حالة المخزون
                let stockStatus = '';
                let stockClass = '';
                if (product.inventory <= 0) {
                    stockStatus = 'نفذ من المخزون';
                    stockClass = 'out-of-stock';
                } else if (product.inventory <= settings.lowStockThreshold) {
                    stockStatus = 'منخفض';
                    stockClass = 'low-stock';
                } else {
                    stockStatus = 'متوفر';
                    stockClass = 'in-stock';
                }

                // إنشاء صف للمنتج
                const row = document.createElement('tr');
                row.innerHTML = `
            <td>${product.barcode}</td>
            <td>${product.name}</td>
            <td>${categoryName}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.inventory}</td>
            <td><span class="stock-status ${stockClass}">${stockStatus}</span></td>
            <td class="inventory-actions">
                <button class="edit" title="تعديل"><i class="fas fa-edit"></i></button>
                <button class="delete" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        `;

                // إضافة مستمعي الأحداث للأزرار
                row.querySelector('.edit').addEventListener('click', () => {
                    openAddProductModal(product);
                });

                row.querySelector('.delete').addEventListener('click', () => {
                    deleteProduct(product.id);
                });

                inventoryItems.appendChild(row);
            });
        }

        // فلترة المخزون حسب البحث
        function filterInventory() {
            const searchTerm = document.getElementById('inventory-search').value.toLowerCase();

            if (searchTerm.trim() === '') {
                renderInventory();
                return;
            }

            const filteredProducts = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.barcode.includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );

            renderInventory(filteredProducts);
        }

        // حذف منتج
        function deleteProduct(productId) {
            if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج؟')) {
                return;
            }

            // الحصول على اسم المنتج قبل الحذف
            const product = products.find(p => p.id === productId);
            const productName = product ? product.name : '';

            // حذف المنتج
            products = products.filter(p => p.id !== productId);

            // حفظ التغييرات في التخزين المحلي
            saveToLocalStorage();

            // تحديث واجهة المستخدم
            renderInventory();
            if (currentCategoryId) {
                filterProductsByCategory(currentCategoryId);
            } else {
                renderProducts();
            }

            showNotification(`تم حذف المنتج ${productName} بنجاح`, 'success');
        }

        // تصدير المخزون إلى ملف Excel
        function exportInventoryToExcel() {
            // إنشاء بيانات CSV
            let csvContent = "الباركود,اسم المنتج,القسم,السعر,الكمية,حالة المخزون\n";

            products.forEach(product => {
                // الحصول على اسم القسم
                const category = categories.find(c => c.id === product.category_id);
                const categoryName = category ? category.name : 'غير محدد';

                // تحديد حالة المخزون
                let stockStatus = '';
                if (product.inventory <= 0) {
                    stockStatus = 'نفذ من المخزون';
                } else if (product.inventory <= settings.lowStockThreshold) {
                    stockStatus = 'منخفض';
                } else {
                    stockStatus = 'متوفر';
                }

                // إضافة سطر للملف
                csvContent += `"${product.barcode}","${product.name}","${categoryName}","${product.price}","${product.inventory}","${stockStatus}"\n`;
            });

            // إنشاء رابط التنزيل
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `تقرير-المخزون-${new Date().toLocaleDateString()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification('تم تصدير تقرير المخزون بنجاح', 'success');
        }

        // فتح نافذة التقارير
        function openReportsModal() {
            // تعيين تواريخ افتراضية للتقرير
            const today = new Date();
            const fromDate = new Date();
            fromDate.setDate(today.getDate() - 30);

            document.getElementById('report-from-date').valueAsDate = fromDate;
            document.getElementById('report-to-date').valueAsDate = today;

            // توليد التقرير الافتراضي
            generateReport();

            // عرض النافذة
            document.getElementById('reports-modal').style.display = 'flex';
        }

        // إغلاق نافذة التقارير
        function closeReportsModal() {
            document.getElementById('reports-modal').style.display = 'none';
        }

        // تحويل علامة تبويب التقارير
        function switchReportTab(tab) {
            // إزالة الفئة النشطة من جميع علامات التبويب
            document.querySelectorAll('.settings-tab[data-report]').forEach(t => {
                t.classList.remove('active');
            });

            // إضافة الفئة النشطة إلى علامة التبويب المحددة
            document.querySelector(`.settings-tab[data-report="${tab}"]`).classList.add('active');

            // إخفاء جميع لوحات التقارير
            document.querySelectorAll('.report-panel').forEach(panel => {
                panel.classList.remove('active');
            });

            // إظهار لوحة التقرير المحددة
            document.getElementById(`report-${tab}`).classList.add('active');

            // إعادة توليد التقرير مع تغيير التبويب
            generateReport();
        }

        // توليد التقرير
        function generateReport() {
            // الحصول على نطاق التاريخ
            const fromDateStr = document.getElementById('report-from-date').value;
            const toDateStr = document.getElementById('report-to-date').value;

            const fromDate = fromDateStr ? new Date(fromDateStr) : new Date(0);
            const toDate = toDateStr ? new Date(toDateStr) : new Date();

            // تعديل تاريخ النهاية ليشمل اليوم بأكمله
            toDate.setHours(23, 59, 59, 999);

            // فلترة بيانات المبيعات حسب النطاق الزمني
            const filteredSales = salesData.filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= fromDate && saleDate <= toDate;
            });

            // الحصول على التبويب النشط
            const activeTab = document.querySelector('.settings-tab[data-report].active').dataset.report;

            // توليد التقرير المناسب
            switch (activeTab) {
                case 'sales':
                    generateSalesReport(filteredSales);
                    break;
                case 'inventory':
                    generateInventoryReport();
                    break;
                case 'customers':
                    generateCustomersReport(filteredSales);
                    break;
                case 'profit':
                    generateProfitReport(filteredSales);
                    break;
            }
        }
        // توليد تقرير المبيعات
        function generateSalesReport(filteredSales) {
            // حساب المجاميع
            const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
            const transactionsCount = filteredSales.length;
            const averageSale = transactionsCount > 0 ? totalSales / transactionsCount : 0;

            // تحديث البطاقات
            document.getElementById('total-sales').textContent = formatCurrency(totalSales);
            document.getElementById('transactions-count').textContent = transactionsCount;
            document.getElementById('average-sale').textContent = formatCurrency(averageSale);

            // توليد بيانات المبيعات اليومية
            const dailySales = {};

            filteredSales.forEach(sale => {
                const date = new Date(sale.date).toLocaleDateString();
                if (dailySales[date]) {
                    dailySales[date] += sale.total;
                } else {
                    dailySales[date] = sale.total;
                }
            });

            // إنشاء المخطط البياني للمبيعات اليومية
            const dailySalesChart = document.getElementById('daily-sales-chart');
            dailySalesChart.innerHTML = '';

            // تحديد أقصى قيمة للمبيعات اليومية
            const maxSale = Math.max(...Object.values(dailySales), 1);

            // إنشاء الأعمدة في المخطط
            Object.entries(dailySales).forEach(([date, amount]) => {
                const height = (amount / maxSale) * 180; // الارتفاع النسبي للعمود

                const chartBar = document.createElement('div');
                chartBar.className = 'chart-bar';
                chartBar.style.height = `${height}px`;

                // إضافة قيمة وتسمية للعمود
                chartBar.innerHTML = `
            <div class="chart-value">${formatCurrency(amount)}</div>
            <div class="chart-label">${date}</div>
        `;

                dailySalesChart.appendChild(chartBar);
            });

            // توليد قائمة أفضل المنتجات مبيعًا
            const productSales = {};

            filteredSales.forEach(sale => {
                sale.items.forEach(item => {
                    if (productSales[item.id]) {
                        productSales[item.id].quantity += item.quantity;
                        productSales[item.id].total += item.price * item.quantity;
                    } else {
                        productSales[item.id] = {
                            id: item.id,
                            name: item.name,
                            quantity: item.quantity,
                            total: item.price * item.quantity
                        };
                    }
                });
            });

            // ترتيب المنتجات حسب الكمية المباعة
            const topProducts = Object.values(productSales)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            // عرض قائمة أفضل المنتجات
            const topProductsList = document.getElementById('top-products');
            topProductsList.innerHTML = '';

            if (topProducts.length === 0) {
                topProductsList.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا توجد بيانات للعرض</td></tr>';
            } else {
                topProducts.forEach(product => {
                    const productObj = products.find(p => p.id === product.id);
                    const category = categories.find(c => c.id === productObj?.category_id);
                    const categoryName = category ? category.name : 'غير محدد';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                <td>${product.name}</td>
                <td>${categoryName}</td>
                <td>${product.quantity}</td>
                <td>${formatCurrency(product.total)}</td>
            `;

                    topProductsList.appendChild(row);
                });
            }
        }

        // توليد تقرير المخزون
        function generateInventoryReport() {
            // حساب إحصائيات المخزون
            const totalProducts = products.length;
            const inventoryValue = products.reduce((sum, product) => sum + (product.price * product.inventory), 0);
            const outOfStockCount = products.filter(p => p.inventory <= 0).length;

            // تحديث البطاقات
            document.getElementById('total-products').textContent = totalProducts;
            document.getElementById('inventory-value').textContent = formatCurrency(inventoryValue);
            document.getElementById('out-of-stock').textContent = outOfStockCount;

            // الحصول على المنتجات قليلة المخزون
            const lowStockProducts = products
                .filter(p => p.inventory > 0 && p.inventory <= settings.lowStockThreshold)
                .sort((a, b) => a.inventory - b.inventory);

            // عرض قائمة المنتجات قليلة المخزون
            const lowStockList = document.getElementById('low-stock-products');
            lowStockList.innerHTML = '';

            if (lowStockProducts.length === 0) {
                lowStockList.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا توجد منتجات منخفضة المخزون</td></tr>';
            } else {
                lowStockProducts.forEach(product => {
                    const category = categories.find(c => c.id === product.category_id);
                    const categoryName = category ? category.name : 'غير محدد';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                <td>${product.name}</td>
                <td>${categoryName}</td>
                <td>${product.inventory}</td>
                <td><span class="stock-status low-stock">منخفض</span></td>
            `;

                    lowStockList.appendChild(row);
                });
            }
        }

        // توليد تقرير العملاء
        function generateCustomersReport(filteredSales) {
            // استخلاص معلومات العملاء من المبيعات
            const customerVisits = {};
            let totalCustomers = 0;

            filteredSales.forEach(sale => {
                if (sale.customer && sale.customer.name !== 'زبون عام') {
                    const customerKey = sale.customer.phone || sale.customer.name;

                    if (customerVisits[customerKey]) {
                        customerVisits[customerKey].visits += 1;
                        customerVisits[customerKey].totalSpent += sale.total;
                        if (new Date(sale.date) > new Date(customerVisits[customerKey].lastVisit)) {
                            customerVisits[customerKey].lastVisit = sale.date;
                        }
                    } else {
                        customerVisits[customerKey] = {
                            name: sale.customer.name,
                            phone: sale.customer.phone || '',
                            visits: 1,
                            totalSpent: sale.total,
                            lastVisit: sale.date
                        };
                        totalCustomers++;
                    }
                }
            });

            // حساب إجمالي الزيارات وإنفاق العملاء
            const totalVisits = Object.values(customerVisits).reduce((sum, customer) => sum + customer.visits, 0);
            const totalSpent = Object.values(customerVisits).reduce((sum, customer) => sum + customer.totalSpent, 0);
            const averageSpend = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

            // تحديث البطاقات
            document.getElementById('total-customers').textContent = totalCustomers;
            document.getElementById('customer-visits').textContent = totalVisits;
            document.getElementById('average-customer-spend').textContent = formatCurrency(averageSpend);

            // ترتيب العملاء حسب الإنفاق
            const topCustomers = Object.values(customerVisits)
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 5);

            // عرض قائمة أفضل العملاء
            const topCustomersList = document.getElementById('top-customers');
            topCustomersList.innerHTML = '';

            if (topCustomers.length === 0) {
                topCustomersList.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا توجد بيانات للعرض</td></tr>';
            } else {
                topCustomers.forEach(customer => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.visits}</td>
                <td>${formatCurrency(customer.totalSpent)}</td>
                <td>${new Date(customer.lastVisit).toLocaleDateString()}</td>
            `;

                    topCustomersList.appendChild(row);
                });
            }
        }

        // توليد تقرير الربح
        function generateProfitReport(filteredSales) {
            // حساب إجمالي المبيعات والخصومات
            const totalSales = filteredSales.reduce((sum, sale) => sum + sale.subtotal, 0);
            const totalDiscounts = filteredSales.reduce((sum, sale) => sum + sale.discount, 0);

            // تقدير متوسط التكلفة (افتراضياً 60% من سعر البيع)
            const estimatedCost = totalSales * 0.6;
            const totalProfit = totalSales - estimatedCost - totalDiscounts;
            const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

            // تحديث البطاقات
            document.getElementById('total-profit').textContent = formatCurrency(totalProfit);
            document.getElementById('total-discounts').textContent = formatCurrency(totalDiscounts);
            document.getElementById('profit-margin').textContent = profitMargin.toFixed(2) + '%';

            // حساب الربح حسب القسم
            const profitByCategory = {};

            filteredSales.forEach(sale => {
                sale.items.forEach(item => {
                    const product = products.find(p => p.id === item.id);
                    if (product) {
                        const categoryId = product.category_id;
                        const category = categories.find(c => c.id === categoryId);
                        const categoryName = category ? category.name : 'غير محدد';

                        const revenue = item.price * item.quantity;
                        const estimatedItemCost = revenue * 0.6;
                        const itemProfit = revenue - estimatedItemCost;

                        if (profitByCategory[categoryName]) {
                            profitByCategory[categoryName] += itemProfit;
                        } else {
                            profitByCategory[categoryName] = itemProfit;
                        }
                    }
                });
            });

            // إنشاء المخطط البياني للربح حسب القسم
            const categoryProfitChart = document.getElementById('profit-by-category');
            categoryProfitChart.innerHTML = '';

            // تحديد أقصى قيمة للربح حسب القسم
            const maxProfit = Math.max(...Object.values(profitByCategory), 1);

            // إنشاء الأعمدة في المخطط
            Object.entries(profitByCategory).forEach(([category, profit]) => {
                const height = (profit / maxProfit) * 180; // الارتفاع النسبي للعمود

                const chartBar = document.createElement('div');
                chartBar.className = 'chart-bar';
                chartBar.style.height = `${height}px`;

                // إضافة قيمة وتسمية للعمود
                chartBar.innerHTML = `
            <div class="chart-value">${formatCurrency(profit)}</div>
            <div class="chart-label">${category}</div>
        `;

                categoryProfitChart.appendChild(chartBar);
            });
        }

        // طباعة التقرير الحالي
        function printCurrentReport() {
            const reportContent = document.querySelector('.report-panel.active');
            const printWindow = window.open('', '_blank');

            printWindow.document.write(`
        <html>
        <head>
            <title>تقرير</title>
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; }
                .report-card { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; }
                .report-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f5f5f5; }
                .report-content { display: flex; justify-content: space-between; }
                .report-value { font-size: 24px; font-weight: bold; color: #3498db; }
            </style>
        </head>
        <body>
            <h1>تقرير ${document.querySelector('.settings-tab[data-report].active').textContent}</h1>
            <p>الفترة: ${document.getElementById('report-from-date').value} إلى ${document.getElementById('report-to-date').value}</p>
            ${reportContent.innerHTML}
        </body>
        </html>
    `);

            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }

        // تصدير التقرير الحالي
        function exportCurrentReport() {
            const reportType = document.querySelector('.settings-tab[data-report].active').dataset.report;
            const fromDate = document.getElementById('report-from-date').value;
            const toDate = document.getElementById('report-to-date').value;

            let csvContent = "";

            // تحديد محتوى التصدير حسب نوع التقرير
            switch (reportType) {
                case 'sales':
                    csvContent = "تقرير المبيعات\n";
                    csvContent += `الفترة: ${fromDate} إلى ${toDate}\n\n`;
                    csvContent += `إجمالي المبيعات,${document.getElementById('total-sales').textContent}\n`;
                    csvContent += `عدد المعاملات,${document.getElementById('transactions-count').textContent}\n`;
                    csvContent += `متوسط قيمة الفاتورة,${document.getElementById('average-sale').textContent}\n\n`;

                    csvContent += "أفضل المنتجات مبيعاً\n";
                    csvContent += "المنتج,القسم,الكمية المباعة,إجمالي المبيعات\n";

                    const topProducts = document.querySelectorAll('#top-products tr');
                    topProducts.forEach(row => {
                        const columns = row.querySelectorAll('td');
                        if (columns.length === 4) {
                            csvContent += `"${columns[0].textContent}","${columns[1].textContent}","${columns[2].textContent}","${columns[3].textContent}"\n`;
                        }
                    });
                    break;

                case 'inventory':
                    csvContent = "تقرير المخزون\n\n";
                    csvContent += `إجمالي المنتجات,${document.getElementById('total-products').textContent}\n`;
                    csvContent += `قيمة المخزون,${document.getElementById('inventory-value').textContent}\n`;
                    csvContent += `منتجات نفذت,${document.getElementById('out-of-stock').textContent}\n\n`;

                    csvContent += "المنتجات قليلة المخزون\n";
                    csvContent += "المنتج,القسم,الكمية المتبقية,حالة المخزون\n";

                    const lowStockProducts = document.querySelectorAll('#low-stock-products tr');
                    lowStockProducts.forEach(row => {
                        const columns = row.querySelectorAll('td');
                        if (columns.length === 4) {
                            csvContent += `"${columns[0].textContent}","${columns[1].textContent}","${columns[2].textContent}","${columns[3].textContent}"\n`;
                        }
                    });
                    break;

                case 'customers':
                    csvContent = "تقرير العملاء\n";
                    csvContent += `الفترة: ${fromDate} إلى ${toDate}\n\n`;
                    csvContent += `إجمالي العملاء,${document.getElementById('total-customers').textContent}\n`;
                    csvContent += `عدد الزيارات,${document.getElementById('customer-visits').textContent}\n`;
                    csvContent += `متوسط إنفاق العميل,${document.getElementById('average-customer-spend').textContent}\n\n`;

                    csvContent += "أفضل العملاء\n";
                    csvContent += "العميل,عدد المشتريات,إجمالي الإنفاق,آخر زيارة\n";

                    const topCustomers = document.querySelectorAll('#top-customers tr');
                    topCustomers.forEach(row => {
                        const columns = row.querySelectorAll('td');
                        if (columns.length === 4) {
                            csvContent += `"${columns[0].textContent}","${columns[1].textContent}","${columns[2].textContent}","${columns[3].textContent}"\n`;
                        }
                    });
                    break;

                case 'profit':
                    csvContent = "تقرير الربح\n";
                    csvContent += `الفترة: ${fromDate} إلى ${toDate}\n\n`;
                    csvContent += `إجمالي الربح,${document.getElementById('total-profit').textContent}\n`;
                    csvContent += `الخصومات,${document.getElementById('total-discounts').textContent}\n`;
                    csvContent += `نسبة الربح,${document.getElementById('profit-margin').textContent}\n`;
                    break;
            }

            // إنشاء رابط التنزيل
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `تقرير-${reportType}-${new Date().toLocaleDateString()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification(`تم تصدير تقرير ${document.querySelector('.settings-tab[data-report].active').textContent} بنجاح`, 'success');
        }

        // إنشاء نسخة احتياطية
        function createBackup() {
            const backupData = {
                settings: settings,
                categories: categories,
                products: products,
                salesData: salesData,
                customersData: customersData,
                holdOrders: holdOrders,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            const jsonData = JSON.stringify(backupData);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pos-backup-${new Date().toLocaleDateString()}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification('تم إنشاء نسخة احتياطية بنجاح', 'success');
        }

        // استعادة النسخة الاحتياطية
        function restoreBackup() {
            const fileInput = document.getElementById('restore-backup');

            if (!fileInput.files || fileInput.files.length === 0) {
                showNotification('يرجى اختيار ملف النسخة الاحتياطية', 'error');
                return;
            }

            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    const backupData = JSON.parse(e.target.result);

                    // التحقق من صحة البيانات
                    if (!backupData.version || !backupData.timestamp) {
                        showNotification('صيغة ملف النسخة الاحتياطية غير صحيحة', 'error');
                        return;
                    }

                    // استعادة البيانات
                    settings = backupData.settings || settings;
                    categories = backupData.categories || categories;
                    products = backupData.products || products;
                    salesData = backupData.salesData || salesData;
                    customersData = backupData.customersData || customersData;
                    holdOrders = backupData.holdOrders || holdOrders;

                    // حفظ البيانات المستعادة
                    saveToLocalStorage();

                    // تطبيق الإعدادات
                    applySettings();

                    // تحديث واجهة المستخدم
                    renderCategories();
                    if (categories.length > 0) {
                        filterProductsByCategory(categories[0].id);
                    }

                    showNotification('تم استعادة النسخة الاحتياطية بنجاح', 'success');

                    // إعادة تحميل الصفحة لتطبيق التغييرات بشكل كامل
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } catch (error) {
                    console.error('Error restoring backup:', error);
                    showNotification('حدث خطأ أثناء استعادة النسخة الاحتياطية', 'error');
                }
            };

            reader.readAsText(file);
        }

        // فتح نافذة تعليق الطلب
        function openHoldOrderModal() {
            if (cart.length === 0) {
                showNotification('السلة فارغة، لا يمكن تعليق طلب فارغ', 'error');
                return;
            }

            document.getElementById('hold-name').value = '';
            document.getElementById('hold-note').value = '';
            document.getElementById('hold-order-modal').style.display = 'flex';
        }

        // إغلاق نافذة تعليق الطلب
        function closeHoldOrderModal() {
            document.getElementById('hold-order-modal').style.display = 'none';
        }

        // حفظ الطلب المعلق
        function saveHoldOrder() {
            if (cart.length === 0) return;

            const holdName = document.getElementById('hold-name').value.trim();
            const holdNote = document.getElementById('hold-note').value.trim();

            if (!holdName) {
                showNotification('يرجى إدخال اسم للطلب المعلق', 'error');
                return;
            }

            // إنشاء طلب معلق جديد
            const holdOrder = {
                id: Date.now(),
                name: holdName,
                note: holdNote,
                items: [...cart],
                discount: {
                    amount: discountAmount,
                    type: discountType,
                    reason: discountReason
                },
                timestamp: new Date().toISOString()
            };

            // إضافة الطلب إلى قائمة الطلبات المعلقة
            holdOrders.push(holdOrder);

            // حفظ الطلبات المعلقة في التخزين المحلي
            saveToLocalStorage();

            // تحديث قائمة الطلبات المعلقة
            renderHoldOrders();

            // مسح السلة الحالية
            cart = [];
            discountAmount = 0;
            discountType = 'percentage';
            discountReason = '';
            renderCart();
            updateCartSummary();

            // إغلاق النافذة
            closeHoldOrderModal();

            showNotification(`تم تعليق الطلب باسم "${holdName}" بنجاح`, 'success');
        }

        // عرض الطلبات المعلقة
        function renderHoldOrders() {
            const holdList = document.getElementById('hold-list');
            const holdsContainer = document.getElementById('holds-container');

            // إخفاء القائمة إذا لم تكن هناك طلبات معلقة
            if (holdOrders.length === 0) {
                holdsContainer.style.display = 'none';
                return;
            }

            // إظهار القائمة وتحديثها
            holdsContainer.style.display = 'block';
            holdList.innerHTML = '';

            holdOrders.forEach(order => {
                const holdItem = document.createElement('div');
                holdItem.className = 'hold-item';
                if (activeHoldId === order.id) {
                    holdItem.classList.add('active');
                }

                const orderDate = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                holdItem.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${order.name}</span>
            <span class="hold-item-count">(${order.items.length})</span>
            <span class="hold-item-time">${orderDate}</span>
            <button class="hold-item-load" title="تحميل الطلب"><i class="fas fa-arrow-right"></i></button>
            <button class="hold-item-delete" title="حذف الطلب"><i class="fas fa-trash"></i></button>
        `;

                // إضافة مستمعي الأحداث
                holdItem.querySelector('.hold-item-load').addEventListener('click', (e) => {
                    e.stopPropagation();
                    loadHoldOrder(order.id);
                });

                holdItem.querySelector('.hold-item-delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteHoldOrder(order.id);
                });

                holdList.appendChild(holdItem);
            });
        }

        // تحميل طلب معلق
        function loadHoldOrder(id) {
            // التحقق من وجود عناصر في السلة الحالية
            if (cart.length > 0) {
                if (!confirm('ستفقد العناصر الموجودة في السلة الحالية. هل تريد المتابعة؟')) {
                    return;
                }
            }

            // البحث عن الطلب المعلق
            const holdOrder = holdOrders.find(order => order.id === id);
            if (!holdOrder) return;

            // تحميل الطلب
            cart = [...holdOrder.items];
            discountAmount = holdOrder.discount.amount;
            discountType = holdOrder.discount.type;
            discountReason = holdOrder.discount.reason;

            // تحديث واجهة المستخدم
            renderCart();
            updateCartSummary();

            // تحديد الطلب كنشط
            activeHoldId = id;
            renderHoldOrders();

            showNotification(`تم تحميل الطلب "${holdOrder.name}" بنجاح`, 'success');
        }

        // حذف طلب معلق
        function deleteHoldOrder(id) {
            if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب المعلق؟')) {
                return;
            }

            // البحث عن الطلب المعلق
            const holdOrderIndex = holdOrders.findIndex(order => order.id === id);
            if (holdOrderIndex === -1) return;

            // حفظ اسم الطلب قبل حذفه
            const holdName = holdOrders[holdOrderIndex].name;

            // حذف الطلب
            holdOrders.splice(holdOrderIndex, 1);

            // إعادة تعيين الطلب النشط إذا تم حذفه
            if (activeHoldId === id) {
                activeHoldId = null;
            }

            // تحديث واجهة المستخدم
            saveToLocalStorage();
            renderHoldOrders();

            showNotification(`تم حذف الطلب "${holdName}" بنجاح`, 'success');
        }

        // فتح نافذة الإعدادات
        function openSettingsModal() {
            // ملء الإعدادات الحالية
            document.getElementById('store-name').value = settings.storeName;
            document.getElementById('store-address').value = settings.storeAddress;
            document.getElementById('store-phone').value = settings.storePhone;
            document.getElementById('currency').value = settings.currency;
            document.getElementById('receipt-header').value = settings.receiptHeader;
            document.getElementById('receipt-footer').value = settings.receiptFooter;
            document.getElementById('receipt-show-tax').value = settings.showTax ? 'yes' : 'no';
            document.getElementById('tax-enabled').value = settings.taxEnabled ? 'yes' : 'no';
            document.getElementById('tax-rate').value = settings.taxRate;
            document.getElementById('tax-included').value = settings.taxIncluded ? 'yes' : 'no';
            document.getElementById('low-stock-threshold').value = settings.lowStockThreshold;
            document.getElementById('tax-number').value = settings.taxNumber || '';

            // تطبيق إعدادات المظهر
            if (settings.theme) {
                document.getElementById('theme-color').value = settings.theme.color || 'blue';
                document.getElementById('font-size').value = settings.theme.fontSize || 'medium';
                document.getElementById('dark-mode').value = settings.theme.darkMode || 'light';
            }

            // عرض النافذة
            document.getElementById('settings-modal').style.display = 'flex';
        }

        // إغلاق نافذة الإعدادات
        function closeSettingsModal() {
            document.getElementById('settings-modal').style.display = 'none';
        }

        // حفظ الإعدادات
        function saveSettings() {
            // تحديث الإعدادات
            settings.storeName = document.getElementById('store-name').value;
            settings.storeAddress = document.getElementById('store-address').value;
            settings.storePhone = document.getElementById('store-phone').value;
            settings.currency = document.getElementById('currency').value;
            settings.receiptHeader = document.getElementById('receipt-header').value;
            settings.receiptFooter = document.getElementById('receipt-footer').value;
            settings.showTax = document.getElementById('receipt-show-tax').value === 'yes';
            settings.taxEnabled = document.getElementById('tax-enabled').value === 'yes';
            settings.taxRate = parseFloat(document.getElementById('tax-rate').value);
            settings.taxIncluded = document.getElementById('tax-included').value === 'yes';
            settings.lowStockThreshold = parseInt(document.getElementById('low-stock-threshold').value) || 10;
            settings.taxNumber = document.getElementById('tax-number').value;

            // إعدادات المظهر
            settings.theme = {
                color: document.getElementById('theme-color').value,
                fontSize: document.getElementById('font-size').value,
                darkMode: document.getElementById('dark-mode').value
            };

            // كلمات المرور - فقط إذا تم تغييرها
            const adminPassword = document.getElementById('admin-password').value;
            const cashierPassword = document.getElementById('cashier-password').value;

            if (adminPassword) {
                settings.adminPassword = adminPassword;
            }

            if (cashierPassword) {
                settings.cashierPassword = cashierPassword;
            }

            // حفظ الإعدادات
            saveToLocalStorage();

            // تطبيق الإعدادات
            applySettings();

            // تطبيق إعدادات المظهر
            applyTheme(settings.theme);

            // إغلاق النافذة
            closeSettingsModal();

            showNotification('تم حفظ الإعدادات بنجاح', 'success');
        }

        // تبديل علامة تبويب الإعدادات
        function switchSettingsTab(tab) {
            // إزالة الفئة النشطة من جميع علامات التبويب
            document.querySelectorAll('.settings-tab').forEach(t => {
                t.classList.remove('active');
            });

            // إضافة الفئة النشطة إلى علامة التبويب المحددة
            document.querySelector(`.settings-tab[data-tab="${tab}"]`).classList.add('active');

            // إخفاء جميع محتويات علامات التبويب
            document.querySelectorAll('.settings-content').forEach(content => {
                content.classList.remove('active');
            });

            // إظهار محتوى علامة التبويب المحددة
            document.getElementById(`${tab}-settings`).classList.add('active');
        }

        // فتح نافذة اختصارات لوحة المفاتيح
        function openKeyboardShortcutsModal() {
            document.getElementById('keyboard-shortcuts-modal').style.display = 'flex';
        }

        // إغلاق نافذة اختصارات لوحة المفاتيح
        function closeKeyboardShortcutsModal() {
            document.getElementById('keyboard-shortcuts-modal').style.display = 'none';
        }

        // فتح درج النقد
        function openCashDrawer() {
            // في بيئة حقيقية، هذه الدالة ستتواصل مع الطابعة لفتح درج النقد
            // هنا نعرض فقط إشعارًا
            showNotification('تم فتح درج النقد', 'success');

            // إضافة صوت الدرج في بيئة حقيقية
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAABhbWQ=');
                audio.play();
            } catch (e) {
                console.log('Cash drawer sound not supported');
            }
        }

        // عرض إشعار
        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            const notificationMessage = document.getElementById('notification-message');

            // إزالة جميع الفئات
            notification.className = 'notification';

            // إضافة فئة النوع
            if (type === 'success') {
                notification.classList.add('success');
                notification.querySelector('i').className = 'fas fa-check-circle';
            } else if (type === 'error') {
                notification.classList.add('error');
                notification.querySelector('i').className = 'fas fa-exclamation-circle';
            } else {
                notification.querySelector('i').className = 'fas fa-info-circle';
            }

            // تعيين الرسالة
            notificationMessage.textContent = message;

            // إظهار الإشعار
            notification.classList.add('show');

            // إخفاء الإشعار بعد 3 ثوانٍ
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // إضافة ميزة البحث السريع بالاسم أو الباركود
        function quickSearch(term) {
            if (!term) return null;

            // البحث في الباركود أولاً (بحث دقيق)
            const productByBarcode = products.find(p => p.barcode === term);
            if (productByBarcode) return productByBarcode;

            // البحث في الأسماء (بحث جزئي)
            const termLower = term.toLowerCase();
            return products.find(p => p.name.toLowerCase().includes(termLower));
        }

        // التحقق من توفر المنتج في المخزون
        function checkInventoryAvailability(productId, quantity) {
            const product = products.find(p => p.id === productId);
            if (!product) return false;

            return product.inventory >= quantity;
        }

        // تحديث المخزون بعد الإعادة أو المرتجعات
        function updateInventoryAfterReturn(items) {
            items.forEach(item => {
                const productIndex = products.findIndex(p => p.id === item.id);
                if (productIndex !== -1) {
                    products[productIndex].inventory += item.quantity;
                }
            });

            // حفظ التغييرات
            saveToLocalStorage();
        }

        // التحقق من المنتجات منخفضة المخزون وإظهار تنبيهات
        function checkLowStockProducts() {
            const lowStockThreshold = settings.lowStockThreshold || 10;
            const lowStockProducts = products.filter(p => p.inventory > 0 && p.inventory <= lowStockThreshold);

            if (lowStockProducts.length > 0) {
                showNotification(`يوجد ${lowStockProducts.length} منتج منخفض المخزون`, 'error');
            }
        }

        // إعداد دعم قارئ الباركود
        function setupBarcodeScanner() {
            let barcodeBuffer = '';
            let barcodeTimeout;

            // استمع إلى ضغطات المفاتيح في أي مكان في الصفحة
            document.addEventListener('keypress', (e) => {
                // تجاهل إذا كان المؤشر في حقل نصي
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }

                // تجميع الباركود من ضغطات المفاتيح المتتالية
                clearTimeout(barcodeTimeout);

                // إضافة الحرف إلى المخزن المؤقت
                if (e.key !== 'Enter') {
                    barcodeBuffer += e.key;
                }

                // تعيين مؤقت لإعادة ضبط المخزن المؤقت
                barcodeTimeout = setTimeout(() => {
                    barcodeBuffer = '';
                }, 100);

                // معالجة الباركود عند الضغط على Enter
                if (e.key === 'Enter' && barcodeBuffer.length > 5) {
                    const product = products.find(p => p.barcode === barcodeBuffer);

                    if (product) {
                        addToCart(product);
                        showNotification(`تم إضافة ${product.name} إلى السلة`, 'success');
                    } else {
                        showNotification('لم يتم العثور على منتج بهذا الباركود', 'error');
                    }

                    barcodeBuffer = '';
                }
            });
        }

        // بدء تشغيل التطبيق
        document.addEventListener('DOMContentLoaded', () => {
            // تهيئة الصفحة
            initializePage();

            // تحقق من المنتجات منخفضة المخزون
            setTimeout(() => {
                checkLowStockProducts();
            }, 3000);
        });



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