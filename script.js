
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const scoreDisplay = document.getElementById('score');
        const finalScoreDisplay = document.getElementById('finalScore');
        const highScoreDisplay = document.getElementById('highScore');
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        const modeToggle = document.getElementById('modeToggle');
        const body = document.body;

        canvas.width = 400;
        canvas.height = 600;

        // Game variables
        let gameStarted = false;
        let gameOver = false;
        let score = 0;
        let highScore = localStorage.getItem('flappyHighScore') || 0;
        let isDayMode = true;

        // Bird
        const bird = {
            x: 80,
            y: 250,
            radius: 20,
            velocity: 0,
            gravity: 0.5,
            jump: -9,
            rotation: 0
        };

        // Pipes
        let pipes = [];
        const pipeWidth = 60;
        const pipeGap = 180;
        let frameCount = 0;

        // Colors
        const colors = {
            day: {
                bird: '#ff0000',
                birdBelly: '#ffff00',
                birdBeak: '#ffa500',
                pipe: '#6fdc6f',
                pipeEdge: '#4caf50',
                ground: '#deb887',
                cloud: 'rgba(255, 255, 255, 0.8)'
            },
            night: {
                bird: '#ff4444',
                birdBelly: '#ffaa00',
                birdBeak: '#ff8800',
                pipe: '#2d5a2d',
                pipeEdge: '#1a3d1a',
                ground: '#8b7355',
                cloud: 'rgba(200, 200, 220, 0.3)'
            }
        };

        // Cloud decoration
        let clouds = [
            { x: 100, y: 100, size: 40 },
            { x: 250, y: 150, size: 50 },
            { x: 50, y: 400, size: 35 }
        ];

        function getCurrentColors() {
            return isDayMode ? colors.day : colors.night;
        }

        function drawBird() {
            const currentColors = getCurrentColors();
            ctx.save();
            ctx.translate(bird.x, bird.y);
            ctx.rotate(bird.rotation);

            // Body
            ctx.fillStyle = currentColors.bird;
            ctx.beginPath();
            ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
            ctx.fill();

            // Belly
            ctx.fillStyle = currentColors.birdBelly;
            ctx.beginPath();
            ctx.arc(2, 3, bird.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Eye white
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(8, -5, 8, 0, Math.PI * 2);
            ctx.fill();

            // Eye pupil
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(10, -5, 4, 0, Math.PI * 2);
            ctx.fill();

            // Eyebrow (angry)
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(2, -12);
            ctx.lineTo(14, -10);
            ctx.stroke();

            // Beak
            ctx.fillStyle = currentColors.birdBeak;
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(25, -3);
            ctx.lineTo(25, 3);
            ctx.closePath();
            ctx.fill();

            // Tail feathers
            ctx.fillStyle = currentColors.bird;
            ctx.beginPath();
            ctx.moveTo(-bird.radius, 0);
            ctx.lineTo(-bird.radius - 10, -8);
            ctx.lineTo(-bird.radius - 5, 0);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        function drawPipe(pipe) {
            const currentColors = getCurrentColors();
            
            // Top pipe
            ctx.fillStyle = currentColors.pipe;
            ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
            
            // Top pipe cap
            ctx.fillStyle = currentColors.pipeEdge;
            ctx.fillRect(pipe.x - 5, pipe.top - 30, pipeWidth + 10, 30);
            
            // Pipe details (lines)
            ctx.strokeStyle = currentColors.pipeEdge;
            ctx.lineWidth = 2;
            for (let i = 0; i < pipe.top - 30; i += 20) {
                ctx.beginPath();
                ctx.moveTo(pipe.x, i);
                ctx.lineTo(pipe.x + pipeWidth, i);
                ctx.stroke();
            }

            // Bottom pipe
            ctx.fillStyle = currentColors.pipe;
            ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height - pipe.top - pipeGap);
            
            // Bottom pipe cap
            ctx.fillStyle = currentColors.pipeEdge;
            ctx.fillRect(pipe.x - 5, pipe.top + pipeGap, pipeWidth + 10, 30);
            
            // Pipe details (lines)
            for (let i = pipe.top + pipeGap + 30; i < canvas.height; i += 20) {
                ctx.beginPath();
                ctx.moveTo(pipe.x, i);
                ctx.lineTo(pipe.x + pipeWidth, i);
                ctx.stroke();
            }
        }

        function drawGround() {
            const currentColors = getCurrentColors();
            ctx.fillStyle = currentColors.ground;
            ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
            
            // Ground texture
            ctx.strokeStyle = isDayMode ? '#cd853f' : '#6b5945';
            ctx.lineWidth = 2;
            for (let i = 0; i < canvas.width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(i, canvas.height - 50);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
        }

        function drawClouds() {
            const currentColors = getCurrentColors();
            clouds.forEach(cloud => {
                ctx.fillStyle = currentColors.cloud;
                ctx.beginPath();
                ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
                ctx.arc(cloud.x + cloud.size * 1.5, cloud.y, cloud.size * 0.9, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function updateBird() {
            bird.velocity += bird.gravity;
            bird.y += bird.velocity;
            
            // Rotation based on velocity
            bird.rotation = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.8);

            // Ground collision
            if (bird.y + bird.radius > canvas.height - 50) {
                bird.y = canvas.height - 50 - bird.radius;
                endGame();
            }

            // Ceiling collision
            if (bird.y - bird.radius < 0) {
                bird.y = bird.radius;
                bird.velocity = 0;
            }
        }

        function updatePipes() {
            if (frameCount % 90 === 0) {
                const minTop = 80;
                const maxTop = canvas.height - pipeGap - 150;
                const top = Math.random() * (maxTop - minTop) + minTop;
                pipes.push({
                    x: canvas.width,
                    top: top,
                    scored: false
                });
            }

            pipes.forEach((pipe, index) => {
                pipe.x -= 3;

                // Check collision
                if (
                    bird.x + bird.radius > pipe.x &&
                    bird.x - bird.radius < pipe.x + pipeWidth &&
                    (bird.y - bird.radius < pipe.top || bird.y + bird.radius > pipe.top + pipeGap)
                ) {
                    endGame();
                }

                // Score
                if (!pipe.scored && bird.x > pipe.x + pipeWidth) {
                    pipe.scored = true;
                    score++;
                    scoreDisplay.textContent = score;
                }

                // Remove off-screen pipes
                if (pipe.x + pipeWidth < 0) {
                    pipes.splice(index, 1);
                }
            });
        }

        function updateClouds() {
            clouds.forEach(cloud => {
                cloud.x -= 0.3;
                if (cloud.x + cloud.size < 0) {
                    cloud.x = canvas.width + cloud.size;
                    cloud.y = Math.random() * (canvas.height - 100);
                }
            });
        }

        function draw() {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background elements
            drawClouds();
            drawGround();

            // Draw game objects
            pipes.forEach(drawPipe);
            drawBird();
        }

        function gameLoop() {
            if (!gameStarted || gameOver) return;

            frameCount++;
            updateBird();
            updatePipes();
            updateClouds();
            draw();

            requestAnimationFrame(gameLoop);
        }

        function flap() {
            if (!gameStarted || gameOver) return;
            bird.velocity = bird.jump;
        }

        function startGame() {
            gameStarted = true;
            gameOver = false;
            score = 0;
            frameCount = 0;
            pipes = [];
            bird.y = 250;
            bird.velocity = 0;
            bird.rotation = 0;
            scoreDisplay.textContent = '0';
            startScreen.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            gameLoop();
        }

        function endGame() {
            gameOver = true;
            finalScoreDisplay.textContent = `Score: ${score}`;
            
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyHighScore', highScore);
            }
            
            highScoreDisplay.textContent = `Best: ${highScore}`;
            gameOverScreen.classList.remove('hidden');
        }

        function toggleMode() {
            isDayMode = !isDayMode;
            body.classList.toggle('day', isDayMode);
            body.classList.toggle('night', !isDayMode);
            modeToggle.textContent = isDayMode ? '🌙' : '☀️';
            draw();
        }

        // Event listeners
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        modeToggle.addEventListener('click', toggleMode);

        canvas.addEventListener('click', flap);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!gameStarted) {
                    startGame();
                } else {
                    flap();
                }
            }
        });

        // Initial draw
        highScoreDisplay.textContent = `Best: ${highScore}`;
        draw();