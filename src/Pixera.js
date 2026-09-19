const { instanceStatus, TCPHelper } = require('@companion-module/base');
const { debug } = require('console');
const { forEach } = require('lodash');
const { isIP } = require('net');
const variablesHelper = require('./variables');
const cuesHelper = require('./cues');

const MONITORING_SUBJECTS_CUES = [
	'cueAdded',
	'cueChanged',
	'cueRemoved',
	'cueApplied',
];

class Pixera {
	constructor(instance, config) {
		this.instance = instance;
		let self = instance;
		//buffer for receive stream
		if (isIP(config.host) !== 4) {
			self.log('error', self.config + ' is not a valid IP');
			return;
		}
		if (config.host) {
			this.socket = new TCPHelper(config.host, config.port);
			this.socket.on('status_change', function (status, message) {
				self.updateStatus(status, message);
			});

			this.socket.on('disconnect', function (err) {
				self.log('error', 'Network error: ' + err.message);
				clearInterval(self.retry_interval);
				clearInterval(self.getSelectedTimelines);
			});

			this.socket.on('error', function (err) {
				self.log('error', 'Network error: ' + err.message);
				clearInterval(self.retry_interval);
				clearInterval(self.getSelectedTimelines);
			});

			this.socket.on('close', function () {
				self.log('debug', 'Close Connection.');
				clearInterval(self.retry_interval);
				clearInterval(self.getSelectedTimelines);
			});
			this.socket.on('connect', () => {
				self.log('info', 'Pixera Connected');
				//use version to filter commands
				this.send(1, 'Pixera.Utility.getApiRevision');
				//send message to get reply
				this.sendParams(99, 'Pixera.Utility.setShowContextInReplies', {
					doShow: true,
				});
				//make sure the cue subjects are part of the monitoring for this connection
				for (const subject of MONITORING_SUBJECTS_CUES) {
					this.sendParams(65, 'Pixera.Utility.subscribeMonitoringSubject', {
						subject: subject,
					});
				}
				self.initFeedbacks();
				this.initVariables();
				this.initLiveSystems();
				this.initOutputs();
				this.initStudioCameras();
				this.initProjectors();
				//don't get resources because it take to long
				//this.initResources();
				this.initResourceFolders();
				/*this.initTranscodingFolders();*/
				this.initTimelines();
				this.initScreens();
				if (self.config.polling) {
					//self.log('debug',config.polling_rate);
					self.retry_interval = setInterval(
						this.retry.bind(this),
						config.polling_rate
					); //ms for poll timelinestate
					this.retry();
				}
				self.getSelectedTimelines = setInterval(
					this.getSelectedTimeline.bind(this),
					100
				); //ms for poll selected Timelines
				this.getSelectedTimeline();
			});
			let currentLength = 0;
			let splittetMessage = '';
			this.socket.on('data', (chunk) => {
				//const header = 'pxr1';
				const header = [112, 120, 114, 49];
				let messageLength = 0;
				while(chunk.length>0)
				{
					if(currentLength == 0)
					{
						if(chunk[0] !== header[0] || chunk[1] !== header[1] || chunk[2] !== header[2] || chunk[3] !== header[3])
						{
							//console.log('debug','-------------------------------')
							//console.log('debug', 'header was not correct');
							//console.log('debug', chunk.toString('utf8'));
							splittetMessage = '';
							break;
						}
						messageLength = chunk[4] + (chunk[5]<<8) + (chunk[6]<<16) + (chunk[7]<<24);
						//console.log('debug',chunk[4],chunk[5],chunk[6],chunk[7])
						if(messageLength<=(chunk.length-8))
						{
							splittetMessage += chunk.subarray(0,messageLength+8);
						}
						else
						{
							//break loop and wait for next chunk to combine
							splittetMessage += chunk.subarray(0,chunk.length);
							currentLength += messageLength+8-chunk.length;
							break;
						}
						//console.log('debug',messageLength + " - Size MSG " + (chunk.length));
						//console.log(splittetMessage.toString('utf8'));
						if(splittetMessage.length+1 === chunk.length)
						{
							chunk = [];
						}
						else
							chunk = chunk.subarray(messageLength+8,chunk.length);
						//console.log('debug',chunk.length);
					}
					else
					{
						//console.log('debug', 'combine splitted message');
						if(currentLength<=chunk.length)
						{
							splittetMessage += chunk.subarray(0,currentLength);
							chunk = chunk.subarray(currentLength,chunk.length);
							currentLength = 0;
							//console.log('debug',splittetMessage);
						}
						else
						{
							console.log('debug','---------');
							console.log('error','error split second time');
						}

					}
					let splitChunk = splittetMessage.substring(8,splittetMessage.length).toString('utf8');
					this.processReceivedData(splitChunk);
					splittetMessage = '';
					
			}
			});
		}
	}
	destroy() {
		let self = this.instance;
		clearInterval(self.retry_interval);
		clearInterval(self.getSelectedTimelines);
		if (this.rebuild_timer) {
			clearTimeout(this.rebuild_timer);
			this.rebuild_timer = null;
		}
		if (this.cue_resync_timer) {
			clearTimeout(this.cue_resync_timer);
			this.cue_resync_timer = null;
		}
		if (this.socket) {
			this.socket.destroy();
			delete this.socket;
		}
	}
	generateCommand(id, method, params) {
		let self = this.instance;
		if (id == undefined || !method) {
			self.log('error', 'missing method or id in generate');
			return;
		}
		let command = {
			jsonrpc: '2.0',
			id: id,
			method: method,
		};
		if (params) {
			command.params = params;
		}
		return command;
	}
	send(id, method) {
		if (id == undefined || !method) {
			self.log('error', 'missing id,method or param in send');
			return;
		}
		this.sendParams(id, method, null);
	}
	sendParams(id, method, params) {
		let self = this.instance;
		if (id == undefined || !method) {
			self.log('error', 'missing id,method or param in sendParams');
			self.log('debug', id + ' - ' + method + ' - ' + params);
			return;
		}
		let msg = this.generateCommand(id, method, params);
		let sendBuffer = this.prependHeader(JSON.stringify(msg));
		if (sendBuffer) {
			this.sendBuffer(sendBuffer);
		}
	}
	prependHeader(body) {
		let self = this;
		var result = [];

		for (let i = 0; i < body.length; i++) {
			let hex = body.charCodeAt(i).toString(16);
			result = result.concat(this.roughScale(hex, 16));
		}

		var preHeader = [112, 120, 114, 49, body.length, 0, 0, 0];
		const buf = Buffer.from(preHeader.concat(result));
		return buf;
	}
	roughScale(x, base) {
		var parsed = parseInt(x, base);
		if (isNaN(parsed)) {
			return 0;
		}
		return parsed;
	}
	sendBuffer(cmd) {
		let self = this.instance;
		//enable this for debugging to see send out commands
		//self.log('debug', cmd.toString('utf8'));
		if (this.socket && this.socket.isConnected) {
			this.socket.send(cmd);
		} else {
			self.log('error', 'Pixera not connected. Can not send command');
		}
	}
	/*
	  Rebuilding actions, feedbacks, variable definitions and presets is expensive and every
	  timeline/cue reply would otherwise trigger a full rebuild. Coalesce them into one run.
	*/
	scheduleRebuild() {
		let self = this.instance;
		if (this.rebuild_timer) return;
		this.rebuild_timer = setTimeout(() => {
			this.rebuild_timer = null;
			try {
				cuesHelper.rebuildCueChoices(self);
				self.updateActions();
				self.initFeedbacks();
				if (variablesHelper.initDefinitions) {
					variablesHelper.initDefinitions(self);
				}
				if (self.updatePresets) {
					self.updatePresets();
				}
			} catch (e) {
				self.log('error', 'rebuild failed: ' + e.message);
			}
		}, 250);
	}
	initCues(timelineHandle) {
		this.sendParams(61, 'Pixera.Timelines.Timeline.getCues', {
			handle: timelineHandle,
		});
	}
	/*
	  Re-read the whole cue list of a timeline. Monitoring only tells us which cue handles
	  changed, not where they sit, so after any add/remove the order and the indices have to
	  come from Pixera again. Coalesced, because one edit usually touches several cues.
	*/
	scheduleCueResync(timelineHandle) {
		if (timelineHandle === null || timelineHandle === undefined) return;
		if (!this.pending_cue_resync) this.pending_cue_resync = new Set();
		this.pending_cue_resync.add(timelineHandle);
		if (this.cue_resync_timer) return;
		this.cue_resync_timer = setTimeout(() => {
			this.cue_resync_timer = null;
			const handles = Array.from(this.pending_cue_resync);
			this.pending_cue_resync.clear();
			for (const h of handles) {
				this.initCues(h);
			}
		}, 150);
	}
	//ask Pixera which timeline a cue belongs to, plus its attributes and time
	resolveCue(cueHandle) {
		this.sendParams(64, 'Pixera.Timelines.Cue.getTimeline', {
			handle: cueHandle,
		});
		this.requestCueDetails(cueHandle);
	}
	requestCueDetails(cueHandle) {
		this.sendParams(62, 'Pixera.Timelines.Cue.getAttributes', {
			handle: cueHandle,
		});
		this.sendParams(63, 'Pixera.Timelines.Cue.getTime', { handle: cueHandle });
	}
	poll() {
		let self = this.instance;
		this.send(10000, 'Pixera.Utility.pollMonitoring');
	}
	getSelectedTimeline() {
		let self = this.instance;
		this.send(10001, 'Pixera.Timelines.getTimelinesSelected');
	}
	retry() {
		let self = this.instance;
		this.poll();
	}
	initLiveSystems() {
		let self = this.instance;
		this.send(15, 'Pixera.LiveSystems.getLiveSystems');
	}
	initOutputs() {
		let self = this.instance;
		this.send(21, 'Pixera.LiveSystems.getLiveSystems');
	}
	initStudioCameras() {
		let self = this.instance;
		this.send(17, 'Pixera.Screens.getStudioCameras');
	}
	initProjectors() {
		let self = this.instance;
		this.send(19, 'Pixera.Projectors.getProjectors');
		this.send(20, 'Pixera.Projectors.getProjectorNames');
	}
	initResources() {
		let self = this.instance;
		this.send(35, 'Pixera.Resources.getResources');
	}
	initResourceFolders() {
		let self = this.instance;
		this.send(48, 'Pixera.Resources.getResourceFolders');
	} /*
  initTranscodingFolders(){
    let self = this.instance;
		this.send(51,'Pixera.Resources.getTranscodingFolders');
  }*/
	initTimelines() {
		let self = this.instance;
		this.send(11, 'Pixera.Timelines.getTimelines');
	}
	initVariables() {
		let self = this.instance;

		self.CHOICES_LIVESYSTEMNAME = [{ label: '', id: 0 }];
		self.CHOICES_LIVESYSTEMHANDLE = '';
		self.CHOICES_OUTPUTNAME = [{ label: '', id: 0 }];
		self.CHOICES_OUTPUTHANDLE = [];
		self.CHOICES_STUDIOCAMERANAME = [{ label: '', id: 0 }];
		self.CHOICES_STUDIOCAMERAHANDLE = [];
		self.CHOICES_PROJECTORNAME = [{ label: '', id: 0 }];
		self.CHOICES_PROJECTORHANDLE = [];
		self.CHOICES_RESOURCENAME = [{ label: '', id: 0 }];
		self.CHOICES_RESOURCEHANDLE = [];
		self.CHOICES_RESOURCEFOLDERNAME = [{ label: '', id: 0 }];
		self.CHOICES_RESOURCEFOLDERHANDLE = [];
		/*
    self.CHOICES_TRANSCODEFOLDERNAME = [{label: '',id:0}]
    */
		self.CHOICES_TIMELINENAME = [{ label: '', id: 0 }];
		self.CHOICES_TIMELINEHANDLE = [];
		self.CHOICES_TIMELINEFEEDBACK = [];
		self.CHOICES_SCREENNAME = [{ label: '', id: 0 }];
		self.CHOICES_SCREENHANDLE = [];
		self.CHOICES_CUENAME = [];
		self.CUES = {};
		self.CUESBYTIMELINE = {};
		self.CHOICES_FADELIST = [];
		self.SELECTEDTIMELINES = [];

		self.INDEX_LIVESYSTEM = 0;
		self.INDEX_STUDIOCAMERA = 0;
		self.INDEX_OUTPUT = 0;
		self.INDEX_RESOURCE = 0;
		self.INDEX_RESOURCEFOLDER = 0;
	}

