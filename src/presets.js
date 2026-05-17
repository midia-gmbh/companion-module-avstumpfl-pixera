const { combineRgb } = require('@companion-module/base')

const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)
const GREEN = combineRgb(0, 200, 0)
const YELLOW = combineRgb(255, 255, 0)
const RED = combineRgb(200, 0, 0)
const PURPLE = combineRgb(153, 0, 153)
const BLUE_DARK = combineRgb(0, 0, 153)

const TRANSPORT_MODES = [
	{ mode: 1, icon: '⏵', label: 'Play',   run_bg: GREEN,  pause_bg: BLACK,  stop_bg: BLACK,  run_fg: WHITE, pause_fg: WHITE, stop_fg: WHITE },
	{ mode: 2, icon: '⏸', label: 'Pause',  run_bg: BLACK,  pause_bg: YELLOW, stop_bg: BLACK,  run_fg: WHITE, pause_fg: BLACK, stop_fg: WHITE },
	{ mode: 3, icon: '⏹', label: 'Stop',   run_bg: BLACK,  pause_bg: BLACK,  stop_bg: RED,    run_fg: WHITE, pause_fg: WHITE, stop_fg: WHITE },
	{ mode: 4, icon: '⏯', label: 'Toggle', run_bg: GREEN,  pause_bg: YELLOW, stop_bg: BLACK,  run_fg: WHITE, pause_fg: BLACK, stop_fg: WHITE },
]

const STATE_FEEDBACK_ALL = { run_bg: GREEN, pause_bg: YELLOW, stop_bg: RED, run_fg: WHITE, pause_fg: BLACK, stop_fg: WHITE }

const TIMECODE_LABELS = [
	{ id: '1', label: 'HH', title: 'Hour' },
	{ id: '2', label: 'MM', title: 'Minute' },
	{ id: '3', label: 'SS', title: 'Second' },
	{ id: '4', label: 'FF', title: 'Frame' },
]

const CUE_MODES = [
	{ actionId: 'timeline_prev_cue', optKey: 'timelinename_prev', icon: '⏮', label: 'Previous Cue' },
	{ actionId: 'timeline_next_cue', optKey: 'timelinename_next', icon: '⏭', label: 'Next Cue' },
]

const FADE_MODES = [
	{ fadeIn: true,  icon: '▲\nFade Up',   label: 'Fade Up' },
	{ fadeIn: false, icon: '▼\nFade Down', label: 'Fade Down' },
]

const TIMECODE_SECTIONS = [
	{ header: 'Timeline Timecode',   varSuffix: 'position_timecode',  varLabel: 'Position',  feedbackId: 'timeline_positions',  feedbackIdSelected: 'timeline_positions_selected' },
	{ header: 'Timeline Countdown',  varSuffix: 'countdown_timecode', varLabel: 'Countdown', feedbackId: 'timeline_countdowns', feedbackIdSelected: 'timeline_countdowns_selected' },
]

function stateFb(feedbackId, handle, colors) {
	return { feedbackId, options: { timelinename_feedback: handle, ...colors } }
}

function makeGroup(id, name, description) {
	return { type: 'simple', id, name, description, presets: [] }
}

function addPreset(presetsObj, group, id, def) {
	presetsObj[id] = { type: 'simple', name: def.name, style: def.style, steps: def.steps, feedbacks: def.feedbacks }
	group.presets.push(id)
}

