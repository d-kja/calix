import './style.css'
import init, { Game, Kind, Status } from 'sweeper'

const CELL_SIZE = 75
const WORLD_SIZE = CELL_SIZE * 10;
const CELL_AMOUNT_ROW = Math.floor(WORLD_SIZE / CELL_SIZE)
const FRAMES_PER_SECOND = 1000 / 4
const DEFAULT_STATUS = "Click to play"

const createGame = () => Game.new(CELL_AMOUNT_ROW * CELL_AMOUNT_ROW)

const wasm = await init()
let game = createGame()

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="container">
    <div id="header">
      <h1>Mine sweeper</h1>
      <div id="actions">
        <span id="reset"></span>
        <span id="status">${DEFAULT_STATUS}</span>
      </div>
    </div>

    <canvas id="game"></canvas>
  </main>
`
const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

canvas.width = WORLD_SIZE
canvas.height = WORLD_SIZE

canvas.addEventListener('click', (props) => {
  const [clientX, clientY] = [props.offsetX, props.offsetY]
  const [cellIndexX, cellIndexY] = [
    Math.floor(clientX / CELL_SIZE),
    Math.floor(clientY / CELL_SIZE)
  ]

  const cellIdx = (cellIndexY + 1) * CELL_AMOUNT_ROW - (CELL_AMOUNT_ROW - cellIndexX)
  const cellPointer = game.get_cell_as_ptr(cellIdx)

  const cell = getCellFromPointer(cellPointer)

  if (!cell) return

  game.touch_cell(cell.index)
})

const getCellFromPointer = (pointerIdx: number) => {
  const memoryLength = 8

  const cell = new Uint8Array(
    wasm.memory.buffer,
    pointerIdx,
    memoryLength // index, ..., ..., ..., kind, touched, ..., ...
  )

  return {
    index: cell[0],
    kind: Kind[cell[4]],
    touched: cell[5]
  }
}

const getGameStatusAsStr = (): [string, boolean] => {
  const status = game.status ?? Number.MAX_SAFE_INTEGER

  switch (status) {
    case Status.WON:
      return ["You won", true];
    case Status.LOST:
      return ["You lost", true];
    case Status.PAUSED:
      return ["The game was paused", false];
    case Status.PLAYING:
      return ["Currently playing", false];
    default:
      return [DEFAULT_STATUS, false];
  }
}

const renderStatus = () => {
  const statusElement = document.getElementById('status');
  const resetElement = document.getElementById('reset')
  if (!statusElement || !resetElement) return

  const [status, resetable] = getGameStatusAsStr()

  statusElement.innerText = status

  if (resetable) {
    clearInterval(interval)

    resetElement.innerHTML = `
      <button id="reset-btn">
        RESET
      </button>
    `

    const resetBtn = document.getElementById('reset-btn')
    if (!resetBtn) return

    resetBtn.onclick = () => {
      game = createGame()
      interval = createInterval()
    }

    return
  }

  resetElement.innerHTML = ''
}

const renderCells = () => {
  ctx.reset()
  ctx.beginPath()

  const cell_amount = game.get_cells()

  for (const cell of cell_amount) {
    const position = cell.index

    const [x, y] = [
      (CELL_SIZE * position) % WORLD_SIZE,
      Math.floor((CELL_SIZE * position) / WORLD_SIZE) * CELL_SIZE
    ]

    ctx.fillStyle = '#27272a'
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)

    ctx.fillStyle = '#121214'
    ctx.fillRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10)

    const drawPattern = () => {
      const hasBeenTouched = cell.dirty
      ctx.fillStyle = '#3f3f46'

      ctx.fillRect(
        x + 10,
        y + 10,
        CELL_SIZE - 20,
        CELL_SIZE - 20
      )

      switch (cell.kind) {
        case Kind.BOMB: {
          ctx.fillStyle = '#ef4444';

          if (hasBeenTouched) {
            ctx.fillRect(
              x + 15,
              y + 15,
              CELL_SIZE - 30,
              CELL_SIZE - 30
            )

          }

          break
        } case Kind.EMPTY: {
          ctx.fillStyle = '#bae6fd';

          if (hasBeenTouched) {
            ctx.fillRect(
              x + 15,
              y + 15,
              CELL_SIZE - 30,
              CELL_SIZE - 30,
            )
          }

          break
        }
        default: {
          break
        };
      }
    }

    drawPattern()
  }

  ctx.stroke()
}

const createInterval = () => setInterval(() => {
  renderCells()
  renderStatus()
}, FRAMES_PER_SECOND);

let interval = createInterval() 
