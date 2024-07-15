import './style.css'
import init, { Game, Kind, Status } from 'sweeper'

const CELL_SIZE = 75
const WORLD_SIZE = CELL_SIZE * 10;
const CELL_AMOUNT_ROW = Math.floor(WORLD_SIZE / CELL_SIZE)
const FRAMES_PER_SECOND = 1000 / 4
const DEFAULT_STATUS = "Click to play"

const BOMB_SRC = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWJvbWIiPjxjaXJjbGUgY3g9IjExIiBjeT0iMTMiIHI9IjkiLz48cGF0aCBkPSJNMTQuMzUgNC42NSAxNi4zIDIuN2EyLjQxIDIuNDEgMCAwIDEgMy40IDBsMS42IDEuNmEyLjQgMi40IDAgMCAxIDAgMy40bC0xLjk1IDEuOTUiLz48cGF0aCBkPSJtMjIgMi0xLjUgMS41Ii8+PC9zdmc+"
const EMPTY_SRC = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNxdWFyZSI+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSIzIiByeD0iMiIvPjwvc3ZnPg=="
const TILE_SRC = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWluc3BlY3Rpb24tcGFuZWwiPjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjIiLz48cGF0aCBkPSJNNyA3aC4wMSIvPjxwYXRoIGQ9Ik0xNyA3aC4wMSIvPjxwYXRoIGQ9Ik03IDE3aC4wMSIvPjxwYXRoIGQ9Ik0xNyAxN2guMDEiLz48L3N2Zz4="

const wasm = await init()
const game = Game.new(CELL_AMOUNT_ROW * CELL_AMOUNT_ROW)

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="container">
    <div id="header">
      <h1>Mine sweeper</h1>
      <span id="status">${DEFAULT_STATUS}</span>
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
  const status = game.status ? Status[game.status] : 'not started'
  console.log(status)

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

const getGameStatusAsStr = () => {
  const status = game.status ?? Number.MAX_SAFE_INTEGER

  switch (status) {
    case Status.WON:
      return "You won";
    case Status.LOST:
      return "You lost";
    case Status.PAUSED:
      return "The game was paused";
    case Status.PLAYING:
      return "Currently playing";
    default:
      return DEFAULT_STATUS;
  }
}

const renderStatus = () => {
  const statusElement = document.getElementById('status');
  if (!statusElement) return

  statusElement.innerText = getGameStatusAsStr()
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

    const getPattern = () => {
      const hasBeenTouched = cell.dirty
      const image = new Image()
      image.src = TILE_SRC

      if (!hasBeenTouched) return 'gray'
      
      switch (cell.kind) {
        case Kind.BOMB: {
          if (hasBeenTouched) {
            image.src = BOMB_SRC
          }

          const pattern = ctx.createPattern(image, null)
          return "red";

        } case Kind.EMPTY: {
          if (hasBeenTouched) {
            image.src = EMPTY_SRC
          }

          const pattern = ctx.createPattern(image, null)
          return "blue";
        }
        default: {
          const pattern = ctx.createPattern(image, null)
          return "white"
        };
      }
    }

    ctx.fillStyle = getPattern()!
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)
  }

  ctx.stroke()
}

setInterval(() => {
  renderCells()
  renderStatus()
}, FRAMES_PER_SECOND);
