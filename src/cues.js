/*
  Cue cache for the Pixera Companion module.

  State kept on the Companion instance:
    instance.CUES            cueHandle -> {handle, timelineHandle, name, index, number,
                                           numberFormatted, operation, waitDuration, time}
    instance.CUESBYTIMELINE  timelineHandle -> [cueHandle, ...] sorted by time
    instance.CHOICES_CUENAME    dropdown choices for name based actions (id = cue name)

  Cues are fetched once per connect (Timeline.getCues + Cue.getAttributes + Cue.getTime)
  and kept in sync through the cueAdded/cueChanged/cueRemoved/cueApplied monitoring subjects.
*/

// Display name for a cue: its name, or - for unnamed cues - its cue number.
function cueLabel(cue) {
  if (!cue) return ''
  if (cue.name !== undefined && cue.name !== null && String(cue.name).trim() !== '') {
    return String(cue.name)
  }
  if (cue.numberFormatted !== undefined && cue.numberFormatted !== null && String(cue.numberFormatted).trim() !== '') {
    return String(cue.numberFormatted)
  }
  if (cue.number !== undefined && cue.number !== null) return `Cue ${cue.number}`
  if (cue.index !== undefined && cue.index !== null) return `Cue ${parseInt(cue.index) + 1}`
  return `Cue ${cue.handle}`
}

function getCue(instance, cueHandle) {
  if (!instance || !instance.CUES) return undefined
  return instance.CUES[cueHandle]
}

// Cue objects of one timeline, in chronological order.
function getCuesOfTimeline(instance, timelineHandle) {
  if (!instance || !instance.CUESBYTIMELINE) return []
  const handles = instance.CUESBYTIMELINE[timelineHandle] || []
  return handles.map((h) => instance.CUES[h]).filter((c) => c !== undefined)
}

function cueTime(cue) {
  const t = cue && cue.time !== undefined && cue.time !== null ? Number(cue.time) : NaN
  return isNaN(t) ? null : Math.round(t)
}

function sortTimelineCues(instance, timelineHandle) {
  const list = instance.CUESBYTIMELINE[timelineHandle]
  if (!list) return
  list.sort((a, b) => {
    const ca = instance.CUES[a]
    const cb = instance.CUES[b]
    const ta = cueTime(ca)
    const tb = cueTime(cb)
    // cues without a known time yet keep their order at the end
    if (ta === null && tb === null) return 0
    if (ta === null) return 1
    if (tb === null) return -1
    if (ta !== tb) return ta - tb
    const ia = ca && ca.index !== undefined ? parseInt(ca.index) : 0
    const ib = cb && cb.index !== undefined ? parseInt(cb.index) : 0
    return ia - ib
  })
}

// Create or patch a cue record. Returns the record.
function upsertCue(instance, cueHandle, patch) {
  if (!instance) return undefined
  if (!instance.CUES) instance.CUES = {}
  if (!instance.CUESBYTIMELINE) instance.CUESBYTIMELINE = {}

  let cue = instance.CUES[cueHandle]
  if (!cue) {
    cue = { handle: cueHandle, timelineHandle: null, time: null }
    instance.CUES[cueHandle] = cue
  }

  const previousTimeline = cue.timelineHandle
  Object.assign(cue, patch)

  if (cue.timelineHandle !== null && cue.timelineHandle !== undefined) {
    if (previousTimeline !== null && previousTimeline !== undefined && previousTimeline !== cue.timelineHandle) {
      const old = instance.CUESBYTIMELINE[previousTimeline]
      if (old) instance.CUESBYTIMELINE[previousTimeline] = old.filter((h) => h !== cueHandle)
    }
    if (!instance.CUESBYTIMELINE[cue.timelineHandle]) instance.CUESBYTIMELINE[cue.timelineHandle] = []
    if (!instance.CUESBYTIMELINE[cue.timelineHandle].includes(cueHandle)) {
      instance.CUESBYTIMELINE[cue.timelineHandle].push(cueHandle)
    }
    sortTimelineCues(instance, cue.timelineHandle)
  }

  return cue
}

/*
  Make the cached cue list of a timeline match the handles Pixera just reported:
  register new ones in the given (chronological) order and drop the ones that are gone.
  Returns the handles whose details still have to be fetched.
*/
function syncTimelineCues(instance, timelineHandle, handles) {
  if (!instance) return []
  if (!instance.CUES) instance.CUES = {}
  if (!instance.CUESBYTIMELINE) instance.CUESBYTIMELINE = {}

  const known = instance.CUESBYTIMELINE[timelineHandle] || []
  for (const h of known.slice()) {
    if (!handles.includes(h)) removeCue(instance, h)
  }

  const unresolved = []
  for (let i = 0; i < handles.length; i++) {
    const existing = instance.CUES[handles[i]]
    upsertCue(instance, handles[i], { timelineHandle: timelineHandle, index: i })
    //a cue we have never seen still needs name/number and time
    if (!existing || existing.time === null || existing.time === undefined) {
      unresolved.push(handles[i])
    }
  }
  return unresolved
}

