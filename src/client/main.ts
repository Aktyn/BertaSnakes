// console.log( (s=n=>n==2?2:n*s(--n))(6) );//mystery code
// ¯\_(ツ)_/¯
//[]+(-~(x=>x)-~(x=>x))+(-~(x=>x)-~(x=>x))

///<reference path="common/utils.ts"/>
///<reference path="stages/stage.js"/>

$$.load(function() {
	//@ts-ignore
	var currentStage = null;
	//@ts-ignore
	var changeStage = (StageClass) => {
		$$.assert(typeof StageClass === 'function', 'Argument must be typeof function');
		//@ts-ignore
		if(currentStage != null) {
			//@ts-ignore
			currentStage.destroy();
		}
		currentStage = new StageClass();

		$$.assert(currentStage instanceof Stage, 'StageClass must be a derived class of Stage');
		//@ts-ignore
		currentStage.onchange(NewStageClass => {
			changeStage( NewStageClass );
		});
	};
	
	try {
		//@ts-ignore
		changeStage(Stage.LOBBY_STAGE);//initial stage LOBBY_STAGE
	} catch(e) {
		console.error(e);
	}
});