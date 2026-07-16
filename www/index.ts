import __wbg_init, { World, Direction, GameStatus } from "snake_game";
import {rnd} from "./utils/rnd.js";

__wbg_init().then(wasm => {
    const CELL_SIZE = 25;
    const WORLD_WIDTH = 9;
    const snakeSpawnIdx = rnd(WORLD_WIDTH * WORLD_WIDTH);

    //Event Listener
    document.addEventListener("keydown", e => {
        switch(e.code) {
            case "KeyW":
            case "ArrowUp":
                world.change_snake_dir(Direction.Up);
                break;
            case "KeyD":
            case "ArrowRight":
                world.change_snake_dir(Direction.Right);
                break;
            case "KeyS":
            case "ArrowDown":
                world.change_snake_dir(Direction.Down);
                break;
            case "KeyA":
            case "ArrowLeft":
                world.change_snake_dir(Direction.Left);
            break;
        }
    });
    //Squares Traveled
    const squares = document.getElementById("squares")!;

    //Points
    const points = document.getElementById("points")!;

    //Game Status
    const gameStatus = document.getElementById("game-status")!;

    //WORLD
    const world = World.new(WORLD_WIDTH, snakeSpawnIdx);

    //Play Button
    const gameControlBtn = document.getElementById("game-control-btn")!;
    gameControlBtn.addEventListener("click", _ => {
        const status = world.game_status();

        if (status === undefined) {
            gameControlBtn.textContent = "Playing..."
            world.start_game();
            play();
        } else  {
            location.reload();
        }
    });

    //CANVAS
    const canvas = <HTMLCanvasElement> document.getElementById("snake-canvas");
    const ctx = canvas.getContext("2d")!;

    canvas.height = WORLD_WIDTH * CELL_SIZE;
    canvas.width = WORLD_WIDTH * CELL_SIZE;

    const snakeCellPtr = world.snake_cells();
    const snakeLen = world.snake_length();

    function getSnakeCells() {
        return new Uint32Array(
            wasm.memory.buffer,
            snakeCellPtr,
            snakeLen
        );
    }

    //WORLD
    function drawWorld() {
        ctx.beginPath();

        for (let x = 0; x < WORLD_WIDTH + 1; x++) {
            ctx.moveTo(CELL_SIZE * x, 0);
            ctx.lineTo(CELL_SIZE * x, WORLD_WIDTH * CELL_SIZE)
        }

        for (let y = 0; y < WORLD_WIDTH + 1; y++) {
            ctx.moveTo(0, CELL_SIZE * y);
            ctx.lineTo(WORLD_WIDTH * CELL_SIZE, CELL_SIZE * y)
        }

        ctx.stroke();
    }

    //LOG SNAKE _HEAD
    function logSnakeHead() {
        console.log("Snake Head: ", world.snake_head_idx());
    }

    //Draw Reward
    function drawReward() {
        const idx = world.reward_cell()!;
        const col = idx % WORLD_WIDTH;
        const row = Math.floor(idx / WORLD_WIDTH);

        ctx.beginPath();
        ctx.fillStyle = "#7878db";
        ctx.fillRect(
            col * CELL_SIZE,
            row * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
        ctx.stroke();
    }

    //Draw snake
    function drawSnake() {
        const snakeCells = new Uint32Array(
            wasm.memory.buffer,
            world.snake_cells(),
            world.snake_length()
        );

        snakeCells
            .filter((cellIndex, i) => !(i>0 && cellIndex === snakeCells[0]))
            .forEach((cellIndex, i) => {
            const col = cellIndex % WORLD_WIDTH;
            const row = Math.floor(cellIndex / WORLD_WIDTH);

            ctx.fillStyle = i === 0 ? '#FF0000' : '#000000';

            ctx.beginPath();
            ctx.fillRect(
                col * CELL_SIZE,
                row * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );
        });
        
        
        ctx.stroke();
    }


    function drawGameStatus() {
        gameStatus.textContent = world.game_status_text();
        points.textContent = world.points().toString();
        squares.textContent = squaresTraveled.toString();
    }

    //Render the world
    function paint() {
        drawWorld();
        drawSnake();
        drawReward();
        drawGameStatus();
    }

    let squaresTraveled = 0;
    function play() {
        const status = world.game_status();

        if (status == GameStatus.Won || status == GameStatus.Lost) {
            gameControlBtn.textContent = "Re-Play";
            return;
        }
        const fps = 8;

        setTimeout(() => {
            squaresTraveled++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            world.step();
            paint();
            // the method takes a callback to invoked before the next repaint
            requestAnimationFrame(play)
        }, 1000 / fps);
    }

    paint();
});