function removeCue(instance, cueHandle) {
  if (!instance || !instance.CUES) return
  const cue = instance.CUES[cueHandle]
  if (cue && cue.timelineHandle !== null && cue.timelineHandle !== undefined) {
    const list = instance.CUESBYTIMELINE[cue.timelineHandle]
    if (list) instance.CUESBYTIMELINE[cue.timelineHandle] = list.filter((h) => h !== cueHandle)
  }
  delete instance.CUES[cueHandle]

  for (const tl of instance.CHOICES_TIMELINEFEEDBACK || []) {
    for (const key of ['cueApplied', 'cueCurrent', 'cueNext', 'cuePrev']) {
      if (tl[key] === cueHandle) tl[key] = null
    }
  }
}

// Drop every cue belonging to a timeline (used when a timeline is removed).
function removeCuesOfTimeline(instance, timelineHandle) {
  if (!instance || !instance.CUESBYTIMELINE) return
  const list = instance.CUESBYTIMELINE[timelineHandle] || []
  for (const h of list.slice()) {
    if (instance.CUES) delete instance.CUES[h]
  }
  delete instance.CUESBYTIMELINE[timelineHandle]
}

/*
  Pixera can exclude a cue from the countdown ("Exclude Cue from Countdown"). Such a cue is
  still the chronologically next one, but the timeline counts down to the cue after it, and
  the API exposes no flag for this. The countdown itself does tell us: while it counts towards
  a cue (flag 1) the target sits at position + countdown, so we match a cue to that time and
  prefer it over the chronological successor. Anything else (no countdown, flag 2 = a cue wait
  duration, no cue at that time) keeps the chronological successor.
  Can be turned off with the 'Next cue follows countdown' option in the instance config.
*/
const COUNTDOWN_MATCH_TOLERANCE = 2 // frames

function matchCountdownCue(instance, tl, cues, position, chronologicalNext) {
  const config = (instance && instance.config) || {}
  if (config.cue_next_follows_countdown === false) return chronologicalNext
  if (parseInt(tl.countdownFlag) !== 1) return chronologicalNext

  const countdown = tl.timelineCountdowns ? parseInt(tl.timelineCountdowns) : 0
  if (!countdown || countdown <= 0) return chronologicalNext

  const target = position + countdown
  let best = null
  let bestDiff = null
  for (const c of cues) {
    const t = cueTime(c)
    if (t <= position) continue
    const diff = Math.abs(t - target)
    if (bestDiff === null || diff < bestDiff) {
      best = c.handle
      bestDiff = diff
    }
  }

  return best !== null && bestDiff <= COUNTDOWN_MATCH_TOLERANCE ? best : chronologicalNext
}

/*
  Derive current/next/previous cue for every timeline from the cached cue times and the
  live timeline position. 'cueApplied' (from monitoring) wins for the current cue, and the
  timeline countdown wins for the next cue (see matchCountdownCue).
*/
function recomputePointers(instance) {
  if (!instance) return
  for (const tl of instance.CHOICES_TIMELINEFEEDBACK || []) {
    if (tl.handle === -1) continue

    const cues = getCuesOfTimeline(instance, tl.handle).filter((c) => cueTime(c) !== null)
    if (cues.length === 0) {
      tl.cueCurrent = tl.cueApplied !== undefined ? tl.cueApplied : null
      tl.cueNext = null
      tl.cuePrev = null
      continue
    }

    const position = tl.timelinePositions ? parseInt(tl.timelinePositions) : 0

    let prev = null
    let next = null
    let atOrBefore = null
    for (const c of cues) {
      const t = cueTime(c)
      if (t < position) prev = c.handle
      if (t <= position) atOrBefore = c.handle
      if (t > position && next === null) next = c.handle
    }

    tl.cuePrev = prev
    tl.cueNext = matchCountdownCue(instance, tl, cues, position, next)

    /*
      The applied cue is authoritative while the timeline plays through it, but it must not
      stick once the playhead has moved somewhere else (scrub, jump, goto time). So it only
      wins while it sits at or before the playhead and is not older than the cue the
      position itself points at.
    */
    const applied = tl.cueApplied
    const appliedCue = applied !== undefined && applied !== null ? instance.CUES[applied] : undefined
    const appliedTime = appliedCue && appliedCue.timelineHandle === tl.handle ? cueTime(appliedCue) : null
    const atOrBeforeTime = atOrBefore !== null ? cueTime(instance.CUES[atOrBefore]) : null

    if (appliedTime !== null && appliedTime <= position && (atOrBeforeTime === null || appliedTime >= atOrBeforeTime)) {
      tl.cueCurrent = applied
    } else {
      tl.cueCurrent = atOrBefore
    }
  }
}

