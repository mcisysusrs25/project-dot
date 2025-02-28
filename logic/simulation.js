// Universe setup
const universe = document.getElementById('universe');
const starsContainer = document.getElementById('stars');
const statsDisplay = document.getElementById('stats');
const messageBox = document.getElementById('message');

// Controls
const gravitySlider = document.getElementById('gravity');
const elasticitySlider = document.getElementById('elasticity');
const particleCountSlider = document.getElementById('particleCount');
const resetBtn = document.getElementById('resetBtn');
const explosionBtn = document.getElementById('explosionBtn');
const vorticityBtn = document.getElementById('vorticityBtn');

// Physics parameters
let gravity = parseFloat(gravitySlider.value) / 1000;
let elasticity = parseFloat(elasticitySlider.value) / 100;
let particleCount = parseInt(particleCountSlider.value);

// Mouse interaction
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;
let draggedParticle = null;
let particleRadius = 4; // Half of particle width

// Particles storage
let particles = [];
let lines = [];
let activeConnections = 0;
let isSimulationRunning = true;

// Create stars background
function createStars() {
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.opacity = Math.random() * 0.8 + 0.2;
        starsContainer.appendChild(star);
        
        // Twinkle animation
        setInterval(() => {
            star.style.opacity = Math.random() * 0.8 + 0.2;
        }, Math.random() * 5000 + 2000);
    }
}

// Initialize particles
function createParticles(count) {
    // Clear existing particles
    particles.forEach(p => p.element.remove());
    particles = [];
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random position
        const x = Math.random() * (universe.clientWidth - 20) + 10;
        const y = Math.random() * (universe.clientHeight - 20) + 10;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        universe.appendChild(particle);
        
        // Physics properties
        const particleObj = {
            element: particle,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            mass: Math.random() * 2 + 0.5,
            connections: []
        };
        
        particles.push(particleObj);
        
        // Interaction events
        particle.addEventListener('mousedown', (e) => {
            draggedParticle = particleObj;
            particle.classList.add('dragging');
            isMouseDown = true;
            e.preventDefault();
        });
        
        particle.addEventListener('touchstart', (e) => {
            draggedParticle = particleObj;
            particle.classList.add('dragging');
            const touch = e.touches[0];
            mouseX = touch.clientX;
            mouseY = touch.clientY;
            e.preventDefault();
        });
    }
}

// Physics engine
function updateParticles() {
    if (!isSimulationRunning) return;
    
    particles.forEach(p => {
        if (p === draggedParticle) return;
        
        // Apply gravity
        p.vy += gravity;
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        
        // Boundary collision
        if (p.x < particleRadius) {
            p.x = particleRadius;
            p.vx = -p.vx * elasticity;
        } else if (p.x > universe.clientWidth - particleRadius) {
            p.x = universe.clientWidth - particleRadius;
            p.vx = -p.vx * elasticity;
        }
        
        if (p.y < particleRadius) {
            p.y = particleRadius;
            p.vy = -p.vy * elasticity;
        } else if (p.y > universe.clientHeight - particleRadius) {
            p.y = universe.clientHeight - particleRadius;
            p.vy = -p.vy * elasticity;
        }
        
        // Apply friction
        p.vx *= 0.995;
        p.vy *= 0.995;
        
        // Particle-particle collision
        particles.forEach(p2 => {
            if (p === p2) return;
            
            const dx = p2.x - p.x;
            const dy = p2.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = particleRadius * 2;
            
            // Check for collision
            if (distance < minDistance) {
                // Calculate collision response
                const angle = Math.atan2(dy, dx);
                const targetX = p.x + Math.cos(angle) * minDistance;
                const targetY = p.y + Math.sin(angle) * minDistance;
                const ax = (targetX - p2.x) * 0.05;
                const ay = (targetY - p2.y) * 0.05;
                
                p.vx -= ax * p2.mass / p.mass;
                p.vy -= ay * p2.mass / p.mass;
                p2.vx += ax * p.mass / p2.mass;
                p2.vy += ay * p.mass / p2.mass;
                
                // Make particles glow when they collide
                p.element.classList.add('active');
                p2.element.classList.add('active');
                
                setTimeout(() => {
                    p.element.classList.remove('active');
                    p2.element.classList.remove('active');
                }, 300);
                
                // Create a connection if close enough
                if (distance < minDistance * 4 && !p.connections.includes(p2) && lines.length < 50) {
                    connectParticles(p, p2);
                }
            }
        });
        
        // Update element position
        p.element.style.left = `${p.x - particleRadius}px`;
        p.element.style.top = `${p.y - particleRadius}px`;
    });
    
    // Update connections
    updateLines();
    
    // Update stats
    statsDisplay.textContent = `Active Connections: ${activeConnections}`;
    
    requestAnimationFrame(updateParticles);
}

// Connect two particles with a line
function connectParticles(p1, p2) {
    const line = document.createElement('div');
    line.className = 'line';
    document.body.appendChild(line);
    
    p1.connections.push(p2);
    p2.connections.push(p1);
    
    const connection = {
        element: line,
        p1: p1,
        p2: p2,
        lifetime: Math.random() * 100 + 50 // Random lifetime
    };
    
    lines.push(connection);
    activeConnections++;
}

