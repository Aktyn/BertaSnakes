// console.log( (s=n=>n==2?2:n*s(--n))(6) );//mystery code
//[]+(-~(x=>x)-~(x=>x))+(-~(x=>x)-~(x=>x))

///<reference path="common/utils.ts"/>
///<reference path="stages/stage.ts"/>
///<reference path="stages/lobby_stage.ts"/>

$$.load(function() {
	var currentStage: Stages.StageBase | null = null;
	
	var changeStage = (StageClass: Stages.StageClassI) => {
		$$.assert(typeof StageClass === 'function', 'Argument must be typeof function');
		
		if(currentStage !== null) {
			currentStage.destroy();
			currentStage = null;
		}
		currentStage = new StageClass();

		$$.assert(currentStage instanceof Stages.StageBase, 
			'StageClass must be a derived class of Stage');
		
		currentStage.onchange(NewStageClass => {
			changeStage( NewStageClass );
		});
	};
	
	try {
		changeStage(Stages.LOBBY_STAGE);//initial stage LOBBY_STAGE
	} catch(e) {
		console.error(e);
	}
});