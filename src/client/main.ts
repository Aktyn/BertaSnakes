// console.log( (s=n=>n==2?2:n*s(--n))(6) );//mystery code
// ¯\_(ツ)_/¯
//[]+(-~(x=>x)-~(x=>x))+(-~(x=>x)-~(x=>x))

///<reference path="common/utils.ts"/>
///<reference path="stages/stage.ts"/>
///<reference path="stages/lobby_stage.ts"/>

$$.load(function() {
	var currentStage: Stage | null = null;
	
	var changeStage = (StageClass: Stage) => {
		$$.assert(typeof StageClass === 'function', 'Argument must be typeof function');
		
		if(currentStage != null) {
			currentStage.destroy();
		}
		currentStage = new ( <StageDerived>StageClass )();

		$$.assert(currentStage instanceof Stage, 'StageClass must be a derived class of Stage');
		
		currentStage.onchange(NewStageClass => {
			changeStage( NewStageClass );
		});
	};
	
	try {
		//TODO - try to remove unknown
		changeStage(<Stage><unknown>LOBBY_STAGE);//initial stage LOBBY_STAGE
	} catch(e) {
		console.error(e);
	}
});