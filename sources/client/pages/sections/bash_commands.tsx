import * as React from 'react';
import ERROR_CODES, {errorMsg} from '../../../common/error_codes';
import Account from '../../account';
import ServerApi from '../../utils/server_api';
// import {offsetTop} from '../../components/sidepops/sidepops_common';

interface BashCommandsProps {
	setError: (msg: string) => void;
}

interface BashCommandsState {
	execution_successful: boolean;
	command_output: string;
}

export default class BashCommandsSection extends React.Component<BashCommandsProps, BashCommandsState> {
	private command_input: HTMLInputElement | null = null;
	
	state: BashCommandsState = {
		execution_successful: false,
		command_output: ''
	};
	
	private async executeCommand() {
		if( !this.command_input )
			return;
		let cmd = this.command_input.value.trim();
		if(cmd.length < 2)
			return;
		this.command_input.value = '';
		try {
			let res = await ServerApi.postRequest('/execute_bash_command', {
				token: Account.getToken(),
				cmd
			});
			
			if (res['error'] !== ERROR_CODES.SUCCESS) {
				this.props.setError(errorMsg(res.error));
				this.setState({execution_successful: false});
			} else {
				console.log(res.response);
				this.setState({
					execution_successful: true,
					command_output: escape(res.response).replace(/%20/g, '&nbsp;')
						.replace(/%09/g, '&#09;')
						.replace(/%0A/g, '<br />')
				});
			}
		}
		catch (e) {
			this.props.setError(errorMsg(ERROR_CODES.SERVER_UNREACHABLE));
			this.setState({execution_successful: false});
		}
	}
	
	render() {
		return <section>
			{this.state.execution_successful && <div style={{
				fontWeight: 'bold',
				color: '#66BB6A'
			}}>Command executed</div>}
			<input type={'text'} placeholder={'Bash command'} ref={el => this.command_input = el} onKeyDown={e => {
				if (e.keyCode === 13)
					this.executeCommand().catch(console.error);
			}} style={{display: 'inline-block'}}/>
			<button onClick={this.executeCommand.bind(this)} style={{marginLeft: '5px'}}>EXECUTE</button>
			<pre style={{
				textAlign: 'left',
				padding: '5px',
				fontFamily: 'monospace'
			}} dangerouslySetInnerHTML={{__html: this.state.command_output}}/>
		</section>;
	}
}