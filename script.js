console.log("El script se cargó correctamente"); // Mensaje para verificar carga

document.getElementById('loginForm').addEventListener('submit', async function(evento) {
    evento.preventDefault(); // 1. ESTO EVITA QUE LA PÁGINA SE RECARGUE
    alert("¡Click detectado! Enviando datos..."); // PRUEBA A: ¿Sale esta alerta?

    // Capturamos los elementos
    const cajaEmail = document.getElementById('emailInput');
    const cajaPass = document.getElementById('passwordInput');

    // Verificamos si existen
    if (!cajaEmail || !cajaPass) {
        alert("ERROR: No encuentro las cajas de texto. Revisa los IDs en el HTML.");
        return;
    }

    const email = cajaEmail.value;
    const password = cajaPass.value;

    try {
        const respuesta = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            alert("✅ Login correcto. Redirigiendo a HU2...");
            window.location.href = "HU2.html"; 
        } else {
            alert("❌ Error: " + datos.error);
        }

    } catch (error) {
        console.error(error);
        alert("⚠️ Error de conexión: Asegúrate de que 'node server.js' esté corriendo.");
    }
});