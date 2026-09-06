document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");

    if (!form) return;

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const data = {

            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value

        };

        try {

            const response = await fetch("/website/login", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(data)

            });

            const result = await response.json();

            if (result.status) {

                alert(result.message);

                window.location.href = "/website";

            } else {

                alert(result.message);

            }

        } catch (error) {

            console.error(error);

            alert("Login failed.");

        }

    });

});