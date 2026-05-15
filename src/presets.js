const { combineRgb } = require('@companion-module/base')

module.exports = {
	updatePresets() {
		const self = this
		const presets = []

		for (const tl of (self.CHOICES_TIMELINEFEEDBACK || [])) {
			const { name, handle, slug } = tl
			const category = `Timeline: ${name}`

			// --- Transport ---
			presets.push({ type: 'text', category, name: 'Transport', text: 'Transport controls for this timeline.' })

			// Play
			presets.push({
				type: 'button',
				category,
				name: `${name} – Play`,
				style: { text: '⏵', size: '60', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
				steps: [{ down: [{ actionId: 'timeline_transport', options: { mode: 1, timelinename_state: handle } }], up: [] }],
				feedbacks: [{ feedbackId: 'timeline_state', options: {
					timelinename_feedback: name,
					run_fg: combineRgb(255, 255, 255), run_bg: combineRgb(0, 255, 0),
					pause_fg: combineRgb(0, 0, 0), pause_bg: combineRgb(0, 0, 0),
					stop_fg: combineRgb(255, 255, 255), stop_bg: combineRgb(0, 0, 0),
				} }],
			})

			// Pause
			presets.push({
				type: 'button',
				category,
				name: `${name} – Pause`,
				style: { text: '⏸', size: '60', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
				steps: [{ down: [{ actionId: 'timeline_transport', options: { mode: 2, timelinename_state: handle } }], up: [] }],
				feedbacks: [{ feedbackId: 'timeline_state', options: {
					timelinename_feedback: name,
					run_fg: combineRgb(255, 255, 255), run_bg: combineRgb(0, 0, 0),
					pause_fg: combineRgb(0, 0, 0), pause_bg: combineRgb(255, 255, 0),
					stop_fg: combineRgb(255, 255, 255), stop_bg: combineRgb(0, 0, 0),
				} }],
			})

			// Stop
			presets.push({
				type: 'button',
				category,
				name: `${name} – Stop`,
				style: { text: '⏹', size: '60', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
				steps: [{ down: [{ actionId: 'timeline_transport', options: { mode: 3, timelinename_state: handle } }], up: [] }],
				feedbacks: [{ feedbackId: 'timeline_state', options: {
					timelinename_feedback: name,
					run_fg: combineRgb(255, 255, 255), run_bg: combineRgb(0, 0, 0),
					pause_fg: combineRgb(0, 0, 0), pause_bg: combineRgb(0, 0, 0),
					stop_fg: combineRgb(255, 255, 255), stop_bg: combineRgb(255, 0, 0),
				} }],
			})

			// Toggle Play/Pause
			presets.push({
				type: 'button',
				category,
				name: `${name} – Toggle Play/Pause`,
				style: { text: '⏯', size: '60', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
				steps: [{ down: [{ actionId: 'timeline_transport', options: { mode: 4, timelinename_state: handle } }], up: [] }],
				feedbacks: [{ feedbackId: 'timeline_state', options: {
					timelinename_feedback: name,
					run_fg: combineRgb(255, 255, 255), run_bg: combineRgb(0, 255, 0),
					pause_fg: combineRgb(0, 0, 0), pause_bg: combineRgb(255, 255, 0),
					stop_fg: combineRgb(255, 255, 255), stop_bg: combineRgb(0, 0, 0),
				} }],
			})
			// Timeline State Feedback
			presets.push({
				type: 'button',
				category,
				name: `${name} – State Feedback`,
				style: { text: '', size: '14', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
				steps: [{ down: [], up: [] }],
				feedbacks: [{ feedbackId: 'timeline_state', options: {
					timelinename_feedback: name,
					run_fg: combineRgb(255, 255, 255), run_bg: combineRgb(0, 255, 0),
					pause_fg: combineRgb(0, 0, 0), pause_bg: combineRgb(255, 255, 0),
					stop_fg: combineRgb(255, 255, 255), stop_bg: combineRgb(255, 0, 0),
				} }],
			})

			// --- Cue Navigation ---
			presets.push({ type: 'text', category, name: 'Cue Navigation', text: 'Jump to the next or previous cue.' })

			// Next Cue
			presets.push({
				type: 'button',
				category,
				name: `${name} – Nächster Cue`,
				style: { text: '⏭', size: '60', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 153) },
				steps: [{ down: [{ actionId: 'timeline_next_cue', options: { timelinename_next: handle, timelinename_next_ignore: false, timelinename_next_blend: false, blend_name_frames: 60 } }], up: [] }],
				feedbacks: [],
			})

			// Previous Cue
			presets.push({
				type: 'button',
				category,
				name: `${name} – Vorheriger Cue`,
				style: { text: '⏮', size: '60', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 153) },
				steps: [{ down: [{ actionId: 'timeline_prev_cue', options: { timelinename_prev: handle, timelinename_prev_ignore: false, timelinename_prev_blend: false, blend_name_frames: 60 } }], up: [] }],
				feedbacks: [],
			})

			// --- Select ---
			presets.push({ type: 'text', category, name: 'Select', text: 'Select this timeline in Pixera.' })

			// Timeline Select
			presets.push({
				type: 'button',
				category,
				name: `${name} – Select`,
				style: { text: `Select\n${name}`, size: '14', color: combineRgb(255, 255, 255), bgcolor: combineRgb(204, 101, 0) },
				steps: [{ down: [{ actionId: 'timeline_select', options: { timeline_select_timeline: handle } }], up: [] }],
				feedbacks: [],
			})

			// --- Timecode Feedback ---
			presets.push({ type: 'text', category, name: 'Timeline Timecode', text: 'Full Timecode or Individual timecode components: Hour, Minute, Second, Frame' })

			// Position Timecode (via variable)
			presets.push({
				type: 'button',
				category,
				name: `${name} – Position`,
				style: { text: `$(pixera:timeline_${slug}_position_timecode)`, size: '14', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
				steps: [{ down: [], up: [] }],
				feedbacks: [],
			})

			// Timecode (positions) feedback – 4 buttons: Hour, Minute, Second, Frame
			const timecodeLabels = [
				{ id: '1', label: 'HH', title: 'Hour' },
				{ id: '2', label: 'MM', title: 'Minute' },
				{ id: '3', label: 'SS', title: 'Second' },
				{ id: '4', label: 'FF', title: 'Frame' },
			]
			for (const tc of timecodeLabels) {
				presets.push({
					type: 'button',
					category,
					name: `${name} – Timecode ${tc.title}`,
					style: { text: tc.label, size: '24', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
					steps: [{ down: [], up: [] }],
					feedbacks: [{ feedbackId: 'timeline_positions', options: {
						timelinename_feedback: name,
						show_label: tc.id,
					} }],
				})
			}

			// --- Countdown Feedback ---
			presets.push({ type: 'text', category, name: 'Timeline Countdown', text: 'Full Countdown or Individual countdown components: Hour, Minute, Second, Frame.' })

			// Countdown Timecode (via variable)
			presets.push({
				type: 'button',
				category,
				name: `${name} – Countdown`,
				style: { text: `$(pixera:timeline_${slug}_countdown_timecode)`, size: '14', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
				steps: [{ down: [], up: [] }],
				feedbacks: [],
			})

			// Countdown feedback – 4 buttons: Hour, Minute, Second, Frame
			for (const tc of timecodeLabels) {
				presets.push({
					type: 'button',
					category,
					name: `${name} – Countdown ${tc.title}`,
					style: { text: tc.label, size: '24', color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 0, 0) },
					steps: [{ down: [], up: [] }],
					feedbacks: [{ feedbackId: 'timeline_countdowns', options: {
						timelinename_feedback: name,
						show_label: tc.id,
					} }],
				})
			}
		}

		self.setPresetDefinitions(presets)
	},
}
