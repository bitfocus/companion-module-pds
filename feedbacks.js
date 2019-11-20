module.exports = {

	/**
	 * INTERNAL: Get the available feedbacks.
	 *
	 * @access protected
	 * @since 1.0.0
	 * @returns {Object[]} - the available feedbacks
	 */
	getFeedbacks() {
		let feedbacks = {};

		const inputOption = {
			type: 'dropdown',
			label: 'Input',
			id: 'i',
			default: 1,
			choices: this.CHOICES_INPUTS
		};

		feedbacks['preview_bg'] = {
			label: 'Change colors for preview',
			description: 'If the input specified is in use by preview, change colors of the bank',
			options: [
				{
					type: 'colorpicker',
					label: 'Foreground color',
					id: 'fg',
					default: this.rgb(255, 255, 255)
				},
				{
					type: 'colorpicker',
					label: 'Background color',
					id: 'bg',
					default: this.rgb(0, 255, 0)
				},
				inputOption
			],
			callback: (feedback, bank) => {
				if (this.states['preview_bg'] === parseInt(feedback.options.input)) {
					return {color: feedback.options.fg, bgcolor: feedback.options.bg};
				}
			}
		};

		feedbacks['program_bg'] = {
			label: 'Change colors for program',
			description: 'If the input specified is in use by program, change colors of the bank',
			options: [
				{
					type: 'colorpicker',
					label: 'Foreground color',
					id: 'fg',
					default: this.rgb(255, 255, 255)
				},
				{
					type: 'colorpicker',
					label: 'Background color',
					id: 'bg',
					default: this.rgb(255, 0, 0)
				},
				inputOption
			],
			callback: (feedback, bank) => {
				if (this.states['program_bg'] === parseInt(feedback.options.input)) {
					return {color: feedback.options.fg, bgcolor: feedback.options.bg};
				}
			}
		};

		feedbacks['logo_bg'] = {
			label: 'Change colors for logo',
			description: 'If the logo specified is in use, change colors of the bank',
			options: [
				{
					type: 'colorpicker',
					label: 'Foreground color',
					id: 'fg',
					default: this.rgb(255, 255, 255)
				},
				{
					type: 'colorpicker',
					label: 'Background color',
					id: 'bg',
					default: this.rgb(255, 0, 0)
				},
				inputOption
			],
			callback: (feedback, bank) => {
				if (this.states['logo_bg'] === parseInt(feedback.options.input)) {
					return {color: feedback.options.fg, bgcolor: feedback.options.bg};
				}
			}
		};

		feedbacks['pip_bg'] = {
			label: 'Change colors for PiP',
			description: 'If the PiP specified is in use, change colors of the bank',
			options: [
				{
					type: 'dropdown',
					label: 'PiP',
					id: 'p',
					default: 1,
					choices: [{id: 1, label: '1'}, {id: 2, label: '2'}]
				},
				{
					type: 'colorpicker',
					label: 'Foreground color',
					id: 'fg',
					default: this.rgb(255, 255, 255)
				},
				{
					type: 'colorpicker',
					label: 'Background color',
					id: 'bg',
					default: this.rgb(255, 0, 0)
				},
				inputOption
			],
			callback: (feedback, bank) => {
				const pipId = parseInt(feedback.options.p);
				if (this.states['pip' + pipId] === true) {
					return {color: feedback.options.fg, bgcolor: feedback.options.bg};
				}
			}
		};

		return feedbacks;
	}
};
