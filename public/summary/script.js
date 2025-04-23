document.addEventListener('DOMContentLoaded', () => {
    const summaryList = document.getElementById('orderSummary');

    function getDoneOrders() {
        const done = localStorage.getItem('doneOrders');
        return done ? JSON.parse(done) : [];
    }

    function setDoneOrders(doneOrders) {
        localStorage.setItem('doneOrders', JSON.stringify(doneOrders));
    }



    async function fetchOrders() {
        try {
            const response = await fetch('/api/getOrders');
            const orders = await response.json();

            console.log("Fetched orders:", orders);

            if (Array.isArray(orders) && orders.length > 0) {
                // 🔧 Sort orders based on timestamp string as actual Date
                orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                renderOrders(orders);
            } else {
                summaryList.innerHTML = '<p>No orders available.</p>';
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            if (summaryList) {
                summaryList.innerHTML = '<p>Error fetching orders.</p>';
            }
        }
    }

    function calculateDishTotal(order) {
        const dishList = [
            "Pork Chilly", "Pork Vindaloo", "Pork Sarpotel", "Pork Sukha", "Chicken Bhujing",
            "Pattice", "Pattice Pav", "Omelette Pav", "Mojito", "Blue Lagoon", "Pink Lemonade",
            "Chicken Container"
        ];
        return dishList.reduce((sum, dish) => sum + (parseInt(order[dish]) || 0), 0);
    }

    function renderOrders(orders) {
        const doneOrders = getDoneOrders();
    
        if (summaryList) {
            summaryList.innerHTML = '';
    
            orders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.classList.add('order-card');
    
                const isDone = doneOrders.includes(order.id);
                if (isDone) orderElement.classList.add('done');
    
                const formattedTimestamp = new Date(order.timestamp.seconds * 1000).toLocaleString();
    
                orderElement.innerHTML = `
                    <div class="order-header">
                        <h3>Order #${order.orderNumber}</h3>
                        <p><strong>Customer Name:</strong> ${order.customerName}</p>
                        <p><strong>Payment Mode:</strong> ${order.paymentMode}</p>
                        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
                        <p><strong>Timestamp:</strong> ${formattedTimestamp}</p>
                    </div>
    
                    <div class="order-details">
                        <h4>Dish Summary (Total: ${calculateDishTotal(order)}):</h4>
                        <ul>${renderDishes(order)}</ul>
                    </div>
    
                    <div class="order-notes">
                        <h4>Notes:</h4>
                        <p>${order.notes || 'No notes provided'}</p>
                    </div>
    
                    <button class="mark-done" data-id="${order.id}" ${isDone ? 'disabled' : ''}>
                        ${isDone ? '✔ Marked Done' : 'Mark as Done'}
                    </button>
                `;
                summaryList.appendChild(orderElement);
            });
    
            // Attach listeners to newly created buttons
            document.querySelectorAll('.mark-done').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const btn = e.target;
                    const id = btn.dataset.id;
    
                    // Disable immediately to prevent multiple clicks
                    if (btn.disabled) return;
                    btn.disabled = true;
                    btn.textContent = 'Marking...';
    
                    const orderCard = btn.closest('.order-card');
                    const updatedDoneOrders = [...new Set([...getDoneOrders(), id])];
                    setDoneOrders(updatedDoneOrders);
                    orderCard.classList.add('done');
    
                    const order = orders.find(o => o.id === id);
                    if (!order) {
                        alert('Order not found for sheet logging');
                        btn.disabled = false;
                        btn.textContent = 'Mark as Done';
                        return;
                    }
    
                    try {
                        const response = await fetch("/api/logToSheet", {
                            method: "POST",
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(order)
                        });
    
                        const result = await response.json();
                        if (!response.ok) throw new Error(result.error || 'Sheet logging failed');
    
                        console.log(`Order #${order.orderNumber} logged to sheet.`);
                        btn.textContent = '✔ Marked Done';
                    } catch (err) {
                        console.error('Sheet logging error:', err);
                        alert('Failed to log to sheet. Please try again.');
                        btn.disabled = false;
                        btn.textContent = 'Mark as Done';
                    }
                });
            });
        }
    }
    
    function renderDishes(order) {
        const dishes = [
            "Pork Chilly", "Pork Vindaloo", "Pork Sarpotel", "Pork Sukha", "Chicken Bhujing",
            "Pattice", "Pattice Pav", "Omelette Pav", "Mojito", "Blue Lagoon", "Pink Lemonade",
            "Chicken Container"
        ];

        // Calculate the total number of dishes
        let totalQuantity = 0;

        // Generate the dish list and sum the quantities
        const dishList = dishes.map(dish => {
            const quantity = parseInt(order[dish], 10) || 0; // Ensure quantity is a number
            if (quantity > 0) {
                totalQuantity += quantity;
                return `<li><strong>${dish}:</strong> ${quantity}</li>`;
            }
            return ''; // Do not display if quantity is 0
        }).join('');

        // Add total quantity summary after the dish list
        return `${dishList}
                <p><strong>Total Dishes:</strong> ${totalQuantity}</p>`;
    }



    async function deleteOrder(orderId) {
        try {
            const response = await fetch(`/api/deleteOrder?orderId=${orderId}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (result.status === 'Order deleted') {
                alert('Order deleted successfully');
                fetchOrders(); // Reload orders
            } else {
                alert('Failed to delete order');
            }
        } catch (error) {
            console.error('Failed to delete order:', error);
            alert('Error deleting order');
        }
    }

    // Auto-refresh orders every 30 seconds
    setInterval(fetchOrders, 30000);

    // Initial fetch on page load
    fetchOrders();
});
