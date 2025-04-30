document.addEventListener('DOMContentLoaded', () => {
    const prices = {
        "Mojito": 50,
        "Blue Lagoon": 50,
        "Orange Lemonade": 50
    };

    let totalAmount = 0;

    function getCustomAmount() {
        const input = document.getElementById('customAmount');
        return input ? parseInt(input.value) || 0 : 0;
    }

    function updateTotal() {
        const dishTotal = Object.keys(prices).reduce((sum, key) => {
            const input = document.getElementById(key);
            if (input) {
                const quantity = parseInt(input.value) || 0;
                return sum + (prices[key] * quantity);
            }
            return sum;
        }, 0);
        const custom = getCustomAmount();
        totalAmount = dishTotal + custom;
        const totalAmountElement = document.getElementById('totalAmount');
        if (totalAmountElement) {
            totalAmountElement.textContent = totalAmount;
        }
    }

    document.querySelectorAll('.increase').forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            if (input) {
                const quantity = parseInt(input.value) + 1;
                input.value = quantity;
                updateTotal();
            }
        });
    });

    document.querySelectorAll('.decrease').forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.nextElementSibling;
            if (input) {
                const quantity = Math.max(0, parseInt(input.value) - 1);
                input.value = quantity;
                updateTotal();
            }
        });
    });

    document.querySelectorAll('.dish input').forEach((input) => {
        input.addEventListener('input', () => {
            input.value = Math.max(0, parseInt(input.value) || 0);
            updateTotal();
        });
    });

    const customAmountInput = document.getElementById('customAmount');
    if (customAmountInput) {
        customAmountInput.addEventListener('input', () => {
            updateTotal();
        });
    }

    document.getElementById('finalizeOrder').addEventListener('click', async () => {
        const finalizeButton = document.getElementById('finalizeOrder');
        const spinner = finalizeButton.querySelector('.spinner');
        finalizeButton.disabled = true;
        spinner.style.display = 'inline-block';
        finalizeButton.childNodes[1].textContent = ' Finalizing...';

        const paymentModeContainer = document.getElementById('paymentMode');
        let paymentMode = "Cash"; // default
        if (paymentModeContainer) {
            const selectedPayment = paymentModeContainer.querySelector('input[name="paymentMode"]:checked');
            if (selectedPayment) {
                paymentMode = selectedPayment.value;
            }
        }

        const customAmount = getCustomAmount();
        const notes = document.getElementById('notes')?.value || "";
        const customerName = document.getElementById('customerName')?.value || "";

        const orderData = {
            paymentMode,
            totalAmount,
            customAmount,
            notes,
            customerName
        };

        // Only add available dishes
        Object.keys(prices).forEach(dish => {
            const input = document.getElementById(dish);
            if (input) {
                orderData[dish] = input.value;
            }
        });

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
        const customAmountInput = document.getElementById('customAmount');
        if (customAmountInput) customAmountInput.value = "";
        const notesInput = document.getElementById('notes');
        if (notesInput) notesInput.value = "";
        const customerNameInput = document.getElementById('customerName');
        if (customerNameInput) customerNameInput.value = "";

        const totalAmountElement = document.getElementById('totalAmount');
        if (totalAmountElement) {
            totalAmountElement.textContent = '0';
        }

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
