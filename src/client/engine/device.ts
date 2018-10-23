namespace Device {
	const orientation_support = "orientation" in screen;
	if(!orientation_support)
		console.info('No screen.orientation support');

	export enum Orientation {
		LANDSCAPE,
		PORTRAIT
	}

	interface Info {
		orientation: Orientation
	}

	function getOrientation() {
		return screen.orientation.type.indexOf('portrait') !== -1 ? 
			Orientation.PORTRAIT : Orientation.LANDSCAPE;
	}

	function refreshInfo(_info: Info | {[index: string]: any}) {
		if(orientation_support) {
			_info.orientation = getOrientation();
		}
		
		return <Info>_info;
	}

	export var info: Info = refreshInfo({});

	var orientation_listeners: ( (orient: Orientation) => void )[] = [];

	if(orientation_support) {
		screen.orientation.addEventListener("change", function(e) {
			refreshInfo(info);

			for(var cb of orientation_listeners)
				cb( info.orientation );
		}, false);
	}

	export function onOrientationChange(callback: (orient: Orientation) => void) {
		orientation_listeners.push(callback);
	}

	export function onOrientationChangeRelease(callback: (orient: Orientation) => void) {
		let index = orientation_listeners.indexOf(callback);
		if(index !== -1)
			orientation_listeners.splice(index, 1);
	}
}