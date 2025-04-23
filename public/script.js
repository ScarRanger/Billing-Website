document.addEventListener('DOMContentLoaded', () => {
    const prices = {
        "Pork Chilly": 100,
        "Pork Vindaloo": 100,
        "Pork Sarpotel": 100,
        "Pork Sukha": 100,
        "Chicken Bhujing": 100,
        "Pattice": 25,
        "Pattice Pav": 30,
        "Omelette Pav": 30,
        "Mojito": 50,
        "Blue Lagoon": 50,
        "Pink Lemonade": 50,
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

        const paymentMode = document.getElementById('paymentMode').value;
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
            "Pink Lemonade": document.getElementById('Pink Lemonade').value,
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
        document.getElementById('paymentMode').value = "Cash";
        document.getElementById('totalAmount').textContent = '0';
        document.getElementById('customerName').value = "";

    }
});