module.exports = {
	updatePresets() {
		const self = this
		const sections = []
		const presetsObj = {}

		// --- Selected Timeline ---
		const selSection = { id: 'selected_timeline', name: 'Selected Timeline', definitions: [] }

		const selTransportGroup = makeGroup('sel_transport', 'Transport', 'Transport controls for the currently selected timeline.')
		for (const t of TRANSPORT_MODES) {
			addPreset(presetsObj, selTransportGroup, `sel_transport_${t.mode}`, {
				name: `Selected – ${t.label}`,
				style: { text: t.icon, size: '60', color: WHITE, bgcolor: BLACK },
				steps: [{ down: [{ actionId: 'timeline_transport', options: { mode: t.mode, timelinename_state: -1 } }], up: [] }],
				feedbacks: [{ feedbackId: 'timeline_state_selected', options: { run_fg: t.run_fg, run_bg: t.run_bg, pause_fg: t.pause_fg, pause_bg: t.pause_bg, stop_fg: t.stop_fg, stop_bg: t.stop_bg } }],
			})
		}
		addPreset(presetsObj, selTransportGroup, 'sel_state_feedback', {
			name: 'Selected – State Feedback',
			style: { text: '', size: '14', color: WHITE, bgcolor: BLACK },
			steps: [{ down: [], up: [] }],
			feedbacks: [{ feedbackId: 'timeline_state_selected', options: STATE_FEEDBACK_ALL }],
		})
		selSection.definitions.push(selTransportGroup)

		const selCueGroup = makeGroup('sel_cue', 'Cue Navigation', 'Jump to the next or previous cue on the selected timeline.')
		for (const c of CUE_MODES) {
			addPreset(presetsObj, selCueGroup, `sel_cue_${c.actionId}`, {
				name: `Selected – ${c.label}`,
				style: { text: c.icon, size: '60', color: WHITE, bgcolor: BLUE_DARK },
				steps: [{ down: [{ actionId: c.actionId, options: { [c.optKey]: -1, [`${c.optKey}_ignore`]: false, [`${c.optKey}_blend`]: false, blend_name_frames: 60 } }], up: [] }],
				feedbacks: [],
			})
		}
		selSection.definitions.push(selCueGroup)

		const selFadeGroup = makeGroup('sel_fade', 'Fade', 'Fade the selected timeline in or out.')
		for (const f of FADE_MODES) {
			addPreset(presetsObj, selFadeGroup, `sel_fade_${f.fadeIn ? 'in' : 'out'}`, {
				name: `Selected – ${f.label}`,
				style: { text: f.icon, size: '24', color: WHITE, bgcolor: PURPLE },
				steps: [{ down: [{ actionId: 'timeline_fadeopacity', options: { timelinename_timelineopacity: -1, timeline_fadeIn: f.fadeIn, timeline_fadeopacity_time: '60' } }], up: [] }],
				feedbacks: [],
			})
		}
		selSection.definitions.push(selFadeGroup)

		for (const sec of TIMECODE_SECTIONS) {
			const tcGroup = makeGroup(`sel_tc_${sec.varSuffix}`, sec.header, `Full ${sec.varLabel} or individual components via feedback.`)
			addPreset(presetsObj, tcGroup, `sel_tc_${sec.varSuffix}_full`, {
				name: `Selected – ${sec.varLabel}`,
				style: { text: `$(pixera:timeline_selected_${sec.varSuffix})`, size: '14', color: WHITE, bgcolor: BLACK },
				steps: [{ down: [], up: [] }],
				feedbacks: [],
			})
			for (const tc of TIMECODE_LABELS) {
				addPreset(presetsObj, tcGroup, `sel_tc_${sec.varSuffix}_${tc.id}`, {
					name: `Selected – ${sec.varLabel} ${tc.title}`,
					style: { text: tc.label, size: '24', color: WHITE, bgcolor: BLACK },
					steps: [{ down: [], up: [] }],
					feedbacks: [{ feedbackId: sec.feedbackIdSelected, options: { show_label: tc.id } }],
				})
			}
			selSection.definitions.push(tcGroup)
		}

		sections.push(selSection)

		// --- Per-Timeline Presets ---
		for (const tl of (self.CHOICES_TIMELINEFEEDBACK || []).filter(tl => tl.handle !== -1)) {
			const { name, handle } = tl
			const h = String(handle)
			const tlSection = { id: `tl_${h}`, name: `Timeline: ${name}`, definitions: [] }

			const transportGroup = makeGroup(`tl_${h}_transport`, 'Transport', 'Transport controls for this timeline.')
			for (const t of TRANSPORT_MODES) {
				addPreset(presetsObj, transportGroup, `tl_${h}_transport_${t.mode}`, {
					name: `${name} – ${t.label}`,
					style: { text: t.icon, size: '60', color: WHITE, bgcolor: BLACK },
					steps: [{ down: [{ actionId: 'timeline_transport', options: { mode: t.mode, timelinename_state: handle } }], up: [] }],
					feedbacks: [stateFb('timeline_state', handle, { run_fg: t.run_fg, run_bg: t.run_bg, pause_fg: t.pause_fg, pause_bg: t.pause_bg, stop_fg: t.stop_fg, stop_bg: t.stop_bg })],
				})
			}
			addPreset(presetsObj, transportGroup, `tl_${h}_state_feedback`, {
				name: `${name} – State Feedback`,
				style: { text: '', size: '14', color: WHITE, bgcolor: BLACK },
				steps: [{ down: [], up: [] }],
				feedbacks: [stateFb('timeline_state', handle, STATE_FEEDBACK_ALL)],
			})
			tlSection.definitions.push(transportGroup)

			const cueGroup = makeGroup(`tl_${h}_cue`, 'Cue Navigation', 'Jump to the next or previous cue.')
			for (const c of CUE_MODES) {
				addPreset(presetsObj, cueGroup, `tl_${h}_cue_${c.actionId}`, {
					name: `${name} – ${c.label}`,
					style: { text: c.icon, size: '60', color: WHITE, bgcolor: BLUE_DARK },
					steps: [{ down: [{ actionId: c.actionId, options: { [c.optKey]: handle, [`${c.optKey}_ignore`]: false, [`${c.optKey}_blend`]: false, blend_name_frames: 60 } }], up: [] }],
					feedbacks: [],
				})
			}
			tlSection.definitions.push(cueGroup)

			const fadeGroup = makeGroup(`tl_${h}_fade`, 'Fade', 'Fade this timeline in or out.')
			for (const f of FADE_MODES) {
				addPreset(presetsObj, fadeGroup, `tl_${h}_fade_${f.fadeIn ? 'in' : 'out'}`, {
					name: `${name} – ${f.label}`,
					style: { text: f.icon, size: '24', color: WHITE, bgcolor: PURPLE },
					steps: [{ down: [{ actionId: 'timeline_fadeopacity', options: { timelinename_timelineopacity: handle, timeline_fadeIn: f.fadeIn, timeline_fadeopacity_time: '60' } }], up: [] }],
					feedbacks: [],
				})
			}
			tlSection.definitions.push(fadeGroup)

			const selectGroup = makeGroup(`tl_${h}_select`, 'Select', 'Select this timeline in Pixera.')
			addPreset(presetsObj, selectGroup, `tl_${h}_select`, {
				name: `${name} – Select`,
				style: { text: `Select\n$(pixera:timeline_${handle}_name)`, size: '14', color: WHITE, bgcolor: combineRgb(102, 51, 0) },
				steps: [{ down: [{ actionId: 'timeline_select', options: { timeline_select_timeline: handle } }], up: [] }],
				feedbacks: [{ feedbackId: 'timeline_selected', options: { timelinename_feedback: handle, fg: WHITE, bg: combineRgb(204, 101, 0) } }],
			})
			tlSection.definitions.push(selectGroup)

			for (const sec of TIMECODE_SECTIONS) {
				const tcGroup = makeGroup(`tl_${h}_tc_${sec.varSuffix}`, sec.header, `Full ${sec.varLabel} or individual components: Hour, Minute, Second, Frame.`)
				addPreset(presetsObj, tcGroup, `tl_${h}_tc_${sec.varSuffix}_full`, {
					name: `${name} – ${sec.varLabel}`,
					style: { text: `$(pixera:timeline_${handle}_${sec.varSuffix})`, size: '14', color: WHITE, bgcolor: BLACK },
					steps: [{ down: [], up: [] }],
					feedbacks: [],
				})
				for (const tc of TIMECODE_LABELS) {
					addPreset(presetsObj, tcGroup, `tl_${h}_tc_${sec.varSuffix}_${tc.id}`, {
						name: `${name} – ${sec.varLabel} ${tc.title}`,
						style: { text: tc.label, size: '24', color: WHITE, bgcolor: BLACK },
						steps: [{ down: [], up: [] }],
						feedbacks: [{ feedbackId: sec.feedbackId, options: { timelinename_feedback: handle, show_label: tc.id } }],
					})
				}
				tlSection.definitions.push(tcGroup)
			}

			sections.push(tlSection)
		}

		self.setPresetDefinitions(sections, presetsObj)
	},
}
