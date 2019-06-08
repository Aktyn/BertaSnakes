import * as React from 'react';

import StageBase, {BaseProps, BaseState} from './stage_base';

interface GameState extends BaseState {

}

export default class extends StageBase<BaseProps, GameState> {

	state: GameState = {

	}

	constructor(props: any) {
		super(props);
	}

	public onChatMessage(from: string, is_room_msg: boolean, id: number, msg: string) {
		
	}

	render() {
		return <div>
			TODO
		</div>;
	}
}