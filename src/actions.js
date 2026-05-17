const { InstanceStatus } = require('@companion-module/base');
const { forEach } = require('lodash');
module.exports = {
	updateActions() {
		let self = this;
		let actions = {};

		actions.timeline_transport = {
			name: 'Timeline Transport',
			options: [
				{
					type: 'dropdown',
					label: 'Transport',
					id: 'mode',
					default: '1',
					choices: [
						{ id: 1, label: 'Play' },
						{ id: 2, label: 'Pause' },
						{ id: 3, label: 'Stop' },
						{ id: 4, label: 'Toggle' },
					],
				},
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_state',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
			],
			callback: async (event) => {
				if (parseInt(event.options.timelinename_state) == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						if (event.options.mode == 4) {
							self.pixera.sendParams(
								0,
								'Pixera.Timelines.Timeline.toggleTransport',
								{ handle: self.SELECTEDTIMELINES[i] }
							);
						} else {
							self.pixera.sendParams(
								0,
								'Pixera.Timelines.Timeline.setTransportMode',
								{
									handle: self.SELECTEDTIMELINES[i],
									mode: parseInt(event.options.mode),
								}
							);
						}
					}
				} else {
					if (event.options.mode == 4) {
						self.pixera.sendParams(
							0,
							'Pixera.Timelines.Timeline.toggleTransport',
							{ handle: parseInt(event.options.timelinename_state) }
						);
					} else {
						self.pixera.sendParams(
							0,
							'Pixera.Timelines.Timeline.setTransportMode',
							{
								handle: parseInt(event.options.timelinename_state),
								mode: parseInt(event.options.mode),
							}
						);
					}
				}
			},
		};

		actions.timeline_transport_extended = {
			name: 'Timeline Transport Extended',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'timeline_transport_mode',
					default: 1,
					choices: [
						{ label: 'Play', id: 1 },
						{ label: 'Pause', id: 2 },
						{ label: 'Stop', id: 3 },
						{ label: 'Toggle', id: 4 },
					],
				},
				{
					type: 'dropdown',
					label: 'Type',
					id: 'timeline_transport_type',
					disableAutoExpression: true,
					default: 2,
					choices: [
						{ label: 'Multiple', id: 2 },
						{ label: 'All', id: 3 },
					],
				},
				{
					type: 'textinput',
					label: 'Timeline Names',
					id: 'timeline_transport_timelines',
					isVisibleExpression: "$(options:timeline_transport_type) == 2",
					default: 'Timeline 1,Timeline 2,Timeline 3',
				},
			],
			callback: async (event) => {
				let opt = event.options;
				switch (opt.timeline_transport_type) {
					case 2:
						let timelines = opt.timeline_transport_timelines.split(',');
						for (let i = 0; i < timelines.length; i++) {
							for (var k = 0; k < self.CHOICES_TIMELINEFEEDBACK.length; k++) {
								if (
									timelines[i].trim() ==
									self.CHOICES_TIMELINEFEEDBACK[k]['name']
								) {
									if (opt.timeline_transport_mode == 4) {
										self.pixera.sendParams(
											0,
											'Pixera.Timelines.Timeline.toggleTransport',
											{
												handle: parseInt(
													self.CHOICES_TIMELINEFEEDBACK[k]['handle']
												),
											}
										);
									} else {
										self.pixera.sendParams(
											0,
											'Pixera.Timelines.Timeline.setTransportMode',
											{
												handle: parseInt(
													self.CHOICES_TIMELINEFEEDBACK[k]['handle']
												),
												mode: parseInt(opt.timeline_transport_mode),
											}
										);
									}
								}
							}
						}
						break;
					case 3:
						for (let i = 0; i < self.CHOICES_TIMELINEFEEDBACK.length; i++) {
							if (opt.timeline_transport_mode == 4) {
								self.pixera.sendParams(
									0,
									'Pixera.Timelines.Timeline.toggleTransport',
									{
										handle: parseInt(
											self.CHOICES_TIMELINEFEEDBACK[k]['handle']
										),
									}
								);
							} else {
								self.pixera.sendParams(
									0,
									'Pixera.Timelines.Timeline.setTransportMode',
									{
										handle: parseInt(
											self.CHOICES_TIMELINEFEEDBACK[i]['handle']
										),
										mode: parseInt(opt.timeline_transport_mode),
									}
								);
							}
						}
						break;
				}
			},
		};

		actions.timeline_next_cue = {
			name: 'Next Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_next',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'checkbox',
					label: 'Ignore Properties',
					id: 'timelinename_next_ignore',
					disableAutoExpression: true,
					isVisibleExpression: "$(options:timelinename_next_blend) == false",
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Blend To',
					id: 'timelinename_next_blend',
					disableAutoExpression: true,
					isVisibleExpression: "$(options:timelinename_next_ignore) == false",
					default: false,
				},
				{
					type: 'textinput',
					label: 'Blendtime in Frames',
					id: 'blend_name_frames',
					isVisibleExpression: "$(options:timelinename_next_blend) == true",
					default: 60.0,
					regex: self.REGEX_FLOAT,
				},
			],
			callback: async (event) => {
				let method = 'Pixera.Timelines.Timeline.moveToNextCue';
				let _id = 0;
				if (event.options.timelinename_next_ignore) {
					method = 'Pixera.Timelines.Timeline.moveToNextCueIgnoreProperties';
				} else if (event.options.timelinename_next_blend) {
					_id = 33;
					method = 'Pixera.Timelines.Timeline.getCueNext';
					let blendDuration = parseInt(
						await self.parseVariablesInString(event.options.blend_name_frames)
					);
					self.CHOICES_BLENDNAME_FRAMES = blendDuration;
				}
				if (event.options.timelinename_next == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(_id, method, {
							handle: self.SELECTEDTIMELINES[i],
						});
					}
				} else {
					self.pixera.sendParams(_id, method, {
						handle: parseInt(event.options.timelinename_next),
					});
				}
			},
		};

		actions.timeline_prev_cue = {
			name: 'Previous Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_prev',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'checkbox',
					label: 'Ignore Properties',
					id: 'timelinename_prev_ignore',
					disableAutoExpression: true,
					isVisibleExpression: "$(options:timelinename_prev_blend) == false",
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Blend To',
					id: 'timelinename_prev_blend',
					disableAutoExpression: true,
					isVisibleExpression: "$(options:timelinename_prev_ignore) == false",
					default: false,
				},
				{
					type: 'textinput',
					label: 'Blendtime in Frames',
					id: 'blend_name_frames',
					isVisibleExpression: "$(options:timelinename_prev_blend) == true",
					default: 60.0,
					regex: self.REGEX_FLOAT,
				},
			],
			callback: async (event) => {
				let method = 'Pixera.Timelines.Timeline.moveToPreviousCue';
				let _id = 0;

				if (event.options.timelinename_prev_ignore) {
					method =
						'Pixera.Timelines.Timeline.moveToPreviousCueIgnoreProperties';
				} else if (event.options.timelinename_prev_blend) {
					_id = 33;
					method = 'Pixera.Timelines.Timeline.getCuePrevious';
					let blendDuration = parseInt(
						await self.parseVariablesInString(event.options.blend_name_frames)
					);
					self.CHOICES_BLENDNAME_FRAMES = blendDuration;
				}
				if (event.options.timelinename_prev == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(_id, method, {
							handle: self.SELECTEDTIMELINES[i],
						});
					}
				} else {
					self.pixera.sendParams(_id, method, {
						handle: parseInt(event.options.timelinename_prev),
					});
				}
			},
		};

		actions.timeline_ignore_next_cue = {
			name: 'Ignore Next Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_ignore',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
			],
			callback: async (event) => {
				if (event.options.timelinename_ignore == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						{
							self.pixera.sendParams(
								0,
								'Pixera.Timelines.Timeline.ignoreNextCue',
								{
									handle: self.SELECTEDTIMELINES[i],
								}
							);
						}
					}
				} else {
					self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.ignoreNextCue', {
						handle: parseInt(event.options.timelinename_ignore),
					});
				}
			},
		};

		actions.timeline_store = {
			name: 'Timeline Store',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_store',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
			],
			callback: async (event) => {
				if (event.options.timelinename_store == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						{
							self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.store', {
								handle: self.SELECTEDTIMELINES[i],
							});
						}
					}
				} else {
					self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.store', {
						handle: parseInt(event.options.timelinename_store),
					});
				}
			},
		};

		//Updated 10/30/2023 by Cody Luketic
		actions.session_project = {
			name: 'Session Project',
			options: [
				{
					type: 'dropdown',
					label: 'Action',
					id: 'session_project_action',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Save', id: 1 },
						{ label: 'Save As', id: 2 },
						{ label: 'Load', id: 3 },
						{ label: 'Close', id: 4 },
					],
				},
				{
					type: 'textinput',
					label: 'Project Path',
					id: 'session_project_projectpath',
					isVisibleExpression: "$(options:session_project_action) == 2 || $(options:session_project_action) == 3",
					default: 'C:\\Dump',
				},
				{
					type: 'checkbox',
					label: 'Save Project',
					id: 'session_project_saveproject',
					isVisibleExpression: "$(options:session_project_action) == 4",
					default: true,
				},
			],
			callback: async (event) => {
				let opt = event.options;

				switch (opt.session_project_action) {
					case 1:
						self.pixera.send(0, 'Pixera.Session.saveProject');
						break;
					case 2:
						self.pixera.sendParams(0, 'Pixera.Session.saveProjectAs', {
							path: opt.session_project_projectpath,
						});
						break;
					case 3:
						self.pixera.sendParams(0, 'Pixera.Session.loadProject', {
							path: opt.session_project_projectpath,
						});
						break;
					case 4:
						self.pixera.sendParams(0, 'Pixera.Session.closeApp', {
							saveProject: opt.session_project_saveproject,
						});
						break;
					default:
						break;
				}
			},
		};

		//Created 10/31/2023 by Cody Luketic
		actions.session_livesystem = {
			name: 'Session Livesystem',
			options: [
				{
					type: 'checkbox',
					label: 'All Live Systems',
					id: 'session_livesystem_all',
					disableAutoExpression: true,
					default: false,
				},
				{
					type: 'textinput',
					label: 'IP',
					id: 'session_livesystem_ip',
					isVisibleExpression: "$(options:session_livesystem_all) == 0",
					default: '127.0.0.1',
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'session_livesystem_action',
					default: 0,
					choices: [
						{ label: 'Start', id: 1 },
						{ label: 'Stop', id: 2 },
						{ label: 'Restart', id: 3 },
					],
				},
			],
			callback: async (event) => {
				let opt = event.options;

				if (opt.session_livesystem_all) {
					switch (opt.session_livesystem_action) {
						case 1:
							self.pixera.send(0, 'Pixera.Session.startLiveSystems');
							break;
						case 2:
							self.pixera.send(0, 'Pixera.Session.stopLiveSystems');
							break;
						case 3:
							self.pixera.send(0, 'Pixera.Session.restartLiveSystems');
							break;
						default:
							break;
					}
				} else {
					switch (opt.session_livesystem_action) {
						case 1:
							self.pixera.sendParams(0, 'Pixera.Session.startLiveSystem', {
								ip: opt.session_livesystem_ip,
							});
							break;
						case 2:
							self.pixera.sendParams(0, 'Pixera.Session.stopLiveSystem', {
								ip: opt.session_livesystem_ip,
							});
							break;
						case 3:
							self.pixera.sendParams(0, 'Pixera.Session.restartLiveSystem', {
								ip: opt.session_livesystem_ip,
							});
							break;
						default:
							break;
					}
				}
			},
		};

		//Created 10/30/2023 by Cody Luketic
		actions.session_setvideostreamactivestate = {
			name: 'Session Set Video Stream Active State',
			options: [
				{
					type: 'textinput',
					label: 'IP',
					id: 'session_setvideostreamactivestate_ip',
					default: '127.0.0.1',
				},
				{
					type: 'textinput',
					label: 'Device',
					id: 'session_setvideostreamactivestate_device',
					default: '',
				},
				{
					type: 'checkbox',
					label: 'Is Active',
					id: 'session_setvideostreamactivestate_isactive',
					default: false,
				},
			],
			callback: async (event) => {
				let opt = event.options;

				self.pixera.sendParams(0, 'Pixera.Session.setVideoStreamActiveState', {
					ip: opt.session_setvideostreamactivestate_ip,
					device: opt.session_setvideostreamactivestate_device,
					isActive: opt.session_setvideostreamactivestate_isactive,
				});
			},
		};

		//Created 10/27/2023 by Cody Luketic
		actions.livesystem_engine = {
			name: 'Live Systems Engine',
			options: [
				{
					type: 'checkbox',
					label: 'All Live Systems',
					id: 'livesystem_engine_all',
					disableAutoExpression: true,
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Live System',
					id: 'livesystem_engine_livesystem',
					default: 0,
					isVisibleExpression: "$(options:livesystem_engine_all) == 0",
					choices: self.CHOICES_LIVESYSTEMNAME,
				},
				{
					type: 'checkbox',
					label: 'Exclude Local',
					id: 'livesystem_engine_local',
					isVisibleExpression: "$(options:livesystem_engine_all) == 1",
					default: true,
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'livesystem_engine_action',
					default: 1,
					choices: [
						{ label: 'Start', id: 1 },
						{ label: 'Close', id: 2 },
						{ label: 'Restart', id: 3 },
						{ label: 'Reset', id: 4 },
						{ label: 'Wake Up', id: 5 },
					],
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let id = opt.livesystem_engine_action;

				if (opt.livesystem_engine_all) {
					for (let i = 0; i < self.CHOICES_LIVESYSTEMNAME.length; i++) {
						let handle = self.CHOICES_LIVESYSTEMNAME[i].id;
						if (!opt.livesystem_engine_local) {
							switch (id) {
								case 1:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.startEngine',
										{ handle: parseInt(handle) }
									);
									break;
								case 2:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.closeEngine',
										{ handle: parseInt(handle) }
									);
									break;
								case 3:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.restartEngine',
										{ handle: parseInt(handle) }
									);
									break;
								case 4:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.resetEngine',
										{ handle: parseInt(handle) }
									);
									break;
								case 5:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.wakeUp',
										{ handle: parseInt(handle) }
									);
									break;
								default:
									break;
							}
						} else if (self.CHOICES_LIVESYSTEMNAME[i].label != 'Local') {
							switch (id) {
								case 1:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.startEngine',
										{ handle: parseInt(handle) }
									);
									break;
								case 2:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.closeEngine',
										{ handle: parseInt(handle) }
									);
									break;
								case 3:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.restartEngine',
										{ handle: parseInt(handle) }
									);
									break;
								case 4:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.resetEngine',
										{ handle: parseInt(handle) }
									);
									break;
								case 5:
									self.pixera.sendParams(
										0,
										'Pixera.LiveSystems.LiveSystem.wakeUp',
										{ handle: parseInt(handle) }
									);
									break;
								default:
									break;
							}
						}
					}
				} else {
					switch (id) {
						case 1:
							self.pixera.sendParams(
								0,
								'Pixera.LiveSystems.LiveSystem.startEngine',
								{ handle: parseInt(opt.livesystem_engine_livesystem) }
							);
							break;
						case 2:
							self.pixera.sendParams(
								0,
								'Pixera.LiveSystems.LiveSystem.closeEngine',
								{ handle: parseInt(opt.livesystem_engine_livesystem) }
							);
							break;
						case 3:
							self.pixera.sendParams(
								0,
								'Pixera.LiveSystems.LiveSystem.restartEngine',
								{ handle: parseInt(opt.livesystem_engine_livesystem) }
							);
							break;
						case 4:
							self.pixera.sendParams(
								0,
								'Pixera.LiveSystems.LiveSystem.resetEngine',
								{ handle: parseInt(opt.livesystem_engine_livesystem) }
							);
							break;
						case 5:
							self.pixera.sendParams(
								0,
								'Pixera.LiveSystems.LiveSystem.wakeUp',
								{ handle: parseInt(opt.livesystem_engine_livesystem) }
							);
							break;
						default:
							break;
					}
				}
			},
		};

		//Created 10/30/2023 by Cody Luketic
		actions.livesystem_exportMappings = {
			name: 'Live Systems Export Mappings',
			options: [
				{
					type: 'dropdown',
					label: 'Live System',
					id: 'livesystem_exportMappings_livesystem',
					default: 0,
					choices: self.CHOICES_LIVESYSTEMNAME,
				},
				{
					type: 'textinput',
					label: 'Export Path',
					id: 'livesystem_exportMappings_exportpath',
					default: 'C:\\Dump',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				self.pixera.sendParams(
					0,
					'Pixera.LiveSystems.LiveSystem.exportMappings',
					{
						handle: parseInt(opt.livesystem_exportMappings_livesystem),
						path: opt.livesystem_exportMappings_exportpath,
					}
				);
			},
		};

		//Updated 10/31/2023 by Cody Luketic
		actions.livesystem_setaudiomaster_volume = {
			name: 'Live Systems Set Audio Master Volume',
			options: [
				{
					type: 'dropdown',
					label: 'Live System',
					id: 'livesystem_setaudiomaster_volume_livesystem',
					default: 0,
					choices: self.CHOICES_LIVESYSTEMNAME,
				},
				{
					type: 'textinput',
					label: 'Channels',
					id: 'livesystem_setaudiomaster_volume_channels',
					default: '1,2',
				},
				{
					type: 'textinput',
					label: 'Volume',
					id: 'livesystem_setaudiomaster_volume_value',
					default: '1.0',
					regex: self.REGEX_FLOAT,
				},
			],
			callback: async (event) => {
				let opt = event.options;

				let channels = opt.livesystem_setaudiomaster_volume_channels.split(',');
				for (let i = 0; i < channels.length; i++) {
					self.pixera.sendParams(
						0,
						'Pixera.LiveSystems.LiveSystem.setAudioMasterVolume',
						{
							handle: parseInt(opt.livesystem_setaudiomaster_volume_livesystem),
							channel: parseInt(channels[i]),
							volume: parseFloat(opt.livesystem_setaudiomaster_volume_value),
						}
					);
				}
			},
		};

		//Updated 10/31/2023 by Cody Luketic
		actions.livesystem_setaudiomaster_mute = {
			name: 'Live Systems Set Audio Master Mute',
			options: [
				{
					type: 'dropdown',
					label: 'Live System',
					id: 'livesystem_setaudiomaster_mute_livesystem',
					default: 0,
					choices: self.CHOICES_LIVESYSTEMNAME,
				},
				{
					type: 'textinput',
					label: 'Channel',
					id: 'livesystem_setaudiomaster_mute_channel',
					default: '1',
				},
				{
					type: 'checkbox',
					label: 'Make Toggle',
					id: 'livesystem_setaudiomaster_mute_toggle',
					disableAutoExpression: true,
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Mute',
					id: 'livesystem_setaudiomaster_mute_state',
					isVisibleExpression: "$(options:livesystem_setaudiomaster_mute_toggle) == 0",
					default: false,
				},
			],
			callback: async (event) => {
				let opt = event.options;

				if (opt.livesystem_setaudiomaster_mute_toggle) {
					self.LIVESYSTEM_SETAUDIOMASTER_MUTE_LIVESYSTEM = parseInt(
						opt.livesystem_setaudiomaster_mute_livesystem
					);
					self.LIVESYSTEM_SETAUDIOMASTER_MUTE_CHANNEL = parseInt(
						opt.livesystem_setaudiomaster_mute_channel
					);

					self.pixera.sendParams(
						24,
						'Pixera.LiveSystems.LiveSystem.getAudioMasterMute',
						{
							handle: parseInt(opt.livesystem_setaudiomaster_mute_livesystem),
							channel: parseInt(opt.livesystem_setaudiomaster_mute_channel),
						}
					);
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.LiveSystems.LiveSystem.setAudioMasterMute',
						{
							handle: parseInt(opt.livesystem_setaudiomaster_mute_livesystem),
							channel: parseInt(opt.livesystem_setaudiomaster_mute_channel),
							state: opt.livesystem_setaudiomaster_mute_state,
						}
					);
				}
			},
		};

		//Updated 10/31/2023 by Cody Luketic
		actions.livesystem_setaudiotimecodeinput = {
			name: 'Live Systems Set Audio Timecode Input',
			options: [
				{
					type: 'dropdown',
					label: 'Live System',
					id: 'livesystem_setaudiotimecodeinput_livesystem',
					default: 0,
					choices: self.CHOICES_LIVESYSTEMNAME,
				},
				{
					type: 'textinput',
					label: 'Channel',
					id: 'livesystem_setaudiotimecodeinput_channel',
					default: '1',
				},
				{
					type: 'checkbox',
					label: 'State',
					id: 'livesystem_setaudiotimecodeinput_state',
					default: true,
				},
			],
			callback: async (event) => {
				let opt = event.options;

				self.pixera.sendParams(
					0,
					'Pixera.LiveSystems.LiveSystem.setAudioTimecodeInput',
					{
						handle: parseInt(opt.livesystem_setaudiotimecodeinput_livesystem),
						channel: parseInt(opt.livesystem_setaudiotimecodeinput_channel),
						state: opt.livesystem_setaudiotimecodeinput_state,
					}
				);
			},
		};

		//Created 11/7/2023 by Cody Luketic
		actions.output_status = {
			name: 'Output Status',
			options: [
				{
					type: 'dropdown',
					label: 'Output Name',
					id: 'output_status_output',
					default: 0,
					choices: self.CHOICES_OUTPUTNAME,
				},
				{
					type: 'checkbox',
					label: 'Active: Make Toggle',
					id: 'output_status_active_toggle',
					disableAutoExpression: true,
					default: true,
				},
				{
					type: 'checkbox',
					label: 'Active',
					id: 'output_status_active',
					isVisibleExpression: "$(options:output_status_active_toggle) == 0",
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Identify: Make Toggle',
					id: 'output_status_identify_toggle',
					disableAutoExpression: true,
					default: true,
				},
				{
					type: 'checkbox',
					label: 'Identify',
					id: 'output_status_identify',
					isVisibleExpression: "$(options:output_status_identify_toggle) == 0",
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Is Output Aggregate: Make Toggle',
					id: 'output_status_isoutputaggregate_toggle',
					disableAutoExpression: true,
					default: true,
				},
				{
					type: 'checkbox',
					label: 'Is Output Aggregate',
					id: 'output_status_isoutputaggregate',
					disableAutoExpression: true,
					isVisibleExpression: "$(options:output_status_isoutputaggregate_toggle) == 0",
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Set Aggregate Dimensions',
					id: 'output_status_aggregateddimensions',
					isVisibleExpression: "$(options:output_status_isoutputaggregate_toggle) == 1 || $(options:output_status_isoutputaggregate) == 1",
					default: false,
				},
				{
					type: 'textinput',
					label: 'Horizontal Count',
					id: 'output_status_aggregatedimensions_horizontalcount',
					isVisibleExpression: "$(options:output_status_aggregatedimensions) == 1",
					default: '1',
				},
				{
					type: 'textinput',
					label: 'Vertical Count',
					id: 'output_status_aggregatedimensions_verticalcount',
					isVisibleExpression: "$(options:output_status_aggregatedimensions) == 1",
					default: '1',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				if (opt.output_status_active_toggle) {
					self.OUTPUT_STATUS_OUTPUT = opt.output_status_output;
					self.pixera.sendParams(25, 'Pixera.LiveSystems.Output.getActive', {
						handle: parseInt(opt.output_status_output),
					});
				} else {
					self.pixera.sendParams(0, 'Pixera.LiveSystems.Output.setActive', {
						handle: parseInt(opt.output_status_output),
						active: opt.output_status_active,
					});
				}

				if (opt.output_status_identify_toggle) {
					self.OUTPUT_STATUS_OUTPUT = opt.output_status_output;
					self.pixera.sendParams(26, 'Pixera.LiveSystems.Output.getIdentify', {
						handle: parseInt(opt.output_status_output),
					});
				} else {
					self.pixera.sendParams(0, 'Pixera.LiveSystems.Output.setIdentify', {
						handle: parseInt(opt.output_status_output),
						state: opt.output_status_identify,
					});
				}

				if (opt.output_status_isoutputaggregate_toggle) {
					self.OUTPUT_STATUS_OUTPUT = opt.output_status_output;
					self.pixera.sendParams(
						27,
						'Pixera.LiveSystems.Output.getIsOutputAggregate',
						{ handle: parseInt(opt.output_status_output) }
					);
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.LiveSystems.Output.setIsOutputAggregate',
						{
							handle: parseInt(opt.output_status_output),
							state: opt.output_status_isoutputaggregate,
						}
					);
				}

				if (opt.output_status_aggregateddimensions) {
					self.pixera.sendParams(
						0,
						'Pixera.LiveSystems.Output.setAggregateDims',
						{
							handle: parseInt(opt.output_status_output),
							horizontalCount: parseInt(
								opt.output_status_aggregatedimensions_horizontalcount
							),
							verticalCount: parseInt(
								opt.output_status_aggregatedimensions_verticalcount
							),
						}
					);
				}
			},
		};

		//Created 11/7/2023 by Cody Luketic
		actions.output_assignment = {
			name: 'Output Assignment',
			options: [
				/*
				{
					type: 'checkbox',
					label: 'Object Type',
					id: 'output_assignment_type',
					disableAutoExpression: true,
					default: 1,
					choices:[
						{label: 'Screen', id: 1},
						{label: 'Projector', id: 2}
					]
				},
				{
					type: 'dropdown',
					label: 'Screen',
					id: 'output_assignment_screen',
					isVisibleExpression: "$(options:output_assignment_type) == 1",
					default: 0,
					choices: self.CHOICES_SCREENNAME
				},*/
				{
					type: 'dropdown',
					label: 'Projector',
					id: 'output_assignment_projector',
					/*isVisible: (options) => options.output_assignment_type == 2,*/
					default: 0,
					choices: self.CHOICES_PROJECTORNAME,
				},
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_assignment_output',
					default: 0,
					choices: self.CHOICES_OUTPUTNAME,
				},
			],
			callback: async (event) => {
				let opt = event.options;

				/*
				if(opt.output_assignment_type == 1) {
					self.pixera.sendParams(0,'Pixera.Screens.Screen.setOutput',
						{'handle':parseInt(opt.output_assignment_output)});
				}
				else {
					self.pixera.sendParams(0,'Pixera.Projectors.Projector.setOutput',
						{'handle':parseInt(opt.output_assignment_output)});
				}
				*/

				self.pixera.sendParams(0, 'Pixera.Projectors.Projector.setOutput', {
					handle: parseInt(opt.output_assignment_projector),
					outputHandle: parseInt(opt.output_assignment_output),
				});
			},
		};

		actions.resource_system = {
			name: 'Resource System',
			options: [
				{
					type: 'textinput',
					label: 'Resource Path',
					id: 'resource_system_resource',
					default: 'Media/Standard Content/Filename.mov',
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'resource_system_action',
					disableAutoExpression: true,
					default: 6,
					choices: [
						{ label: 'Remove This', id: 1 },
						{ label: 'Remove This Including Assets', id: 2 },
						{ label: 'Delete Files on Systems', id: 3 },
						{ label: 'Delete Asset From Live System', id: 4 },
						{ label: 'Replace', id: 5 },
						{ label: 'Refresh', id: 6 },
						/*{label: 'Move to Transcoding Folder', id: 7},*/
						{ label: 'Reset Distribution Targets', id: 8 },
						{ label: 'Change Distribution Targets', id: 9 },
						{ label: 'Distribute', id: 10 },
					],
				},
				{
					type: 'dropdown',
					label: 'Livesystem',
					id: 'resource_system_livesystem',
					isVisibleExpression: "$(options:resource_system_action) == 4 || $(options:resource_system_action) == 9",
					default: 0,
					choices: self.CHOICES_LIVESYSTEMNAME,
				},
				{
					type: 'checkbox',
					label: 'Should Distribute',
					id: 'resource_system_shoulddistribute',
					isVisibleExpression: "$(options:resource_system_action) == 9",
					default: false,
				},
				{
					type: 'textinput',
					label: 'File Path',
					id: 'resource_system_filepath',
					isVisibleExpression: "$(options:resource_system_action) == 5",
					default: 'C:\\Dump',
				} /*,
				{
					type: 'textinput',
					label: 'Folder Path',
					id: 'resource_system_folderpath',
					isVisibleExpression: "$(options:resource_system_action) == 7",
					default: 'C:\\Dump',
				},*/,
			],
			callback: async (event) => {
				let opt = event.options;
				let id = opt.resource_system_action;

				switch (id) {
					case 1:
						break;
					case 2:
						break;
					case 3:
						break;
					case 4:
						self.RESOURCEREMOVE_LIVESYSTEM = parseInt(opt.resource_system_livesystem);
						break;
					case 5:
						self.RESOURCE_REPLACE = opt.resource_system_filepath;
						break;
					case 6:
						break;
					/*case 7:
						self.pixera.sendParams(0,'Pixera.Resources.Resource.moveToTranscodingFolder',
							{'handle':parseInt(opt.resource_system_resource),
								'folderPath':opt.resource.system.folderpath});
						break;*/
					case 8:
						break;
					case 9:
						self.RESOURCECHANGEDIST = [opt.resource.system.livesystem, opt.resource.system.shoulddistribute];
						break;
					case 10:
						break;
					default:
						break;
				}
				self.pixera.sendParams(50+id, 'Pixera.Resources.Resource.getInst', {
					instancePath: opt.resource_system_resource,
				});
			},
		};

		actions.resource_settings_general = {
			name: 'Resource Settings General',
			options: [
				{
					type: 'textinput',
					label: 'Resource Path or Handle',
					id: 'resource_settings_general_resource',
					default: 'Media/Standard Content/tunnel_HD_h264.mp4',
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'resource_settings_general_action',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Set Name', id: 1 },
						{ label: 'Set Current Version', id: 2 },
						{ label: 'Set DMX Id', id: 3 },
					],
				},
				{
					type: 'textinput',
					label: 'Name',
					id: 'resource_settings_general_name',
					isVisibleExpression: "$(options:resource_settings_general_action) == 1",
					default: 'Resource 1',
				},
				{
					type: 'textinput',
					label: 'Version',
					id: 'resource_settings_general_version',
					isVisibleExpression: "$(options:resource_settings_general_action) == 2",
					default: '1',
				},
				{
					type: 'textinput',
					label: 'Dmx Id',
					id: 'resource_settings_general_dmxid',
					isVisibleExpression: "$(options:resource_settings_general_action) == 3",
					default: '1',
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let id = opt.resource_settings_general_action;
				let hdl = await self.parseVariablesInString(opt.resource_settings_general_resource);
				let hdlNumber = isNaN(parseInt(hdl)) ? hdl : parseInt(hdl);
				switch (id) {
					case 1:
						self.pixera.sendParams(0, 'Pixera.Resources.Resource.setName', {
							handle: hdlNumber,
							name: opt.resource_settings_general_name,
						});
						break;
					case 2:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.setCurrentVersion',
							{
								handle: hdlNumber,
								version: opt.resource_settings_general_version,
							}
						);
						break;
					case 3:
						self.pixera.sendParams(0, 'Pixera.Resources.Resource.setDmxId', {
							handle: hdlNumber,
							id: parseInt(opt.resource_settings_general_dmxid),
						});
						break;
					default:
						break;
				}
			},
		};

		actions.resource_settings_textweb = {
			name: 'Resource Settings Text And Web',
			options: [
				{
					type: 'textinput',
					label: 'Resource Path or Handle',
					id: 'resource_settings_textweb_resource',
					default: 'Media/Unnamed Text',
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'resource_settings_textweb_action',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Set Text', id: 1 },
						{ label: 'Set Font with Name', id: 2 },
						{ label: 'Set Horizontal Alignment', id: 3 },
						{ label: 'Set Vertical Alignment', id: 4 },
						{ label: 'Set Line Height', id: 5 },
						{ label: 'WEB: Set Url', id: 6 },
					],
				},
				{
					type: 'textinput',
					label: 'Text',
					id: 'resource_settings_textweb_text',
					isVisibleExpression: "$(options:resource_settings_textweb_action) == 1",
					default: 'This is a Text Resource',
				},
				{
					type: 'textinput',
					label: 'Font Name',
					id: 'resource_settings_textweb_fontname',
					isVisibleExpression: "$(options:resource_settings_textweb_action) == 2",
					default: 'Arial',
				},
				{
					type: 'dropdown',
					label: 'Horizontal Text Alignment',
					id: 'resource_settings_textweb_horizontaltextalignment',
					isVisibleExpression: "$(options:resource_settings_textweb_action) == 3",
					default: 0,
					choices: [
						{ label: 'Align Left', id: 0 },
						{ label: 'Align Center', id: 1 },
						{ label: 'Align Right', id: 2 },
					],
				},
				{
					type: 'dropdown',
					label: 'Vertical Text Alignment',
					id: 'resource_settings_textweb_verticaltextalignment',
					isVisibleExpression: "$(options:resource_settings_textweb_action) == 4",
					default: 0,
					choices: [
						{ label: 'Align Top', id: 0 },
						{ label: 'Align Center', id: 1 },
						{ label: 'Align Bottom', id: 2 },
					],
				},
				{
					type: 'textinput',
					label: 'Line Height',
					id: 'resource_settings_textweb_lineheight',
					isVisibleExpression: "$(options:resource_settings_textweb_action) == 5",
					default: '550.0',
				},
				{
					type: 'textinput',
					label: 'URL',
					id: 'resource_settings_textweb_url',
					isVisibleExpression: "$(options:resource_settings_textweb_action) == 6",
					default: 'www.pixera.one',
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let id = opt.resource_settings_textweb_action;
				let hdl = await self.parseVariablesInString(opt.resource_settings_textweb_resource);
				let hdlNumber = isNaN(parseInt(hdl)) ? hdl : parseInt(hdl);

				switch (id) {
					case 1:
						{
							let txt = await self.parseVariablesInString(opt.resource_settings_textweb_text);
							self.pixera.sendParams(0, 'Pixera.Resources.Resource.setText', {
								handle: hdlNumber,
								text: txt,
							});
						}
						break;
					case 2:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.setFontWithName',
							{
								handle: hdlNumber,
								fontName: opt.resource_settings_textweb_fontname,
							}
						);
						break;
					case 3:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.setHorizontalTextAlignment',
							{
								handle: hdlNumber,
								textAlignment: parseInt(
									opt.resource_settings_textweb_horizontaltextalignment
								),
							}
						);
						break;
					case 4:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.setVerticalTextAlignment',
							{
								handle: hdlNumber,
								textAlignment: parseInt(
									opt.resource_settings_textweb_verticaltextalignment
								),
							}
						);
						break;
					case 5:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.setLineHeight',
							{
								handle: hdlNumber,
								lineHeight: parseFloat(
									opt.resource_settings_textweb_lineheight
								),
							}
						);
						break;
					case 6:
						self.pixera.sendParams(0, 'Pixera.Resources.Resource.setUrl', {
							handle: hdlNumber,
							url: opt.resource_settings_textweb_url,
						});
						break;
					default:
						break;
				}
			},
		};

		/*//Created 11/8/2023 by Cody Luketic
		actions.resource_settings_color = {
			name: 'Resource Settings Color',
			options: [
				{
					type: 'dropdown',
					label: 'Resource',
					id: 'resource_settings_color_resource',
					default: 0,
					choices: self.CHOICES_RESOURCENAME,
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'resource_settings_color_action',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Set Use Gradient', id: 1 },
						{ label: 'Set Color at Index', id: 2 },
					],
				},
				{
					type: 'textinput',
					label: 'Index',
					id: 'resource_settings_color_index',
					isVisibleExpression: "$(options:resource_settings_color_action) == 2",
					default: '255',
				},
				{
					type: 'textinput',
					label: 'Red Value (0-255)',
					id: 'resource_settings_color_red',
					isVisibleExpression: "$(options:resource_settings_color_action) == 2",
					default: '255',
				},
				{
					type: 'textinput',
					label: 'Green Value (0-255)',
					id: 'resource_settings_color_green',
					isVisibleExpression: "$(options:resource_settings_color_action) == 2",
					default: '255',
				},
				{
					type: 'textinput',
					label: 'Blue Value (0-255)',
					id: 'resource_settings_color_blue',
					isVisibleExpression: "$(options:resource_settings_color_action) == 2",
					default: '255',
				},
				{
					type: 'textinput',
					label: 'Alpha Value (0-255)',
					id: 'resource_settings_color_alpha',
					isVisibleExpression: "$(options:resource_settings_color_action) == 2",
					default: '255',
				},
				{
					type: 'textinput',
					label: 'Position',
					id: 'resource_settings_color_position',
					isVisibleExpression: "$(options:resource_settings_color_action) == 2",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Color Name',
					id: 'resource_settings_color_colorname',
					isVisibleExpression: "$(options:resource_settings_color_action) == 2",
					default: 'Color 1',
				},
				{
					type: 'checkbox',
					label: 'Use Gradient: Make Toggle',
					id: 'resource_settings_color_gradient_toggle',
					disableAutoExpression: true,
					isVisibleExpression: "$(options:resource_settings_color_action) == 1",
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Use Gradient',
					id: 'resource_settings_color_gradient',
					isVisibleExpression: "($(options:resource_settings_color_action) == 1 && $(options:resource_settings_color_gradient_toggle) == false) || $(options:resource_settings_color_action) == 2",
					default: false,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let id = opt.resource_settings_color_action;

				if (opt.resource_settings_color_gradient_toggle && id == 1) {
					self.RESOURCE_SETTINGS_COLOR_RESOURCE =
						opt.resource_settings_color_resource;
					self.pixera.sendParams(
						37,
						'Pixera.Resources.Resource.getUseGradient',
						{ handle: parseInt(opt.resource_settings_color_resource) }
					);
				} else {
					switch (id) {
						case 1:
							self.pixera.sendParams(
								0,
								'Pixera.Resources.Resource.setUseGradient',
								{
									handle: parseInt(opt.resource_settings_color_resource),
									useGradient: opt.resource_settings_color_gradient,
								}
							);
							break;
						case 2:
							self.pixera.sendParams(
								0,
								'Pixera.Resources.Resource.setColorAtIndex',
								{
									handle: parseInt(opt.resource_settings_color_resource),
									index: parseInt(opt.resource_settings_color_index),
									red: parseInt(opt.resource_settings_color_red),
									green: parseInt(opt.resource_settings_color_green),
									blue: parseInt(opt.resource_settings_color_blue),
									alpha: parseInt(opt.resource_settings_color_alpha),
									position: parseFloat(opt.resource_settings_color_position),
									name: opt.resource_settings_color_colorname,
									useGradient: opt.resource_settings_color_gradient,
								}
							);
							break;
						default:
							break;
					}
				}
			},
		};

		//Updated 11/9/2023 by Cody Luketic
		actions.resource_multiresource = {
			name: 'Resource Multiresource',
			options: [
				{
					type: 'dropdown',
					label: 'Resource',
					id: 'resource_multiresource_resource',
					default: 0,
					choices: self.CHOICES_RESOURCENAME,
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'resource_multiresource_action',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Add Multiresource Item', id: 1 },
						{ label: 'Remove Multiresource Index', id: 2 },
						{ label: 'Replace Multiresource Item by Index', id: 3 },
						{ label: 'Set Multiresource Resolution', id: 4 },
						{ label: 'Set Multiresource Item Size by Index', id: 5 },
						{ label: 'Set Multiresource Item Position by Index', id: 6 },
					],
				},
				{
					type: 'textinput',
					label: 'Index',
					id: 'resource_multiresource_index',
					isVisibleExpression: "$(options:resource_multiresource_action) == 2 || $(options:resource_multiresource_action) == 3 || $(options:resource_multiresource_action) == 5 || $(options:resource_multiresource_action) == 6",
					default: '1',
				},
				{
					type: 'textinput',
					label: 'Id',
					id: 'resource_multiresource_id',
					isVisibleExpression: "$(options:resource_multiresource_action) == 1 || $(options:resource_multiresource_action) == 3",
					default: '1',
				},
				{
					type: 'textinput',
					label: 'Width',
					id: 'resource_multiresource_width',
					isVisibleExpression: "$(options:resource_multiresource_action) == 4 || $(options:resource_multiresource_action) == 5",
					default: '1',
				},
				{
					type: 'textinput',
					label: 'Height',
					id: 'resource_multiresource_height',
					isVisibleExpression: "$(options:resource_multiresource_action) == 4 || $(options:resource_multiresource_action) == 5",
					default: '1',
				},
				{
					type: 'textinput',
					label: 'Position X',
					id: 'resource_multiresource_posx',
					isVisibleExpression: "$(options:resource_multiresource_action) == 6",
					default: '1',
				},
				{
					type: 'textinput',
					label: 'Position Y',
					id: 'resource_multiresource_posy',
					isVisibleExpression: "$(options:resource_multiresource_action) == 6",
					default: '1',
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let id = opt.resource_multiresource_action;

				switch (id) {
					case 1:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.addMultiresourceItem',
							{
								handle: parseInt(opt.resource_multiresource_resource),
								id: parseFloat(opt.resource_multiresource_id),
							}
						);
						break;
					case 2:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.removeMultiresourceIndex',
							{
								handle: parseInt(opt.resource_multiresource_resource),
								index: parseInt(opt.resource_multiresource_index),
							}
						);
						break;
					case 3:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.replaceMultiresourceItemByIndex',
							{
								handle: parseInt(opt.resource_multiresource_resource),
								index: parseInt(opt.resource_multiresource_index),
								id: parseInt(opt.resource_multiresource_id),
							}
						);
						break;
					case 4:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.setMultiresourceResolution',
							{
								handle: parseInt(opt.resource_multiresource_resource),
								width: parseInt(opt.resource_multiresource_width),
								height: parseInt(opt.resource_multiresource_height),
							}
						);
						break;
					case 5:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.setMultiresourceItemSizebyIndex',
							{
								handle: parseInt(opt.resource_multiresource_resource),
								index: parseInt(opt.resource_multiresource_index),
								width: parseFloat(opt.resource_multiresource_width),
								height: parseFloat(opt.resource_multiresource_height),
							}
						);
						break;
					case 6:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.Resource.setMultiresourceItemPositionbyIndex',
							{
								handle: parseInt(opt.resource_multiresource_resource),
								index: parseInt(opt.resource_multiresource_index),
								x: parseFloat(opt.resource_multiresource_posx),
								y: parseFloat(opt.resource_multiresource_posy),
							}
						);
						break;
					default:
						break;
				}
			},
		};*/

		//Updated 11/14/2023 by Cody Luketic
		actions.resource_folder_settings = {
			name: 'Resource Folder Settings',
			options: [
				{
					type: 'dropdown',
					label: 'Resource Folder',
					id: 'resource_folder_settings_resourcefolder',
					default: 0,
					choices: self.CHOICES_RESOURCEFOLDERNAME,
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'resource_folder_settings_action',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Set Name', id: 1 },
						{ label: 'Set DMX Id', id: 2 },
						{ label: 'Change Distribution Target', id: 3 },
						{ label: 'Reset Distribution Targets', id: 4 },
					],
				},
				{
					type: 'textinput',
					label: 'Name',
					id: 'resource_folder_settings_name',
					isVisibleExpression: "$(options:resource_folder_settings_action) == 1",
					default: 'Resource 1',
				},
				{
					type: 'textinput',
					label: 'Dmx Id',
					id: 'resource_folder_settings_dmxid',
					isVisibleExpression: "$(options:resource_folder_settings_action) == 2",
					default: '1',
				},
				{
					type: 'dropdown',
					label: 'Livesystem',
					id: 'resource_folder_settings_livesystem',
					isVisibleExpression: "$(options:resource_folder_settings_action) == 3",
					default: 0,
					choices: self.CHOICES_LIVESYSTEMNAME,
				},
				{
					type: 'checkbox',
					label: 'Should Distribute',
					id: 'resource_folder_settings_distribute',
					isVisibleExpression: "$(options:resource_folder_settings_action) == 3",
					default: false,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let id = opt.resource_folder_settings_action;

				switch (id) {
					case 1:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.setName',
							{
								handle: parseInt(opt.resource_folder_settings_resourcefolder),
								name: opt.resource_folder_settings_name,
							}
						);
						break;
					case 2:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.setDmxId',
							{
								handle: parseInt(opt.resource_folder_settings_resourcefolder),
								id: parseInt(opt.resource_folder_settings_dmxid),
							}
						);
						break;
					case 3:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.changeDistributionTarget',
							{
								handle: parseInt(opt.resource_folder_settings_resourcefolder),
								apEntityLiveSystemHandle: parseInt(
									opt.resource_folder_settings_livesystem
								),
								shouldDistribute: opt.resource_folder_settings_distribute,
							}
						);
						break;
					case 4:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.resetDistributionTargets',
							{ handle: parseInt(opt.resource_folder_settings_resourcefolder) }
						);
						break;
					default:
						break;
				}
			},
		};

		//Created 11/14/2023 by Cody Luketic
		actions.resource_folder_content = {
			name: 'Resource Folder Content',
			options: [
				{
					type: 'dropdown',
					label: 'Resource Folder',
					id: 'resource_folder_content_resourcefolder',
					default: 0,
					choices: self.CHOICES_RESOURCEFOLDERNAME,
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'resource_folder_content_action',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Create Folders From Path', id: 1 },
						{ label: 'Remove This', id: 2 },
						{ label: 'Remove This Including Assets', id: 3 },
						/*{label: 'Move Resource to This by Id', id: 4},*/
						{ label: 'Refresh Resources', id: 5 },
						{ label: 'Remove All Contents', id: 6 },
						{ label: 'Remove All Contents Including Assets', id: 7 },
						{ label: 'Delete All Contents Assets From LiveSystem', id: 8 },
					],
				},
				{
					type: 'textinput',
					label: 'Folder Path',
					id: 'resource_folder_content_path',
					isVisibleExpression: "$(options:resource_folder_content_action) == 1",
					default: 'Other\\Videos',
				} /*
				{
					type: 'textinput',
					label: 'Resource Id',
					id: 'resource_folder_content_resourceid',
					isVisibleExpression: "$(options:resource_folder_content_action) == 4",
					default: '1.0',
				},*/,
				{
					type: 'dropdown',
					label: 'Livesystem',
					id: 'resource_folder_content_livesystem',
					isVisibleExpression: "$(options:resource_folder_content_action) == 8",
					default: 0,
					choices: self.CHOICES_LIVESYSTEMNAME,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let id = opt.resource_folder_content_action;

				switch (id) {
					case 1:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.createFoldersFrom',
							{
								handle: parseInt(opt.resource_folder_content_resourcefolder),
								path: opt.resource_folder_content_path,
							}
						);
						break;
					case 2:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.removeThis',
							{ handle: parseInt(opt.resource_folder_content_resourcefolder) }
						);
						break;
					case 3:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.removeThisIncludingAssets',
							{ handle: parseInt(opt.resource_folder_content_resourcefolder) }
						);
						break;
					/*case 4:
						self.pixera.sendParams(0,'Pixera.Resources.ResourceFolder.moveResourceToThis',
							{'handle':parseInt(opt.resource_folder_content_resourcefolder),
								'id':parseDouble(opt.resource_folder_content_id)});
						break;*/
					case 5:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.refreshResources',
							{ handle: parseInt(opt.resource_folder_content_resourcefolder) }
						);
						break;
					case 6:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.removeAllContents',
							{ handle: parseInt(opt.resource_folder_content_resourcefolder) }
						);
						break;
					case 7:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.removeAllContentsIncludingAssets',
							{ handle: parseInt(opt.resource_folder_content_resourcefolder) }
						);
						break;
					case 8:
						self.pixera.sendParams(
							0,
							'Pixera.Resources.ResourceFolder.deleteAllContentsAssetsFromLiveSystem',
							{
								handle: parseInt(opt.resource_folder_content_resourcefolder),
								apEntityLiveSystemHandle: parseInt(
									opt.resource_folder_content_livesystem
								),
							}
						);
						break;
					default:
						break;
				}
			},
		};
		/*
		//Created 11/14/2023 by Cody Luketic
		actions.resource_folder_transcode = {
			name: 'Resource Folder Transcode',
			options: [
				{
					type: 'dropdown',
					label: 'Transcode Folder',
					id: 'resource_folder_transcode_transcodefolder',
					default: 0,
					choices: self.CHOICES_TRANSCODEFOLDERNAME
				},
				{
					type: 'dropdown',
					label: 'Action',
					id: 'resource_folder_transcode_action',
					disableAutoExpression: true,
					default: 1,
					choices:[
						{label: 'Set Used Transcoding Preset', id: 1},
						{label: 'Set Transcode Automatically', id: 2},
						{label: 'Set RX Cache as Destination', id: 3},
						{label: 'Set Destination Directory', id: 4}
					]
				},
				{
					type: 'textinput',
					label: 'Preset',
					id: 'resource_folder_transcode_preset',
					isVisibleExpression: "$(options:resource_folder_transcode_action) == 1",
					default: '',
				},
				{
					type: 'checkbox',
					label: 'Transcode Automatically',
					id: 'resource_folder_transcode_automatic',
					isVisibleExpression: "$(options:resource_folder_transcode_action) == 2",
					default: '1',
				},
				{
					type: 'checkbox',
					label: 'Set RX Cache as the Destination',
					id: 'resource_folder_transcode_rx',
					isVisibleExpression: "$(options:resource_folder_transcode_action) == 3",
					default: '1',
				},
				{
					type: 'textinput',
					label: 'Path',
					id: 'resource_folder_transcode_path',
					isVisibleExpression: "$(options:resource_folder_transcode_action) == 4",
				}
			],
			callback: async (event) => {
				let opt = event.options;
				let id = opt.resource_folder_transcode_action;

				switch (id) {
					case 1:
						self.pixera.sendParams(0,'Pixera.Resources.TranscodeFolder.setUsedTranscodePreset',
							{'handle':parseInt(opt.resource_folder_transcode_transcodefolder),
								'preset':opt.resource_folder_transcode_preset});
						break;
					case 2:
						self.pixera.sendParams(0,'Pixera.Resources.TranscodeFolder.setTranscodeAutomatically',
							{'handle':parseInt(opt.resource_folder_transcode_transcodefolder),
								'autoTranscode':opt.resource_folder_transcode_automatic});
						break;
					case 3:
						self.pixera.sendParams(0,'Pixera.Resources.TranscodeFolder.setRxCacheAsDestination',
							{'handle':parseInt(opt.resource_folder_transcode_transcodefolder),
								'useRxCache':opt.resource_folder_transcode_rx});
						break;
					case 4:
						self.pixera.sendParams(0,'Pixera.Resources.TranscodeFolder.setDestinationDirectory',
							{'handle':parseInt(opt.resource_folder_transcode_transcodefolder),
								'path':opt.resource_folder_transcode_path});
						break;
					default:
						break;
				}
			}
		}
		*/

		//Created 11/3/2023 by Cody Luketic
		actions.screen_transform = {
			name: 'Screen Transform',
			options: [
				{
					type: 'dropdown',
					label: 'Screen',
					id: 'screen_transform_screen',
					default: 0,
					choices: self.CHOICES_SCREENNAME,
				},
				{
					type: 'dropdown',
					label: 'Type',
					id: 'screen_transform_type',
					disableAutoExpression: true,
					default: 5,
					choices: [
						{ label: 'Position', id: 1 },
						{ label: 'Rotation', id: 2 },
						{ label: 'Scale', id: 3 },
						{ label: 'Position and Rotation', id: 4 },
						{ label: 'Position and Rotation and Scale', id: 5 },
					],
				},
				{
					type: 'textinput',
					label: 'Position X',
					id: 'screen_transform_position_x',
					isVisibleExpression: "$(options:screen_transform_type) == 1 || $(options:screen_transform_type) == 4 || $(options:screen_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Y',
					id: 'screen_transform_position_y',
					isVisibleExpression: "$(options:screen_transform_type) == 1 || $(options:screen_transform_type) == 4 || $(options:screen_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Z',
					id: 'screen_transform_position_z',
					isVisibleExpression: "$(options:screen_transform_type) == 1 || $(options:screen_transform_type) == 4 || $(options:screen_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation X',
					id: 'screen_transform_rotation_x',
					isVisibleExpression: "$(options:screen_transform_type) == 2 || $(options:screen_transform_type) == 4 || $(options:screen_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Y',
					id: 'screen_transform_rotation_y',
					isVisibleExpression: "$(options:screen_transform_type) == 2 || $(options:screen_transform_type) == 4 || $(options:screen_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Z',
					id: 'screen_transform_rotation_z',
					isVisibleExpression: "$(options:screen_transform_type) == 2 || $(options:screen_transform_type) == 4 || $(options:screen_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Scale X',
					id: 'screen_transform_scale_x',
					isVisibleExpression: "$(options:screen_transform_type) == 3 || $(options:screen_transform_type) == 5",
					default: '1.0',
				},
				{
					type: 'textinput',
					label: 'Scale Y',
					id: 'screen_transform_scale_y',
					isVisibleExpression: "$(options:screen_transform_type) == 3 || $(options:screen_transform_type) == 5",
					default: '1.0',
				},
				{
					type: 'textinput',
					label: 'Scale Z',
					id: 'screen_transform_scale_z',
					isVisibleExpression: "$(options:screen_transform_type) == 3 || $(options:screen_transform_type) == 5",
					default: '1.0',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				switch (opt.screen_transform_type) {
					case 1:
						self.pixera.sendParams(0, 'Pixera.Screens.Screen.setPosition', {
							handle: parseInt(opt.screen_transform_screen),
							xPos: parseFloat(opt.screen_transform_position_x),
							yPos: parseFloat(opt.screen_transform_position_y),
							zPos: parseFloat(opt.screen_transform_position_z),
						});
						break;
					case 2:
						self.pixera.sendParams(0, 'Pixera.Screens.Screen.setRotation', {
							handle: parseInt(opt.screen_transform_screen),
							xRot: parseFloat(opt.screen_transform_rotation_x),
							yRot: parseFloat(opt.screen_transform_rotation_y),
							zRot: parseFloat(opt.screen_transform_rotation_z),
						});
						break;
					case 3:
						self.pixera.sendParams(0, 'Pixera.Screens.Screen.setScale', {
							handle: parseInt(opt.screen_transform_screen),
							xScale: parseFloat(opt.screen_transform_scale_x),
							yScale: parseFloat(opt.screen_transform_scale_y),
							zScale: parseFloat(opt.screen_transform_scale_z),
						});
						break;
					case 4:
						self.pixera.sendParams(0, 'Pixera.Screens.Screen.setPosRot', {
							handle: parseInt(opt.screen_transform_screen),
							xPos: parseFloat(opt.screen_transform_position_x),
							yPos: parseFloat(opt.screen_transform_position_y),
							zPos: parseFloat(opt.screen_transform_position_z),
							xRot: parseFloat(opt.screen_transform_rotation_x),
							yRot: parseFloat(opt.screen_transform_rotation_y),
							zRot: parseFloat(opt.screen_transform_rotation_z),
						});
						break;
					case 5:
						self.pixera.sendParams(0, 'Pixera.Screens.Screen.setPosRotScale', {
							handle: parseInt(opt.screen_transform_screen),
							xPos: parseFloat(opt.screen_transform_position_x),
							yPos: parseFloat(opt.screen_transform_position_y),
							zPos: parseFloat(opt.screen_transform_position_z),
							xRot: parseFloat(opt.screen_transform_rotation_x),
							yRot: parseFloat(opt.screen_transform_rotation_y),
							zRot: parseFloat(opt.screen_transform_rotation_z),
							xScale: parseFloat(opt.screen_transform_scale_x),
							yScale: parseFloat(opt.screen_transform_scale_y),
							zScale: parseFloat(opt.screen_transform_scale_z),
						});
						break;
					default:
						break;
				}
			},
		};

		//Created 11/6/2023 by Cody Luketic
		actions.screen_perspective_transform = {
			name: 'Screen Perspective Transform',
			options: [
				{
					type: 'dropdown',
					label: 'Screen',
					id: 'screen_perspective_transform_screen',
					default: 0,
					choices: self.CHOICES_SCREENNAME,
				},
				{
					type: 'dropdown',
					label: 'Type',
					id: 'screen_perspective_transform_type',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Position', id: 1 },
						{ label: 'Position with Look at', id: 2 },
						{ label: 'Rotation', id: 3 },
						{ label: 'Snap Corners to Screen', id: 4 },
					],
				},
				{
					type: 'textinput',
					label: 'Position X',
					id: 'screen_perspective_transform_position_x',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 1",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Y',
					id: 'screen_perspective_transform_position_y',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 1",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Z',
					id: 'screen_perspective_transform_position_z',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 1",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Look at X',
					id: 'screen_perspective_transform_positionlookat_x',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 2",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Look at Y',
					id: 'screen_perspective_transform_positionlookat_y',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 2",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Look at Z',
					id: 'screen_perspective_transform_positionlookat_z',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 2",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation X',
					id: 'screen_perspective_transform_rotation_x',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Y',
					id: 'screen_perspective_transform_rotation_y',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Z',
					id: 'screen_perspective_transform_rotation_z',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Mode',
					id: 'screen_perspective_transform_mode',
					isVisibleExpression: "$(options:screen_perspective_transform_type) == 4",
					default: '0.0',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				switch (opt.screen_perspective_transform_type) {
					case 1:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.Screen.setPerspectivePosition',
							{
								handle: parseInt(opt.screen_perspective_transform_screen),
								xPos: parseFloat(opt.screen_perspective_transform_position_x),
								yPos: parseFloat(opt.screen_perspective_transform_position_y),
								zPos: parseFloat(opt.screen_perspective_transform_position_z),
							}
						);
						break;
					case 2:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.Screen.setPerspectivePositionWithLookAt',
							{
								handle: parseInt(opt.screen_perspective_transform_screen),
								xPos: parseFloat(
									opt.screen_perspective_transform_positionlookat_x
								),
								yPos: parseFloat(
									opt.screen_perspective_transform_positionlookat_y
								),
								zPos: parseFloat(
									opt.screen_perspective_transform_positionlookat_z
								),
							}
						);
						break;
					case 3:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.Screen.setPerspectiveRotation',
							{
								handle: parseInt(opt.screen_perspective_transform_screen),
								xRot: parseFloat(opt.screen_perspective_transform_rotation_x),
								yRot: parseFloat(opt.screen_perspective_transform_rotation_y),
								zRot: parseFloat(opt.screen_perspective_transform_rotation_z),
							}
						);
						break;
					case 4:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.Screen.snapPerspectiveCornersToScreen',
							{
								handle: parseInt(opt.screen_perspective_transform_screen),
								mode: parseFloat(opt.screen_perspective_transform_mode),
							}
						);
						break;
					default:
						break;
				}
			},
		};

		//Created 11/6/2023 by Cody Luketic
		actions.screen_camera_transform = {
			name: 'Screen Camera Transform',
			options: [
				{
					type: 'dropdown',
					label: 'Screen',
					id: 'screen_camera_transform_screen',
					default: 0,
					choices: self.CHOICES_SCREENNAME,
				},
				{
					type: 'dropdown',
					label: 'Type',
					id: 'screen_camera_transform_type',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Position', id: 1 },
						{ label: 'Position with Look at', id: 2 },
						{ label: 'Rotation', id: 3 },
					],
				},
				{
					type: 'textinput',
					label: 'Position X',
					id: 'screen_camera_transform_position_x',
					isVisibleExpression: "$(options:screen_camera_transform_type) == 1",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Y',
					id: 'screen_camera_transform_position_y',
					isVisibleExpression: "$(options:screen_camera_transform_type) == 1",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Z',
					id: 'screen_camera_transform_position_z',
					isVisibleExpression: "$(options:screen_camera_transform_type) == 1",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Look at X',
					id: 'screen_camera_transform_positionlookat_x',
					isVisibleExpression: "$(options:screen_camera_transform_type) == 2",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Look at Y',
					id: 'screen_camera_transform_positionlookat_y',
					isVisibleExpression: "$(options:screen_camera_transform_type) == 2",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Look at Z',
					id: 'screen_camera_transform_positionlookat_z',
					isVisibleExpression: "$(options:screen_camera_transform_type) == 2",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation X',
					id: 'screen_camera_transform_rotation_x',
					isVisibleExpression: "$(options:screen_camera_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Y',
					id: 'screen_camera_transform_rotation_y',
					isVisibleExpression: "$(options:screen_camera_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Z',
					id: 'screen_camera_transform_rotation_z',
					isVisibleExpression: "$(options:screen_camera_transform_type) == 3",
					default: '0.0',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				switch (opt.screen_camera_transform_type) {
					case 1:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.Screen.setCameraPosition',
							{
								handle: parseInt(opt.screen_camera_transform_screen),
								xPos: parseFloat(opt.screen_camera_transform_position_x),
								yPos: parseFloat(opt.screen_camera_transform_position_y),
								zPos: parseFloat(opt.screen_camera_transform_position_z),
							}
						);
						break;
					case 2:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.Screen.setCameraPositionWithLookAt',
							{
								handle: parseInt(opt.screen_camera_transform_screen),
								xPos: parseFloat(opt.screen_camera_transform_positionlookat_x),
								yPos: parseFloat(opt.screen_camera_transform_positionlookat_y),
								zPos: parseFloat(opt.screen_camera_transform_positionlookat_z),
							}
						);
						break;
					case 3:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.Screen.setCameraRotation',
							{
								handle: parseInt(opt.screen_camera_transform_screen),
								xRot: parseFloat(opt.screen_camera_transform_rotation_x),
								yRot: parseFloat(opt.screen_camera_transform_rotation_y),
								zRot: parseFloat(opt.screen_camera_transform_rotation_z),
							}
						);
						break;
					default:
						break;
				}
			},
		};

		//Created 11/6/2023 by Cody Luketic
		actions.screen_studiocamera_transform = {
			name: 'Screen Studio Camera Transform',
			options: [
				{
					type: 'dropdown',
					label: 'Studio Camera',
					id: 'screen_studiocamera_transform_studiocamera',
					default: 0,
					choices: self.CHOICES_STUDIOCAMERANAME,
				},
				{
					type: 'dropdown',
					label: 'Type',
					id: 'screen_studiocamera_transform_type',
					disableAutoExpression: true,
					default: 1,
					choices: [
						{ label: 'Position', id: 1 },
						{ label: 'Rotation', id: 2 },
						{ label: 'Transformation', id: 3 } /*,
						{label: 'Transformation and Lens Properties', id: 4},
						{label: 'Transformation and Lens Properties Extended', id: 5},*/,
					],
				},
				{
					type: 'textinput',
					label: 'Position X',
					id: 'screen_studiocamera_transform_position_x',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 1 || $(options:screen_studiocamera_transform_type) == 3 || $(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Y',
					id: 'screen_studiocamera_transform_position_y',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 1 || $(options:screen_studiocamera_transform_type) == 3 || $(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Z',
					id: 'screen_studiocamera_transform_position_z',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 1 || $(options:screen_studiocamera_transform_type) == 3 || $(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation X',
					id: 'screen_studiocamera_transform_rotation_x',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 2 || $(options:screen_studiocamera_transform_type) == 3 || $(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Y',
					id: 'screen_studiocamera_transform_rotation_y',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 2 || $(options:screen_studiocamera_transform_type) == 3 || $(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Z',
					id: 'screen_studiocamera_transform_rotation_z',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 2 || $(options:screen_studiocamera_transform_type) == 3 || $(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'FOV',
					id: 'screen_studiocamera_transform_fov',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 3 || $(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Aspect Ratio',
					id: 'screen_studiocamera_transform_aspectratio',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 3 || $(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				} /*,
				{
					type: 'textinput',
					label: 'Near Clip',
					id: 'screen_studiocamera_transform_nearclip',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Far Clip',
					id: 'screen_studiocamera_transform_farclip',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Aperture',
					id: 'screen_studiocamera_transform_aperture',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Focus',
					id: 'screen_studiocamera_transform_focus',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Focal Distance',
					id: 'screen_studiocamera_transform_focaldistance',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Zoom',
					id: 'screen_studiocamera_transform_zoom',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Iris',
					id: 'screen_studiocamera_transform_iris',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'K1',
					id: 'screen_studiocamera_transform_k1',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'K2',
					id: 'screen_studiocamera_transform_k2',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'K3',
					id: 'screen_studiocamera_transform_k3',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'P1',
					id: 'screen_studiocamera_transform_p1',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'P2',
					id: 'screen_studiocamera_transform_p2',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Center X',
					id: 'screen_studiocamera_transform_centerx',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Center Y',
					id: 'screen_studiocamera_transform_centery',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Panel Width',
					id: 'screen_studiocamera_transform_panelwidth',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 4 || $(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Overscan',
					id: 'screen_studiocamera_transform_overscan',
					isVisibleExpression: "$(options:screen_studiocamera_transform_type) == 5",
					default: '0.0',
				}
				*/,
			],
			callback: async (event) => {
				let opt = event.options;

				switch (opt.screen_studiocamera_transform_type) {
					case 1:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.StudioCamera.setPosition',
							{
								handle: parseInt(
									opt.screen_studiocamera_transform_studiocamera
								),
								xPos: parseFloat(opt.screen_studiocamera_transform_position_x),
								yPos: parseFloat(opt.screen_studiocamera_transform_position_y),
								zPos: parseFloat(opt.screen_studiocamera_transform_position_z),
							}
						);
						break;
					case 2:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.StudioCamera.setRotation',
							{
								handle: parseInt(
									opt.screen_studiocamera_transform_studiocamera
								),
								xRot: parseFloat(opt.screen_studiocamera_transform_rotation_x),
								yRot: parseFloat(opt.screen_studiocamera_transform_rotation_y),
								zRot: parseFloat(opt.screen_studiocamera_transform_rotation_z),
							}
						);
						break;
					case 3:
						self.pixera.sendParams(
							0,
							'Pixera.Screens.StudioCamera.setTransformation',
							{
								handle: parseInt(
									opt.screen_studiocamera_transform_studiocamera
								),
								xPos: parseFloat(opt.screen_studiocamera_transform_position_x),
								yPos: parseFloat(opt.screen_studiocamera_transform_position_y),
								zPos: parseFloat(opt.screen_studiocamera_transform_position_z),
								xRot: parseFloat(opt.screen_studiocamera_transform_rotation_x),
								yRot: parseFloat(opt.screen_studiocamera_transform_rotation_y),
								zRot: parseFloat(opt.screen_studiocamera_transform_rotation_z),
								fov: parseFloat(opt.screen_studiocamera_transform_fov),
								aspectRatio: parseFloat(
									opt.screen_studiocamera_transform_aspectratio
								),
							}
						);
						break;
					/*
					case 4:
						self.pixera.sendParams(0,'Pixera.Screens.StudioCamera.setTransformationAndLensProps',
							{'handle':parseInt(opt.screen_studiocamera_transform_studiocamera),
								'xPos':parseFloat(opt.screen_studiocamera_transform_position_x),
								'yPos':parseFloat(opt.screen_studiocamera_transform_position_y),
								'zPos':parseFloat(opt.screen_studiocamera_transform_position_z),
								'xRot':parseFloat(opt.screen_studiocamera_transform_rotation_x),
								'yRot':parseFloat(opt.screen_studiocamera_transform_rotation_y),
								'zRot':parseFloat(opt.screen_studiocamera_transform_rotation_z),
								'fov':parseFloat(opt.screen_studiocamera_transform_fov),
								'aspectRatio':parseFloat(opt.screen_studiocamera_transform_aspectratio),
								'nearClip':parseFloat(opt.screen_studiocamera_transform_nearclip),
								'farClip':parseFloat(opt.screen_studiocamera_transform_farclip),
								'aperture':parseFloat(opt.screen_studiocamera_transform_aperture),
								'focus':parseFloat(opt.screen_studiocamera_transform_focus),
								'iris':parseFloat(opt.screen_studiocamera_transform_iris),
								'k1':parseFloat(opt.screen_studiocamera_transform_k1),
								'k2':parseFloat(opt.screen_studiocamera_transform_k2),
								'centerX':parseFloat(opt.screen_studiocamera_transform_centerx),
								'centerY':parseFloat(opt.screen_studiocamera_transform_centery),
								'panelWidth':parseFloat(opt.screen_studiocamera_transform_panelwidth)});
						break;
					case 5:
						self.pixera.sendParams(0,'Pixera.Screens.StudioCamera.setTransformationAndLensPropsExt',
							{'handle':parseInt(opt.screen_studiocamera_transform_studiocamera),
								'xPos':parseFloat(opt.screen_studiocamera_transform_position_x),
								'yPos':parseFloat(opt.screen_studiocamera_transform_position_y),
								'zPos':parseFloat(opt.screen_studiocamera_transform_position_z),
								'xRot':parseFloat(opt.screen_studiocamera_transform_rotation_x),
								'yRot':parseFloat(opt.screen_studiocamera_transform_rotation_y),
								'zRot':parseFloat(opt.screen_studiocamera_transform_rotation_z),
								'fov':parseFloat(opt.screen_studiocamera_transform_fov),
								'aspectRatio':parseFloat(opt.screen_studiocamera_transform_aspectratio),
								'nearClip':parseFloat(opt.screen_studiocamera_transform_nearclip),
								'farClip':parseFloat(opt.screen_studiocamera_transform_farclip),
								'aperture':parseFloat(opt.screen_studiocamera_transform_aperture),
								'focus':parseFloat(opt.screen_studiocamera_transform_focus),
								'focalDistance':parseFloat(opt.screen_studiocamera_transform_focaldistance),
								'zoom':parseFloat(opt.screen_studiocamera_transform_zoom),
								'iris':parseFloat(opt.screen_studiocamera_transform_iris),
								'k1':parseFloat(opt.screen_studiocamera_transform_k1),
								'k2':parseFloat(opt.screen_studiocamera_transform_k2),
								'k3':parseFloat(opt.screen_studiocamera_transform_k3),
								'p1':parseFloat(opt.screen_studiocamera_transform_p1),
								'p2':parseFloat(opt.screen_studiocamera_transform_p2),
								'centerX':parseFloat(opt.screen_studiocamera_transform_centerx),
								'centerY':parseFloat(opt.screen_studiocamera_transform_centery),
								'panelWidth':parseFloat(opt.screen_studiocamera_transform_panelwidth),
								'overscan':parseFloat(opt.screen_studiocamera_transform_overscan)});
						break;
					*/
					default:
						break;
				}
			},
		};

		//Created 11/6/2023 by Cody Luketic
		actions.screen_studiocamera_tracking = {
			name: 'Screen Studio Camera Tracking',
			options: [
				{
					type: 'dropdown',
					label: 'Studio Camera',
					id: 'screen_studiocamera_tracking_studiocamera',
					default: 0,
					choices: self.CHOICES_STUDIOCAMERANAME,
				},
				{
					type: 'checkbox',
					label: 'Pause Tracking Input: Make Toggle',
					id: 'screen_studiocamera_tracking_trackinginputpause_toggle',
					disableAutoExpression: true,
					default: true,
				},
				{
					type: 'checkbox',
					label: 'Pause Tracking Input',
					id: 'screen_studiocamera_tracking_trackinginputpause',
					isVisibleExpression: "$(options:screen_studiocamera_tracking_trackinginputpause_toggle) == 0",
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Use Position Properties From Tracking: Make Toggle',
					id: 'screen_studiocamera_tracking_positionfromtracking_toggle',
					disableAutoExpression: true,
					default: true,
				},
				{
					type: 'checkbox',
					label: 'Use Position Properties From Tracking',
					id: 'screen_studiocamera_tracking_positionfromtracking',
					isVisibleExpression: "$(options:screen_studiocamera_tracking_positionfromtracking_toggle) == 0",
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Use Rotation Properties From Tracking: Make Toggle',
					id: 'screen_studiocamera_tracking_rotationfromtracking_toggle',
					disableAutoExpression: true,
					default: true,
				},
				{
					type: 'checkbox',
					label: 'Use Rotation Properties From Tracking',
					id: 'screen_studiocamera_tracking_rotationfromtracking',
					isVisibleExpression: "$(options:screen_studiocamera_tracking_rotationfromtracking_toggle) == 0",
					default: false,
				},
			],
			callback: async (event) => {
				let opt = event.options;

				if (opt.screen_studiocamera_trackinginputpause_toggle) {
					self.SCREEN_STUDIOCAMERA_TRACKING_STUDIOCAMERA =
						opt.screen_studiocamera_tracking_studiocamera;
					self.pixera.sendParams(
						28,
						'Pixera.Screens.StudioCamera.getTrackingInputPause',
						{ handle: parseInt(opt.screen_studiocamera_tracking_studiocamera) }
					);
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.Screens.StudioCamera.setTrackingInputPause',
						{
							handle: parseInt(opt.screen_studiocamera_tracking_studiocamera),
							pause: opt.screen_studiocamera_tracking_trackinginputpause,
						}
					);
				}

				if (opt.screen_studiocamera_tracking_positionfromtracking_toggle) {
					self.SCREEN_STUDIOCAMERA_TRACKING_STUDIOCAMERA =
						opt.screen_studiocamera_tracking_studiocamera;
					self.pixera.sendParams(
						29,
						'Pixera.Screens.StudioCamera.getUsePositionPropertiesFromTracking',
						{ handle: parseInt(opt.screen_studiocamera_tracking_studiocamera) }
					);
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.Screens.StudioCamera.setUsePositionPropertiesFromTracking',
						{
							handle: parseInt(opt.screen_studiocamera_tracking_studiocamera),
							pause: opt.screen_studiocamera_tracking_positionfromtracking,
						}
					);
				}

				if (opt.screen_studiocamera_tracking_rotationfromtracking_toggle) {
					self.SCREEN_STUDIOCAMERA_TRACKING_STUDIOCAMERA =
						opt.screen_studiocamera_tracking_studiocamera;
					self.pixera.sendParams(
						30,
						'Pixera.Screens.StudioCamera.getUseRotationPropertiesFromTracking',
						{ handle: parseInt(opt.screen_studiocamera_tracking_studiocamera) }
					);
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.Screens.StudioCamera.setUseRotationPropertiesFromTracking',
						{
							handle: parseInt(opt.screen_studiocamera_tracking_studiocamera),
							pause: opt.screen_studiocamera_tracking_rotationfromtracking,
						}
					);
				}
			},
		};

		actions.screen_visible = {
			name: 'Visible Screen',
			options: [
				{
					type: 'dropdown',
					label: 'Screen Name',
					id: 'visible_screen_name',
					default: 0,
					choices: self.CHOICES_SCREENNAME,
				},
				{
					type: 'checkbox',
					label: 'Screen Visible',
					id: 'visible_screen_state',
					default: true,
				},
			],
			callback: async (event) => {
				self.pixera.sendParams(0, 'Pixera.Screens.Screen.setIsVisible', {
					handle: parseInt(event.options.visible_screen_name),
					isVisible: JSON.parse(event.options.visible_screen_state),
				});
			},
		};

		actions.screen_refresh_mapping = {
			name: 'Screen Refresh Mapping',
			options: [
				{
					type: 'dropdown',
					label: 'Screen Name',
					id: 'refresh_screen_name',
					default: 0,
					choices: self.CHOICES_SCREENNAME,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				self.pixera.sendParams(
					0,
					'Pixera.Screens.Screen.triggerRefreshMapping',
					{ handle: parseInt(opt.refresh_screen_name) }
				);
			},
		};

		actions.screen_projectable = {
			name: 'Screen is Projectable',
			options: [
				{
					type: 'dropdown',
					label: 'Screen Name',
					id: 'visible_projectable_name',
					default: 0,
					choices: self.CHOICES_SCREENNAME,
				},
				{
					type: 'checkbox',
					label: 'Screen Is Projectable',
					id: 'visible_projectable_state',
					default: true,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				self.pixera.sendParams(0, 'Pixera.Screens.Screen.setIsProjectable', {
					handle: parseInt(opt.visible_projectable_name),
					isProjectable: JSON.parse(opt.visible_projectable_state),
				});
			},
		};

		//Created 11/6/2023 by Cody Luketic
		actions.projector_transform = {
			name: 'Projector Transform',
			options: [
				{
					type: 'dropdown',
					label: 'Projector',
					id: 'projector_transform_projector',
					default: 0,
					choices: self.CHOICES_PROJECTORNAME,
				},
				{
					type: 'dropdown',
					label: 'Type',
					id: 'projector_transform_type',
					disableAutoExpression: true,
					default: 3,
					choices: [
						{ label: 'Position', id: 1 },
						{ label: 'Rotation', id: 2 },
						{ label: 'Position and Rotation', id: 3 },
					],
				},
				{
					type: 'textinput',
					label: 'Position X',
					id: 'projector_transform_position_x',
					isVisibleExpression: "$(options:projector_transform_type) == 1 || $(options:projector_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Y',
					id: 'projector_transform_position_y',
					isVisibleExpression: "$(options:projector_transform_type) == 1 || $(options:projector_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Position Z',
					id: 'projector_transform_position_z',
					isVisibleExpression: "$(options:projector_transform_type) == 1 || $(options:projector_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation X',
					id: 'projector_transform_rotation_x',
					isVisibleExpression: "$(options:projector_transform_type) == 2 || $(options:projector_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Y',
					id: 'projector_transform_rotation_y',
					isVisibleExpression: "$(options:projector_transform_type) == 2 || $(options:projector_transform_type) == 3",
					default: '0.0',
				},
				{
					type: 'textinput',
					label: 'Rotation Z',
					id: 'projector_transform_rotation_z',
					isVisibleExpression: "$(options:projector_transform_type) == 2 || $(options:projector_transform_type) == 3",
					default: '0.0',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				switch (opt.projector_transform_type) {
					case 1:
						self.pixera.sendParams(
							0,
							'Pixera.Projectors.Projector.setPosition',
							{
								handle: parseInt(opt.projector_transform_projector),
								xPos: parseFloat(opt.projector_transform_position_x),
								yPos: parseFloat(opt.projector_transform_position_y),
								zPos: parseFloat(opt.projector_transform_position_z),
							}
						);
						break;
					case 2:
						self.pixera.sendParams(
							0,
							'Pixera.Projectors.Projector.setRotation',
							{
								handle: parseInt(opt.projector_transform_projector),
								xRot: parseFloat(opt.projector_transform_rotation_x),
								yRot: parseFloat(opt.projector_transform_rotation_y),
								zRot: parseFloat(opt.projector_transform_rotation_z),
							}
						);
						break;
					case 3:
						self.pixera.sendParams(
							0,
							'Pixera.Projectors.Projector.setPosition',
							{
								handle: parseInt(opt.projector_transform_projector),
								xPos: parseFloat(opt.projector_transform_position_x),
								yPos: parseFloat(opt.projector_transform_position_y),
								zPos: parseFloat(opt.projector_transform_position_z),
							}
						);

						self.pixera.sendParams(
							0,
							'Pixera.Projectors.Projector.setRotation',
							{
								handle: parseInt(opt.projector_transform_projector),
								xRot: parseFloat(opt.projector_transform_rotation_x),
								yRot: parseFloat(opt.projector_transform_rotation_y),
								zRot: parseFloat(opt.projector_transform_rotation_z),
							}
						);
						break;
					default:
						break;
				}
			},
		};

		actions.projector_blackout = {
			name: 'Projector Blackout Toggle',
			options: [
				{
					type: 'dropdown',
					label: 'Projector',
					id: 'projector_blackout_projector',
					default: 0,
					choices: self.CHOICES_PROJECTORNAME,
				},
			],
			callback: async (event) => {
				let opt = event.options;

				self.PROJECTOR_BLACKOUT_PROJECTOR = opt.projector_blackout_projector;
				self.pixera.sendParams(31, 'Pixera.Projectors.Projector.getBlackout', {
					handle: parseInt(opt.projector_blackout_projector),
				});
			},
		};

		actions.goto_time = {
			name: 'Goto Timecode',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'goto_time_timelinename',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Hour',
					id: 'goto_time_h',
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Minute',
					id: 'goto_time_m',
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Second',
					id: 'goto_time_s',
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Frame',
					id: 'goto_time_f',
					default: '0',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				let hour = parseInt(await self.parseVariablesInString(opt.goto_time_h));
				let min = parseInt(await self.parseVariablesInString(opt.goto_time_m));
				let sec = parseInt(await self.parseVariablesInString(opt.goto_time_s));
				let frame = parseInt(
					await self.parseVariablesInString(opt.goto_time_f)
				);

				let fps = 60;
				for (let k = 0; k < self.CHOICES_TIMELINEFEEDBACK.length; k++) {
					if (
						self.CHOICES_TIMELINEFEEDBACK[k]['handle'] ==
						opt.goto_time_timelinename
					) {
						fps = self.CHOICES_TIMELINEFEEDBACK[k]['fps'];
						break;
					}
				}
				let time =
					hour * 60 * 60 * parseInt(fps) +
					min * 60 * parseInt(fps) +
					sec * parseInt(fps) +
					frame;

				if (event.options.goto_time_timelinename == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(
							0,
							'Pixera.Timelines.Timeline.setCurrentTime',
							{
								handle: self.SELECTEDTIMELINES[i],
								time: time,
							}
						);
					}
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.Timelines.Timeline.setCurrentTime',
						{
							handle: opt.goto_time_timelinename,
							time: time,
						}
					);
				}
			},
		};

		actions.goto_cue_name = {
			name: 'Goto Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_cuename',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Cue Name',
					id: 'cue_name',
					default: '',
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let timelineName = '';
				for (let k = 0; k < self.CHOICES_TIMELINEFEEDBACK.length; k++) {
					if (
						self.CHOICES_TIMELINEFEEDBACK[k]['handle'] ==
						opt.timelinename_cuename
					) {
						timelineName = self.CHOICES_TIMELINEFEEDBACK[k]['name'];
						break;
					}
				}
				self.pixera.sendParams(0, 'Pixera.Compound.applyCueOnTimeline', {
					timelineName: timelineName,
					cueName: await self.parseVariablesInString(opt.cue_name),
				});
			},
		};

		actions.goto_cue_index = {
			name: 'Goto Cue Index',
			options: [
				{
					type: 'textinput',
					label: 'Timeline Index',
					id: 'timelinecue_index',
					default: '0',
					tooltip: 'index starts at 0',
					useVariables: true,
					regex: self.REGEX_NUMBER,
				},
				{
					type: 'textinput',
					label: 'Cue Index',
					id: 'cue_index',
					default: '0',
					tooltip: 'index starts at 0',
					useVariables: true,
					regex: self.REGEX_NUMBER,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let indexTl = parseInt(
					await self.parseVariablesInString(opt.timelinecue_index)
				);
				let indexCue = parseInt(
					await self.parseVariablesInString(opt.cue_index)
				);
				self.pixera.sendParams(
					0,
					'Pixera.Compound.applyCueAtIndexOnTimelineAtIndex',
					{ cueIndex: indexCue, timelineIndex: indexTl }
				);
			},
		};

		actions.blend_to_time = {
			name: 'Blend To Timecode',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'blend_time_timelinename',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Hour',
					id: 'blend_time_h',
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Minute',
					id: 'blend_time_m',
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Second',
					id: 'blend_time_s',
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Frame',
					id: 'blend_time_f',
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Blendtime in Frames',
					id: 'blend_time_frames',
					default: '0',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				let hour = parseInt(
					await self.parseVariablesInString(opt.blend_time_h)
				);
				let min = parseInt(await self.parseVariablesInString(opt.blend_time_m));
				let sec = parseInt(await self.parseVariablesInString(opt.blend_time_s));
				let frame = parseInt(
					await self.parseVariablesInString(opt.blend_time_f)
				);

				let fps = 60;
				for (let k = 0; k < self.CHOICES_TIMELINEFEEDBACK.length; k++) {
					if (
						self.CHOICES_TIMELINEFEEDBACK[k]['handle'] ==
						opt.blend_time_timelinename
					) {
						fps = self.CHOICES_TIMELINEFEEDBACK[k]['fps'];
						break;
					}
				}
				let blendDuration = parseInt(
					await self.parseVariablesInString(opt.blend_time_frames)
				);
				let time =
					hour * 60 * 60 * parseInt(fps) +
					min * 60 * parseInt(fps) +
					sec * parseInt(fps) +
					frame;
				if (event.options.blend_time_timelinename == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.blendToTime', {
							handle: self.SELECTEDTIMELINES[i],
							goalTime: time,
							blendDuration: blendDuration,
						});
					}
				} else {
					self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.blendToTime', {
						handle: opt.blend_time_timelinename,
						goalTime: time,
						blendDuration: blendDuration,
					});
				}
			},
		};

		actions.blend_cue_name = {
			name: 'Blend to Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_blendcuename',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Cue Name',
					id: 'blend_cue_name',
					default: '',
				},
				{
					type: 'textinput',
					label: 'Blendtime in Frames',
					id: 'blend_name_frames',
					default: 0,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				self.CHOICES_BLENDNAME_TIMELINE = parseInt(
					opt.timelinename_blendcuename
				);
				let cueName = await self.parseVariablesInString(opt.blend_cue_name);
				let blendDuration = parseInt(
					await self.parseVariablesInString(opt.blend_name_frames)
				);
				self.CHOICES_BLENDNAME_FRAMES = blendDuration;
				if (event.options.timelinename_blendcuename == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(
							33,
							'Pixera.Timelines.Timeline.getCueFromName',
							{
								handle: self.SELECTEDTIMELINES[i],
								name: cueName,
							}
						);
					}
				} else {
					self.pixera.sendParams(
						33,
						'Pixera.Timelines.Timeline.getCueFromName',
						{
							handle: parseInt(opt.timelinename_blendcuename),
							name: cueName,
						}
					);
				}
			},
		};

		actions.timeline_opacity = {
			name: 'Timeline Opacity',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_timelineopacity',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Opacity',
					id: 'timeline_opacity',
					default: '1.0',
					regex: self.REGEX_FLOAT,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let val = parseFloat(
					await self.parseVariablesInString(opt.timeline_opacity)
				);
				if (event.options.timelinename_timelineopacity == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.setOpacity', {
							handle: self.SELECTEDTIMELINES[i],
							value: val,
						});
					}
				} else {
					self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.setOpacity', {
						handle: parseInt(opt.timelinename_timelineopacity),
						value: val,
					});
				}
			},
		};

		actions.timeline_scrubcurrenttime = {
			name: 'Timeline Scrub Current Time',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline_scrubcurrenttime_timeline',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Frames',
					id: 'timeline_scrubcurrenttime_frames',
					default: 0,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let val = parseInt(
					await self.parseVariablesInString(opt.timeline_scrubcurrenttime_frames)
				);
				if (event.options.timeline_scrubcurrenttime_timeline == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(
							0,
							'Pixera.Timelines.Timeline.scrubCurrentTime',
							{
								handle: self.SELECTEDTIMELINES[i],
								frames: val,
							}
						);
					}
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.Timelines.Timeline.scrubCurrentTime',
						{
							handle: parseInt(opt.timeline_scrubcurrenttime_timeline),
							frames: val,
						}
					);
				}
			},
		};

		actions.timeline_zoomfactor = {
			name: 'Timeline Zoom Factor',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline_zoomfactor_timeline',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Zoom Factor',
					id: 'timeline_zoomfactor_factor',
					default: '1.0',
					regex: self.REGEX_FLOAT,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let val = parseFloat(
					await self.parseVariablesInString(opt.timeline_zoomfactor_factor)
				);
				if (event.options.timeline_zoomfactor_timeline == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(
							0,
							'Pixera.Timelines.Timeline.setZoomFactor',
							{
								handle: self.SELECTEDTIMELINES[i],
								zoomFactor: val,
							}
						);
					}
				} else {
					self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.setZoomFactor', {
						handle: parseInt(opt.timeline_zoomfactor_timeline),
						zoomFactor: val,
					});
				}
			},
		};

		actions.timeline_select = {
			name: 'Timeline Select',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline_select_timeline',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				if (event.options.timeline_select_timeline == -1) return;
				self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.selectThis', {
					handle: parseInt(opt.timeline_select_timeline),
				});
			},
		};

		actions.timeline_moverenderorder = {
			name: 'Timeline Move Render Order',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline_moverenderorder_timeline',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'checkbox',
					label: 'Move (On = Down, Off = Up)',
					id: 'timeline_moverenderorder_state',
					default: true,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				if (event.options.timeline_moverenderorder_timeline == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(
							0,
							'Pixera.Timelines.Timeline.moveInRenderOrder',
							{ handle: self.SELECTEDTIMELINES[i] }
						);
					}
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.Timelines.Timeline.moveInRenderOrder',
						{
							handle: parseInt(opt.timeline_moverenderorder_timeline),
							moveDown: opt.timeline_moverenderorder_state,
						}
					);
				}
			},
		};

		actions.timeline_create_layer = {
			name: 'Timeline Create Layer',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline_create_layer_timeline',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Name',
					id: 'timeline_create_layer_name',
					default: 'Layer 1',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				self.CREATE_LAYER_NAME = opt.timeline_create_layer_name;
				if (event.options.timeline_create_layer_timeline == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						self.pixera.sendParams(
							32,
							'Pixera.Timelines.Timeline.createLayer',
							{ handle: self.SELECTEDTIMELINES[i] }
						);
					}
				} else {
					self.pixera.sendParams(32, 'Pixera.Timelines.Timeline.createLayer', {
						handle: parseInt(opt.timeline_create_layer_timeline),
					});
				}
			},
		};

		actions.timeline_create_cue = {
			name: 'Timeline Create Cue',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline_create_cue_timeline',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Name',
					id: 'timeline_create_cue_name',
					default: 'Cue 1',
				},
				{
					type: 'dropdown',
					label: 'Operation',
					id: 'timeline_create_cue_operation',
					default: 1,
					choices: [
						{ label: 'Play', id: 1 },
						{ label: 'Pause', id: 2 },
						{ label: 'Stop', id: 3 },
						{ label: 'Jump', id: 4 },
					],
				},
				{
					type: 'checkbox',
					label: 'At Current Time',
					id: 'timeline_create_cue_atcurrenttime',
					disableAutoExpression: true,
					default: true,
				},
				{
					type: 'textinput',
					label: 'Hour',
					id: 'timeline_create_cue_h',
					isVisibleExpression: "$(options:timeline_create_cue_atcurrenttime) == 0",
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Minute',
					id: 'timeline_create_cue_m',
					isVisibleExpression: "$(options:timeline_create_cue_atcurrenttime) == 0",
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Second',
					id: 'timeline_create_cue_s',
					isVisibleExpression: "$(options:timeline_create_cue_atcurrenttime) == 0",
					default: '0',
				},
				{
					type: 'textinput',
					label: 'Frame',
					id: 'timeline_create_cue_f',
					isVisibleExpression: "$(options:timeline_create_cue_atcurrenttime) == 0",
					default: '0',
				},
			],
			callback: async (event) => {
				let opt = event.options;

				if (opt.timeline_create_cue_atcurrenttime) {
					self.TIMELINE_CREATE_CUE_TIMELINEHANDLE = parseInt(
						opt.timeline_create_cue_timeline
					);
					self.TIMELINE_CREATE_CUE_NAME = opt.timeline_create_cue_name;
					self.TIMELINE_CREATE_CUE_CUEOPERATION = parseInt(
						opt.timeline_create_cue_operation
					);

					if (parseInt(event.options.timeline_create_cue_timeline) == -1) {
						for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
					console.log('debug', self.SELECTEDTIMELINES[i])

							self.pixera.sendParams(
								34,
								'Pixera.Timelines.Timeline.getCurrentTime',
								{ handle: parseInt(self.SELECTEDTIMELINES[i]) }
							);
						}
					} else {
						self.pixera.sendParams(
							34,
							'Pixera.Timelines.Timeline.getCurrentTime',
							{ handle: parseInt(opt.timeline_create_cue_timeline) }
						);
					}
				} else {
					let hour = parseInt(
						await self.parseVariablesInString(opt.timeline_create_cue_h)
					);
					let min = parseInt(
						await self.parseVariablesInString(opt.timeline_create_cue_m)
					);
					let sec = parseInt(
						await self.parseVariablesInString(opt.timeline_create_cue_s)
					);
					let frame = parseInt(
						await self.parseVariablesInString(opt.timeline_create_cue_f)
					);

					let fps = 60;
					for (let i = 0; i < self.CHOICES_TIMELINEFEEDBACK.length; i++) {
						if (
							self.CHOICES_TIMELINEFEEDBACK[i]['handle'] ==
							opt.timeline_create_cue_timeline
						) {
							fps = self.CHOICES_TIMELINEFEEDBACK[i]['fps'];
							break;
						}
					}

					let time =
						hour * 60 * 60 * parseInt(fps) +
						min * 60 * parseInt(fps) +
						sec * parseInt(fps) +
						frame;
					console.log('debug', event.options.timeline_create_cue_timeline)
					if (event.options.timeline_create_cue_timeline == -1) {
						for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
							{
								self.pixera.sendParams(
									0,
									'Pixera.Timelines.Timeline.createCue',
									{
										handle: self.SELECTEDTIMELINES[i],
										name: opt.timeline_create_cue_name,
										timeInFrames: time,
										operation: parseInt(opt.timeline_create_cue_operation),
									}
								);
							}
						}
					} else {
						self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.createCue', {
							handle: parseInt(opt.timeline_create_cue_timeline),
							name: opt.timeline_create_cue_name,
							timeInFrames: time,
							operation: parseInt(opt.timeline_create_cue_operation),
						});
					}
				}
			},
		};

		actions.timeline_removecues = {
			name: 'Timeline Remove Cues',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline_removecues_timeline',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				if (event.options.timeline_removecues_timeline == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						{
							self.pixera.sendParams(
								0,
								'Pixera.Timelines.Timeline.removeCues',
								{
									handle: self.SELECTEDTIMELINES[i],
								}
							);
						}
					}
				} else {
					self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.removeCues', {
						handle: parseInt(opt.timeline_removecues_timeline),
					});
				}
			},
		};

		actions.timeline_reset = {
			name: 'Timeline Reset',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline_reset_timeline',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				if (event.options.timeline_reset_timeline == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						{
							self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.reset', {
								handle: self.SELECTEDTIMELINES[i],
							});
						}
					}
				} else {
					self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.reset', {
						handle: parseInt(opt.timeline_reset_timeline),
					});
				}
			},
		};

		actions.timeline_speedfactor = {
			name: 'Timeline Speed Factor',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline_speedfactor_timeline',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'textinput',
					label: 'Speed Factor',
					id: 'timeline_speedfactor_factor',
					default: '1.0',
					regex: self.REGEX_FLOAT,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				if (event.options.timeline_speedfactor_timeline == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						{
							self.pixera.sendParams(
								0,
								'Pixera.Timelines.Timeline.setSpeedFactor',
								{
									handle: self.SELECTEDTIMELINES[i],
									factor: parseFloat(opt.timeline_speedfactor_factor),
								}
							);
						}
					}
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.Timelines.Timeline.setSpeedFactor',
						{
							handle: parseInt(opt.timeline_speedfactor_timeline),
							factor: parseFloat(opt.timeline_speedfactor_factor),
						}
					);
				}
			},
		};

		actions.timeline_setsmpte = {
			name: 'Timeline Set SMPTE',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_timelinesmpte',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'dropdown',
					label: 'State',
					id: 'timeline_smpte_state',
					default: 0,
					choices: [
						{ id: 0, label: 'none' },
						{ id: 1, label: 'receive' },
						{ id: 2, label: 'send' },
					],
				},
			],
			callback: async (event) => {
				let opt = event.options;
				if (event.options.timelinename_timelinesmpte == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						{
							self.pixera.sendParams(
								0,
								'Pixera.Timelines.Timeline.setSmpteMode',
								{
									handle: self.SELECTEDTIMELINES[i],
									mode: parseInt(opt.timeline_smpte_state),
								}
							);
						}
					}
				} else {
					self.pixera.sendParams(0, 'Pixera.Timelines.Timeline.setSmpteMode', {
						handle: parseInt(opt.timelinename_timelinesmpte),
						mode: parseInt(opt.timeline_smpte_state),
					});
				}
			},
		};

		actions.timeline_fadeopacity = {
			name: 'Timeline Fade Opacity',
			options: [
				{
					type: 'dropdown',
					label: 'Timeline Name',
					id: 'timelinename_timelineopacity',
					default: 0,
					choices: self.CHOICES_TIMELINENAME,
				},
				{
					type: 'checkbox',
					label: 'FadeIn',
					id: 'timeline_fadeIn',
					default: true,
				},
				{
					type: 'textinput',
					label: 'Time in Frames',
					id: 'timeline_fadeopacity_time',
					default: '60',
					regex: self.REGEX_INT,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				if (event.options.timelinename_timelineopacity == -1) {
					for (let i = 0; i < self.SELECTEDTIMELINES.length; i++) {
						{
							self.pixera.sendParams(
								0,
								'Pixera.Timelines.Timeline.startOpacityAnimation',
								{
									handle: self.SELECTEDTIMELINES[i],
									fadeIn: opt.timeline_fadeIn,
									fullFadeDuration: parseFloat(opt.timeline_fadeopacity_time),
								}
							);
						}
					}
				} else {
					self.pixera.sendParams(
						0,
						'Pixera.Timelines.Timeline.startOpacityAnimation',
						{
							handle: parseInt(opt.timelinename_timelineopacity),
							fadeIn: opt.timeline_fadeIn,
							fullFadeDuration: parseFloat(opt.timeline_fadeopacity_time),
						}
					);
				}
			},
		};

		actions.layerReset = {
			name: 'Layer Reset',
			options: [
				{
					type: 'textinput',
					label: 'Layer Path',
					id: 'layerPath',
					default: 'Timeline 1.Layer 1',
				},
			],
			callback: async (event) => {
				let opt = event.options;
				self.pixera.sendParams(43, 'Pixera.Timelines.Layer.getInst', {
					instancePath: opt.layerPath,
				});
			},
		};

		actions.layerMute = {
			name: 'Layer Mute',
			options: [
				{
					type: 'textinput',
					label: 'Layer Path',
					id: 'layerPath',
					default: 'Timeline 1.Layer 1',
				},
				{
					type: 'dropdown',
					label: 'Parameter',
					id: 'layerParameterMute',
					default: 'muteLayer',
					choices: [
						{ id: 'muteLayer', label: 'Mute Layer' },
						{ id: 'muteVolume', label: 'Mute Volume' },
					],
				},
				{
					type: 'checkbox',
					label: 'Toggle',
					id: 'layer_mute_toggle',
					disableAutoExpression: true,
					default: false,
				},
				{
					type: 'checkbox',
					label: 'Mute',
					id: 'layerState',
					isVisibleExpression: "$(options:layer_mute_toggle) == false",
					default: true,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				if (opt.layerParameterMute === 'muteLayer') {
					if (opt.layer_mute_toggle === true) {
						self.pixera.sendParams(44, 'Pixera.Timelines.Layer.getInst', {
							instancePath: opt.layerPath,
						});
						return;
					}
					if (opt.layerState === true) {
						self.pixera.sendParams(39, 'Pixera.Timelines.Layer.getInst', {
							instancePath: opt.layerPath,
						});
					} else {
						self.pixera.sendParams(40, 'Pixera.Timelines.Layer.getInst', {
							instancePath: opt.layerPath,
						});
					}
				} else if (opt.layerParameterMute == 'muteVolume') {
					if (opt.layer_mute_toggle === true) {
						self.pixera.sendParams(45, 'Pixera.Timelines.Layer.getInst', {
							instancePath: opt.layerPath,
						});
						return;
					}
					if (opt.layerState === true) {
						self.pixera.sendParams(41, 'Pixera.Timelines.Layer.getInst', {
							instancePath: opt.layerPath,
						});
					} else {
						self.pixera.sendParams(42, 'Pixera.Timelines.Layer.getInst', {
							instancePath: opt.layerPath,
						});
					}
				}
			},
		};

		actions.layerParameter = {
			name: 'Layer Parameter',
			options: [
				{
					type: 'textinput',
					label: 'Parameter Path',
					id: 'layerPath',
					default: 'Timeline 1.Layer 1.Opacity',
				},
				{
					type: 'textinput',
					label: 'Value',
					id: 'layerValue',
					default: 1.0,
					regex: self.REGEX_FLOAT,
				},
			],
			callback: async (event) => {
				let opt = event.options;
				self.pixera.sendParams(0, 'Pixera.Compound.setParamValue', {
					path: opt.layerPath,
					value: parseFloat(opt.layerValue),
				});
			},
		};

		actions.controlAction = {
			name: 'Control Call Action',
			options: [
				{
					type: 'textinput',
					label: 'Control Path',
					id: 'controlPath',
					default: 'Logger.info',
				},
				{
					type: 'textinput',
					label: 'arguments',
					id: 'controlArguments',
					default: '"Hello World" 1 12.7 false',
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let args = [];
				let argString = await self.parseVariablesInString(opt.controlArguments);

				const tempArgs = (argString + '')
					.replace(/“/g, '"')
					.replace(/”/g, '"')
					.split(' ');

				if (tempArgs.length) {
					args = [];
				}

				for (let i = 0; i < tempArgs.length; i++) {
					if (tempArgs[i].length == 0) continue;
					if (tempArgs[i] === 'true' || tempArgs[i] === 'True') args.push(true);
					else if (tempArgs[i] === 'false' || tempArgs[i] === 'False')
						args.push(false);
					else if (isNaN(tempArgs[i])) {
						var str = tempArgs[i];
						if (str.startsWith('"')) {
							//a quoted string..
							while (!tempArgs[i].endsWith('"')) {
								i++;
								str += ' ' + tempArgs[i];
							}
						}
						args.push(str.replace(/"/g, '').replace(/'/g, ''));
					} else if (tempArgs[i].indexOf('.') > -1) {
						args.push(parseFloat(tempArgs[i]));
					} else {
						args.push(parseInt(tempArgs[i]));
					}
				}

				self.pixera.sendParams(0, opt.controlPath, args);
			},
		};

		actions.api = {
			name: 'API',
			options: [
				{
					type: 'textinput',
					label: 'API',
					id: 'api_methode',
					default: '',
				},
			],
			callback: async (event) => {
				let opt = event.options;
				let tempApiCmd = await self.parseVariablesInString(opt.api_methode);
				try {
					let apiCmd = JSON.parse(tempApiCmd);
					self.pixera.sendParams(9999, apiCmd['method'], apiCmd['params']);
				} catch {
					self.log('error', 'Can not parse json in API call: ' + tempApiCmd);
					return;
				}
			},
		};
		//set the actions
		//self.log('debug', 'set actions')
		self.setActionDefinitions(actions);
	},
};
