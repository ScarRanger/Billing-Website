import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyClexhIGp7WV4r8FU3sOouwzAF_vWqvg4k",
    authDomain: "cypmain-171b3.firebaseapp.com",
    projectId: "cypmain-171b3",
    storageBucket: "cypmain-171b3.firebasestorage.app",
    messagingSenderId: "108819960879",
    appId: "1:108819960879:web:1c9d15d53cd1bf3dac62da"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const summaryList = document.getElementById('orderSummary');

const ordersRef = collection(db, "VU_billing");
const q = query(ordersRef, orderBy("orderNumber", "desc")); // Sort by orderNumber in descending order

const timers = {};

// Render and sort orders
function renderOrders(orders) {
    const doneOrders = getDoneOrders();
    const existingCards = new Map();

    orders.sort((a, b) => {
        const aDone = doneOrders.includes(a.id);
        const bDone = doneOrders.includes(b.id);
        const aNum = parseInt(a.orderNumber) || 0;
        const bNum = parseInt(b.orderNumber) || 0;

        // Sort unmarked orders first (descending by orderNumber)
        if (aDone !== bDone) return aDone ? 1 : -1;

        return bNum - aNum; // Order by orderNumber descending
    });

    document.querySelectorAll('.order-card').forEach(card => {
        const id = card.querySelector('.mark-done')?.dataset.id;
        if (id) existingCards.set(id, card);
    });

    const seenOrderIds = new Set();

    orders.forEach(order => {
        seenOrderIds.add(order.id);
        const isDone = doneOrders.includes(order.id);

        // Format finalized time for displaying
        const finalizedTime = order.finalizedAt instanceof Date
            ? order.finalizedAt.toLocaleString()
            : order.timestamp instanceof Date
                ? order.timestamp.toLocaleString()
                : new Date().toLocaleString();

        const existingCard = existingCards.get(order.id);
        const shouldPreserve = timers[order.id] && existingCard;

        const orderElement = document.createElement('div');
        orderElement.classList.add('order-card');
        if (isDone) orderElement.classList.add('done');

        orderElement.innerHTML = `
            <div class="order-header">
                <h3>Order #${order.orderNumber}</h3>
                <p><strong>Customer Name:</strong> ${order.customerName}</p>
                <p><strong>Payment Mode:</strong> ${order.paymentMode}</p>
                <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
                <p><strong>Timestamp:</strong> ${finalizedTime}</p>
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
            <button class="mark-undone" data-id="${order.id}" style="display: none;">Mark as Undone</button>
            <div class="progress-bar" style="display: none;"></div>
        `;

        if (existingCard) {
            if (shouldPreserve) {
                existingCard.querySelector('.order-header').innerHTML = orderElement.querySelector('.order-header').innerHTML;
                existingCard.querySelector('.order-details').innerHTML = orderElement.querySelector('.order-details').innerHTML;
                existingCard.querySelector('.order-notes').innerHTML = orderElement.querySelector('.order-notes').innerHTML;
            } else {
                summaryList.replaceChild(orderElement, existingCard);
            }
        } else {
            summaryList.insertBefore(orderElement, summaryList.firstChild); // Insert at the top
        }

        if (!shouldPreserve) {
            const btn = orderElement.querySelector('.mark-done');
            const markUndoneBtn = orderElement.querySelector('.mark-undone');
            const progressBar = orderElement.querySelector('.progress-bar');

            btn.addEventListener('click', async () => {
                if (timers[order.id]) return;

                btn.disabled = true;
                markUndoneBtn.style.display = 'inline-block';
                progressBar.style.display = 'block';

                let countdown = 10;
                progressBar.style.width = '0%';

                timers[order.id] = setInterval(() => {
                    countdown--;
                    progressBar.style.width = `${(10 - countdown) * 10}%`;

                    if (countdown <= 0) {
                        clearInterval(timers[order.id]);
                        delete timers[order.id];
                        processOrderDone(order, orderElement, btn);
                    }
                }, 1000);

                markUndoneBtn.addEventListener('click', () => {
                    clearInterval(timers[order.id]);
                    delete timers[order.id];
                    btn.disabled = false;
                    markUndoneBtn.style.display = 'none';
                    progressBar.style.display = 'none';
                    progressBar.style.width = '0%';
                    btn.textContent = 'Mark as Done';
                }, { once: true });
            });
        }
    });

    document.querySelectorAll('.order-card').forEach(card => {
        const id = card.querySelector('.mark-done')?.dataset.id;
        if (id && !seenOrderIds.has(id)) card.remove();
    });
}

