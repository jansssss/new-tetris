// 게임 상수
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    'cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'
];

// 테트리스 블록 모양
const SHAPES = [
    [[1, 1, 1, 1]],                // I
    [[1, 1, 1], [0, 1, 0]],       // T
    [[1, 1, 1], [1, 0, 0]],       // L
    [[1, 1, 1], [0, 0, 1]],       // J
    [[1, 1], [1, 1]],             // O
    [[1, 1, 0], [0, 1, 1]],       // Z
    [[0, 1, 1], [1, 1, 0]]        // S
];

// 게임 변수
let canvas;
let ctx;
let nextPieceCanvas;
let nextPieceCtx;
let grid;
let score = 0;
let level = 1;
let gameOver = false;
let isPaused = false;
let currentPiece;
let nextPiece;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationId;

// DOM 요소
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

// 게임 초기화
function init() {
    canvas = document.getElementById('tetris');
    ctx = canvas.getContext('2d');
    nextPieceCanvas = document.getElementById('nextPiece');
    nextPieceCtx = nextPieceCanvas.getContext('2d');
    
    // 이벤트 리스너 설정
    document.addEventListener('keydown', handleKeyPress);
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
}

// 게임 시작
function startGame() {
    reset();
    nextPiece = createPiece();
    createNewPiece();
    gameLoop(0);
    startBtn.textContent = '다시 시작';
}

// 게임 초기화
function reset() {
    score = 0;
    level = 1;
    gameOver = false;
    isPaused = false;
    dropInterval = 1000;
    grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    updateScore();
    updateLevel();
}

// 새로운 조각 생성
function createPiece() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[SHAPES.indexOf(shape)];
    return {
        shape,
        color,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

// 새로운 조각을 게임에 추가
function createNewPiece() {
    currentPiece = nextPiece;
    nextPiece = createPiece();
    drawNextPiece();
    
    if (checkCollision()) {
        gameOver = true;
    }
}

// 충돌 검사
function checkCollision() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const newX = currentPiece.x + x;
                const newY = currentPiece.y + y;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS ||
                    (newY >= 0 && grid[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 조각 회전
function rotate() {
    const matrix = currentPiece.shape;
    const N = matrix.length;
    const rotated = Array.from({length: N}, () => Array(N).fill(0));
    
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            rotated[x][N - 1 - y] = matrix[y][x];
        }
    }
    
    const previousShape = currentPiece.shape;
    currentPiece.shape = rotated;
    
    if (checkCollision()) {
        currentPiece.shape = previousShape;
    }
}

// 조각 이동
function movePiece(dir) {
    currentPiece.x += dir;
    if (checkCollision()) {
        currentPiece.x -= dir;
    }
}

// 조각 떨어뜨리기
function dropPiece() {
    currentPiece.y++;
    if (checkCollision()) {
        currentPiece.y--;
        mergePiece();
        createNewPiece();
        clearLines();
    }
    dropCounter = 0;
}

// 즉시 하강
function hardDrop() {
    while (!checkCollision()) {
        currentPiece.y++;
    }
    currentPiece.y--;
    mergePiece();
    createNewPiece();
    clearLines();
}

// 조각을 그리드에 병합
function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const newY = currentPiece.y + y;
                const newX = currentPiece.x + x;
                if (newY >= 0) {
                    grid[newY][newX] = currentPiece.color;
                }
            }
        });
    });
}

// 완성된 줄 제거
function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (grid[y].every(cell => cell !== 0)) {
            grid.splice(y, 1);
            grid.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        updateScore();
        
        if (score >= level * 1000) {
            level++;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            updateLevel();
        }
    }
}

// 게임 화면 그리기
function draw() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 그리드 그리기
    grid.forEach((row, y) => {
        row.forEach((color, x) => {
            if (color) {
                drawBlock(ctx, x, y, color);
            }
        });
    });
    
    // 현재 조각 그리기
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
            }
        });
    });
}

// 다음 조각 그리기
function drawNextPiece() {
    nextPieceCtx.fillStyle = '#fff';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    const offsetX = (nextPieceCanvas.width - nextPiece.shape[0].length * BLOCK_SIZE) / 2;
    const offsetY = (nextPieceCanvas.height - nextPiece.shape.length * BLOCK_SIZE) / 2;
    
    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(nextPieceCtx, x, y, nextPiece.color, offsetX, offsetY);
            }
        });
    });
}

// 블록 그리기
function drawBlock(context, x, y, color, offsetX = 0, offsetY = 0) {
    context.fillStyle = color;
    context.fillRect(offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
    context.strokeStyle = '#000';
    context.strokeRect(offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

// 키보드 입력 처리
function handleKeyPress(e) {
    if (gameOver || isPaused) return;
    
    switch (e.keyCode) {
        case 37: // 왼쪽
            movePiece(-1);
            break;
        case 39: // 오른쪽
            movePiece(1);
            break;
        case 40: // 아래
            dropPiece();
            break;
        case 38: // 위
            rotate();
            break;
        case 32: // 스페이스바
            hardDrop();
            break;
    }
}

// 점수 업데이트
function updateScore() {
    scoreElement.textContent = score;
}

// 레벨 업데이트
function updateLevel() {
    levelElement.textContent = level;
}

// 게임 일시정지 토글
function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '계속하기' : '일시정지';
    if (!isPaused) {
        lastTime = 0;
        gameLoop(0);
    }
}

// 게임 루프
function gameLoop(time = 0) {
    if (gameOver) {
        alert('게임 오버!\n점수: ' + score);
        return;
    }
    
    if (!isPaused) {
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            dropPiece();
        }
        
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// 게임 초기화 및 시작
init(); 