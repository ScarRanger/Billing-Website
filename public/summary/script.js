import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyClexhIGp7WV4r8FU3sOouwzAF_vWqvg4k",
    authDomain: "cypmain-171b3.firebaseapp.com",
    projectId: "cypmain-171b3",
    storageBucket: "cypmain-171b3.firebasestorage.app",
    messagingSenderId: "108819960879",
    appId: "1:108819960879:web:1c9d15d53cd1bf3dac62da"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const summaryList = document.getElementById('orderSummary');

// Firestore reference and query to listen for real-time updates
const ordersRef = collection(db, "VU_billing");
const q = query(ordersRef, orderBy("timestamp", "desc"));

// Function to render orders on the page
function renderOrders(orders) {
    const doneOrders = getDoneOrders();

    if (summaryList) {
        summaryList.innerHTML = '';

        orders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.classList.add('order-card');

            // Check if the order is done
            const isDone = doneOrders.includes(order.id);

            if (isDone) {
                orderElement.classList.add('done');
            }

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

        // Attach listeners to newly created buttons for marking as done
        document.querySelectorAll('.mark-done').forEach(button => {
            button.addEventListener('click', async (e) => {
                const btn = e.target;
                const id = btn.dataset.id;

                // Disable button to prevent multiple clicks
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

                // Update Firestore to mark order as done
                try {
                    await fetch("/api/markOrderDone", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                } catch (err) {
                    console.error("Failed to mark order as done in Firestore:", err);
                }

                // Log the order to Google Sheets
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


// Function to fetch orders from API endpoint
async function fetchOrders() {
    try {
        const response = await fetch('/api/getOrders');
        const orders = await response.json();

        console.log("Fetched orders:", orders);

        if (Array.isArray(orders) && orders.length > 0) {
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

// Auto-refresh orders every 30 seconds
setInterval(fetchOrders, 30000);

// Initial fetch on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();  // Load orders initially

    // Listen to real-time updates from Firestore
    onSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        console.log('Snapshot received:', snapshot.docs.map(doc => doc.data()));

        renderOrders(orders);  // Render orders on real-time update
    });
});

// Helper functions for managing "done" orders in localStorage
function getDoneOrders() {
    const done = localStorage.getItem('doneOrders');
    return done ? JSON.parse(done) : [];
}

function setDoneOrders(doneOrders) {
    localStorage.setItem('doneOrders', JSON.stringify(doneOrders));
}

// Calculate the total number of dishes in an order
function calculateDishTotal(order) {
    const dishList = [
        "Pork Chilly", "Pork Vindaloo", "Pork Sarpotel", "Pork Sukha", "Chicken Bhujing",
        "Pattice", "Pattice Pav", "Omelette Pav", "Mojito", "Blue Lagoon", "Pink Lemonade",
        "Chicken Container"
    ];
    return dishList.reduce((sum, dish) => sum + (parseInt(order[dish]) || 0), 0);
}

// Render the dish list for each order
function renderDishes(order) {
    const dishes = [
        "Pork Chilly", "Pork Vindaloo", "Pork Sarpotel", "Pork Sukha", "Chicken Bhujing",
        "Pattice", "Pattice Pav", "Omelette Pav", "Mojito", "Blue Lagoon", "Pink Lemonade",
        "Chicken Container"
    ];

    let totalQuantity = 0;
    const dishList = dishes.map(dish => {
        const quantity = parseInt(order[dish], 10) || 0;
        if (quantity > 0) {
            totalQuantity += quantity;
            return `<li><strong>${dish}:</strong> ${quantity}</li>`;
        }
        return ''; // Do not display if quantity is 0
    }).join('');

    return `${dishList}
            <p><strong>Total Dishes:</strong> ${totalQuantity}</p>`;
}
