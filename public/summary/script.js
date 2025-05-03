import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
    getFirestore,
    collection,
    onSnapshot,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyClexhIGp7WV4r8FU3sOouwzAF_vWqvg4k",
    authDomain: "cypmain-171b3.firebaseapp.com",
    projectId: "cypmain-171b3",
    storageBucket: "cypmain-171b3.appspot.com",
    messagingSenderId: "108819960879",
    appId: "1:108819960879:web:1c9d15d53cd1bf3dac62da"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const summaryList = document.getElementById('orderSummary');
const ordersRef = collection(db, "VU_billing");

// Updated dish prices
const dishPrices = {
    "Pork Chilly": 200,
    "Pork Vindaloo": 220,
    "Pork Sarpotel": 220,
    "Pork Sukha": 200,
    "Chicken Bhujing": 150,
    "Pattice": 20,
    "Pattice Pav": 25,
    "Omelette Pav": 30,
    "Mojito": 50,
    "Blue Lagoon": 50,
    "Orange Lemonade": 50,
    "Chicken Container": 150,
    "Mineral Water": 20 
};

document.addEventListener("DOMContentLoaded", () => {
    onSnapshot(ordersRef, (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: doc.id,
                ...data
            });
        });
        renderOrders(orders);
    });
});

document.addEventListener("click", function (e) {
    if (e.target.classList.contains("qty-btn")) {
        const action = e.target.getAttribute("data-action");
        const input = e.target.parentElement.querySelector("input");
        let current = parseInt(input.value) || 0;

        if (action === "increase") current++;
        if (action === "decrease" && current > 0) current--;

        input.value = current;
    }
});


