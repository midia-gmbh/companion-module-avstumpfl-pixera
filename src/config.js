const { Regex } = require('@companion-module/base')

/*
  Config layout: a heading per topic, the fields below it. Explanations live in the field
  tooltips so the page stays scannable; widths add up to 12 per row so fields line up.
*/
module.exports = {
	getConfigFields() {
		return [
			// --- Connection ---
			{
				type: 'static-text',
				id: 'info_connection',
				width: 12,
				label: 'Connection',
				value: 'Native implementation of the AV Stumpfl Pixera JSON/TCP API.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				tooltip: 'IPv4 address of the system running Pixera.',
				width: 6,
				regex: Regex.IP,
			},
			{
				type: 'number',
				id: 'port',
				label: 'Port',
				tooltip: 'TCP port of the Pixera API. Pixera uses 1400 by default.',
				width: 6,
				default: 1400,
				regex: Regex.PORT,
			},

			// --- Live values ---
			{
				type: 'static-text',
				id: 'info_polling',
				width: 12,
				label: 'Live Values',
				value: 'Continuous updates for transport state, timecode and cues.',
			},
			{
				type: 'checkbox',
				id: 'polling',
				label: 'Enable polling',
				tooltip:
					'Required for transport state, timecode, countdown and cue updates. While disabled, the corresponding variables and feedbacks keep the values read at connect.',
				width: 6,
				default: false,
			},
			{
				type: 'dropdown',
				id: 'polling_rate',
				label: 'Polling rate',
				tooltip:
					'Interval between monitoring requests. Shorter intervals update more smoothly and increase network and CPU load.',
				width: 6,
				isVisible: (configValues) => configValues.polling === true,
				default: 50,
				choices: [
					{ id: 50, label: '50ms' },
					{ id: 100, label: '100ms' },
					{ id: 200, label: '200ms' },
					{ id: 500, label: '500ms' },
					{ id: 1000, label: '1000ms' },
				],
			},
			{
				type: 'checkbox',
				id: 'cue_next_follows_countdown',
				label: 'Next cue follows countdown',
				tooltip:
					'Reports the cue the timeline is counting down to as the next cue, so cues set to "Exclude Cue from Countdown" in Pixera are skipped. When disabled, the next cue is always the chronologically next one.',
				width: 6,
				default: true,
			},

			// --- Defaults ---
			{
				type: 'static-text',
				id: 'info_defaults',
				width: 12,
				label: 'Defaults',
				value: 'Initial values for newly created actions and presets.',
			},
			{
				type: 'number',
				id: 'blendtime_default',
				label: 'Default blendtime (frames)',
				tooltip:
					'Pre-fills the blendtime of newly added blend actions and of the generated blend presets. Each action keeps its own editable blendtime.',
				width: 6,
				min: 0,
				max: 100000,
				default: 60,
			},

			// --- Advanced ---
			{
				type: 'static-text',
				id: 'info_advanced',
				width: 12,
				label: 'Advanced',
				value:
					'The "API" and "Control Action" actions pass commands to Pixera unvalidated. Use them at your own risk.',
			},
		]
	},
}
