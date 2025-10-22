const API_URL = 'http://localhost:3000/api';
let tg = window.Telegram.WebApp;
let user = null;
let token = null;
let menu = [];
let cart = [];
let orders = [];
let selectedCategory = 'all';

// Initialize app
async function init() {
    tg.ready();
    tg.expand();
    
    // Get Telegram user data
    const tgUser = tg.initDataUnsafe?.user;
    
    if (tgUser) {
        // Authenticate with backend
        await authenticateUser(tgUser);
    }
    
    await loadMenu();
    showMenu();
    
    document.getElementById('loading').classList.remove('active');
}

async function authenticateUser(tgUser) {
    try {
        const response = await fetch(`${API_URL}/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: tgUser.id.toString(),
                firstName: tgUser.first_name,
                lastName: tgUser.last_name || '',
                username: tgUser.username || ''
            })
        });
        
        const data = await response.json();
        token = data.token;
        user = data.user;
    } catch (error) {
        console.error('Auth error:', error);
        tg.showAlert('Authentication failed');
    }
}

async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const data = await response.json();
        menu = data.items.filter(item => item.isAvailable);
        displayMenu();
        displayCategories();
    } catch (error) {
        console.error('Error loading menu:', error);
        tg.showAlert('Failed to load menu');
    }
}

function displayCategories() {
    const categories = ['all', ...new Set(menu.map(item => item.category))];
    const html = categories.map(cat => `
        <button class="category-btn ${cat === selectedCategory ? 'active' : ''}" 
                onclick="filterByCategory('${cat}')">
            ${cat === 'all' ? 'All' : cat}
        </button>
    `).join('');
    
    document.getElementById('categories').innerHTML = html;
}

function filterByCategory(category) {
    selectedCategory = category;
    displayCategories();
    displayMenu();
}

function displayMenu() {
    const filteredMenu = selectedCategory === 'all' 
        ? menu 
        : menu.filter(item => item.category === selectedCategory);
    
    const html = filteredMenu.map(item => {
        const inCart = cart.find(c => c.id === item.id);
        
        return `
            <div class="menu-item">
                <div class="menu-item-info">
                    <h3>${item.name}</h3>
                    <p>${item.description || ''}</p>
                    <div class="menu-item-price">$${item.price}</div>
                </div>
                <div class="menu-item-actions">
                    ${inCart ? `
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                            <span>${inCart.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    ` : `
                        <button class="add-btn" onclick="addToCart(${item.id})">Add</button>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('menu-items').innerHTML = html || '<div class="empty-state">No items found</div>';
}

function addToCart(itemId) {
    const item = menu.find(i => i.id === itemId);
    cart.push({ ...item, quantity: 1 });
    updateCartCount();
    displayMenu();
    tg.HapticFeedback.impactOccurred('light');
}

function updateQuantity(itemId, change) {
    const cartItem = cart.find(c => c.id === itemId);
    if (cartItem) {
        cartItem.quantity += change;
        if (cartItem.quantity <= 0) {
            cart = cart.filter(c => c.id !== itemId);
        }
    }
    updateCartCount();
    displayMenu();
    displayCart();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showMenu() {
    showScreen('menu-screen');
}

function showCart() {
    displayCart();
    showScreen('cart-screen');
}

function displayCart() {
    if (cart.length === 0) {
        document.getElementById('cart-items').innerHTML = '<div class="empty-state">Your cart is empty</div>';
        return;
    }
    
    const html = cart.map(item => `
        <div class="cart-item">
            <div>
                <h3>${item.name}</h3>
                <p>$${item.price} × ${item.quantity}</p>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('cart-items').innerHTML = html;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function proceedToCheckout() {
    if (cart.length === 0) {
        tg.showAlert('Your cart is empty');
        return;
    }
    
    // Pre-fill user data
    if (user) {
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('address').value = user.address || '';
    }
    
    showScreen('checkout-screen');
}

document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const address = document.getElementById('address').value;
    const phone = document.getElementById('phone').value;
    const instructions = document.getElementById('instructions').value;
    const paymentMethod = document.getElementById('payment-method').value;
    
    try {
        tg.MainButton.showProgress();
        
        // Create order
        const orderResponse = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: cart.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity
                })),
                deliveryAddress: address,
                customerPhone: phone,
                deliveryInstructions: instructions
            })
        });
        
        const orderData = await orderResponse.json();
        
        if (!orderResponse.ok) throw new Error(orderData.error);
        
        // Create payment
        const paymentResponse = await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                orderId: orderData.order.id,
                method: paymentMethod
            })
        });
        
        const paymentData = await paymentResponse.json();
        
        if (!paymentResponse.ok) throw new Error(paymentData.error);
        
        tg.MainButton.hideProgress();
        
        // Clear cart
        cart = [];
        updateCartCount();
        
        tg.showAlert('Order placed successfully!', () => {
            showOrders();
        });
        
    } catch (error) {
        tg.MainButton.hideProgress();
        tg.showAlert(error.message || 'Failed to place order');
    }
});

