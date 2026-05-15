/*
  Variables helper for Pixera Companion module
  - Defines variables per timeline (by handle)
  - Updates variable values when timeline data changes
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
    case 1:
      return 'play'
    case 2:
      return 'pause'
    case 3:
      return 'stop'
    default:
      return 'unknown'
  }
}

function sanitizeName(name) {
  if (!name) return ''
  try {
    let s = name.toString()

    // Normalize common German umlauts and ß to ascii equivalents
    s = s.replace(/Ä/g, 'Ae').replace(/ä/g, 'ae')
    s = s.replace(/Ö/g, 'Oe').replace(/ö/g, 'oe')
    s = s.replace(/Ü/g, 'Ue').replace(/ü/g, 'ue')
    s = s.replace(/ß/g, 'ss')

    // Remove diacritics (é -> e)
    s = s.normalize('NFKD').replace(/\p{Diacritic}/gu, '')

    // lowercase, keep only a-z0-9, replace sequences of invalid chars with underscore
    s = s.toLowerCase().replace(/[^a-z0-9]+/g, '_')

    // collapse multiple underscores and trim
    s = s.replace(/_+/g, '_').replace(/^_+|_+$/g, '')

    // final safety strip – remove any char still not in [a-z0-9_-]
    s = s.replace(/[^a-z0-9_-]/g, '')

    // if slug starts with digit, prefix with 't_'
    if (/^[0-9]/.test(s)) s = `t_${s}`

    // limit length to 40 chars to keep variable ids reasonable
    if (s.length > 40) s = s.substring(0, 40)

    return s
  } catch (e) {
    return ''
  }
}

module.exports = {
  initVariables: function (instance) {
    // build definitions & initial values from current timeline feedback array
    this.initDefinitions(instance)
  },

  // create variable definitions (called once when timeline list is known)
  initDefinitions: function (instance) {
    try {
      if (!instance) return

      const defs = []
      const values = {}
      const list = instance.CHOICES_TIMELINEFEEDBACK || []
      for (let i = 0; i < list.length; i++) {
        const tl = list[i] || {}
        const handle = tl.handle !== undefined && tl.handle !== null ? tl.handle : i


        const name = tl.name ? tl.name : `Timeline_${handle}`
        const baseSlug = sanitizeName(name)

        // Use a stable slug for the selected timeline (handle === -1)
        let effectiveSlug = null
        if (handle === -1) {
          effectiveSlug = 'selected'
        } else {
          effectiveSlug = baseSlug && baseSlug.length > 0 ? baseSlug : `timeline_${handle}`
        }
        if (defs.find((d) => d.variableId === `timeline_${effectiveSlug}_state`)) {
          effectiveSlug = `${effectiveSlug}_${handle}`
          if (instance && instance.log) {
            try {
              instance.log('warn', `variables: duplicate timeline name detected for '${name}'. Using slug '${effectiveSlug}' to keep variables unique.`)
            } catch (e) {}
          }
        }

        // Store slug back so other modules (e.g. presets) can reference it
        list[i].slug = effectiveSlug

  const basePrefix = `timeline_${effectiveSlug}`
  const finalIdState = `${basePrefix}_state`
  const finalIdPositions = `${basePrefix}_position`
  const finalIdCountdowns = `${basePrefix}_countdown`
  const finalIdName = `${basePrefix}_name`
  const finalIdFps = `${basePrefix}_fps`
// If the timeline is the selected timeline (handle === -1), use "Selected Timeline" as the name
const displayName = (name === 'Timeline_-1' || handle === -1) ? 'Selected Timeline' : name

if (!defs.find((d) => d.variableId === finalIdState)) {
  defs.push({ variableId: finalIdState, name: `${displayName} - State (numeric)` })
}
if (!defs.find((d) => d.variableId === `${finalIdState}_text`)) {
  defs.push({ variableId: `${finalIdState}_text`, name: `${displayName} - State (text)` })
}
if (!defs.find((d) => d.variableId === finalIdPositions)) {
  defs.push({ variableId: finalIdPositions, name: `${displayName} - Position (frames)` })
}
if (!defs.find((d) => d.variableId === `${finalIdPositions}_timecode`)) {
  defs.push({ variableId: `${finalIdPositions}_timecode`, name: `${displayName} - Position (HH:MM:SS:FF)` })
}
if (!defs.find((d) => d.variableId === finalIdCountdowns)) {
  defs.push({ variableId: finalIdCountdowns, name: `${displayName} - Countdown (frames)` })
}
if (!defs.find((d) => d.variableId === `${finalIdCountdowns}_timecode`)) {
  defs.push({ variableId: `${finalIdCountdowns}_timecode`, name: `${displayName} - Countdown (HH:MM:SS:FF)` })
}

if (!defs.find((d) => d.variableId === finalIdName)) {
  defs.push({ variableId: finalIdName, name: `${displayName} - Name` })
}
if (!defs.find((d) => d.variableId === finalIdFps)) {
  defs.push({ variableId: finalIdFps, name: `${displayName} - FPS` })
}

        // set initial zero values for the newly defined variables
  values[finalIdState] = 0
  values[`${finalIdState}_text`] = stateToString(0)
  values[finalIdPositions] = 0
  values[`${finalIdPositions}_timecode`] = framesToTimeString(0, 60)
  values[finalIdCountdowns] = 0
  values[`${finalIdCountdowns}_timecode`] = framesToTimeString(0, 60)
  values[finalIdName] = name
  values[finalIdFps] = tl.fps ? parseInt(tl.fps) : 0
        // store slug on the timeline feedback entry so updates use same slug
        try {
          if (list[i]) list[i].slug = effectiveSlug
        } catch (e) {}
      }

      if (instance.setVariableDefinitions) {
        instance.setVariableDefinitions(defs)
      }

      // set initial values if available
      if (instance.setVariableValues) {

        instance.setVariableValues(values)
      }
    } catch (e) {
      if (instance && instance.log) instance.log('error', `variables.initDefinitions error: ${e.message}`)
    }
  },

  // update only variable values (called on monitoring updates - Case 10000)
  updateVariables: function (instance) {
    try {
      if (!instance) return

  const values = {}

  const list = instance.CHOICES_TIMELINEFEEDBACK || []
      for (let i = 0; i < list.length; i++) {
        const tl = list[i] || {}
        const handle = tl.handle !== undefined && tl.handle !== null ? tl.handle : i

        const name = tl.name ? tl.name : `Timeline_${handle}`
        const baseSlug = sanitizeName(name)

  // Prefer slug saved during initDefinitions; fall back to name-based slug if missing.
  let effectiveSlug = null
  if (tl && tl.slug) {
    effectiveSlug = tl.slug
  } else if (handle === -1) {
    // keep a stable slug for the selected timeline
    effectiveSlug = 'selected'
  } else {
    effectiveSlug = baseSlug && baseSlug.length > 0 ? baseSlug : `timeline_${handle}`
  }

  const finalIdState = `timeline_${effectiveSlug}_state`
  const finalIdPositions = `timeline_${effectiveSlug}_position`
  const finalIdCountdowns = `timeline_${effectiveSlug}_countdown`
  const finalIdName = `timeline_${effectiveSlug}_name`
  const finalIdFps = `timeline_${effectiveSlug}_fps`

  // values: map state to numeric (like feedbacks) and friendly string; positions/countdowns to raw frames
        const fps = tl.fps ? parseInt(tl.fps) : 60
        const posFrames = tl.timelinePositions ? parseInt(tl.timelinePositions) : 0
        const countdownFrames = tl.timelineCountdowns ? parseInt(tl.timelineCountdowns) : 0

        const stateNum = tl.timelineTransport !== undefined && tl.timelineTransport !== null ? parseInt(tl.timelineTransport) : 0
        const stateStr = stateToString(stateNum)
        const posStr = framesToTimeString(posFrames, fps)
        const countdownStr = framesToTimeString(countdownFrames, fps)
        
        // set slug-based values: numeric state and raw frame counts (feedbacks expect raw frames)
        values[finalIdState] = stateNum
        values[`${finalIdState}_text`] = stateStr
        values[finalIdPositions] = posFrames
        values[`${finalIdPositions}_timecode`] = posStr
        values[finalIdCountdowns] = countdownFrames
        values[`${finalIdCountdowns}_timecode`] = countdownStr
        // name and fps variables
        values[finalIdName] = `${name}`
        values[finalIdFps] = tl.fps ? parseInt(tl.fps) : 0
      }

      if (instance.setVariableValues) {
        instance.setVariableValues(values)
      }
    } catch (e) {
      if (instance && instance.log) instance.log('error', `variables.updateVariables error: ${e.message}`)
    }
  },
}
