const tcp          = require('../../tcp');
const instanceSkel = require('../../instance_skel');
let debug, log;

const feedbacks = require('./feedbacks');

const PDS_VARIANT_701 = 1;
const PDS_VARIANT_901 = 2;
const PDS_VARIANT_902 = 3;

/**
 * Companion instance class for the Epiphan Pearl.
 *
 * @extends instanceSkel
 * @version 1.2.0
 * @since 1.2.0
 * @author Marc Hagen <hello@marchagen.nl>
 */
class BarcoPDS extends instanceSkel {

	/**
	 * Create an instance of a BarcoPDS module.
	 *
	 * @access public
	 * @since 1.2.0
	 * @param {EventEmitter} system - the brains of the operation
	 * @param {string} id - the instance ID
	 * @param {Object} config - saved user configuration parameters
	 */
	constructor(system, id, config) {
		super(system, id, config);

		this.firmwareVersion = '0';

		this.states          = {};
		this.refreshInterval = null;

		Object.assign(this, {
			//...actions,
			...feedbacks,
			//...presets,
			//...variables
		});
	}

	/**
	 * Setup the actions.
	 *
	 * @access public
	 * @since 1.2.0
	 * @param {EventEmitter} system - the brains of the operation
	 */
	actions(system = null) {
		const inputOption = {
			type: 'dropdown',
			label: 'Input',
			id: 'i',
			default: 1,
			choices: this.CHOICES_INPUTS
		};

		this.setActions({
			'TAKE': {
				label: 'Take'
			},
			'ISEL': {
				label: 'Select Input',
				options: [
					inputOption,
					{
						type: 'textinput',
						label: 'Filenumber (optional)',
						id: 'f',
						regex: '/^([1-9]|[1-5][0-9]|6[0-4])$/'
					}
				]
			},
			'FREEZE': {
				label: 'Freeze',
				options: [{
					type: 'dropdown',
					label: 'Freeze',
					id: 'm',
					default: 1,
					choices: [{id: 0, label: 'unfrozen'}, {id: 1, label: 'frozen'}]
				}]
			},
			'BLACK': {
				label: 'Set Black Output',
				options: [{
					type: 'dropdown',
					label: 'Mode',
					id: 'm',
					default: 1,
					choices: [{id: 0, label: 'normal'}, {id: 1, label: 'black'}]
				}]
			},
			'OTPM': {
				label: 'Set Testpattern on/off',
				options: [
					{
						type: 'dropdown',
						label: 'Output',
						id: 'o',
						default: 1,
						choices: [{id: 1, label: 'Program'}, {id: 3, label: 'Preview'}]
					},
					{
						type: 'dropdown',
						label: 'Testpattern',
						id: 'm',
						default: 1,
						choices: [{id: 0, label: 'off'}, {id: 1, label: 'on'}]
					}
				]
			},
			'OTPT': {
				label: 'Set Testpattern Type',
				options: [
					{
						type: 'dropdown',
						label: 'Output',
						id: 'o',
						default: 1,
						choices: [{id: 1, label: 'Program'}, {id: 3, label: 'Preview'}]
					},
					{
						type: 'dropdown',
						label: 'Type',
						id: 't',
						default: 4,
						choices: [
							{id: 4, label: '16x16 Grid'},
							{id: 5, label: '32x32 Grid'},
							{id: 1, label: 'H Ramp'},
							{id: 2, label: 'V Ramp'},
							{id: 6, label: 'Burst'},
							{id: 7, label: '75% Color Bars'},
							{id: 3, label: '100% Color Bars'},
							{id: 9, label: 'Vertical Gray Steps'},
							{id: 10, label: 'Horizontal Gray Steps'},
							{id: 8, label: '50% Gray'},
							{id: 11, label: 'White'},
							{id: 12, label: 'Black'},
							{id: 13, label: 'Red'},
							{id: 14, label: 'Green'},
							{id: 15, label: 'Blue'}
						]
					}
				]
			},
			'ORBM': {
				label: 'Set Rasterbox on/off',
				options: [
					{
						type: 'dropdown',
						label: 'Output',
						id: 'o',
						default: 1,
						choices: [{id: 1, label: 'Program'}, {id: 3, label: 'Preview'}]
					}, {
						type: 'dropdown',
						label: 'Rasterbox',
						id: 'm',
						default: 1,
						choices: [{id: 0, label: 'off'}, {id: 1, label: 'on'}]
					}
				]
			},
			'TRNTIME': {
				label: 'Set Transition Time',
				options: [{
					type: 'textinput',
					label: 'Seconds',
					id: 's',
					default: '1.0',
					regex: '/^([0-9]|1[0-2])(\\.\\d)?$/'
				}]
			},
			'LOGOSEL': {
				label: 'Select Black/Logo',
				options: [{
					type: 'dropdown',
					label: 'Framestore',
					id: 'l',
					default: 1,
					choices: this.CHOICES_LOGOS
				}]
			},
			'LOGOSAVE': {
				label: 'Save Logo',
				options: [{
					type: 'dropdown',
					label: 'Framestore',
					id: 'l',
					default: 1,
					choices: [
						{id: 1, label: 'Logo 1'},
						{id: 2, label: 'Logo 2'},
						{id: 3, label: 'Logo 3'}
					]
				}]
			},
			'AUTOTAKE': {
				label: 'Set Autotake Mode on/off',
				options: [{
					type: 'dropdown',
					label: 'Autotake',
					id: 'm',
					default: 0,
					choices: [{id: 0, label: 'off'}, {id: 1, label: 'on'}]
				}]
			},
			'PENDPIP': {
				label: 'Pend PiP Mode on/off',
				options: [
					{
						type: 'dropdown',
						label: 'PiP',
						id: 'p',
						default: 1,
						choices: [{id: 1, label: '1'}, {id: 2, label: '2'}]
					}, {
						type: 'dropdown',
						label: 'PiP on/off',
						id: 'm',
						default: 0,
						choices: [{id: 0, label: 'unpend (no change on Take)'}, {
							id: 1,
							label: 'pend (PiP on/off on Take)'
						}]
					}
				]
			},
			'PIPISEL': {
				label: 'Pend PiP Input',
				options: [
					{
						type: 'dropdown',
						label: 'PiP',
						id: 'p',
						default: 1,
						choices: [{id: 0, label: 'All'}, {id: 1, label: '1'}, {id: 2, label: '2'}]
					},
					inputOption
				]
			},
			'PIPREC': {
				label: 'PiP Recall',
				options: [
					{
						type: 'dropdown',
						label: 'PiP',
						id: 'p',
						default: 1,
						choices: [{id: 1, label: '1'}, {id: 2, label: '2'}]
					},
					{
						type: 'dropdown',
						label: 'Input',
						id: 'f',
						default: 1,
						choices: this.CHOICES_PIPRECALL
					}
				]
			},
			'PIPFULL': {
				label: 'PiP Fullscreen',
				options: [
					{
						type: 'dropdown',
						label: 'PiP',
						id: 'p',
						default: 1,
						choices: [{id: 1, label: '1'}, {id: 2, label: '2'}]
					}
				]
			},
			'PIPUNIT': {
				label: 'PiP Unit mode',
				options: [
					{
						type: 'dropdown',
						label: 'Mode',
						id: 'm',
						default: 0,
						choices: [{id: 0, label: 'Percentage'}, {id: 1, label: 'Pixel'}]
					}
				]
			},
			'PIPPOS': {
				label: 'Position',
				options: [
					{
						type: 'dropdown',
						label: 'PiP',
						id: 'p',
						default: 1,
						choices: [{id: 1, label: '1'}, {id: 2, label: '2'}]
					},
					{
						type: 'textinput',
						label: 'Horizontal offset from center',
						id: 'hpos',
						default: 0,
						regex: this.REGEX_NUMBER
					},
					{
						type: 'textinput',
						label: 'Vertical offset from center',
						id: 'vpos',
						default: 0,
						regex: this.REGEX_NUMBER
					}
				]
			},
			'PIPPOS': {
				label: 'PiP Size',
				options: [
					{
						type: 'dropdown',
						label: 'PiP',
						id: 'p',
						default: 1,
						choices: [{id: 1, label: '1'}, {id: 2, label: '2'}]
					},
					{
						type: 'textinput',
						label: 'Horizontal size',
						id: 'hsize',
						default: 0,
						regex: this.REGEX_NUMBER
					},
					{
						type: 'textinput',
						label: 'Vertical size',
						id: 'vsize',
						default: 0,
						regex: this.REGEX_NUMBER
					}
				]
			},
			'RBACKGND': {
				label: 'PiP Background color',
				options: [
					{
						type: 'textinput',
						label: 'Red',
						id: 'r',
						default: 0,
						regex: '/^\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b$/'
					},
					{
						type: 'textinput',
						label: 'Green',
						id: 'g',
						default: 0,
						regex: '/^\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b$/'
					},
					{
						type: 'textinput',
						label: 'Blue',
						id: 'b',
						default: 0,
						regex: '/^\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b$/'
					}
				]
			}
		});
	}

