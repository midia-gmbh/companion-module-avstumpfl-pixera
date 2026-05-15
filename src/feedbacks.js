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
					type: 'textinput',
					label: 'Timeline Name',
					id: 'timelinename_feedback',
					default: 0,
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
				callback: function(feedback, bank) {
					self.log('debug','checkForFeedbacks: ' + feedback.options.run_fg);
					for(let i = 0; i<self.CHOICES_TIMELINEFEEDBACK.length;i++){
						if(self.CHOICES_TIMELINEFEEDBACK[i]['name']==feedback.options.timelinename_feedback){
							if (self.CHOICES_TIMELINEFEEDBACK[i]['timelineTransport'] == 1) {//Play
								return {
									color: feedback.options.run_fg,
									bgcolor: feedback.options.run_bg
								}
							}
							else if (self.CHOICES_TIMELINEFEEDBACK[i]['timelineTransport'] == 2) {//Pause
								return {
									color: feedback.options.pause_fg,
									bgcolor: feedback.options.pause_bg
								}
							}
							else if (self.CHOICES_TIMELINEFEEDBACK[i]['timelineTransport'] == 3) {//Stop
								return {
									color: feedback.options.stop_fg,
									bgcolor: feedback.options.stop_bg
								}
							}
						}
					}
				}//close callback
			},//close timeline state
			timeline_positions:{
				type: 'advanced',
				name: 'Change Text from Timeline Timecode',
				options: [
				{
					type: 'textinput',
					label: 'Timeline Name',
					id: 'timelinename_feedback',
					default: 0,
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
				callback: function(feedback, bank) {
					for(let i = 0; i<self.CHOICES_TIMELINEFEEDBACK.length;i++){
						if(self.CHOICES_TIMELINEFEEDBACK[i]['name']==feedback.options.timelinename_feedback){
							//self.log('debug', 'positions:',self.CHOICES_TIMELINEFEEDBACK[i]['timelinePositions']);
							let time = self.CHOICES_TIMELINEFEEDBACK[i]['timelinePositions'];
							let fps = self.CHOICES_TIMELINEFEEDBACK[i]['fps'];
							let hours = Math.floor(time / (60 * (60 * fps)));
							let minutes = Math.floor(time / (60 * fps)-(hours * 60));
							let seconds = Math.floor(((time / (60 * fps))*60)-(((hours * 60) * 60) + (minutes * 60)));
							let frames = Math.floor(time - ((((hours * 60) * 60) * fps) + ((minutes * 60) * fps) + (seconds * fps)));
							if(feedback.options.show_label == 1){
								return {
									text: hours.toString()
								}
							}
							else if(feedback.options.show_label == 2){
								return {
									text: minutes.toString()
								}
							}
							else if(feedback.options.show_label == 3){
								return {
									text: seconds.toString()
								}
							}
							else if(feedback.options.show_label == 4){
								return {
									text: frames.toString()
								}
							}
						}
					}
				}//close callback
			},//close timeline positions
			timeline_countdowns:{
				type: 'advanced',
				name: 'Change Text from Timeline Countdown',
				options: [
				{
					type: 'textinput',
					label: 'Timeline Name',
					id: 'timelinename_feedback',
					default: 0,
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
				callback: function(feedback, bank) {
					for(let i = 0; i<self.CHOICES_TIMELINEFEEDBACK.length;i++){
						if(self.CHOICES_TIMELINEFEEDBACK[i]['name']==feedback.options.timelinename_feedback){
							//self.log('debug', 'countdown:',self.CHOICES_TIMELINEFEEDBACK[i]['timelinePositions']);
							let time = self.CHOICES_TIMELINEFEEDBACK[i]['timelineCountdowns'];
							let fps = self.CHOICES_TIMELINEFEEDBACK[i]['fps'];
							let hours = Math.floor(time / (60 * (60 * fps)));
							let minutes = Math.floor(time / (60 * fps)-(hours * 60));
							let seconds = Math.floor(((time / (60 * fps))*60)-(((hours * 60) * 60) + (minutes * 60)));
							let frames = Math.floor(time - ((((hours * 60) * 60) * fps) + ((minutes * 60) * fps) + (seconds * fps)));
							if(feedback.options.show_label == 1){
								return {
									text: hours.toString()
								}
							}
							else if(feedback.options.show_label == 2){
								return {
									text: minutes.toString()
								}
							}
							else if(feedback.options.show_label == 3){
								return {
									text: seconds.toString()
								}
							}
							else if(feedback.options.show_label == 4){
								return {
									text: frames.toString()
								}
							}
						}
					}
				}//close callback
			},//close timeline positions
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