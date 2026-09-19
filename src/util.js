/*
  Shared formatting helpers for the Pixera Companion module.
*/
function pad(n) {
  return n.toString().padStart(2, '0')
}

function framesToTimeString(frames, fps) {
  fps = fps || 60
  const hours = Math.floor(frames / (fps * 60 * 60))
  const minutes = Math.floor(frames / (fps * 60)) - hours * 60
  const seconds = Math.floor(frames / fps) - hours * 3600 - minutes * 60
  const f = Math.floor(frames - ((hours * 3600 + minutes * 60 + seconds) * fps))
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(f)}`
}

function stateToString(state) {
  switch (parseInt(state)) {
    case 1:  return 'play'
    case 2:  return 'pause'
    case 3:  return 'stop'
    default: return 'unknown'
  }
}

module.exports = { pad, framesToTimeString, stateToString }
