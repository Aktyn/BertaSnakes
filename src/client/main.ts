// console.log( (s=n=>n==2?2:n*s(--n))(6) );//mystery code
// ¯\_(ツ)_/¯
//[]+(-~(x=>x)-~(x=>x))+(-~(x=>x)-~(x=>x))

///<reference path="common/utils.ts"/>
///<reference path="stages/stage.ts"/>
///<reference path="stages/lobby_stage.ts"/>

(function() {//hide logs
	console.log('%clogs disabled\n¯\\_(ツ)_/¯', 'color: #f44336; font-weight: bold; font-size: 25px;');
	console.log = console.info = function() {};
})();

$$.load(function() {
	var currentStage: Stage | null = null;
	
	var changeStage = (StageClass: Stage) => {
		$$.assert(typeof StageClass === 'function', 'Argument must be typeof function');
		
		if(currentStage !== null) {
			currentStage.destroy();
			currentStage = null;
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