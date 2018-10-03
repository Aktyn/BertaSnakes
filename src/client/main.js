// console.log( (s=n=>n==2?2:n*s(--n))(6) );//mystery code
// ¯\_(ツ)_/¯
//[]+(-~(x=>x)-~(x=>x))+(-~(x=>x)-~(x=>x))

var $$ = $$;
if(!$$) throw Error('utilsV2.js required');

$$.load(function() {
	var currentStage = null;

	var changeStage = (StageClass) => {
		$$.assert(typeof StageClass === 'function', 'Argument must be typeof function');
		
		if(currentStage != null)
			currentStage.destroy();
		currentStage = new StageClass();
		$$.assert(currentStage instanceof Stage, 'StageClass must be a derived class of Stage');
		
		currentStage.onchange(NewStageClass => {
			changeStage( NewStageClass );
		});
	};
	
	try {
		changeStage(Stage.LOBBY_STAGE);//initial stage LOBBY_STAGE
	} catch(e) {
		console.error(e);
	}
});