	/**
	 * Executes the provided action.
	 *
	 * @access public
	 * @since 1.2.0
	 * @param {Object} action - the action to be executed
	 * @param {Object} deviceInfo - information from where the button was pressed...
	 */
	action(action, deviceInfo) {
		if (!this._isConnected) {
			return;
		}

		let cmd = action.action;
		switch (cmd) {
			case 'PIPPOS':
				cmd = 'PIPHPOS -p ' + action.options.p + ' -o ' + action.options.hpos + '\r';
				cmd += 'PIPVPOS -p ' + action.options.p + ' -o ' + action.options.vpos + '\r';
				break;
			case 'PIPSIZE':
				cmd = 'PIPHSIZE -p ' + action.options.p + ' -w ' + action.options.hsize + '\r';
				cmd += 'PIPVSIZE -p ' + action.options.p + ' -h ' + action.options.vsize + '\r';
				break;
			case 'RBACKGND':
				cmd = 'RBACKGND -r ' + action.options.r + ' -g ' + action.options.g + ' -b ' + action.options.b + '\r';

				break;
			default:
				for (let option in action.options) {
					if (action.options.hasOwnProperty(option) && action.options[option] !== '') {
						cmd += ' -' + option + ' ' + action.options[option];
					}
				}
				cmd += '\r';
				break;
		}

		// Add FPUPDATE to freeze command
		if (action.action === 'FREEZE') {
			cmd += 'FPUPDATE\r';
		}

		debug('sending tcp', cmd, 'to', this.config.host);
		this.socket.send(cmd);
	}