function renderOrders(orders) {
    orders.sort((a, b) => {
        const aNum = parseInt(a.orderNumber) || 0;
        const bNum = parseInt(b.orderNumber) || 0;
        return bNum - aNum;
    });

    summaryList.innerHTML = "";

    orders.forEach(order => {
        const orderCard = document.createElement("div");
        orderCard.className = "order-card";
        if (order.done) orderCard.classList.add("done");

        const finalizedAt = order.finalizedAt?.toDate?.() || order.timestamp?.toDate?.() || new Date();
        const dishSummary = renderDishes(order);
        const dishInputs = renderDishInputs(order);

        orderCard.innerHTML = `
            <div class="order-header">
                <h2 style="color: red;">Order #${order.orderNumber}</h2>
                <p><strong>Customer Name:</strong> <span class="customer-name">${order.customerName}</span></p>
                <input type="text" class="edit-customer-name" value="${order.customerName}" style="display: none;" />

                <p><strong>Payment Mode:</strong> <span class="payment-mode">${order.paymentMode}</span></p>
                <select class="edit-payment-mode" style="display: none;">
                    <option value="Cash" ${order.paymentMode === "Cash" ? "selected" : ""}>Cash</option>
                    <option value="UPI" ${order.paymentMode === "UPI" ? "selected" : ""}>UPI</option>
                </select>

                <p><strong>Total Amount:</strong> ₹<span class="amount-value">${order.totalAmount}</span></p>
                <p><strong>Timestamp:</strong> ${new Date(finalizedAt).toLocaleString()}</p>
            </div>

            <div class="order-details">
                <h4>Dish Summary:</h4>
                <ol type="A" class="dish-list" style="font-size: 1.2em; color: red;" >${dishSummary}</ol>
                <div class="dish-inputs" style="display: none;">${dishInputs}</div>
            </div>

            <div class="order-notes">
                <h4>Notes:</h4>
                <p contenteditable="false" class="notes-content">${order.notes || "No notes provided"}</p>
            </div>

            <input type="number" class="edit-amount" value="${order.totalAmount}" style="display: none;" />

            <button class="edit-btn">Edit</button>
            <button class="save-edit-btn" style="display: none;">Save</button>

            <button class="mark-done" data-id="${order.id}" ${order.done ? "disabled" : ""}>
                ${order.done ? "✔ Marked Done" : "Mark as Done"}
            </button>
        `;

        summaryList.appendChild(orderCard);

        const editBtn = orderCard.querySelector(".edit-btn");
        const saveEditBtn = orderCard.querySelector(".save-edit-btn");
        const dishList = orderCard.querySelector(".dish-list");
        const dishInputsDiv = orderCard.querySelector(".dish-inputs");
        const notes = orderCard.querySelector(".notes-content");
        const amountInput = orderCard.querySelector(".edit-amount");
        const markBtn = orderCard.querySelector(".mark-done");
        const amountValueSpan = orderCard.querySelector(".amount-value");

        const customerNameSpan = orderCard.querySelector(".customer-name");
        const customerNameInput = orderCard.querySelector(".edit-customer-name");
        const paymentModeSpan = orderCard.querySelector(".payment-mode");
        const paymentModeSelect = orderCard.querySelector(".edit-payment-mode");

        editBtn.addEventListener("click", () => {
            editBtn.style.display = "none";
            saveEditBtn.style.display = "inline-block";
            dishList.style.display = "none";
            dishInputsDiv.style.display = "block";
            notes.contentEditable = true;
            amountInput.style.display = "inline-block";

            customerNameSpan.style.display = "none";
            customerNameInput.style.display = "inline-block";

            paymentModeSpan.style.display = "none";
            paymentModeSelect.style.display = "inline-block";
        });

        saveEditBtn.addEventListener("click", async () => {
            editBtn.style.display = "inline-block";
            saveEditBtn.style.display = "none";
            dishList.style.display = "block";
            dishInputsDiv.style.display = "none";
            notes.contentEditable = false;
            amountInput.style.display = "none";

            customerNameSpan.style.display = "inline-block";
            customerNameInput.style.display = "none";

            paymentModeSpan.style.display = "inline-block";
            paymentModeSelect.style.display = "none";

            const updatedFields = {
                notes: notes.innerText.trim(),
                customerName: customerNameInput.value.trim(),
                paymentMode: paymentModeSelect.value
            };

            const inputs = dishInputsDiv.querySelectorAll("input");
            let calculatedTotal = 0;
            const dishQuantities = {};

            inputs.forEach(input => {
                const name = input.name;
                const qty = parseInt(input.value);
                const safeQty = isNaN(qty) ? 0 : qty;
                updatedFields[name] = safeQty;
                dishQuantities[name] = safeQty;

                if (dishPrices[name]) {
                    calculatedTotal += safeQty * dishPrices[name];
                }
            });

            updatedFields.totalAmount = calculatedTotal;
            amountInput.value = calculatedTotal;
            amountValueSpan.textContent = calculatedTotal;
            dishList.innerHTML = renderDishes({ ...order, ...dishQuantities });

            try {
                const orderDocRef = doc(db, "VU_billing", order.id);
                await updateDoc(orderDocRef, updatedFields);
            } catch (err) {
                console.error("Failed to update order:", err);
            }
        });

        markBtn.addEventListener("click", async () => {
            markBtn.disabled = true;
            markBtn.textContent = "✔ Marked Done";

            try {
                const orderDocRef = doc(db, "VU_billing", order.id);
                const finalizedAt = new Date();
                await updateDoc(orderDocRef, { done: true, finalizedAt });

                // Optional: Call API to log to Google Sheets
                await fetch("/api/logToSheet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...order, done: true, finalizedAt })
                });

                orderCard.classList.add("done");
            } catch (err) {
                console.error("Error marking as done:", err);
                markBtn.disabled = false;
                markBtn.textContent = "Mark as Done";
            }
        });
    });
}

function renderDishes(order) {
    return getDishList()
        .map(dish => {
            const qty = parseInt(order[dish], 10) || 0;
            return qty > 0 ? `<li><strong>${dish}:</strong> ${qty}</li>` : '';
        })
        .join("");
}

function renderDishInputs(order) {
    return getDishList()
        .map(dish => {
            const qty = parseInt(order[dish], 10) || 0;
            return `
                <div class="dish-row">
                    <span class="dish-name">${dish}</span>
                    <div class="qty-controls">
                        <button type="button" class="qty-btn" data-action="decrease" data-dish="${dish}">−</button>
                        <input type="number" name="${dish}" value="${qty}" min="0" />
                        <button type="button" class="qty-btn" data-action="increase" data-dish="${dish}">+</button>
                    </div>
                </div>
            `;
        })
        .join("");
}


function getDishList() {
    return [
        "Pork Chilly", "Pork Vindaloo", "Pork Sarpotel", "Pork Sukha",
        "Chicken Bhujing", "Pattice", "Pattice Pav", "Omelette Pav",
        "Mojito", "Blue Lagoon", "Orange Lemonade", "Chicken Container","Mineral Water"
    ];
}
