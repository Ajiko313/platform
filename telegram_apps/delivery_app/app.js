const API_URL = 'http://localhost:3000/api';
let tg = window.Telegram.WebApp;
let user = null;
let token = null;
let availableDeliveries = [];
let myDeliveries = [];
let selectedDelivery = null;

// Initialize app
async function init() {
    tg.ready();
    tg.expand();
    
    const tgUser = tg.initDataUnsafe?.user;
    
    if (tgUser) {
        await authenticateUser(tgUser);
    }
    
    await loadDriverStats();
    await loadDeliveries();
    showAvailable();
    
    document.getElementById('loading').classList.remove('active');
    
    // Auto-refresh every 30 seconds
    setInterval(async () => {
        await loadDeliveries();
        await loadMyDeliveries();
    }, 30000);
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
        
        // Update user role to delivery if not already
        if (user.role !== 'delivery') {
            // This would normally require admin approval
            console.log('User needs delivery role');
        }
    } catch (error) {
        console.error('Auth error:', error);
        tg.showAlert('Authentication failed');
    }
}

async function loadDriverStats() {
    if (!user) return;
    
    const html = `
        <div class="stat-row">
            <span>⭐ Rating</span>
            <strong>${user.rating || 5.0}</strong>
        </div>
        <div class="stat-row">
            <span>📦 Total Deliveries</span>
            <strong>${user.totalDeliveries || 0}</strong>
        </div>
    `;
    
    document.getElementById('driver-stats').innerHTML = html;
}

async function loadDeliveries() {
    try {
        const response = await fetch(`${API_URL}/deliveries/available`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            availableDeliveries = data.deliveries;
            displayAvailableDeliveries();
        }
    } catch (error) {
        console.error('Error loading deliveries:', error);
    }
}

function displayAvailableDeliveries() {
    if (availableDeliveries.length === 0) {
        document.getElementById('available-list').innerHTML = '<div class="empty-state">No available deliveries</div>';
        return;
    }
    
    const html = availableDeliveries.map(delivery => `
        <div class="delivery-card" onclick="viewDelivery(${delivery.id}, true)">
            <h3>
                <span>Delivery #${delivery.id}</span>
                <span class="delivery-status status-${delivery.status}">
                    ${delivery.status.toUpperCase()}
                </span>
            </h3>
            <p><strong>📍 Address:</strong> ${delivery.order.deliveryAddress}</p>
            <p><strong>📦 Items:</strong> ${delivery.order.items.length} items</p>
            <p><strong>💰 Amount:</strong> $${delivery.order.totalAmount}</p>
            <small>Order placed: ${new Date(delivery.order.createdAt).toLocaleString()}</small>
        </div>
    `).join('');
    
    document.getElementById('available-list').innerHTML = html;
}

