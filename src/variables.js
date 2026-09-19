/*
  Variables helper for Pixera Companion module
  - Per-timeline variables use the numeric handle as ID (stable across renames)
  - Selected-timeline variables use the fixed prefix 'timeline_selected'
*/
const { framesToTimeString, stateToString } = require('./util')
const cues = require('./cues')

// Cue related suffixes, shared by definitions and values
const CUE_ROLES = [
  { key: 'cueCurrent', prefix: 'cue_current', label: 'Current Cue' },
  { key: 'cueNext',    prefix: 'cue_next',    label: 'Next Cue' },
  { key: 'cuePrev',    prefix: 'cue_prev',    label: 'Previous Cue' },
]

function countdownReasonToString(flag) {
  switch (parseInt(flag)) {
    case 1:  return 'next_cue'
    case 2:  return 'cue_wait'
    default: return ''
  }
}

// Cue values of one timeline record, as a flat {suffix: value} object
function cueValues(instance, tl) {
  const values = {}
  const fps = tl && tl.fps ? parseInt(tl.fps) : 60
  const position = tl && tl.timelinePositions ? parseInt(tl.timelinePositions) : 0
  const list = tl ? cues.getCuesOfTimeline(instance, tl.handle) : []

  values['cue_count'] = list.length

  for (const role of CUE_ROLES) {
    const cue = tl && tl[role.key] !== undefined && tl[role.key] !== null
      ? cues.getCue(instance, tl[role.key])
      : undefined
    const time = cue && cue.time !== undefined && cue.time !== null ? Math.round(Number(cue.time)) : null

    values[`${role.prefix}_name`]          = cue ? cues.cueLabel(cue) : ''
    values[`${role.prefix}_index`]         = cue && cue.index !== undefined && cue.index !== null ? parseInt(cue.index) : ''
    values[`${role.prefix}_number`]        = cue && cue.numberFormatted ? cue.numberFormatted : ''
    values[`${role.prefix}_time`]          = time !== null ? time : ''
    values[`${role.prefix}_time_timecode`] = time !== null ? framesToTimeString(time, fps) : ''
  }

  const nextCue = tl && tl.cueNext !== undefined && tl.cueNext !== null ? cues.getCue(instance, tl.cueNext) : undefined
  const nextTime = nextCue && nextCue.time !== undefined && nextCue.time !== null ? Math.round(Number(nextCue.time)) : null
  const remaining = nextTime !== null ? Math.max(0, nextTime - position) : null
  values['cue_next_remaining']          = remaining !== null ? remaining : ''
  values['cue_next_remaining_timecode'] = remaining !== null ? framesToTimeString(remaining, fps) : ''

  values['countdown_reason'] = tl ? countdownReasonToString(tl.countdownFlag) : ''

  return values
}

// Cue related definitions for one prefix, e.g. 'timeline_12' or 'timeline_selected'
function cueDefinitions(prefix, displayName) {
  const defs = {}
  defs[`${prefix}_cue_count`] = { name: `${displayName} - Cue Count` }
  for (const role of CUE_ROLES) {
    defs[`${prefix}_${role.prefix}_name`]          = { name: `${displayName} - ${role.label} Name` }
    defs[`${prefix}_${role.prefix}_index`]         = { name: `${displayName} - ${role.label} Index` }
    defs[`${prefix}_${role.prefix}_number`]        = { name: `${displayName} - ${role.label} Number` }
    defs[`${prefix}_${role.prefix}_time`]          = { name: `${displayName} - ${role.label} Time (frames)` }
    defs[`${prefix}_${role.prefix}_time_timecode`] = { name: `${displayName} - ${role.label} Time (HH:MM:SS:FF)` }
  }
  defs[`${prefix}_cue_next_remaining`]          = { name: `${displayName} - Time to Next Cue (frames)` }
  defs[`${prefix}_cue_next_remaining_timecode`] = { name: `${displayName} - Time to Next Cue (HH:MM:SS:FF)` }
  defs[`${prefix}_countdown_reason`]            = { name: `${displayName} - Countdown Reason (next_cue/cue_wait)` }
  return defs
}

function assignPrefixed(target, prefix, values) {
  for (const [key, value] of Object.entries(values)) {
    target[`${prefix}_${key}`] = value
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
        Object.assign(defs, cueDefinitions(p, name))

        values[`${p}_name`]               = name
        values[`${p}_state`]              = 0
        values[`${p}_state_text`]         = stateToString(0)
        values[`${p}_position`]           = 0
        values[`${p}_position_timecode`]  = framesToTimeString(0, 60)
        values[`${p}_countdown`]          = 0
        values[`${p}_countdown_timecode`] = framesToTimeString(0, 60)
        values[`${p}_fps`]                = tl.fps ? parseInt(tl.fps) : 0
        assignPrefixed(values, p, cueValues(instance, tl))
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
      Object.assign(defs, cueDefinitions(sel, 'Selected Timeline'))

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
        assignPrefixed(values, p, cueValues(instance, tl))
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
      assignPrefixed(values, 'timeline_selected', cueValues(instance, s))

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
      assignPrefixed(values, 'timeline_selected', cueValues(instance, s))
      if (instance.setVariableValues) instance.setVariableValues(values)
    } catch (e) {
      if (instance && instance.log) instance.log('error', `variables.updateSelectedVariables error: ${e.message}`)
    }
  },
}
