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



    function updateTotal() {
        const dishTotal = Object.keys(prices).reduce((sum, key) => {
            const quantity = parseInt(document.getElementById(key).value) || 0;
            return sum + (prices[key] * quantity);
        }, 0);
        totalAmount = dishTotal;
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



    document.getElementById('finalizeOrder').addEventListener('click', async () => {
        const finalizeButton = document.getElementById('finalizeOrder');
        const spinner = finalizeButton.querySelector('.spinner');
        finalizeButton.disabled = true;
        spinner.style.display = 'inline-block';
        finalizeButton.childNodes[1].textContent = ' Finalizing...';

        const customerName = document.getElementById('customerName').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const pickupTime = document.getElementById('pickupTime').value;
        const transactionId = document.getElementById('transactionId').value;
        const paymentScreenshot = document.getElementById('paymentScreenshot').files[0];

        if (!pickupTime || !transactionId || !paymentScreenshot) {
            alert('Please fill all required fields!');
            finalizeButton.disabled = false;
            spinner.style.display = 'none';
            finalizeButton.childNodes[1].textContent = ' Finalize Preorder';
            return;
        }

        // Convert payment screenshot to Base64
        const paymentScreenshotBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Get Base64 string
            reader.onerror = reject;
            reader.readAsDataURL(paymentScreenshot);
        });

        const orderData = {
            customerName,
            customerPhone,
            pickupTime,
            transactionId,
            paymentScreenshot: paymentScreenshotBase64,
            totalAmount,
            dishes: Object.keys(prices).reduce((acc, dish) => {
                acc[dish] = document.getElementById(dish).value || 0;
                return acc;
            }, {}),
        };

        try {
            const response = await fetch('/api/preorders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            if (response.ok) {
                const result = await response.json();
                alert('Preorder finalized successfully! Collect the order from CYP Stall');
                console.log('Payment Screenshot URL:', result.publicUrl);
                resetForm();
            } else {
                throw new Error('Failed to log preorder');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong!');
        }

        finalizeButton.disabled = false;
        spinner.style.display = 'none';
        finalizeButton.childNodes[1].textContent = ' Finalize Preorder';
    });

    function resetForm() {
        document.querySelectorAll('.dish input').forEach(input => {
            input.value = 0;
        });

        // Reset total amount
        document.getElementById('totalAmount').textContent = '0';

        // Clear customer details
        document.getElementById('customerName').value = "";
        document.getElementById('customerPhone').value = "";
        document.getElementById('pickupTime').value = "";
        document.getElementById('transactionId').value = "";
        document.getElementById('paymentScreenshot').value = ""; // Clear file input


    }

    // Set Cash as default selected on initial load

});