// Update lines connecting particles
function updateLines() {
    // Remove dead connections
    lines = lines.filter(connection => {
        connection.lifetime--;
        
        if (connection.lifetime <= 0) {
            connection.element.remove();
            
            // Remove connection from particles
            const idx1 = connection.p1.connections.indexOf(connection.p2);
            if (idx1 > -1) connection.p1.connections.splice(idx1, 1);
            
            const idx2 = connection.p2.connections.indexOf(connection.p1);
            if (idx2 > -1) connection.p2.connections.splice(idx2, 1);
            
            activeConnections--;
            return false;
        }
        return true;
    });
    
    // Update remaining connections
    lines.forEach(connection => {
        const p1 = connection.p1;
        const p2 = connection.p2;
        
        const x1 = p1.x;
        const y1 = p1.y;
        const x2 = p2.x;
        const y2 = p2.y;
        
        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        
        connection.element.style.width = `${length}px`;
        connection.element.style.transform = `rotate(${angle}deg)`;
        connection.element.style.left = `${x1}px`;
        connection.element.style.top = `${y1}px`;
        
        // Apply spring force to particles
        const springForce = 0.0003;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distanceRatio = (length - 50) / 100;
        
        if (p1 !== draggedParticle) {
            p1.vx += dx * distanceRatio * springForce;
            p1.vy += dy * distanceRatio * springForce;
        }
        
        if (p2 !== draggedParticle) {
            p2.vx -= dx * distanceRatio * springForce;
            p2.vy -= dy * distanceRatio * springForce;
        }
        
        // Make line glow based on tension
        const tension = Math.abs(distanceRatio);
        if (tension > 0.8) {
            connection.element.style.boxShadow = `0 0 12px 4px var(--line-glow)`;
            connection.element.style.height = `3px`;
        } else {
            connection.element.style.boxShadow = `0 0 8px 2px var(--line-glow)`;
            connection.element.style.height = `2px`;
        }
        
        // Line breaking probability
        if (tension > 1.5 && Math.random() < 0.1) {
            connection.lifetime = 0;
        }
    });
}

// Mouse/touch handling
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (isMouseDown && draggedParticle) {
        draggedParticle.x = mouseX;
        draggedParticle.y = mouseY;
        draggedParticle.vx = 0;
        draggedParticle.vy = 0;
    }
});

document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    mouseX = touch.clientX;
    mouseY = touch.clientY;
    
    if (draggedParticle) {
        draggedParticle.x = mouseX;
        draggedParticle.y = mouseY;
        draggedParticle.vx = 0;
        draggedParticle.vy = 0;
    }
    
    e.preventDefault();
});

document.addEventListener('mouseup', () => {
    isMouseDown = false;
    if (draggedParticle) {
        draggedParticle.element.classList.remove('dragging');
        draggedParticle = null;
    }
});

document.addEventListener('touchend', () => {
    if (draggedParticle) {
        draggedParticle.element.classList.remove('dragging');
        draggedParticle = null;
    }
});

// Special effects
function cosmicExplosion() {
    // First freeze simulation
    isSimulationRunning = false;
    
    // Show message
    messageBox.style.display = 'block';
    
    // Wait a moment
    setTimeout(() => {
        // Hide message and resume
        messageBox.style.display = 'none';
        isSimulationRunning = true;
        
        // Apply explosion force
        const centerX = universe.clientWidth / 2;
        const centerY = universe.clientHeight / 2;
        
        particles.forEach(p => {
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Explosion force decreases with distance
            const force = 20 * (1 - Math.min(distance, 500) / 500);
            
            p.vx += Math.cos(angle) * force;
            p.vy += Math.sin(angle) * force;
            
            // Make particles glow
            p.element.classList.add('active');
            setTimeout(() => {
                p.element.classList.remove('active');
            }, 1000 + Math.random() * 1000);
        });
        
        // Clear existing connections
        lines.forEach(line => line.element.remove());
        lines = [];
        particles.forEach(p => p.connections = []);
        activeConnections = 0;
        
        // Restore simulation
        updateParticles();
    }, 1500);
}

function createVortex() {
    const centerX = universe.clientWidth / 2;
    const centerY = universe.clientHeight / 2;
    
    particles.forEach(p => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Tangential force (perpendicular to radius)
        const force = 0.2 * (1 - Math.min(distance, 300) / 300);
        
        p.vx += -Math.sin(angle) * force * 10;
        p.vy += Math.cos(angle) * force * 10;
        
        // Slight inward pull
        p.vx += -Math.cos(angle) * force * 2;
        p.vy += -Math.sin(angle) * force * 2;
    });
}

// Event listeners for controls
gravitySlider.addEventListener('input', () => {
    gravity = parseFloat(gravitySlider.value) / 1000;
});

elasticitySlider.addEventListener('input', () => {
    elasticity = parseFloat(elasticitySlider.value) / 100;
});

particleCountSlider.addEventListener('input', () => {
    particleCount = parseInt(particleCountSlider.value);
    createParticles(particleCount);
});

resetBtn.addEventListener('click', () => {
    lines.forEach(line => line.element.remove());
    lines = [];
    createParticles(particleCount);
    activeConnections = 0;
});

explosionBtn.addEventListener('click', cosmicExplosion);
vorticityBtn.addEventListener('click', createVortex);

// Initialize
createStars();
createParticles(particleCount);
updateParticles();