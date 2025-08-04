// Game variables
let canvas, ctx;
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let ammo = 10;
let timeLeft = 60;
let ducks = [];
let gameTimer;
let spawnTimer;

// Shooter variables
let shooterX = 0;
let shooterY = 0;
let mouseX = 0;
let mouseY = 0;
let gunAngle = 0;
let muzzleFlash = false;
let muzzleFlashTimer = 0;

// Game settings
const DUCK_SPEED = 2;
const DUCK_SPAWN_RATE = 1500; // milliseconds
const MAX_DUCKS = 5;

// Duck class
class Duck {
    constructor() {
        this.width = 60;
        this.height = 40;
        this.x = -this.width;
        this.y = Math.random() * (canvas.height - 200) + 50; // Keep ducks in upper area
        this.speedX = DUCK_SPEED + Math.random() * 2;
        this.speedY = (Math.random() - 0.5) * 1;
        this.color = this.getRandomDuckColor();
        this.isAlive = true;
        this.flipX = false;
        
        // Randomly spawn from left or right
        if (Math.random() > 0.5) {
            this.x = canvas.width;
            this.speedX = -this.speedX;
            this.flipX = true;
        }
    }

    getRandomDuckColor() {
        // All ducks are now white
        return '#FFFFFF';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Bounce off top and bottom
        if (this.y <= 0 || this.y >= canvas.height - 200) {
            this.speedY = -this.speedY;
        }
        
        // Remove duck if it goes off screen
        if (this.x < -this.width - 50 || this.x > canvas.width + 50) {
            this.isAlive = false;
        }
    }

