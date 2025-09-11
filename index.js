const { InstanceBase, InstanceStatus, runEntrypoint, TCPHelper } = require('@companion-module/base')

const Pixera = require('./src/Pixera')
const config = require('./src/config')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')

class PixeraInstance extends InstanceBase {
		constructor(internal) {
			super(internal)
			let self = this

			Object.assign(self,{
				...config,
				...actions,
				...feedbacks,
				...variables,
			})
		}

	async init(config) {
		let self = this;
		//action variables
		self.CHOICES_LIVESYSTEMNAME = [{label: '',id:0}]
		self.CHOICES_LIVESYSTEMHANDLE = '';
		self.CHOICES_OUTPUTNAME = [{label: '',id:0}]
		self.CHOICES_OUTPUTHANDLE = [];
		self.CHOICES_STUDIOCAMERANAME = [{label: '',id:0}];
		self.CHOICES_STUDIOCAMERAHANDLE = [];
		self.CHOICES_PROJECTORNAME = [{label: '',id:0}];
		self.CHOICES_PROJECTORHANDLE = [];
		self.CHOICES_RESOURCENAME = [{label: '',id:0}]
		self.CHOICES_RESOURCEHANDLE = [];
		self.CHOICES_RESOURCEFOLDERNAME = [{label: '',id:0}]
		self.CHOICES_RESOURCEFOLDERHANDLE = [];
		/*
		self.CHOICES_TRANSCODEFOLDERNAME = [{label: '',id:0}]
		*/
		self.CHOICES_TIMELINENAME = [{label: '',id:0}];
		self.CHOICES_TIMELINEHANDLE = [];
		self.CHOICES_TIMELINEFEEDBACK = [];
		self.CHOICES_SCREENNAME = [{label: '',id:0}];
		self.CHOICES_SCREENHANDLE = [];
		self.CHOICES_CUENAME = [];
		self.CHOICES_CUEHANDLE = [];
		self.CHOICES_FADELIST = [];

		self.INDEX_LIVESYSTEM = 0;
		self.INDEX_STUDIOCAMERA = 0;
		self.INDEX_OUTPUT = 0;
		self.INDEX_RESOURCE = 0;
		self.INDEX_RESOURCEFOLDER = 0;

		await self.configUpdated(config);
	}

	async configUpdated(config) {
		let self = this;
		//self.log('debug', 'update config');
		if(self.pixera){
			self.pixera.destroy();
		}

		if(config){
			self.config = config;
		}
		if(this.config.host && self.config.port){
			self.pixera = new Pixera(self,self.config);
			// Update the actions
			self.updateActions();
			self.updateStatus(InstanceStatus.Ok);
		}
		else{
			self.updateStatus(InstanceStatus.BadConfig,'Missing required values.');
		}
	}
}
runEntrypoint(PixeraInstance, [])