// Mark order done + log to sheet
async function processOrderDone(order, orderCard, btn) {
    try {
        // Update the Firestore document to mark the order as done
        const orderRef = doc(db, "VU_billing", order.id);  // Use Firestore document reference
        await updateDoc(orderRef, {
            finalizedAt: new Date()  // Store the timestamp when the order is finalized
        });

        // Update UI
        btn.textContent = '✔ Marked Done';
        const latestCard = document.querySelector(`.mark-done[data-id="${order.id}"]`)?.closest('.order-card');
        if (latestCard) latestCard.classList.add('done');
        btn.disabled = true;
        setDoneOrders([...getDoneOrders(), order.id]);

        // Optionally log this to a spreadsheet or external system
        await logToSheet(order);

    } catch (err) {
        console.error("Error:", err);
        alert('Error logging order. Try again.');
        btn.disabled = false;
        btn.textContent = 'Mark as Done';
    }
}

async function logToSheet(order) {
    try {
        const response = await fetch("/api/logToSheet", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Sheet logging failed');
        console.log(`Order #${order.orderNumber} logged to sheet.`);
    } catch (err) {
        console.error("Error logging to sheet:", err);
    }
}

// On page load
document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();
    onSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: doc.id,
                ...data,
                finalizedAt: data.finalizedAt?.toDate ? data.finalizedAt.toDate() : null,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : null
            });
        });
        renderOrders(orders);
    });
});

// Load from backend
async function fetchOrders() {
    try {
        const response = await fetch('/api/getOrders');
        const orders = await response.json();

        if (Array.isArray(orders)) {
            renderOrders(orders);
        } else {
            summaryList.innerHTML = '<p>No orders available.</p>';
        }
    } catch (err) {
        summaryList.innerHTML = '<p>Error fetching orders.</p>';
        console.error(err);
    }
}

// Utilities
function getDoneOrders() {
    return JSON.parse(localStorage.getItem('doneOrders') || '[]');
}

function setDoneOrders(doneOrders) {
    localStorage.setItem('doneOrders', JSON.stringify(doneOrders));
}

function calculateDishTotal(order) {
    const dishList = [
        "Pork Chilly", "Pork Vindaloo", "Pork Sarpotel", "Pork Sukha", "Chicken Bhujing",
        "Pattice", "Pattice Pav", "Omelette Pav", "Mojito", "Blue Lagoon", "Pink Lemonade",
        "Chicken Container"
    ];
    return dishList.reduce((sum, dish) => sum + (parseInt(order[dish]) || 0), 0);
}

function renderDishes(order) {
    const dishes = [
        "Pork Chilly", "Pork Vindaloo", "Pork Sarpotel", "Pork Sukha", "Chicken Bhujing",
        "Pattice", "Pattice Pav", "Omelette Pav", "Mojito", "Blue Lagoon", "Pink Lemonade",
        "Chicken Container"
    ];
    let total = 0;
    const dishHTML = dishes.map(dish => {
        const qty = parseInt(order[dish], 10) || 0;
        if (qty > 0) {
            total += qty;
            return `<li><strong>${dish}:</strong> ${qty}</li>`;
        }
        return '';
    }).join('');
    return `${dishHTML}<p><strong>Total Dishes:</strong> ${total}</p>`;
}
