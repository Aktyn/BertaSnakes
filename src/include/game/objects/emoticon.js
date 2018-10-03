const Emoticon = (function() {//NOTE - this file assumes that Entities module exists

	const SCALE = 0.07, DURATION = 2, FADING_DURATION = 0.5;//durations in seconds
	const OFFSET_ANGLE = Math.PI / 4.0, PARENT_OFFSET = 0.15;

	var sc = 0;

	return class extends Object2D {
		constructor(name, parent) {
			super();
			super.setScale(0, 0);

			
			this.name = name;
			this.parent = parent;

			this.factor = 0;
			this.timer = 0;

			this.streak = new Object2D();
			this.streak.setRot( OFFSET_ANGLE );

			if(name !== 'hand.svg')//exception (TODO - hand icon in yellow circle)
				Entities.addObject(Entities['STREAK'].id, this.streak);

			Entities.addObject(Entities[Emoticon.entityName(this.name)].id, this);
		}

		destroy() {
			Entities.removeObject(Entities['STREAK'].id, this.streak);
			Entities.removeObject(Entities[Emoticon.entityName(this.name)].id, this);
		}

		endEffect() {//force end
			this.timer = Math.max(this.timer, DURATION - FADING_DURATION);
		}

		update(delta) {
			if( (this.timer += delta) > DURATION )
				this.expired = true;

			if(this.factor < 1) {//showing up factor
				if( (this.factor += delta*3.0) > 1 )
					this.factor = 1;
			}

			if(DURATION-this.timer < FADING_DURATION)
				sc = Math.pow((DURATION-this.timer) / FADING_DURATION, 2) * SCALE;
			else
				sc = Math.pow(this.factor, 2) * SCALE;

			super.setPos(
				this.parent.x + Math.cos(OFFSET_ANGLE) * Math.pow(this.factor, 2) * PARENT_OFFSET, 
				this.parent.y + Math.sin(OFFSET_ANGLE) * Math.pow(this.factor, 2) * PARENT_OFFSET
			);
			this.streak.setPos(
				(this.x + this.parent.x) / 2,
				(this.y + this.parent.y) / 2
			);
			

			this.streak.setScale(sc, PARENT_OFFSET*0.5 * Math.pow(this.factor, 2));

			super.setScale(sc, sc);
			
		}

		static entityName(emoticon_name) {
			return 'EMOT_' + emoticon_name.replace(/\.[a-zA-Z]+/gi, '');//NOTE - removes extention
		}
	};
})();