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

    // Initialize the total amount
    let totalAmount = 0;

    // Update the total amount display
    function updateTotal() {
        document.getElementById('totalAmount').textContent = totalAmount;
    }

    // Handle quantity increase or decrease
    document.querySelectorAll('.increase').forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const dishName = input.id;
            const quantity = parseInt(input.value) + 1;
            input.value = quantity;
            totalAmount += prices[dishName];
            updateTotal();
        });
    });

    document.querySelectorAll('.decrease').forEach((button) => {
        button.addEventListener('click', () => {
            const input = button.nextElementSibling;
            const dishName = input.id;
            const quantity = Math.max(0, parseInt(input.value) - 1); // Prevent going below 0
            input.value = quantity;
            totalAmount -= prices[dishName];
            updateTotal();
        });
    });

    // Handle direct input changes
    document.querySelectorAll('.dish input').forEach((input) => {
        input.addEventListener('input', () => {
            // Ensure the value is an integer and non-negative
            input.value = Math.max(0, parseInt(input.value) || 0);
            
            // Update the total amount based on the new quantity
            const dishName = input.id;
            const quantities = Array.from(document.querySelectorAll('.dish input')).reduce((acc, input) => {
                acc[input.id] = parseInt(input.value) || 0;
                return acc;
            }, {});
            
            totalAmount = Object.keys(quantities).reduce((sum, key) => sum + (prices[key] * quantities[key]), 0);
            updateTotal();
        });
    });

    // Finalize order
    document.getElementById('finalizeOrder').addEventListener('click', async () => {
        const finalizeButton = document.getElementById('finalizeOrder');
        finalizeButton.disabled = true;
        const originalText = finalizeButton.textContent;
        finalizeButton.textContent = "Submitting...";

        const paymentMode = document.getElementById('paymentMode').value;
        const orderData = {
            timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            paymentMode,
            totalAmount,
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
            "Chicken Container": document.getElementById('Chicken Container').value,
            notes: "" // Optional notes can be added here
        };

        try {
            const [firestoreResponse, sheetResponse] = await Promise.all([
                fetch("/api/logToFirestore", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                }),
                fetch("/api/logToSheet", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                })
            ]);

            if (firestoreResponse.ok && sheetResponse.ok) {
                alert('Order Finalized!');
                resetForm();
            } else {
                throw new Error('Failed to submit data');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong!');
        }

        finalizeButton.disabled = false;
        finalizeButton.textContent = originalText;
    });


    // Function to reset the form
    function resetForm() {
        document.querySelectorAll('.dish input').forEach(input => {
            input.value = 0;
        });

        document.getElementById('paymentMode').value = "Cash"; // Reset payment mode to default
        document.getElementById('totalAmount').textContent = '0'; // Reset total amount
    }
});