	initScreens() {
		let self = this.instance;
		this.send(13, 'Pixera.Screens.getScreens');
		this.send(14, 'Pixera.Screens.getScreenNames');
	}
	processReceivedData(data) {
		let self = this.instance;
		try {
			let jsonData = JSON.parse(data);
			if (jsonData.id == undefined) {
				self.log('debug', 'id is missing in rec data: ' + data);
				return;
			}
			switch (jsonData.id) {
				case 0: //none
					break;

				case 1: //set version
					{
						let result = jsonData.result;
						self.VERSION = result;
					}
					break;

				case 11: //get timeline list
					{
						let result = jsonData.result;
						self.CHOICES_TIMELINEHANDLE = result;
						self.CHOICES_TIMELINEHANDLE.push(-1);
						for (let i = 0; i < result.length; i++) {
							//set feedback timeline array
							self.CHOICES_TIMELINEFEEDBACK.push({
								handle: result[i],
								timelineTransport: '0',
								timelinePositions: '0',
								timelineCountdowns: '0',
								name: '0',
								fps: '0',
								cueApplied: null,
								cueCurrent: null,
								cueNext: null,
								cuePrev: null,
							}); //set timeline variable for feedback
							//get attributes for each timeline
							this.sendParams(12, 'Pixera.Timelines.Timeline.getAttributes', {
								handle: result[i],
							});
						}
						self.updateActions();
					}
					break;
				case 12: //get timeline attributes
					{
						//self.log('debug', 'timeline infos: ' + data);

						let result = jsonData.result;
						let context = jsonData.context;
						let handle = context['handle'];
						for (var i = 0; i < self.CHOICES_TIMELINEHANDLE.length; i++) {
							if (self.CHOICES_TIMELINEHANDLE[i] == handle) {
								if (handle == -1) {
									self.CHOICES_TIMELINENAME.push({
										label: 'Selected Timeline',
										id: self.CHOICES_TIMELINEHANDLE[i],
									}); //set timeline name for dropdown menu
								}
								self.CHOICES_TIMELINENAME.push({
									label: result['name'],
									id: self.CHOICES_TIMELINEHANDLE[i],
								}); //set timeline name for dropdown menu
								break;
							}
						}
						for (var k = 0; k < self.CHOICES_TIMELINEFEEDBACK.length; k++) {
							if (self.CHOICES_TIMELINEFEEDBACK[k]['handle'] == handle) {
								self.CHOICES_TIMELINEFEEDBACK[k]['name'] = result['name'];
								self.CHOICES_TIMELINEFEEDBACK[k]['fps'] = result['fps'];
								self.CHOICES_TIMELINEFEEDBACK[k]['timelineTransport'] = result['mode'];
							}
						}
						//the cues of this timeline are loaded once, then kept in sync via monitoring
						if (handle != -1) {
							this.initCues(handle);
						}
						// names/fps have become available; rebuild actions, feedbacks,
						// variable definitions and presets (coalesced)
						this.scheduleRebuild();
					}
					break;
				case 13: //Pixera.Screens.getScreens
					{
						let result = jsonData.result;
						if (result != null) {
							self.CHOICES_SCREENHANDLE = result;
						}
						self.updateActions();
					}
					break;
				case 14: //Pixera.Screens.getScreenNames
					{
						let result = jsonData.result;
						if (result != null) {
							for (var i = 0; i < result.length; i++) {
								self.CHOICES_SCREENNAME.push({
									label: result[i],
									id: self.CHOICES_SCREENHANDLE[i],
								});
							}
						}
						self.updateActions();
					}
					break;
				case 15: //Pixera.LiveSystems.getLiveSystems
					{
						let result = jsonData.result;
						self.INDEX_LIVESYSTEM = 0;
						if (result != null) {
							self.CHOICES_LIVESYSTEMHANDLE = result;
							for (let i = 0; i < result.length; i++) {
								this.sendParams(16, 'Pixera.LiveSystems.LiveSystem.getName', {
									handle: result[i],
								});
							}
						}
						self.updateActions();
					}
					break;
				case 16: //Pixera.LiveSystems.LiveSystem.getName
					{
						let result = jsonData.result;
						if (result != null) {
							self.CHOICES_LIVESYSTEMNAME.push({
								label: result,
								id: self.CHOICES_LIVESYSTEMHANDLE[self.INDEX_LIVESYSTEM],
							});
							self.INDEX_LIVESYSTEM += 1;
						}
						self.updateActions();
					}
					break;
				case 17: //Pixera.Screens.getStudioCameras
					{
						let result = jsonData.result;
						self.INDEX_STUDIOCAMERA = 0;
						if (result != null) {
							self.CHOICES_STUDIOCAMERAHANDLE = result;
							for (let i = 0; i < result.length; i++) {
								this.sendParams(18, 'Pixera.Screens.StudioCamera.getName', {
									handle: result[i],
								});
							}
						}
						self.updateActions();
					}
					break;
				case 18: //Pixera.Screens.StudioCamera.getName
					{
						let result = jsonData.result;
						if (result != null) {
							self.CHOICES_STUDIOCAMERANAME.push({
								label: result,
								id: self.CHOICES_STUDIOCAMERAHANDLE[self.INDEX_STUDIOCAMERA],
							});
							self.INDEX_STUDIOCAMERA += 1;
						}
						self.updateActions();
					}
					break;
				case 19: //Pixera.Projectors.getProjectors
					{
						let result = jsonData.result;
						if (result != null) {
							self.CHOICES_PROJECTORHANDLE = result;
						}
						self.updateActions();
					}
					break;
				case 20: //Pixera.Projectors.getProjectorNames
					{
						let result = jsonData.result;
						if (result != null) {
							for (var i = 0; i < result.length; i++) {
								self.CHOICES_PROJECTORNAME.push({
									label: result[i],
									id: self.CHOICES_PROJECTORHANDLE[i],
								});
							}
						}
						self.updateActions();
					}
					break;
				case 21: //Pixera.LiveSystems.getLiveSystems
					{
						let result = jsonData.result;
						if (result != null) {
							for (let i = 0; i < result.length; i++) {
								this.sendParams(
									22,
									'Pixera.LiveSystems.LiveSystem.getEnabledOutputs',
									{ handle: result[i] }
								);
							}
						}
						self.updateActions();
					}
					break;
				case 22: //Pixera.LiveSystems.LiveSystem.getEnabledOutputs
					{
						let result = jsonData.result;
						self.INDEX_OUTPUT = 0;
						if (result != null) {
							for (let i = 0; i < result.length; i++) {
								self.CHOICES_OUTPUTHANDLE.push(result[i]);
								this.sendParams(23, 'Pixera.LiveSystems.Output.getName', {
									handle: result[i],
								});
							}
						}
						self.updateActions();
					}
					break;
				case 23: //Pixera.LiveSystems.Output.getName
					{
						let result = jsonData.result;
						if (result != null) {
							self.CHOICES_OUTPUTNAME.push({
								label: result,
								id: self.CHOICES_OUTPUTHANDLE[self.INDEX_OUTPUT],
							});
							self.INDEX_OUTPUT += 1;
						}
						self.updateActions();
					}
					break;
				case 24: //Pixera.LiveSystems.LiveSystem.getAudioMasterMute
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(
								0,
								'Pixera.LiveSystems.LiveSystem.setAudioMasterMute',
								{
									handle: self.LIVESYSTEM_SETAUDIOMASTER_MUTE_LIVESYSTEM,
									channel: self.LIVESYSTEM_SETAUDIOMASTER_MUTE_CHANNEL,
									state: !result,
								}
							);
						}
					}
					break;
				case 25: //Pixera.LiveSystems.Output.getActive
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(0, 'Pixera.LiveSystems.Output.setActive', {
								handle: self.OUTPUT_STATUS_OUTPUT,
								active: !result,
							});
						}
					}
					break;
				case 26: //Pixera.LiveSystems.Output.getIdentify
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(0, 'Pixera.LiveSystems.Output.setIdentify', {
								handle: self.OUTPUT_STATUS_OUTPUT,
								state: !result,
							});
						}
					}
					break;
				case 27: //Pixera.LiveSystems.Output.getIsOutputAggregate
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(
								0,
								'Pixera.LiveSystems.Output.setIsOutputAggregate',
								{ handle: self.OUTPUT_STATUS_OUTPUT, state: !result }
							);
						}
					}
					break;
				case 28: //Pixera.Screens.StudioCamera.getTrackingInputPause
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(
								0,
								'Pixera.Screens.StudioCamera.setTrackingInputPause',
								{
									handle: self.SCREEN_STUDIOCAMERA_TRACKING_STUDIOCAMERA,
									pause: !result,
								}
							);
						}
					}
					break;
				case 29: //Pixera.Screens.StudioCamera.getUsePositionPropertiesFromTracking
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(
								0,
								'Pixera.Screens.StudioCamera.setUsePositionPropertiesFromTracking',
								{
									handle: self.SCREEN_STUDIOCAMERA_TRACKING_STUDIOCAMERA,
									pause: !result,
								}
							);
						}
					}
					break;
				case 30: //Pixera.Screens.StudioCamera.getUseRotationPropertiesFromTracking
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(
								0,
								'Pixera.Screens.StudioCamera.setUseRotationPropertiesFromTracking',
								{
									handle: self.SCREEN_STUDIOCAMERA_TRACKING_STUDIOCAMERA,
									pause: !result,
								}
							);
						}
					}
					break;
				case 31: //Pixera.Projectors.Projector.getBlackout
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(0, 'Pixera.Projectors.Projector.setBlackout', {
								handle: self.PROJECTOR_BLACKOUT_PROJECTOR,
								isActive: !result,
							});
						}
					}
					break;
				case 32: //Pixera.Timelines.Timeline.createLayer
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(0, 'Pixera.Timelines.Layer.setName', {
								handle: result,
								name: self.CREATE_LAYER_NAME,
							});
						}
					}
					break;
				case 33: //Pixera.Timelines.Timeline.CueHandle -> Pixera.Timelines.Cue.blendToThis
					{
						let result = jsonData.result;
						let context = jsonData.context;
						let handleTimeline = context['handle'];
						let fps = 60;
						if (result != null) {
							for (let k = 0; k < self.CHOICES_TIMELINEFEEDBACK.length; k++) {
								if (
									self.CHOICES_TIMELINEFEEDBACK[k]['handle'] ==
										handleTimeline &&
									self.CHOICES_TIMELINEFEEDBACK[k]['fps'] != 0
								) {
									fps = self.CHOICES_TIMELINEFEEDBACK[k]['fps'];
									break;
								}
							}
							let time = self.CHOICES_BLENDNAME_FRAMES / fps;
							/*this.sendParams(0,'Pixera.Timelines.Cue.blendToThis',{'handle':result,'blendDurationInSeconds':time});*/
							this.sendParams(0, 'Pixera.Timelines.Cue.blendToThis', {
								handle: result,
								blendDuration: time,
							});
						}
					}
					break;
				case 34: //Pixera.Timelines.Timeline.getCurrentTime
					{
						let result = jsonData.result;
						if (result != null) {
							let name = self.TIMELINE_CREATE_CUE_NAME;
							let operation = self.TIMELINE_CREATE_CUE_CUEOPERATION;

							this.sendParams(0, 'Pixera.Timelines.Timeline.createCue', {
								handle: jsonData.context.handle,
								name: name,
								timeInFrames: result,
								operation: operation,
							});
						}
					}
					break;
				case 35: //Pixera.Resources.getResources
					{
						let result = jsonData.result;
						self.INDEX_RESOURCE = 0;
						if (result != null) {
							for (let i = 0; i < result.length; i++) {
								self.CHOICES_RESOURCEHANDLE.push(result[i]);
								this.sendParams(36, 'Pixera.Resources.Resource.getName', {
									handle: result[i],
								});
							}
						}
						self.updateActions();
					}
					break;
				case 36: //Pixera.Resources.Resource.getName()
					{
						let result = jsonData.result;
						if (result != null) {
							self.CHOICES_RESOURCENAME.push({
								label: result,
								id: self.CHOICES_RESOURCEHANDLE[self.INDEX_RESOURCE],
							});
							self.INDEX_RESOURCE += 1;
						}
						self.updateActions();
					}
					break;
				case 37: //Pixera.Resources.Resource.getUseGradient
					{
						let result = jsonData.result;
						if (result != null) {
							self.log('warn', 'Result: ' + result);
							this.sendParams(0, 'Pixera.Resources.Resource.setUseGradient', {
								handle: self.RESOURCE_SETTINGS_COLOR_RESOURCE,
								useGradient: !result,
							});
						}
					}
					break;
				case 39: //Pixera.Timelines.Layer.getInst -> Pixera.Timelines.Layer.muteLayer
				case 40: //Pixera.Timelines.Layer.getInst -> Pixera.Timelines.Layer.unMuteLayer
				case 41: //Pixera.Timelines.Layer.getInst -> Pixera.Timelines.Layer.muteAudio
				case 42: //Pixera.Timelines.Layer.getInst -> Pixera.Timelines.Layer.unMuteAudio
					{
						let result = jsonData.result;
						let muteMethod = 'Pixera.Timelines.Layer.muteLayer';
						if (jsonData.id == 40) {
							muteMethod = 'Pixera.Timelines.Layer.unMuteLayer';
						} else if (jsonData.id == 41) {
							muteMethod = 'Pixera.Timelines.Layer.muteAudio';
						} else if (jsonData.id == 42) {
							muteMethod = 'Pixera.Timelines.Layer.unMuteAudio';
						}
						this.sendParams(0, muteMethod, { handle: result });
					}
					break;
				case 43: //Pixera.Timelines.Layer.getInst -> Pixera.Timelines.Layer.resetLayer
					{
						let result = jsonData.result;
						if (result != null) {
							this.sendParams(0, 'Pixera.Timelines.Layer.resetLayer', {
								handle: result,
							});
						}
					}
					break;
				case 44: //Pixera.Timelines.Layer.getInst
				case 45: //Pixera.Timelines.Layer.getInst
					{
						self.MUTE_TOGGLE_LAYER = jsonData.result;
						if (jsonData.id == 45) {
							this.sendParams(47, 'Pixera.Timelines.Layer.getIsAudioMuted', {
								handle: self.MUTE_TOGGLE_LAYER,
							});
						} else {
							this.sendParams(46, 'Pixera.Timelines.Layer.getIsLayerMuted', {
								handle: self.MUTE_TOGGLE_LAYER,
							});
						}
					}
					break;
				case 46: //Pixera.Timelines.Layer.getIsLayerMuted
				case 47: //Pixera.Timelines.Layer.getIsAudioMuted
					{
						let result = jsonData.result;
						if (result == true) {
							if (jsonData.id == 46) {
								this.sendParams(0, 'Pixera.Timelines.Layer.unMuteLayer', {
									handle: self.MUTE_TOGGLE_LAYER,
								});
							} else {
								this.sendParams(0, 'Pixera.Timelines.Layer.unMuteAudio', {
									handle: self.MUTE_TOGGLE_LAYER,
								});
							}
						} else {
							if (jsonData.id == 46) {
								this.sendParams(0, 'Pixera.Timelines.Layer.muteLayer', {
									handle: self.MUTE_TOGGLE_LAYER,
								});
							} else {
								this.sendParams(0, 'Pixera.Timelines.Layer.muteAudio', {
									handle: self.MUTE_TOGGLE_LAYER,
								});
							}
						}
					}
					break;
				case 48: //Pixera.Resources.getResourceFolders
					{
						let result = jsonData.result;
						self.INDEX_RESOURCEFOLDER = 0;
						if (result != null) {
							for (let i = 0; i < result.length; i++) {
								this.sendParams(
									49,
									'Pixera.Resources.ResourceFolder.getResourceFolders',
									{ handle: result[i] }
								);
							}
						}
						self.updateActions();
					}
					break;
				case 49: //Pixera.Resources.ResourceFolder.getResourceFolders
					{
						let result = jsonData.result;
						self.INDEX_RESOURCEFOLDER = 0;
						if (result != null) {
							for (let i = 0; i < result.length; i++) {
								self.CHOICES_RESOURCEFOLDERHANDLE.push(result[i]);
								this.sendParams(50, 'Pixera.Resources.ResourceFolder.getName', {
									handle: result[i],
								});
							}
						}
						self.updateActions();
					}
					break;
				case 50: //Pixera.Resources.ResourceFolder.getName()
					{
						let result = jsonData.result;
						if (result != null) {
							self.CHOICES_RESOURCEFOLDERNAME.push({
								label: result,
								id: self.CHOICES_RESOURCEFOLDERHANDLE[
									self.INDEX_RESOURCEFOLDER
								],
							});
							self.INDEX_RESOURCEFOLDER += 1;
						}
						self.updateActions();
					}
					break;
					//---------resources start ----------
				case 51:
					this.sendParams(0, 'Pixera.Resources.Resource.removeThis', {
						handle: parseInt(jsonData.result),
					});
					break;
				case 52:
					this.sendParams(
						0,
						'Pixera.Resources.Resource.removeThisIncludingAssets',
						{ handle: parseInt(jsonData.result) }
					);
					break;
				case 53:
					this.sendParams(
						0,
						'Pixera.Resources.Resource.deleteFilesOnSystems',
						{ handle: parseInt(jsonData.result) }
					);
					break;
				case 54:
					this.sendParams(
						0,
						'Pixera.Resources.Resource.deleteAssetFromLiveSystem',
						{
							handle: parseInt(jsonData.result),
							apEntityLiveSystemHandle: self.RESOURCEREMOVE_LIVESYSTEM,
						}
					);
					break;
				case 55:
					this.sendParams(0, 'Pixera.Resources.Resource.replace', {
						handle: parseInt(jsonData.result),
						path: self.RESOURCE_REPLACE,
					});
					break;
				case 56:
					this.sendParams(0, 'Pixera.Resources.Resource.refresh', {
						handle: parseInt(jsonData.result),
						text: '',
					});
					break;
				case 58:
					this.sendParams(
						0,
						'Pixera.Resources.Resource.resetDistributionTargets',
						{ handle: parseInt(jsonData.result) }
					);
					break;
				case 59:
					this.sendParams(
						0,
						'Pixera.Resources.Resource.changeDistributionTarget',
						{
							handle: parseInt(jsonData.result),
							apEntityLiveSystemHandle: self.RESOURCECHANGEDIST[0],
							shouldDistribute: self.RESOURCECHANGEDIST[1],
						}
					);
					break;
				case 60:
					this.sendParams(0, 'Pixera.Resources.Resource.distribute', {
						handle: parseInt(jsonData.result),
					});
					break;

					//---------cues start ----------
				case 61: //Pixera.Timelines.Timeline.getCues
					{
						let result = jsonData.result;
						let timelineHandle = jsonData.context
							? jsonData.context['handle']
							: null;
						if (result != null && timelineHandle != null) {
							//authoritative list: adds new cues, fixes the order, drops deleted ones
							const unresolved = cuesHelper.syncTimelineCues(
								self,
								timelineHandle,
								result
							);
							for (const cueHandle of unresolved) {
								this.requestCueDetails(cueHandle);
							}
							cuesHelper.recomputePointers(self);
							this.scheduleRebuild();
						}
					}
					break;
				case 62: //Pixera.Timelines.Cue.getAttributes
					{
						let result = jsonData.result;
						let cueHandle = jsonData.context
							? jsonData.context['handle']
							: null;
						if (result != null && cueHandle != null) {
							cuesHelper.upsertCue(self, cueHandle, {
								name: result['name'],
								index: result['index'],
								operation: result['operation'],
								number: result['number'],
								numberFormatted: result['numberFormatted'],
								waitDuration: result['waitDuration'],
								note: result['note'],
							});
							this.scheduleRebuild();
						}
					}
					break;
				case 63: //Pixera.Timelines.Cue.getTime
					{
						let result = jsonData.result;
						let cueHandle = jsonData.context
							? jsonData.context['handle']
							: null;
						if (result != null && cueHandle != null) {
							cuesHelper.upsertCue(self, cueHandle, { time: result });
							cuesHelper.recomputePointers(self);
							this.scheduleRebuild();
						}
					}
					break;
				case 64: //Pixera.Timelines.Cue.getTimeline
					{
						let result = jsonData.result;
						let cueHandle = jsonData.context
							? jsonData.context['handle']
							: null;
						if (result != null && cueHandle != null) {
							cuesHelper.upsertCue(self, cueHandle, {
								timelineHandle: result,
							});
							//re-read the timeline's cue list so order and indices are correct again
							this.scheduleCueResync(result);
							cuesHelper.recomputePointers(self);
							this.scheduleRebuild();
						}
					}
					break;
				case 65: //Pixera.Utility.subscribeMonitoringSubject
					{
						if (jsonData.result === false) {
							self.log(
								'warn',
								'Pixera refused a monitoring subscription: ' +
									JSON.stringify(jsonData.context)
							);
						}
					}
					break;
					//---------cues end ----------


				/*
        case 51: //Pixera.Resources.getTranscodingFolders
        {
          let result = jsonData.result;
          if(result != null){
            for(let i = 0; i < result.length; i++){
              self.CHOICES_TRANSCODEFOLDERNAME.push({label: "TanscodingFolder " + (i + 1), id:result[i]});
            }
          }
          self.updateActions();
        }
        break;
        */

				case 9999: //API
					{
						var result = jsonData.result;
						if (result != null) {
							self.log('info', result);
						}
					}
					break;
				case 10000: //monitoring
					{
						var result = jsonData.result;
						if (result != null) {
							for (var c = 0; c < result.length; c++) {
								if (result[c]['name'] == 'timelineTransport') {
									//transport change
									var timelineTransport = result[c]['entries'];
									for (var b = 0; b < timelineTransport.length; b++) {
										for (
											var t = 0;
											t < self.CHOICES_TIMELINEFEEDBACK.length;
											t++
										) {
											if (
												timelineTransport[b]['handle'] ==
												self.CHOICES_TIMELINEFEEDBACK[t]['handle']
											) {
												self.CHOICES_TIMELINEFEEDBACK[t]['timelineTransport'] =
													timelineTransport[b]['value'];
												self.checkFeedbacks('timeline_state');
												//self.log('debug', 'transport:',self.CHOICES_TIMELINEFEEDBACK);
											}
										}
									}
								} else if (result[c]['name'] == 'timelinePositions') {
									//timeline time
									var timelinePositions = result[c]['entries'];
									for (var b = 0; b < timelinePositions.length; b++) {
										for (
											var t = 0;
											t < self.CHOICES_TIMELINEFEEDBACK.length;
											t++
										) {
											if (
												timelinePositions[b]['handle'] ==
												self.CHOICES_TIMELINEFEEDBACK[t]['handle']
											) {
												self.CHOICES_TIMELINEFEEDBACK[t]['timelinePositions'] =
													timelinePositions[b]['value'];
												self.checkFeedbacks('timeline_positions');
												//self.log('debug', 'positions:',self.CHOICES_TIMELINEFEEDBACK);
											}
										}
									}
								} else if (result[c]['name'] == 'timelineCountdowns') {
									//timeline remain
									var timelineCountdowns = result[c]['entries'];
									for (var b = 0; b < timelineCountdowns.length; b++) {
										for (
											var t = 0;
											t < self.CHOICES_TIMELINEFEEDBACK.length;
											t++
										) {
											if (
												timelineCountdowns[b]['handle'] ==
												self.CHOICES_TIMELINEFEEDBACK[t]['handle']
											) {
												self.CHOICES_TIMELINEFEEDBACK[t]['timelineCountdowns'] =
													timelineCountdowns[b]['value'];
												//flag 1 = counting down to the next cue, 2 = cue wait duration
												self.CHOICES_TIMELINEFEEDBACK[t]['countdownFlag'] =
													timelineCountdowns[b]['flag'];
												self.checkFeedbacks('timeline_countdowns');
												//self.log('debug', 'countdowns:',self.CHOICES_TIMELINEFEEDBACK);
											}
										}
									}
								} else if (result[c]['name'] == 'timelineAdded') {
									for (var b = 0; b < result[c]['entries'].length; b++) {
										var addedHandles = result[c]['entries'][b]['handles'] || [];
										for (var h = 0; h < addedHandles.length; h++) {
											var newHandle = addedHandles[h];
											if (self.CHOICES_TIMELINEFEEDBACK.some(t => t.handle === newHandle)) continue;
											var sentinelIdx = self.CHOICES_TIMELINEHANDLE.indexOf(-1);
											if (sentinelIdx !== -1) {
												self.CHOICES_TIMELINEHANDLE.splice(sentinelIdx, 0, newHandle);
											} else {
												self.CHOICES_TIMELINEHANDLE.push(newHandle);
											}
											self.CHOICES_TIMELINEFEEDBACK.push({
												handle: newHandle,
												timelineTransport: '0',
												timelinePositions: '0',
												timelineCountdowns: '0',
												name: '0',
												fps: '0',
												cueApplied: null,
												cueCurrent: null,
												cueNext: null,
												cuePrev: null,
											});
											this.sendParams(12, 'Pixera.Timelines.Timeline.getAttributes', { handle: newHandle });
										}
									}
									this.scheduleRebuild();
								} else if (result[c]['name'] == 'timelineRemoved') {
									for (var b = 0; b < result[c]['entries'].length; b++) {
										var removedHandles = result[c]['entries'][b]['handles'] || [];
										for (var h = 0; h < removedHandles.length; h++) {
											var removedHandle = removedHandles[h];
											self.CHOICES_TIMELINEHANDLE = self.CHOICES_TIMELINEHANDLE.filter(h => h !== removedHandle);
											self.CHOICES_TIMELINEFEEDBACK = self.CHOICES_TIMELINEFEEDBACK.filter(t => t.handle !== removedHandle);
											self.CHOICES_TIMELINENAME = self.CHOICES_TIMELINENAME.filter(t => t.id !== removedHandle);
											if (self.SELECTEDTIMELINEFEEDBACK && self.SELECTEDTIMELINEFEEDBACK.handle === removedHandle) {
												self.SELECTEDTIMELINEFEEDBACK = null;
											}
											cuesHelper.removeCuesOfTimeline(self, removedHandle);
										}
									}
									this.scheduleRebuild();
								} else if (result[c]['name'] == 'timelineRenamed') {
									for (var b = 0; b < result[c]['entries'].length; b++) {
										var namePre  = result[c]['entries'][b]['namePre'];
										var namePost = result[c]['entries'][b]['namePost'];
										// Update name in-place by matching the old name
										var tlEntry = self.CHOICES_TIMELINEFEEDBACK.find(t => t.name === namePre);
										if (tlEntry) {
											tlEntry.name = namePost;
											// Also update the CHOICES_TIMELINENAME label
											var nameEntry = (self.CHOICES_TIMELINENAME || []).find(t => t.label === namePre);
											if (nameEntry) nameEntry.label = namePost;
										}
									}
									// Rebuild so display names in actions, variable defs and presets reflect new name
									this.scheduleRebuild();
								} else if (result[c]['name'] == 'cueAdded') {
									for (var b = 0; b < result[c]['entries'].length; b++) {
										var addedCues = result[c]['entries'][b]['handles'] || [];
										self.log('debug', 'monitoring cueAdded: ' + addedCues.join(','));
										for (var h = 0; h < addedCues.length; h++) {
											//the owning timeline is unknown for a new cue
											this.resolveCue(addedCues[h]);
										}
									}
								} else if (result[c]['name'] == 'cueChanged') {
									for (var b = 0; b < result[c]['entries'].length; b++) {
										var changedCues = result[c]['entries'][b]['handles'] || [];
										self.log('debug', 'monitoring cueChanged: ' + changedCues.join(','));
										for (var h = 0; h < changedCues.length; h++) {
											var changedCue = self.CUES ? self.CUES[changedCues[h]] : undefined;
											if (!changedCue || changedCue.timelineHandle === null || changedCue.timelineHandle === undefined) {
												//Pixera also reports brand new cues here - resolve their timeline first
												this.resolveCue(changedCues[h]);
											} else {
												//name, number and time may all have changed
												this.requestCueDetails(changedCues[h]);
												this.scheduleCueResync(changedCue.timelineHandle);
											}
										}
									}
								} else if (result[c]['name'] == 'cueRemoved') {
									for (var b = 0; b < result[c]['entries'].length; b++) {
										var removedCues = result[c]['entries'][b]['handles'] || [];
										self.log('debug', 'monitoring cueRemoved: ' + removedCues.join(','));
										for (var h = 0; h < removedCues.length; h++) {
											var goneCue = self.CUES ? self.CUES[removedCues[h]] : undefined;
											//remember the timeline before dropping the record, then re-read its list
											if (goneCue) this.scheduleCueResync(goneCue.timelineHandle);
											cuesHelper.removeCue(self, removedCues[h]);
										}
									}
									cuesHelper.recomputePointers(self);
									this.scheduleRebuild();
								} else if (result[c]['name'] == 'cueApplied') {
									for (var b = 0; b < result[c]['entries'].length; b++) {
										var appliedCues = result[c]['entries'][b]['handles'] || [];
										for (var h = 0; h < appliedCues.length; h++) {
											var appliedHandle = appliedCues[h];
											var appliedCue = self.CUES ? self.CUES[appliedHandle] : undefined;
											if (!appliedCue || appliedCue.timelineHandle === null || appliedCue.timelineHandle === undefined) {
												//unknown cue - resolve it, it will be picked up on the next apply
												this.resolveCue(appliedHandle);
												continue;
											}
											var appliedTl = self.CHOICES_TIMELINEFEEDBACK.find(t => t.handle === appliedCue.timelineHandle);
											if (appliedTl) appliedTl.cueApplied = appliedHandle;
										}
									}
								}
							}

							// After processing monitoring entries, refresh cue pointers and variables
							cuesHelper.recomputePointers(self);
							self.checkFeedbacks('cue_is_current');
							self.checkFeedbacks('cue_is_next');

							if (variablesHelper.updateVariables) {
								variablesHelper.updateVariables(self);
							}
						}
					}
					break;
				case 10001:
					{
						var result = jsonData.result;
						if (result != null) {
							//the 'Selected Timeline' cue lists follow the selection, so rebuild on change
							var selectionChanged =
								(self.SELECTEDTIMELINES || []).join(',') !== result.join(',');
							self.SELECTEDTIMELINES = result;
							if (selectionChanged) {
								this.scheduleRebuild();
							}

							
							// Direct reference to the selected timeline's CHOICES_TIMELINEFEEDBACK entry.
							// Live values are kept up to date by case 10000 – no copying needed. null if nothing selected.
							self.SELECTEDTIMELINEFEEDBACK = self.SELECTEDTIMELINES.length > 0
								? self.CHOICES_TIMELINEFEEDBACK.find(t => t.handle === self.SELECTEDTIMELINES[0]) || null
								: null

							// Update only the selected-timeline variables (full updateVariables runs in case 10000)
							if (variablesHelper.updateSelectedVariables) {
								variablesHelper.updateSelectedVariables(self)
							}
							self.checkFeedbacks('timeline_state_selected')
							self.checkFeedbacks('timeline_positions_selected')
							self.checkFeedbacks('timeline_countdowns_selected')
							self.checkFeedbacks('timeline_selected')
						}
					}
					break;
			}
		} catch {
			self.log('error', 'error in rec data');
			self.log('error', data);
		}
	}
}

module.exports = Pixera;
