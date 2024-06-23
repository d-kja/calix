import './style.css'
import init, { Game } from 'sweeper'

await init()
const game = Game.new(10)
console.log(game.get_cell(2).get_kind_str())

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="container">
    <h1>GAME</h1>
    <canvas id="game"></canvas>
  </main>
`
