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
    
                // Check if this order is marked as done
                if (doneOrders.includes(order.id)) {
                    orderElement.classList.add('done');
                }
    
                // Format timestamp into a readable format (optional)
                const formattedTimestamp = new Date(order.timestamp.seconds * 1000).toLocaleString();
    
                // Display the order number and ID correctly
                orderElement.innerHTML = `
                    <div class="order-header">
                        <h3>Order #${order.orderNumber}</h3>  <!-- Correct order number without leading zeroes -->
                        <h3>Order ID: ${order.id}</h3>
                        <p><strong>Customer Name:</strong> ${order.customerName}</p>
                        <p><strong>Payment Mode:</strong> ${order.paymentMode}</p>
                        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
                        <p><strong>Timestamp:</strong> ${formattedTimestamp}</p>  <!-- Formatted timestamp -->
                    </div>
    
                    <div class="order-details">
                        <h4>Dish Summary (Total: ${calculateDishTotal(order)}):</h4>
                        <ul>${renderDishes(order)}</ul>
                    </div>
    
                    <div class="order-notes">
                        <h4>Notes:</h4>
                        <p>${order.notes || 'No notes provided'}</p>
                    </div>
    
                    <button class="mark-done" data-id="${order.id}">Mark as Done</button>
                `;
                summaryList.appendChild(orderElement);
            });
    
            // Attach listeners
            document.querySelectorAll('.mark-done').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    const orderCard = e.target.closest('.order-card');
                    orderCard.classList.add('done');
    
                    const updatedDoneOrders = [...new Set([...getDoneOrders(), id])];
                    setDoneOrders(updatedDoneOrders);
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
