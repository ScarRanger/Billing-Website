import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const db = getFirestore();
const ordersRef = collection(db, process.env.FIREBASE_COLLECTION_NAME || 'orders');

// === 1. ORDER CUBES HANDLING ===

function updateOrderCubes(orders) {
    const orderCubesContainer = document.getElementById('orderCubes');
    orderCubesContainer.innerHTML = ''; // Clear previous cubes

    orders.forEach(order => {
        const cube = document.createElement('div');
        cube.className = 'orderCube';
        cube.textContent = `#${order.orderNumber}`;
        if (order.done) {
            cube.classList.add('done');
        }
        orderCubesContainer.appendChild(cube);
    });

    removeOutOfScreenCubes();
}

function removeOutOfScreenCubes() {
    const container = document.getElementById('orderCubes');
    const containerWidth = container.offsetWidth;
    let totalWidth = 0;
    const cubes = container.querySelectorAll('.orderCube');

    cubes.forEach(cube => {
        totalWidth += cube.offsetWidth + 10; // cube width + gap
        if (totalWidth > containerWidth) {
            cube.remove();
        }
    });
}

// Firestore live listener for orders, fetching the orders and displaying the cubes
const q = query(ordersRef, orderBy("timestamp", "asc"));
onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() });
    });

    updateOrderCubes(orders); // Call to update the order cubes
});

// === 2. BILLING FORM HANDLING ===

document.addEventListener('DOMContentLoaded', () => {
    const prices = {
        "Item1": 100,
        "Item2": 150,
        "Item3": 200,
        "Item4": 250,
        "Drink1": 50,
        "Drink2": 50,
        "Drink3": 50,
        "Special1": 300,
        "Special2": 350
    };

    let totalAmount = 0;

    function getCustomAmount() {
        return parseInt(document.getElementById('customAmount').value) || 0;
    }

    function updateTotal() {
        const dishTotal = Object.keys(prices).reduce((sum, dish) => {
            const quantity = parseInt(document.getElementById(dish).value) || 0;
            return sum + (prices[dish] * quantity);
        }, 0);
        const custom = getCustomAmount();
        totalAmount = dishTotal + custom;
        document.getElementById('totalAmount').textContent = totalAmount;
    }

    // Handle + / - buttons
    document.querySelectorAll('.increase').forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            input.value = parseInt(input.value || 0) + 1;
            updateTotal();
        });
    });

    document.querySelectorAll('.decrease').forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.nextElementSibling;
            input.value = Math.max(0, parseInt(input.value || 0) - 1);
            updateTotal();
        });
    });

    // Direct manual input
    document.querySelectorAll('.dish input').forEach((input) => {
        input.addEventListener('input', () => {
            input.value = Math.max(0, parseInt(input.value) || 0);
            updateTotal();
        });
    });

    // Custom amount input
    document.getElementById('customAmount').addEventListener('input', () => {
        updateTotal();
    });

    // Finalize Order Button
    document.getElementById('finalizeOrder').addEventListener('click', async () => {
        const finalizeButton = document.getElementById('finalizeOrder');
        const spinner = finalizeButton.querySelector('.spinner');

        finalizeButton.disabled = true;
        spinner.style.display = 'inline-block';
        finalizeButton.childNodes[1].textContent = ' Finalizing...';

        const paymentModeContainer = document.getElementById('paymentMode');
        let paymentMode = "Cash"; // Default
        if (paymentModeContainer) {
            const selectedPayment = paymentModeContainer.querySelector('input[name="paymentMode"]:checked');
            if (selectedPayment) {
                paymentMode = selectedPayment.value;
            }
        }

        const customAmount = getCustomAmount();
        const notes = document.getElementById('notes').value;
        const customerName = document.getElementById('customerName').value;

        const orderData = {
            paymentMode,
            totalAmount,
            customAmount,
            notes,
            customerName,
            "Pork Chilly": document.getElementById('Pork Chilly').value,
            "Pork Vindaloo": document.getElementById('Pork Vindaloo').value,
            "Pork Sarpotel": document.getElementById('Pork Sarpotel').value,
            "Pork Sukha": document.getElementById('Pork Sukha').value,
            "Chicken Bhujing": document.getElementById('Chicken Bhujing').value,
            "Pattice": document.getElementById('Pattice').value,
            "Pattice Pav": document.getElementById('Pattice Pav').value,
            "Omelette Pav": document.getElementById('Omelette Pav').value,
            "Mojito": document.getElementById('Mojito').value,
            "Blue Lagoon": document.getElementById('Blue Lagoon').value,
            "Orange Lemonade": document.getElementById('Orange Lemonade').value,
            "Chicken Container": document.getElementById('Chicken Container').value
        };

        try {
            const firestoreResponse = await fetch("/api/logToFirestore", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (firestoreResponse.ok) {
                const firestoreData = await firestoreResponse.json();
                alert(`Order Finalized! Order Number: ${firestoreData.orderNumber}`);
                resetForm();
            } else {
                throw new Error('Failed to submit order!');
            }
        } catch (error) {
            console.error('Error finalizing order:', error);
            alert('Something went wrong!');
        }

        finalizeButton.disabled = false;
        spinner.style.display = 'none';
        finalizeButton.childNodes[1].textContent = ' Finalize Order';
    });

    function resetForm() {
        document.querySelectorAll('.dish input').forEach(input => {
            input.value = 0;
        });
        document.getElementById('customAmount').value = "";
        document.getElementById('notes').value = "";
        document.getElementById('customerName').value = "";
        document.getElementById('totalAmount').textContent = '0';

        // Reset payment mode to Cash
        const cashRadio = document.querySelector('input[name="paymentMode"][value="Cash"]');
        if (cashRadio) {
            cashRadio.checked = true;
        }
    }

    // On initial load: Default Cash selected
    const cashRadio = document.querySelector('input[name="paymentMode"][value="Cash"]');
    if (cashRadio) {
        cashRadio.checked = true;
    }
});
