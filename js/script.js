document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // CONFIGURACIÓN
    // ==========================================
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwTEBwhr5eUYliva2qy1ZSMeBjKYqIBZBw2KbZpePjwdbP2e8cD23KZTYxnweH3St6OhQ/exec";

    // ==========================================
    // 1. CARGAR CARRERAS DINÁMICAMENTE (GET)
    // ==========================================
    async function loadCarreras() {
        const container = document.getElementById('carreras-container');
        const selectCarrera = document.getElementById('programa');

        try {
            const response = await fetch(APPS_SCRIPT_URL + '?action=getPrograms', {
                method: 'GET'
            });
            
            const result = await response.json();

            if (result.status !== 'success') {
                throw new Error(result.message);
            }

            const carreras = result.data;
            container.innerHTML = '';

            if (carreras.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted">Aún no hay carreras disponibles.</div>';
                return;
            }

            carreras.forEach((carrera) => {
                const titulo = carrera.titulo || 'Sin título';
                const descripcion = carrera.descripcion || 'Sin descripción';
                const imagenUrl = carrera.imagenUrl || 'https://via.placeholder.com/400x200?text=Sin+Imagen';
                
                const slug = titulo.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                const detailUrl = `carreras/${slug}.html`;

                const cardHTML = `
                    <div class="col">
                        <div class="card h-100 border-0 shadow-sm program-card">
                            <img src="${imagenUrl}" class="card-img-top" alt="${titulo}" onerror="this.src='https://via.placeholder.com/400x200?text=Imagen+no+disponible'">
                            <div class="card-body p-4 d-flex flex-column">
                                <h3 class="h6 fw-bold text-custom-primary">${titulo}</h3>
                                <p class="text-muted small flex-grow-1">${descripcion}</p>
                                <a href="${detailUrl}" class="btn-saber-mas">Saber más</a>
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', cardHTML);

                if (selectCarrera) {
                    const option = document.createElement('option');
                    option.value = titulo;
                    option.textContent = titulo;
                    selectCarrera.appendChild(option);
                }
            });

        } catch (error) {
            console.error('Error al cargar carreras:', error);
            container.innerHTML = '<div class="col-12 text-center text-danger">Error al cargar las carreras. Verifica la configuración del Sheet.</div>';
        }
    }
    loadCarreras();

    // ==========================================
    // 2. ENVÍO DEL FORMULARIO DE REGISTRO (POST)
    // ==========================================
    const registerForm = document.getElementById('registerForm');
    const formMessage = document.getElementById('form-message');

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            // ✅ CORRECCIÓN 1: El select tiene id="programa", no "carrera"
            const carrera = document.getElementById('programa').value;
            const edad = parseInt(document.getElementById('edad').value);

            // --- VALIDACIONES ---
            if (!nombre || !email || !telefono || !carrera || !edad) {
                formMessage.className = 'alert alert-danger';
                formMessage.textContent = 'Todos los campos son obligatorios.';
                formMessage.classList.remove('d-none');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                formMessage.className = 'alert alert-danger';
                formMessage.textContent = 'Ingresa un correo electrónico válido (ejemplo@dominio.com).';
                formMessage.classList.remove('d-none');
                return;
            }

            const phoneRegex = /^[0-9]{9}$/;
            if (!phoneRegex.test(telefono)) {
                formMessage.className = 'alert alert-danger';
                formMessage.textContent = 'El teléfono debe contener exactamente 9 números, sin letras ni espacios.';
                formMessage.classList.remove('d-none');
                return;
            }

            if (isNaN(edad) || edad < 15 || edad > 99) {
                formMessage.className = 'alert alert-danger';
                formMessage.textContent = 'La edad debe ser un número entre 15 y 99 años.';
                formMessage.classList.remove('d-none');
                return;
            }
            // --- FIN VALIDACIONES ---

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Registrando...';
            submitBtn.disabled = true;
            formMessage.classList.add('d-none');

            // ✅ CORRECCIÓN 2: Se envía "carrera" (que coincide con lo que espera Code.gs)
            const formData = {
                sheetName: 'Registros',
                nombre: nombre,
                email: email,
                telefono: telefono,
                carrera: carrera,
                edad: edad
            };

            try {
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                formMessage.className = 'alert alert-success';
                formMessage.textContent = '¡Registro exitoso! Bienvenido a Educatch.';
                formMessage.classList.remove('d-none');
                registerForm.reset();

            } catch (error) {
                console.error('Error:', error);
                formMessage.className = 'alert alert-danger';
                formMessage.textContent = 'Ocurrió un error al registrar. Inténtalo de nuevo.';
                formMessage.classList.remove('d-none');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 3. ENVÍO DEL NEWSLETTER (POST)
    // ==========================================
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterMessage = document.getElementById('newsletter-message');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const emailInput = document.getElementById('newsletterEmail');
            const email = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                newsletterMessage.className = 'small mt-2 error';
                newsletterMessage.textContent = 'Ingresa un correo válido.';
                return;
            }

            const formData = { sheetName: 'Suscriptores', email: email };

            try {
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                newsletterMessage.className = 'small mt-2 success';
                newsletterMessage.textContent = '¡Gracias por suscribirte!';
                emailInput.value = '';

                setTimeout(() => { newsletterMessage.textContent = ''; }, 3000);

            } catch (error) {
                console.error('Error:', error);
                newsletterMessage.className = 'small mt-2 error';
                newsletterMessage.textContent = 'Error al suscribirse. Intenta de nuevo.';
            }
        });
    }

    // ==========================================
    // 4. SCROLL SUAVE
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });
});