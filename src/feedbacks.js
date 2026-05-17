const { combineRgb } = require('@companion-module/base')
module.exports = {
	initFeedbacks() {
		
		let self = this;
		//self.log('debug', 'init feedbacks');
		let feedbacks = {
			timeline_state:{
				type: 'advanced',
				name: 'Change color from Timeline State',
				options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timelinename_feedback',
					default: 0,
					choices: (self.CHOICES_TIMELINENAME || []).filter(c => c.id !== 0 && c.id !== -1),
				},
				{
					type: 'colorpicker',
					label: 'Play: Foreground color',
					id: 'run_fg',
					default: combineRgb(255,255,255)
				},
				{
					type: 'colorpicker',
					label: 'Play: Background color',
					id: 'run_bg',
					default: combineRgb(0,255,0)
				},
				{
					type: 'colorpicker',
					label: 'Pause: Foreground color',
					id: 'pause_fg',
					default: combineRgb(0,0,0)
				},
				{
					type: 'colorpicker',
					label: 'Pause: Background color',
					id: 'pause_bg',
					default: combineRgb(255,255,0)
				},
				{
					type: 'colorpicker',
					label: 'Stop: Foreground color',
					id: 'stop_fg',
					default: combineRgb(255,255,255)
				},
				{
					type: 'colorpicker',
					label: 'Stop: Background color',
					id: 'stop_bg',
					default: combineRgb(255,0,0)
				}
				],
				callback: function(feedback) {
					const tl = (self.CHOICES_TIMELINEFEEDBACK || []).find(t => t.handle == feedback.options.timelinename_feedback)
					if (!tl) return
					if (tl.timelineTransport == 1) return { color: feedback.options.run_fg, bgcolor: feedback.options.run_bg }
					if (tl.timelineTransport == 2) return { color: feedback.options.pause_fg, bgcolor: feedback.options.pause_bg }
					if (tl.timelineTransport == 3) return { color: feedback.options.stop_fg, bgcolor: feedback.options.stop_bg }
				}//close callback
			},//close timeline state
			timeline_positions:{
				type: 'advanced',
				name: 'Change Text from Timeline Timecode',
				options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timelinename_feedback',
					default: 0,
					choices: (self.CHOICES_TIMELINENAME || []).filter(c => c.id !== 0 && c.id !== -1),
				},
				{
					type: 'dropdown',
					label: 'Show Label',
					id: 'show_label',
					default: '1',
					choices:[
					{id:'1', label: 'Hour'},
					{id:'2', label: 'Minute'},
					{id:'3', label: 'Second'},
					{id:'4', label: 'Frame'},
					]
				}
				],
				callback: function(feedback) {
					const tl = (self.CHOICES_TIMELINEFEEDBACK || []).find(t => t.handle == feedback.options.timelinename_feedback)
					if (!tl) return
					const time = tl.timelinePositions || 0
					const fps = tl.fps || 60
					const hours = Math.floor(time / (60 * 60 * fps))
					const minutes = Math.floor(time / (60 * fps)) - hours * 60
					const seconds = Math.floor(time / fps) - hours * 3600 - minutes * 60
					const frames = Math.floor(time - (hours * 3600 + minutes * 60 + seconds) * fps)
					const parts = { '1': hours, '2': minutes, '3': seconds, '4': frames }
					const val = parts[String(feedback.options.show_label)]
					if (val !== undefined) return { text: val.toString() }
				}//close callback
			},//close timeline positions
			timeline_countdowns:{
				type: 'advanced',
				name: 'Change Text from Timeline Countdown',
				options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timelinename_feedback',
					default: 0,
					choices: (self.CHOICES_TIMELINENAME || []).filter(c => c.id !== 0 && c.id !== -1),
				},
				{
					type: 'dropdown',
					label: 'Show Label',
					id: 'show_label',
					default: '1',
					choices:[
					{id:'1', label: 'Hour'},
					{id:'2', label: 'Minute'},
					{id:'3', label: 'Second'},
					{id:'4', label: 'Frame'},
					]
				}
				],
				callback: function(feedback) {
					const tl = (self.CHOICES_TIMELINEFEEDBACK || []).find(t => t.handle == feedback.options.timelinename_feedback)
					if (!tl) return
					const time = tl.timelineCountdowns || 0
					const fps = tl.fps || 60
					const hours = Math.floor(time / (60 * 60 * fps))
					const minutes = Math.floor(time / (60 * fps)) - hours * 60
					const seconds = Math.floor(time / fps) - hours * 3600 - minutes * 60
					const frames = Math.floor(time - (hours * 3600 + minutes * 60 + seconds) * fps)
					const parts = { '1': hours, '2': minutes, '3': seconds, '4': frames }
					const val = parts[String(feedback.options.show_label)]
					if (val !== undefined) return { text: val.toString() }
				}//close callback
			},//close timeline countdowns
			timeline_selected: {
				type: 'advanced',
				name: 'Change color from Selected Timeline',
				options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timelinename_feedback',
					default: 0,
					choices: (self.CHOICES_TIMELINENAME || []).filter(c => c.id !== 0 && c.id !== -1),
				},
				{
					type: 'colorpicker',
					label: 'Foreground color',
					id: 'fg',
					default: combineRgb(255, 255, 255),
				},
				{
					type: 'colorpicker',
					label: 'Background color',
					id: 'bg',
					default: combineRgb(255, 165, 0),
				},
				],
				callback: function(feedback) {
					const handle = feedback.options.timelinename_feedback
					if (handle && (self.SELECTEDTIMELINES || []).some(h => h == handle)) {
						return { color: feedback.options.fg, bgcolor: feedback.options.bg }
					}
				},
			},
			timeline_state_selected: {
				type: 'advanced',
				name: 'Change color from Selected Timeline State',
				options: [
				{
					type: 'colorpicker',
					label: 'Play: Foreground color',
					id: 'run_fg',
					default: combineRgb(255,255,255)
				},
				{
					type: 'colorpicker',
					label: 'Play: Background color',
					id: 'run_bg',
					default: combineRgb(0,255,0)
				},
				{
					type: 'colorpicker',
					label: 'Pause: Foreground color',
					id: 'pause_fg',
					default: combineRgb(0,0,0)
				},
				{
					type: 'colorpicker',
					label: 'Pause: Background color',
					id: 'pause_bg',
					default: combineRgb(255,255,0)
				},
				{
					type: 'colorpicker',
					label: 'Stop: Foreground color',
					id: 'stop_fg',
					default: combineRgb(255,255,255)
				},
				{
					type: 'colorpicker',
					label: 'Stop: Background color',
					id: 'stop_bg',
					default: combineRgb(255,0,0)
				}
				],
				callback: function(feedback) {
					const tl = self.SELECTEDTIMELINEFEEDBACK
					if (!tl) return
					if (tl.timelineTransport == 1) return { color: feedback.options.run_fg, bgcolor: feedback.options.run_bg }
					if (tl.timelineTransport == 2) return { color: feedback.options.pause_fg, bgcolor: feedback.options.pause_bg }
					if (tl.timelineTransport == 3) return { color: feedback.options.stop_fg, bgcolor: feedback.options.stop_bg }
				}
			},
			timeline_positions_selected: {
				type: 'advanced',
				name: 'Change Text from Selected Timeline Timecode',
				options: [
				{
					type: 'dropdown',
					label: 'Show Label',
					id: 'show_label',
					default: '1',
					choices: [
					{id:'1', label: 'Hour'},
					{id:'2', label: 'Minute'},
					{id:'3', label: 'Second'},
					{id:'4', label: 'Frame'},
					]
				}
				],
				callback: function(feedback) {
					const tl = self.SELECTEDTIMELINEFEEDBACK
					if (!tl) return
					const fps = tl.fps || 60
					const time = tl.timelinePositions || 0
					const hours = Math.floor(time / (60 * 60 * fps))
					const minutes = Math.floor(time / (60 * fps)) - hours * 60
					const seconds = Math.floor(time / fps) - hours * 3600 - minutes * 60
					const frames = Math.floor(time - (hours * 3600 + minutes * 60 + seconds) * fps)
					const parts = { '1': hours, '2': minutes, '3': seconds, '4': frames }
					const val = parts[feedback.options.show_label]
					if (val !== undefined) return { text: val.toString() }
				}
			},
			timeline_countdowns_selected: {
				type: 'advanced',
				name: 'Change Text from Selected Timeline Countdown',
				options: [
				{
					type: 'dropdown',
					label: 'Show Label',
					id: 'show_label',
					default: '1',
					choices: [
					{id:'1', label: 'Hour'},
					{id:'2', label: 'Minute'},
					{id:'3', label: 'Second'},
					{id:'4', label: 'Frame'},
					]
				}
				],
				callback: function(feedback) {
					const tl = self.SELECTEDTIMELINEFEEDBACK
					if (!tl) return
					const fps = tl.fps || 60
					const time = tl.timelineCountdowns || 0
					const hours = Math.floor(time / (60 * 60 * fps))
					const minutes = Math.floor(time / (60 * fps)) - hours * 60
					const seconds = Math.floor(time / fps) - hours * 3600 - minutes * 60
					const frames = Math.floor(time - (hours * 3600 + minutes * 60 + seconds) * fps)
					const parts = { '1': hours, '2': minutes, '3': seconds, '4': frames }
					const val = parts[feedback.options.show_label]
					if (val !== undefined) return { text: val.toString() }
				}
			},
		};//close feedbacks
		self.setFeedbackDefinitions(feedbacks);
	}
}