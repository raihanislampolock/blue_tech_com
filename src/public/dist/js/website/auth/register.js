document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");

    if (!form) return;

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const formData = {

            customerName: document.getElementById("customerName").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            company: document.getElementById("company").value.trim(),
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            country: document.getElementById("country").value.trim(),
            password: document.getElementById("password").value

        };

        try {

            const response = await fetch("/website/register", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(formData)

            });

            const result = await response.json();

            if (result.status) {

                alert(result.message);

                window.location.href = "/website/login";

            } else {

                alert(result.message);

            }

        } catch (error) {

            console.error(error);

            alert("Registration failed.");

        }

    });

});