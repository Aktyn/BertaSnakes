import Settings from './settings';

const SOUNDS_PATH = 'sounds/';

var b: number;

export default class SoundEffect {
	private sound_batch: HTMLAudioElement[];
	private b_index = 0;

	constructor(file_name: string, batch = 1) {
		this.sound_batch = [];

		for(b=0; b<batch; b++) {
			/*this.sound_batch[b] = <HTMLAudioElement><any>$$.create('audio')
				.setAttrib('src', SOUNDS_PATH + file_name)
				.setAttrib('preload', 'auto')
				.setAttrib('controls', 'none');*/
			this.sound_batch[b] = document.createElement('audio');
			this.sound_batch[b].setAttribute('src', SOUNDS_PATH + file_name);
			this.sound_batch[b].setAttribute('preload', 'auto');
			this.sound_batch[b].setAttribute('controls', 'none');
		}
	}

	play() {
		this.sound_batch[this.b_index].play();
		this.b_index = (++this.b_index) % this.sound_batch.length;
	}

	pause() {
		for(b=0; b<this.sound_batch.length; b++)
			this.sound_batch[b].pause();
	}

	setVolume(val: number) {//value in range: 0 -> 1
		for(b=0; b<this.sound_batch.length; b++)
			this.sound_batch[b].volume = val;
	}
}

export var EFFECTS = {
	hit: 		new SoundEffect('hit.ogg', 3),
	collect: 	new SoundEffect('collect.ogg', 3),
	explode: 	new SoundEffect('explode.ogg', 5),
	shoot: 		new SoundEffect('shoot.ogg', 10),
	wallHit: 	new SoundEffect('wallHit.ogg', 3)
};

export function updateVolumes(value: number) {
	for(var effect_name in EFFECTS) {
		//@ts-ignore
		EFFECTS[effect_name].setVolume(value);
	}
}

updateVolumes(Settings.sound_effects);