//NOTE - in case of continuous skils the energy cost is per second
export class SkillObject {
	public data: SkillData;
	public cooldown = 0;
	private _in_use = false;

	constructor(skill_data: SkillData) {
		this.data = skill_data;//const
		this.data.continuous = !!this.data.continuous;//make sure it is a bool
		//this.cooldown = 0;
		//this._in_use = false;//for continous skills
	}

	canBeUsed(avaible_energy: number) {
		return avaible_energy+0.001 >= this.data.energy_cost && this.cooldown <= 0;
		// && this._in_use === false;
	}

	isContinous() {
		return this.data.continuous;
	}

	use() {//returns value of consumed energy
		this.cooldown += this.data.cooldown || 0;
		//if(this.data.continuous === true)
		this._in_use = true;
		return this.data.energy_cost;
	}

	stopUsing() {
		this._in_use = false;
		//if(this.isContinous())
		//	this.cooldown = 0;//NOTE - experimental (hacking vulnerability)
	}

	isInUse() {
		return this._in_use;
	}

	update(delta: number) {
		/*if(this.cooldown !== 0) {
			if( (this.cooldown -= delta) < 0 )
				this.cooldown = 0;
		}*/
		if(this.cooldown > 0)
			this.cooldown -= delta;
	}
}

export interface SkillData {
	id: number;
	continuous: boolean;
	energy_cost: number;
	cooldown: number;
	texture_name: string;
	name: string;
	description: string;
	lvl_required: number;
	price: number;
	create: () => SkillObject;
}

interface SkillsSchema {
	[index: string]: any;// SkillData | typeof SkillObject | ((id: number) => SkillData | undefined);
	Skill: typeof SkillObject;
	getById: (id: number) => SkillData | undefined;
}

const Skills: SkillsSchema = {//SCHEMA
	// SHIP SPECIFIC SKILLS:
	SHOOT1: <SkillData>{//level 1 continous shoot
		//id: 0,
		continuous: true,
		energy_cost: 0.015,//per second (1 => 100%)
		cooldown: 0.25,//single bullet per 0.5 sec
		texture_name: 'shot1_skill'//clientside only (texture asset name)
	},
	SHOOT2: <SkillData>{//level 2 continous shoot
		continuous: true,
		energy_cost: 0.01625,//per second (1 => 100%)
		cooldown: 0.25,
		texture_name: 'shot2_skill'
	},
	SHOOT3: <SkillData>{//level 3 continous shoot
		continuous: true,
		energy_cost: 0.0175,//per second (1 => 100%)
		cooldown: 0.25,
		texture_name: 'shot3_skill'
	},

	// DEFFENSIVE SKILLS
	SHIELD: <SkillData>{
		energy_cost: 0.1,
		cooldown: 16,
		texture_name: 'shield_skill',

		name: 'Shield',
		description: 'Active shield that protects player from damage for some time.',
		lvl_required: 3,
		price: 500//coins
	},

	INSTANT_HEAL: <SkillData>{
		energy_cost: 0.3,
		cooldown: 15,
		texture_name: 'heal_skill',

		name: 'Instant Heal',
		description: 'Instantly restores some of your health.',
		lvl_required: 9,
		price: 8000
	},

	// OFFSENSIVE SKILLS
	BOUNCE_SHOT: <SkillData>{
		continuous: true,
		energy_cost: 0.05,
		cooldown: 0.5,
		texture_name: 'bounce_shot_skill',

		name: 'Bounce Shot',
		description: 
			'Shoot bullets that bounces off the walls. \nCauses stronger damage than regular ones.',
		lvl_required: 5,
		price: 1000//coins
	},

	ENERGY_BLAST: <SkillData>{
		energy_cost: 0.1,
		cooldown: 2,
		texture_name: 'energy_blast_skill',

		name: 'Energy Blast',
		description: 'Release a blast of energy that strikes nearby enemies.',
		lvl_required: 7,
		price: 2000//coins
	},

	BOMB: <SkillData>{
		energy_cost: 0.5,
		cooldown: 30,
		texture_name: 'bomb_skill',

		name: 'Bomb',
		description: 'Place a bomb that explodes a while later killing every nearby enemy.',
		lvl_required: 9,
		price: 8000
	},

	//PASSIVE SKILLS
	SPEED: <SkillData>{
		energy_cost: 0.1,
		cooldown: 4,
		texture_name: 'speed_skill',

		name: 'Speed Boost',
		description: 'Makes you fast as bullet for some period of time.',
		lvl_required: 3,
		price: 500//coins
	},


	//NOTE - new skills must be add at the end of this object due to preserve it's id order
	//or change order in mysql database

	getById: function(id: number) {
		for(var s in this) {
			if(typeof this[s] === 'object' && (<SkillData>this[s]).id === id)
				return <SkillData>this[s];
		}
		return undefined;
	},

	Skill: SkillObject
};

function skillCreator(skill: SkillData) {
	return () => new SkillObject(skill);
}

//indexing skills
let i = 0;
for(let prop in Skills) {
	if(typeof Skills[prop] === 'object') {
		(<SkillData>Skills[prop]).id = i++;
		(<SkillData>Skills[prop]).create = skillCreator( <SkillData>Skills[prop] );
	}
}

export default Skills;