	/**
	 * Creates the configuration fields for web config.
	 *
	 * @access public
	 * @since 1.2.0
	 * @returns {Array} the config fields
	 */
	config_fields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'IP-Adress of PDS',
				width: 6,
				default: '192.168.0.10',
				regex: this.REGEX_IP
			},
			{
				type: 'dropdown',
				label: 'Variant',
				id: 'variant',
				default: 1,
				choices: this.PDS_VARIANT
			}
		];
	}

	/**
	 * Clean up the instance before it is destroyed.
	 *
	 * @access public
	 * @since 1.2.0
	 */
	destroy() {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
			this.refreshInterval = null;
		}

		if (this.socket) {
			this.socket.destroy();
		}

		this.states = {};

		debug('destroy', this.id);
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.2.0
	 */
	init() {
		debug = this.debug;
		log   = this.log;

		this.status(this.STATUS_UNKNOWN);

		this._initTcp();
		this._updateSystem();
	}

	/**
	 * Process an updated configuration array.
	 *
	 * @access public
	 * @since 1.2.0
	 * @param {Object} config - the new configuration
	 */
	updateConfig(config) {
		this.config = config;

		this.destroy();
		this.init();
	}

	/**
	 * INTERNAL: setup default request data for requests
	 *
	 * @private
	 * @since 1.2.0
	 */
	_initTcp() {
		if (!this.config.host) {
			return;
		}

		this.status(this.STATE_WARNING, 'Connecting');
		this.socket = new tcp(this.config.host, 3000);

		this.socket.on('status_change', (status, message) => {
			this.status(status, message);
		});

		this.socket.on('error', (err) => {
			debug("Network error", err);
			this.status(this.STATE_ERROR, err);
			this.log('error', `Network error: ${err.message}`);
			if (this.refreshInterval) clearInterval(this.refreshInterval);
		});

		this.socket.on('connect', () => {
			this.status(this.STATE_OK);
			debug("Connected");
			this.refreshInterval = setInterval(this.refreshData.bind(this), 1000);
		});

		// separate buffered stream into lines with responses
		let receivebuffer = '';
		this.socket.on('data', (chunk) => {
			let i, line = '', offset = 0;
			receivebuffer += chunk;
			while ((i = receivebuffer.indexOf('\r', offset)) !== -1) {
				line   = receivebuffer.substr(offset, i - offset);
				offset = i + 1;
				this.socket.emit('receiveline', line.toString());
			}
			receivebuffer = receivebuffer.substr(offset);
		});

		this.socket.on('receiveline', (line) => {
			// check which device and version we have
			if (line.match(/ShellApp waiting for input/)) {
				this.socket.send(
					'\r' +
					'VER -?\r' +
					'PREVIEW -?\r' +
					'PROGRAM -?\r' +
					'LOGOSEL -?\r'
				);
			}

			if (line.match(/VER \d/)) {
				this.firmwareVersion = line.match(/VER ((?:\d+\.?)+)/)[1];
			}

			if (line.match(/PREVIEW -i\d+/)) {
				this.states['preview_bg'] = parseInt(line.match(/-i(\d+)/)[1]);
				this.checkFeedbacks('preview_bg');
			}
			if (line.match(/PROGRAM -i\d+/)) {
				this.states['program_bg'] = parseInt(line.match(/-i(\d+)/)[1]);
				this.checkFeedbacks('program_bg');
			}
			if (line.match(/LOGOSEL -l \d+/)) {
				this.states['logo_bg'] = parseInt(line.match(/-l (\d+)/)[1]);
				this.checkFeedbacks('logo_bg');
			}

			// Save current state preview for feedback
			if (line.match(/ISEL -i \d+/)) {
				this.states['preview_bg'] = parseInt(line.match(/-i (\d+)/)[1]);
				this.checkFeedbacks('preview_bg');
			}

			// Save current state preview for feedback
			if (line.match(/TAKE -e 0/)) {
				const curPreview          = this.states['preview_bg'];
				this.states['preview_bg'] = this.states['program_bg'];
				this.states['program_bg'] = curPreview;
				this.checkFeedbacks('preview_bg');
				this.checkFeedbacks('program_bg');
			}

			if (line.match(/-e -\d+/)) {
				if (line.match(/ISEL -e -9999/)) {
					this.log('error', 'Current selected input "' + this.states['preview_bg'] +
						'" on ' + this.config.label + ' is' + ' a invalid signal!');
					return;
				}

				switch (parseInt(line.match(/-e -(\d+)/)[1])) {
					case 9999:
						self.log('error', 'Received generic fail error from PDS ' + this.config.label + ': ' + line);
						break;
					case 9998:
						this.log('error', 'PDS ' + this.config.label + ' says: Operation is not applicable in current state: ' + line);
						break;
					case 9997:
						this.log('error', 'Received UI related error from PDS ' + this.config.label + ', did not get response from device: ' + line);
						break;
					case 9996:
						this.log('error', 'Received UI related error from PDS ' + this.config.label + ', did not get valid response from device: ' + line);
						break;
					case 9995:
						this.log('error', 'PDS ' + this.config.label + ' says: Timeout occurred: ' + line);
						break;
					case 9994:
						this.log('error', 'PDS ' + this.config.label + ' says: Parameter / data out of range: ' + line);
						break;
					case 9993:
						this.log('error', 'PDS ' + this.config.label + ' says: Searching for data in an index, no matching data: ' + line);
						break;
					case 9992:
						this.log('error', 'PDS ' + this.config.label + ' says: Checksum didn\'t match: ' + line);
						break;
					case 9991:
						this.log('error', 'PDS ' + this.config.label + ' says: Version didn\'t match: ' + line);
						break;
					case 9990:
						this.log('error', 'Received UI related error from PDS ' + this.config.label + ', current device interface not supported: ' + line);
						break;
					case 9989:
						this.log('error', 'PDS ' + this.config.label + ' says: Pointer operation invalid: ' + line);
						break;
					case 9988:
						this.log('error', 'PDS ' + this.config.label + ' says: Part of command had error: ' + line);
						break;
					case 9987:
						this.log('error', 'PDS ' + this.config.label + ' says: Buffer overflow: ' + line);
						break;
					case 9986:
						this.log('error', 'PDS ' + this.config.label + ' says: Initialization is not done (still in progress): ' + line);
						break;
					default:
						this.log('error', 'Received unspecified error from PDS ' + this.config.label + ': ' + line);
				}
			}
		});
	}

	/**
	 * INTERNAL: Is socket connected?
	 *
	 * @private
	 * @returns {boolean}
	 */
	_isConnected() {
		return this.socket !== undefined && this.socket.connected;
	}

	/**
	 * INTERNAL: Setup constants
	 *
	 * @private
	 * @since 1.2.0
	 */
	_initConstants() {
		this.PDS_VARIANT = [
			{id: PDS_VARIANT_701, label: 'PDS-701'},
			{id: PDS_VARIANT_901, label: 'PDS-901'},
			{id: PDS_VARIANT_902, label: 'PDS-902'}
		];

		this.CHOICES_LOGOS = [
			{id: 0, label: 'Black'},
			{id: 1, label: 'Logo 1'},
			{id: 2, label: 'Logo 2'},
			{id: 3, label: 'Logo 3'}
		];

		this.CHOICES_INPUTS = [
			{id: 1, label: '1 VGA'},
			{id: 2, label: '2 VGA'},
			{id: 3, label: '3 VGA'},
			{id: 4, label: '4 VGA'},
			{id: 5, label: '5 DVI'},
			{id: 6, label: '6 DVI'}
		];

		this.CHOICES_PIPRECALL = [
			{id: 1, label: 1},
			{id: 2, label: '2'},
			{id: 3, label: '3'},
			{id: 4, label: '4'},
			{id: 5, label: '5'},
			{id: 6, label: '6'},
			{id: 7, label: '7'},
			{id: 8, label: '8'},
			{id: 9, label: '9'},
			{id: 10, label: '10'}
		];

		// See this.PDS_VARIANT
		// 901 and 902 have DVI
		if (parseInt(this.config.variant) >= PDS_VARIANT_901) {
			this.CHOICES_INPUTS.push({id: 7, label: '7 DVI'});
			this.CHOICES_INPUTS.push({id: 8, label: '8 DVI'});
		}

		// See this.PDS_VARIANT
		// Only 901 has no SDI
		if (parseInt(this.config.variant) !== PDS_VARIANT_901) {
			this.CHOICES_INPUTS.push({id: 9, label: '9 SDI'});
		}

		this.CHOICES_INPUTS.push({id: 10, label: 'Black/Logo'});
	}

	/**
	 * INTERNAL: Getting the data from the PDS and update feedbacks
	 *
	 * @private
	 * @since 1.2.0
	 */
	_refreshData() {
		if (!this._isConnected) {
			return;
		}

		this.socket.send(
			'PREVIEW -?\r' +
			'PROGRAM -?\r' +
			'LOGOSEL -?\r'
		);
	};

	/**
	 * INTERNAL: Get action from the options for start and stop
	 *
	 * @private
	 * @since 1.2.0
	 */
	_updateSystem() {
		this._initConstants();
		this.actions();
		this._updateFeedbacks();
	}

	/**
	 * INTERNAL: initialize feedbacks.
	 *
	 * @private
	 * @since 1.2.0
	 */
	_updateFeedbacks() {
		this.setFeedbackDefinitions(this.getFeedbacks());
	}
}

exports = module.exports = BarcoPDS;
