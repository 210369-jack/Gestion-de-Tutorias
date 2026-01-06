console.log("El script se cargó correctamente"); // Mensaje para verificar carga

document.getElementById('loginForm').addEventListener('submit', async function(evento) {
    evento.preventDefault();
    
    const email = document.querySelector('[name="correo"]').value;
    const password = document.querySelector('[name="password"]').value;
    const rol = document.querySelector('[name="rol"]').value;

    try {
        const respuesta = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                correo: email, 
                password: password,
                rol: rol 
            })
        });

        if (respuesta.redirected) {
            // Si el servidor redirige, seguimos la redirección
            window.location.href = respuesta.url;
        } else {
            const datos = await respuesta.text();
            document.body.innerHTML = datos; // Muestra la respuesta del servidor
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con el servidor");
    }
});