async function loadMyDeliveries() {
    try {
        const response = await fetch(`${API_URL}/deliveries/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            myDeliveries = data.deliveries;
            displayMyDeliveries();
        }
    } catch (error) {
        console.error('Error loading my deliveries:', error);
    }
}

function displayMyDeliveries() {
    if (myDeliveries.length === 0) {
        document.getElementById('my-deliveries-list').innerHTML = '<div class="empty-state">No active deliveries</div>';
        return;
    }
    
    const html = myDeliveries.map(delivery => `
        <div class="delivery-card" onclick="viewDelivery(${delivery.id}, false)">
            <h3>
                <span>Delivery #${delivery.id}</span>
                <span class="delivery-status status-${delivery.status}">
                    ${delivery.status.replace('_', ' ').toUpperCase()}
                </span>
            </h3>
            <p><strong>📍 Address:</strong> ${delivery.order.deliveryAddress}</p>
            <p><strong>👤 Customer:</strong> ${delivery.order.customer.firstName} ${delivery.order.customer.lastName}</p>
            <p><strong>📞 Phone:</strong> ${delivery.order.customerPhone}</p>
            <p><strong>💰 Amount:</strong> $${delivery.order.totalAmount}</p>
            ${delivery.pickupTime ? `<small>Picked up: ${new Date(delivery.pickupTime).toLocaleString()}</small>` : ''}
        </div>
    `).join('');
    
    document.getElementById('my-deliveries-list').innerHTML = html;
}

async function viewDelivery(deliveryId, isAvailable) {
    try {
        const response = await fetch(`${API_URL}/deliveries/${deliveryId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        selectedDelivery = data.delivery;
        displayDeliveryDetails(isAvailable);
        showScreen('details-screen');
    } catch (error) {
        tg.showAlert('Failed to load delivery details');
    }
}

function displayDeliveryDetails(isAvailable) {
    const delivery = selectedDelivery;
    
    const detailsHtml = `
        <div class="details-section">
            <h3>Order Information</h3>
            <div class="details-row">
                <strong>Order ID:</strong>
                <span>#${delivery.order.id}</span>
            </div>
            <div class="details-row">
                <strong>Status:</strong>
                <span class="delivery-status status-${delivery.status}">
                    ${delivery.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>
            <div class="details-row">
                <strong>Amount:</strong>
                <span class="delivery-amount">$${delivery.order.totalAmount}</span>
            </div>
        </div>

        <div class="details-section">
            <h3>Customer Information</h3>
            <div class="details-row">
                <strong>Name:</strong>
                <span>${delivery.order.customer.firstName} ${delivery.order.customer.lastName}</span>
            </div>
            <div class="details-row">
                <strong>Phone:</strong>
                <span>${delivery.order.customerPhone}</span>
            </div>
            <div class="details-row">
                <strong>Address:</strong>
                <span>${delivery.order.deliveryAddress}</span>
            </div>
            ${delivery.order.deliveryInstructions ? `
                <div class="details-row">
                    <strong>Instructions:</strong>
                    <span>${delivery.order.deliveryInstructions}</span>
                </div>
            ` : ''}
        </div>

        <div class="details-section">
            <h3>Order Items</h3>
            <ul class="items-list">
                ${delivery.order.items.map(item => `
                    <li>
                        <span>${item.quantity}x ${item.menuItem.name}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    document.getElementById('delivery-details').innerHTML = detailsHtml;
    
    let actionsHtml = '';
    
    if (isAvailable) {
        actionsHtml = `
            <button class="action-btn btn-accept" onclick="acceptDelivery(${delivery.id})">
                Accept Delivery
            </button>
        `;
    } else {
        if (delivery.status === 'assigned') {
            actionsHtml = `
                <button class="action-btn btn-pickup" onclick="updateDeliveryStatus(${delivery.id}, 'picked_up')">
                    Mark as Picked Up
                </button>
            `;
        } else if (delivery.status === 'picked_up') {
            actionsHtml = `
                <button class="action-btn btn-complete" onclick="updateDeliveryStatus(${delivery.id}, 'delivered')">
                    Mark as Delivered
                </button>
            `;
        }
    }
    
    document.getElementById('delivery-actions').innerHTML = actionsHtml;
}

async function acceptDelivery(deliveryId) {
    try {
        tg.showConfirm('Accept this delivery?', async (confirmed) => {
            if (!confirmed) return;
            
            const response = await fetch(`${API_URL}/deliveries/${deliveryId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                tg.showAlert('Delivery accepted!', () => {
                    loadDeliveries();
                    loadMyDeliveries();
                    showMyDeliveries();
                });
            } else {
                const data = await response.json();
                tg.showAlert(data.error || 'Failed to accept delivery');
            }
        });
    } catch (error) {
        tg.showAlert('Failed to accept delivery');
    }
}

async function updateDeliveryStatus(deliveryId, status) {
    try {
        const response = await fetch(`${API_URL}/deliveries/${deliveryId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            tg.showAlert('Status updated!', () => {
                loadMyDeliveries();
                showMyDeliveries();
            });
        } else {
            const data = await response.json();
            tg.showAlert(data.error || 'Failed to update status');
        }
    } catch (error) {
        tg.showAlert('Failed to update status');
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showAvailable() {
    showScreen('available-screen');
}

function showMyDeliveries() {
    showScreen('my-deliveries-screen');
}

// Initialize on load
window.addEventListener('load', init);
