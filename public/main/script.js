document.addEventListener('DOMContentLoaded', () => {
    const prices = {
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
        "Chicken Container": 150
    };

    let totalAmount = 0;

    function getCustomAmount() {
        return parseInt(document.getElementById('customAmount').value) || 0;
    }

    function updateTotal() {
        const dishTotal = Object.keys(prices).reduce((sum, key) => {
            const quantity = parseInt(document.getElementById(key).value) || 0;
            return sum + (prices[key] * quantity);
        }, 0);
        const custom = getCustomAmount();
        totalAmount = dishTotal + custom;
        document.getElementById('totalAmount').textContent = totalAmount;
    }

    document.querySelectorAll('.increase').forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const dishName = input.id;
            const quantity = parseInt(input.value) + 1;
            input.value = quantity;
            updateTotal();
        });
    });

    document.querySelectorAll('.decrease').forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.nextElementSibling;
            const dishName = input.id;
            const quantity = Math.max(0, parseInt(input.value) - 1);
            input.value = quantity;
            updateTotal();
        });
    });

    document.querySelectorAll('.dish input').forEach((input) => {
        input.addEventListener('input', () => {
            input.value = Math.max(0, parseInt(input.value) || 0);
            updateTotal();
        });
    });

    document.getElementById('customAmount').addEventListener('input', () => {
        updateTotal();
    });

    document.getElementById('finalizeOrder').addEventListener('click', async () => {
        const finalizeButton = document.getElementById('finalizeOrder');
        const spinner = finalizeButton.querySelector('.spinner');
        finalizeButton.disabled = true;
        spinner.style.display = 'inline-block';
        finalizeButton.childNodes[1].textContent = ' Finalizing...';

        const paymentModeContainer = document.getElementById('paymentMode');
        let paymentMode = "";
        if (paymentModeContainer) {
            const selectedPayment = paymentModeContainer.querySelector('input[name="paymentMode"]:checked');
            if (selectedPayment) {
                paymentMode = selectedPayment.value;
            } else {
                paymentMode = "Cash"; // Default if none selected (shouldn't happen after setting default)
            }
        } else {
            console.error("Payment mode container not found!");
            paymentMode = "Cash"; // Fallback
        }

        const customAmount = getCustomAmount();
        const notes = document.getElementById('notes').value;
        const customerName = document.getElementById('customerName').value; // Get customer name

        const orderData = {
            paymentMode,
            totalAmount,
            customAmount,
            notes,
            customerName, // Include customer name
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
                alert(`Order Finalized! Order Number: ${firestoreData.orderNumber}`); // ✅ Here
                resetForm();
            } else {
                throw new Error('Failed to submit data');
            }

        } catch (error) {
            console.error('Error:', error);
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

        // No need to reset paymentMode here if you want the selection to persist
        document.getElementById('totalAmount').textContent = '0';
        document.getElementById('customerName').value = "";

        // Set Cash as default selected payment mode
        const cashRadio = document.querySelector('input[name="paymentMode"][value="Cash"]');
        if (cashRadio) {
            cashRadio.checked = true;
        }
    }

    // Set Cash as default selected on initial load
    const cashRadio = document.querySelector('input[name="paymentMode"][value="Cash"]');
    if (cashRadio) {
        cashRadio.checked = true;
    }
});