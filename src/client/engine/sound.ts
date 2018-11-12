///<reference path="../common/utils.ts"/>
///<reference path="settings.ts"/>

namespace Sounds {
	const SOUNDS_PATH = 'sounds/';

	class SoundEffect {
		private sound: HTMLAudioElement;

		constructor(file_name: string) {
			this.sound = <HTMLAudioElement><any>$$.create('audio')
				.setAttrib('src', SOUNDS_PATH + file_name)
				.setAttrib('preload', 'auto')
				.setAttrib('controls', 'none');
		}

		play() {
			this.sound.play();
		}

		pause() {
			this.sound.pause();
		}

		setVolume(val: number) {//value in range 0 -> 1
			this.sound.volume = val;
		}
	}

	export function updateVolumes(value: number) {
		console.log(`TODO - update volumes (${value})`);
	}

	updateVolumes(SETTINGS.sound_effects);

	var hit = new SoundEffect('hit.ogg');
	hit.setVolume(0.75);
	setTimeout(() => {
		hit.play();
	}, 1000);
}