// Find a cue of one timeline by what the dropdown shows (its name, or its number if unnamed)
function findCueByLabel(instance, timelineHandle, label) {
  if (!instance || label === undefined || label === null) return undefined
  const wanted = String(label).trim()
  if (wanted === '') return undefined
  const list = getCuesOfTimeline(instance, timelineHandle)
  return (
    list.find((c) => c.name !== undefined && c.name !== null && String(c.name) === wanted) ||
    list.find((c) => cueLabel(c) === wanted)
  )
}

/*
  Build the cue dropdowns for an action or feedback.

  Companion option choices are static, they cannot depend on another option at runtime. So we
  emit one cue dropdown per timeline and let isVisibleExpression show only the one belonging to
  the timeline that is currently picked - the user sees a single, filtered cue list.
  The last field is the fallback for 'Selected Timeline' and for configurations that were made
  before the per-timeline lists existed; it lists the cues of all timelines.
*/
function cueOptionFields(instance, timelineOptionId, baseId, label) {
  const fields = []
  const handles = []

  for (const tl of (instance && instance.CHOICES_TIMELINEFEEDBACK) || []) {
    if (tl.handle === -1) continue
    handles.push(tl.handle)
    const choices = getCuesOfTimeline(instance, tl.handle).map((c) => ({
      id: cueLabel(c),
      label: cueLabel(c),
    }))
    fields.push({
      type: 'dropdown',
      label: label,
      id: `${baseId}_${tl.handle}`,
      default: (choices[0] || {}).id || '',
      choices: choices,
      allowCustom: true,
      isVisibleExpression: `$(options:${timelineOptionId}) == ${tl.handle}`,
      tooltip: 'Unnamed cues are listed by their cue number',
    })
  }

  /*
    'Selected Timeline' (-1): the module polls the selection, so this list can show the cues of
    the timeline that is currently selected in Pixera. It is rebuilt whenever the selection
    changes; if nothing is selected we fall back to the cues of all timelines.
  */
  const selected = ((instance && instance.SELECTEDTIMELINES) || [])[0]
  const selectedCues =
    selected !== undefined && selected !== null
      ? getCuesOfTimeline(instance, selected).map((c) => ({ id: cueLabel(c), label: cueLabel(c) }))
      : []

  const fallbackChoices =
    selectedCues.length > 0 ? selectedCues : (instance && instance.CHOICES_CUENAME) || []

  fields.push({
    type: 'dropdown',
    label: label,
    id: baseId,
    default: (fallbackChoices[0] || {}).id || '',
    choices: fallbackChoices,
    allowCustom: true,
    isVisibleExpression: handles
      .map((h) => `$(options:${timelineOptionId}) != ${h}`)
      .join(' && '),
    tooltip:
      selectedCues.length > 0
        ? 'Cues of the timeline currently selected in Pixera'
        : 'Cues of all timelines - select a timeline in Pixera to narrow the list',
  })

  return fields
}

/*
  Read back whichever of the per-timeline cue dropdowns applies.

  Takes the *configured* timeline option, not a resolved timeline handle: with 'Selected
  Timeline' (-1) no per-timeline field was ever shown, so the fallback field holds the cue the
  user picked - the cue name is then looked up on whatever timeline is selected when the action
  runs. Using the resolved handle here would pick up the hidden field's default instead.
*/
function readCueOption(options, baseId, timelineOption) {
  const key = `${baseId}_${timelineOption}`
  if (Object.prototype.hasOwnProperty.call(options, key)) {
    const specific = options[key]
    if (specific !== undefined && specific !== null && String(specific).trim() !== '') {
      return specific
    }
  }
  return options[baseId]
}

/*
  Rebuild CHOICES_CUENAME: the cue labels alone, de-duplicated across timelines. Actions and
  feedbacks always pick the timeline in a separate dropdown, so the timeline is deliberately
  not part of these entries - a combined '<Timeline> › <Cue>' list is unusable once a show has
  hundreds of cues.
*/
function rebuildCueChoices(instance) {
  if (!instance) return
  const labels = new Set()

  for (const tl of instance.CHOICES_TIMELINEFEEDBACK || []) {
    if (tl.handle === -1) continue
    for (const cue of getCuesOfTimeline(instance, tl.handle)) {
      labels.add(cueLabel(cue))
    }
  }

  instance.CHOICES_CUENAME = Array.from(labels).map((l) => ({ id: l, label: l }))
}

module.exports = {
  cueLabel,
  getCue,
  getCuesOfTimeline,
  findCueByLabel,
  cueOptionFields,
  readCueOption,
  syncTimelineCues,
  upsertCue,
  removeCue,
  removeCuesOfTimeline,
  recomputePointers,
  rebuildCueChoices,
  sortTimelineCues,
}