async function showOrders() {
    await loadOrders();
    displayOrders();
    showScreen('orders-screen');
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        orders = data.orders;
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrders() {
    if (orders.length === 0) {
        document.getElementById('orders-list').innerHTML = '<div class="empty-state">No orders yet</div>';
        return;
    }
    
    const html = orders.map(order => `
        <div class="order-card" onclick="trackOrder(${order.id})">
            <h3>Order #${order.id}</h3>
            <div class="order-status status-${order.status}">
                ${order.status.replace('_', ' ').toUpperCase()}
            </div>
            <p>${order.items.length} items • $${order.totalAmount}</p>
            <small>${new Date(order.createdAt).toLocaleString()}</small>
        </div>
    `).join('');
    
    document.getElementById('orders-list').innerHTML = html;
}

async function trackOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        displayOrderTracking(data.order);
        showScreen('tracking-screen');
    } catch (error) {
        tg.showAlert('Failed to load order details');
    }
}

function displayOrderTracking(order) {
    const detailsHtml = `
        <div class="order-card">
            <h3>Order #${order.id}</h3>
            <div class="order-status status-${order.status}">
                ${order.status.replace('_', ' ').toUpperCase()}
            </div>
            <p><strong>Total:</strong> $${order.totalAmount}</p>
            <p><strong>Address:</strong> ${order.deliveryAddress}</p>
            ${order.delivery?.driver ? `
                <p><strong>Driver:</strong> ${order.delivery.driver.firstName} ${order.delivery.driver.lastName}</p>
            ` : ''}
        </div>
    `;
    
    const timelineHtml = `
        <div class="timeline">
            <div class="timeline-step ${getStepStatus(order, 'pending')}">
                <h4>Order Placed</h4>
                <small>${new Date(order.createdAt).toLocaleString()}</small>
            </div>
            <div class="timeline-step ${getStepStatus(order, 'paid')}">
                <h4>Payment Confirmed</h4>
            </div>
            <div class="timeline-step ${getStepStatus(order, 'preparing')}">
                <h4>Preparing Your Order</h4>
            </div>
            <div class="timeline-step ${getStepStatus(order, 'out_for_delivery')}">
                <h4>Out for Delivery</h4>
            </div>
            <div class="timeline-step ${getStepStatus(order, 'delivered')}">
                <h4>Delivered</h4>
                ${order.actualDeliveryTime ? `<small>${new Date(order.actualDeliveryTime).toLocaleString()}</small>` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('order-details').innerHTML = detailsHtml;
    document.getElementById('order-timeline').innerHTML = timelineHtml;
}

function getStepStatus(order, step) {
    const statusFlow = ['pending', 'paid', 'preparing', 'out_for_delivery', 'delivered'];
    const currentIndex = statusFlow.indexOf(order.status);
    const stepIndex = statusFlow.indexOf(step);
    return stepIndex <= currentIndex ? 'completed' : '';
}

// Initialize on load
window.addEventListener('load', init);
