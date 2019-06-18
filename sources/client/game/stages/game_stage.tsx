import * as React from 'react';

import StageBase, {BaseProps, BaseState} from './stage_base';
import {MessageSchema} from '../../components/room_chat';

interface GameState extends BaseState {

}

export default class extends StageBase<BaseProps, GameState> {

	state: GameState = {

	}

	constructor(props: any) {
		super(props);
	}

	public onChatMessage(msg: MessageSchema) {
		
	}

	render() {
		return <div>
			TODO
		</div>;
	}
}