    draw() {
        ctx.save();
        
        // Flip duck if moving right to left
        if (this.flipX) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, 0);
        } else {
            ctx.translate(this.x, 0);
        }
        
        // Draw duck body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.width/2, this.y + this.height/2, this.width/2, this.height/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw duck head
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.width * 0.8, this.y + this.height/3, this.width/4, this.height/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw beak
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(this.width * 0.95, this.y + this.height/3, this.width/8, this.height/8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eye
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(this.width * 0.75, this.y + this.height/4, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw wing
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(this.width/2, this.y + this.height/2, this.width/3, this.height/5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }



    isClicked(mouseX, mouseY) {
        // Simple and reliable rectangular collision detection with generous hit box
        const hitBoxPadding = 10; // Extra padding for easier hitting
        
        return mouseX >= this.x - hitBoxPadding && 
               mouseX <= this.x + this.width + hitBoxPadding &&
               mouseY >= this.y - hitBoxPadding && 
               mouseY <= this.y + this.height + hitBoxPadding;
    }
}

// Initialize game
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Add event listeners
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Start game
function startGame() {
    gameState = 'playing';
    score = 0;
    ammo = 999; // Unlimited ammo
    timeLeft = 60;
    ducks = [];
    
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    
    updateUI();
    
    // Start game timer
    gameTimer = setInterval(() => {
        timeLeft--;
        updateUI();
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // Start spawning ducks
    spawnTimer = setInterval(spawnDuck, DUCK_SPAWN_RATE);
    
    // Start game loop
    gameLoop();
}

// Spawn duck
function spawnDuck() {
    if (ducks.length < MAX_DUCKS && gameState === 'playing') {
        ducks.push(new Duck());
    }
}

// Handle mouse click
function handleClick(event) {
    if (gameState !== 'playing') return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Unlimited ammo - no need to check or decrement
    
    // Trigger muzzle flash
    muzzleFlash = true;
    muzzleFlashTimer = 10; // Flash for 10 frames
    
    // Check if any duck was hit
    let hit = false;
    for (let i = ducks.length - 1; i >= 0; i--) {
        if (ducks[i].isClicked(mouseX, mouseY)) {
            score += 10;
            ducks.splice(i, 1);
            hit = true;
            break;
        }
    }
    
    // Show shot effect
    showShotEffect(mouseX, mouseY, hit);
    
    updateUI();
}

// Handle mouse move for crosshair and shooter
function handleMouseMove(event) {
    if (gameState !== 'playing') return;
    
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    // Update shooter position and gun angle
    shooterX = mouseX;
    shooterY = canvas.height - 80; // Position shooter at bottom
    
    // Calculate gun angle to point towards mouse
    gunAngle = Math.atan2(mouseY - shooterY, mouseX - shooterX);
    
    const crosshair = document.getElementById('crosshair');
    crosshair.style.left = (mouseX - 15) + 'px';
    crosshair.style.top = (mouseY - 15) + 'px';
}

// Show shot effect
function showShotEffect(x, y, hit) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    
    if (hit) {
        // Hit effect - green circle
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Add "HIT!" text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HIT!', x, y + 5);
    } else {
        // Miss effect - red X
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.moveTo(x + 10, y - 10);
        ctx.lineTo(x - 10, y + 10);
        ctx.stroke();
    }
    
    ctx.restore();
    
    // Clear effect after short delay
    setTimeout(() => {
        // Effect will be cleared by next frame render
    }, 200);
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('ammo').textContent = '∞'; // Unlimited ammo symbol
    document.getElementById('time').textContent = timeLeft;
}

// Game loop
function gameLoop() {
    if (gameState !== 'playing') return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background elements
    drawBackground();
    
    // Update and draw ducks
    for (let i = ducks.length - 1; i >= 0; i--) {
        ducks[i].update();
        ducks[i].draw();
        
        // Remove dead ducks
        if (!ducks[i].isAlive) {
            ducks.splice(i, 1);
        }
    }
    
    // Draw the shooter character
    drawShooter();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Draw background
function drawBackground() {
    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 200) + ((Date.now() * 0.01) % 1000);
        const y = 50 + Math.sin(Date.now() * 0.001 + i) * 20;
        drawCloud(x, y);
    }
    
    // Draw grass
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Draw some trees
    ctx.fillStyle = '#8B4513';
    for (let i = 0; i < 3; i++) {
        const x = i * 300 + 100;
        const y = canvas.height - 150;
        ctx.fillRect(x, y, 20, 50);
        
        // Tree top
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x + 10, y, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
    }
}

// Draw shooter character
function drawShooter() {
    if (gameState !== 'playing') return;
    
    ctx.save();
    
    // Draw shooter body
    ctx.fillStyle = '#8B4513'; // Brown color for hunter
    ctx.fillRect(shooterX - 15, shooterY - 40, 30, 40);
    
    // Draw shooter head
    ctx.fillStyle = '#FFDBAC'; // Skin color
    ctx.beginPath();
    ctx.arc(shooterX, shooterY - 50, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw hunter hat
    ctx.fillStyle = '#654321';
    ctx.fillRect(shooterX - 15, shooterY - 60, 30, 10);
    ctx.fillRect(shooterX - 12, shooterY - 65, 24, 5);
    
    // Draw gun
    ctx.save();
    ctx.translate(shooterX, shooterY - 20);
    ctx.rotate(gunAngle);
    
    // Gun barrel
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(0, -3, 40, 6);
    
    // Gun stock
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-15, -5, 15, 10);
    
    // Muzzle flash effect
    if (muzzleFlash && muzzleFlashTimer > 0) {
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(55, -8);
        ctx.lineTo(55, 8);
        ctx.closePath();
        ctx.fill();
        
        // Add some sparkles
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 5; i++) {
            const sparkleX = 45 + Math.random() * 15;
            const sparkleY = (Math.random() - 0.5) * 16;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        muzzleFlashTimer--;
        if (muzzleFlashTimer <= 0) {
            muzzleFlash = false;
        }
    }
    
    ctx.restore();
    
    // Draw legs
    ctx.fillStyle = '#000080'; // Blue pants
    ctx.fillRect(shooterX - 12, shooterY, 10, 25);
    ctx.fillRect(shooterX + 2, shooterY, 10, 25);
    
    // Draw boots
    ctx.fillStyle = '#654321';
    ctx.fillRect(shooterX - 15, shooterY + 25, 12, 8);
    ctx.fillRect(shooterX + 3, shooterY + 25, 12, 8);
    
    ctx.restore();
}

// Draw cloud
function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 35, y - 15, 18, 0, Math.PI * 2);
    ctx.arc(x + 15, y - 10, 15, 0, Math.PI * 2);
    ctx.fill();
}

// End game
function endGame() {
    gameState = 'gameOver';
    clearInterval(gameTimer);
    clearInterval(spawnTimer);
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('crosshair').style.display = 'none';
}

// Restart game
function restartGame() {
    startGame();
}

// Initialize when page loads
window.addEventListener('load', initGame);
