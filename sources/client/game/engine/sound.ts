import Settings from './settings';

const SOUNDS_PATH = require.context('../../sounds');

let b: number;

class SoundEffect {
	private readonly sound_batch: HTMLAudioElement[];
	private b_index = 0;

	constructor(file_name: string, batch = 1) {
		this.sound_batch = [];

		for(b=0; b<batch; b++) {
			this.sound_batch[b] = document.createElement('audio');
			this.sound_batch[b].setAttribute('src', SOUNDS_PATH('./' + file_name));
			this.sound_batch[b].setAttribute('preload', 'auto');
			this.sound_batch[b].setAttribute('controls', 'none');
		}
	}

	play() {
		if(this.sound_batch[this.b_index].volume <= 0)
			return;
		this.sound_batch[this.b_index].play().catch(console.error);
		this.b_index = (++this.b_index) % this.sound_batch.length;
	}

	/*pause() {
		for(b=0; b<this.sound_batch.length; b++)
			this.sound_batch[b].pause();
	}*/

	// noinspection JSUnusedGlobalSymbols
	setVolume(val: number) {//value in range: 0 -> 1
		for(b=0; b<this.sound_batch.length; b++)
			this.sound_batch[b].volume = val;
	}
}

function extendType<T>(target: T): T & {[index: string]: SoundEffect} {
	return target as T & {[index: string]: SoundEffect};
}

export const SOUND_EFFECTS = extendType({
	hit: 		new SoundEffect('hit.ogg', 3),
	collect: 	new SoundEffect('collect.ogg', 3),
	explode: 	new SoundEffect('explode.ogg', 5),
	shoot: 		new SoundEffect('shoot.ogg', 10),
	wallHit: 	new SoundEffect('wallHit.ogg', 3)
});

function updateVolumes(value: number) {
	for(let effect_name in SOUND_EFFECTS)
		SOUND_EFFECTS[effect_name].setVolume(value);
}

Settings.watch('sound_volume', value => updateVolumes(value as number));
updateVolumes( (<number>Settings.getValue('sound_volume')) || 0 );