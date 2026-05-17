/*
  Variables helper for Pixera Companion module
  - Per-timeline variables use the numeric handle as ID (stable across renames)
  - Selected-timeline variables use the fixed prefix 'timeline_selected'
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

module.exports = {
  initVariables: function (instance) {
    this.initDefinitions(instance)
  },

  // create variable definitions (called once when timeline list is known)
  initDefinitions: function (instance) {
    try {
      if (!instance) return

      const defs = {}
      const values = {}

      for (const tl of (instance.CHOICES_TIMELINEFEEDBACK || [])) {
        const handle = tl.handle !== undefined && tl.handle !== null ? tl.handle : 0
        if (handle === -1) continue  // selected timeline is defined statically below

        const name = tl.name && tl.name !== '0' ? tl.name : `Timeline_${handle}`
        const p = `timeline_${handle}`

        defs[`${p}_name`]               = { name: `${name} - Name` }
        defs[`${p}_state`]              = { name: `${name} - State (numeric)` }
        defs[`${p}_state_text`]         = { name: `${name} - State (text)` }
        defs[`${p}_position`]           = { name: `${name} - Position (frames)` }
        defs[`${p}_position_timecode`]  = { name: `${name} - Position (HH:MM:SS:FF)` }
        defs[`${p}_countdown`]          = { name: `${name} - Countdown (frames)` }
        defs[`${p}_countdown_timecode`] = { name: `${name} - Countdown (HH:MM:SS:FF)` }
        defs[`${p}_fps`]                = { name: `${name} - FPS` }

        values[`${p}_name`]               = name
        values[`${p}_state`]              = 0
        values[`${p}_state_text`]         = stateToString(0)
        values[`${p}_position`]           = 0
        values[`${p}_position_timecode`]  = framesToTimeString(0, 60)
        values[`${p}_countdown`]          = 0
        values[`${p}_countdown_timecode`] = framesToTimeString(0, 60)
        values[`${p}_fps`]                = tl.fps ? parseInt(tl.fps) : 0
      }

      // Static definitions for the selected timeline (always present)
      const sel = 'timeline_selected'
      defs[`${sel}_handle`]             = { name: 'Selected Timeline - Handle' }
      defs[`${sel}_name`]               = { name: 'Selected Timeline - Name' }
      defs[`${sel}_state`]              = { name: 'Selected Timeline - State (numeric)' }
      defs[`${sel}_state_text`]         = { name: 'Selected Timeline - State (text)' }
      defs[`${sel}_position`]           = { name: 'Selected Timeline - Position (frames)' }
      defs[`${sel}_position_timecode`]  = { name: 'Selected Timeline - Position (HH:MM:SS:FF)' }
      defs[`${sel}_countdown`]          = { name: 'Selected Timeline - Countdown (frames)' }
      defs[`${sel}_countdown_timecode`] = { name: 'Selected Timeline - Countdown (HH:MM:SS:FF)' }
      defs[`${sel}_fps`]                = { name: 'Selected Timeline - FPS' }

      if (instance.setVariableDefinitions) instance.setVariableDefinitions(defs)
      if (instance.setVariableValues)      instance.setVariableValues(values)
    } catch (e) {
      if (instance && instance.log) instance.log('error', `variables.initDefinitions error: ${e.message}`)
    }
  },

  // update only variable values (called on monitoring updates - case 10000)
  updateVariables: function (instance) {
    try {
      if (!instance) return

      const values = {}

      for (const tl of (instance.CHOICES_TIMELINEFEEDBACK || [])) {
        const handle = tl.handle !== undefined && tl.handle !== null ? tl.handle : 0
        if (handle === -1) continue

        const p = `timeline_${handle}`
        const fps = tl.fps ? parseInt(tl.fps) : 60
        const posFrames       = tl.timelinePositions  ? parseInt(tl.timelinePositions)  : 0
        const countdownFrames = tl.timelineCountdowns ? parseInt(tl.timelineCountdowns) : 0
        const stateNum        = tl.timelineTransport !== undefined && tl.timelineTransport !== null
                                  ? parseInt(tl.timelineTransport) : 0
        const name = tl.name && tl.name !== '0' ? tl.name : `Timeline_${handle}`

        values[`${p}_name`]               = name
        values[`${p}_state`]              = stateNum
        values[`${p}_state_text`]         = stateToString(stateNum)
        values[`${p}_position`]           = posFrames
        values[`${p}_position_timecode`]  = framesToTimeString(posFrames, fps)
        values[`${p}_countdown`]          = countdownFrames
        values[`${p}_countdown_timecode`] = framesToTimeString(countdownFrames, fps)
        values[`${p}_fps`]                = fps
      }

      // Selected timeline: read directly from SELECTEDTIMELINEFEEDBACK
      const s = instance.SELECTEDTIMELINEFEEDBACK
      const sFps      = s && s.fps               ? parseInt(s.fps)               : 60
      const sPos      = s && s.timelinePositions  ? parseInt(s.timelinePositions)  : 0
      const sCountdown= s && s.timelineCountdowns ? parseInt(s.timelineCountdowns) : 0
      const sState    = s && s.timelineTransport !== undefined ? parseInt(s.timelineTransport) : 0
      values['timeline_selected_handle']             = s ? s.handle : ''
      values['timeline_selected_name']               = s ? s.name : ''
      values['timeline_selected_state']              = sState
      values['timeline_selected_state_text']         = stateToString(sState)
      values['timeline_selected_position']           = sPos
      values['timeline_selected_position_timecode']  = framesToTimeString(sPos, sFps)
      values['timeline_selected_countdown']          = sCountdown
      values['timeline_selected_countdown_timecode'] = framesToTimeString(sCountdown, sFps)
      values['timeline_selected_fps']                = sFps

      if (instance.setVariableValues) instance.setVariableValues(values)
    } catch (e) {
      if (instance && instance.log) instance.log('error', `variables.updateVariables error: ${e.message}`)
    }
  },

  // update only the selected-timeline variables (called from case 10001 every ~100ms)
  updateSelectedVariables: function (instance) {
    try {
      if (!instance) return
      const s = instance.SELECTEDTIMELINEFEEDBACK
      const sFps      = s && s.fps               ? parseInt(s.fps)               : 60
      const sPos      = s && s.timelinePositions  ? parseInt(s.timelinePositions)  : 0
      const sCountdown= s && s.timelineCountdowns ? parseInt(s.timelineCountdowns) : 0
      const sState    = s && s.timelineTransport !== undefined ? parseInt(s.timelineTransport) : 0
      const values = {
        'timeline_selected_handle':             s ? s.handle : '',
        'timeline_selected_name':               s ? s.name : '',
        'timeline_selected_state':              sState,
        'timeline_selected_state_text':         stateToString(sState),
        'timeline_selected_position':           sPos,
        'timeline_selected_position_timecode':  framesToTimeString(sPos, sFps),
        'timeline_selected_countdown':          sCountdown,
        'timeline_selected_countdown_timecode': framesToTimeString(sCountdown, sFps),
        'timeline_selected_fps':                sFps,
      }
      if (instance.setVariableValues) instance.setVariableValues(values)
    } catch (e) {
      if (instance && instance.log) instance.log('error', `variables.updateSelectedVariables error: ${e.message}`)
    }
  },
}
