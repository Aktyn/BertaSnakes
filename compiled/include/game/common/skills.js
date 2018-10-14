"use strict";
// const Skills = (function() {
var SkillsScope;
(function (SkillsScope) {
    /*interface SkillObjectDerived extends SkillObject {
        new(): SkillObject;
    }*/
    //NOTE - in case of continuous skils the energy cost is per second
    class SkillObject {
        constructor(skill_data) {
            this.cooldown = 0;
            this._in_use = false;
            this.data = skill_data; //const
            this.data.continuous = !!this.data.continuous; //make sure it is a bool
            //this.cooldown = 0;
            //this._in_use = false;//for continous skills
        }
        canBeUsed(avaible_energy) {
            return avaible_energy + 0.001 >= this.data.energy_cost &&
                this.cooldown <= 0; // && 
            //this._in_use === false;
        }
        isContinous() {
            return this.data.continuous;
        }
        use() {
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
        update(delta) {
            /*if(this.cooldown !== 0) {
                if( (this.cooldown -= delta) < 0 )
                    this.cooldown = 0;
            }*/
            if (this.cooldown > 0)
                this.cooldown -= delta;
        }
    }
    SkillsScope.SkillObject = SkillObject;
    SkillsScope.Skills = {
        // SHIP SPECIFIC SKILLS:
        SHOOT1: {
            //id: 0,
            continuous: true,
            energy_cost: 0.015,
            cooldown: 0.25,
            texture_name: 'shot1_skill' //clientside only (texture asset name)
        },
        SHOOT2: {
            continuous: true,
            energy_cost: 0.0175,
            cooldown: 0.25,
            texture_name: 'shot2_skill'
        },
        SHOOT3: {
            continuous: true,
            energy_cost: 0.02,
            cooldown: 0.25,
            texture_name: 'shot3_skill'
        },
        // DEFFENSIVE SKILLS
        SHIELD: {
            energy_cost: 0.1,
            cooldown: 16,
            texture_name: 'shield_skill',
            name: 'Shield',
            description: 'Active shield that protects player from damage for some time.',
            lvl_required: 3,
            price: 500 //coins
        },
        INSTANT_HEAL: {
            energy_cost: 0.3,
            cooldown: 15,
            texture_name: 'heal_skill',
            name: 'Instant Heal',
            description: 'Instantly restores some of your health.',
            lvl_required: 9,
            price: 8000
        },
        // OFFSENSIVE SKILLS
        BOUNCE_SHOT: {
            continuous: true,
            energy_cost: 0.05,
            cooldown: 0.5,
            texture_name: 'bounce_shot_skill',
            name: 'Bounce Shot',
            description: 'Shoot a bullet that bouncing off the walls. \nCauses stronger damage than regular bullets.',
            lvl_required: 5,
            price: 1000 //coins
        },
        ENERGY_BLAST: {
            energy_cost: 0.1,
            cooldown: 2,
            texture_name: 'energy_blast_skill',
            name: 'Energy Blast',
            description: 'Release a blast of energy that strikes nearby enemies.',
            lvl_required: 7,
            price: 2000 //coins
        },
        BOMB: {
            energy_cost: 0.5,
            cooldown: 30,
            texture_name: 'bomb_skill',
            name: 'Bomb',
            description: 'Place a bomb that explodes a while later killing every nearby enemy.',
            lvl_required: 9,
            price: 8000
        },
        //PASSIVE SKILLS
        SPEED: {
            energy_cost: 0.1,
            cooldown: 4,
            texture_name: 'speed_skill',
            name: 'Speed Boost',
            description: 'Makes you fast as bullet for some period of time.',
            lvl_required: 3,
            price: 500 //coins
        },
        //NOTE - new skills must be add at the end of this object due to preserve it's id order
        //or change order in mysql database
        getById: function (id) {
            for (var s in this) {
                if (typeof this[s] === 'object' && this[s].id === id)
                    return this[s];
            }
            return undefined;
        },
        Skill: SkillObject
    };
    function skillCreator(skill) {
        return () => new SkillObject(skill);
    }
    //indexing skills
    let i = 0;
    for (let prop in SkillsScope.Skills) {
        if (typeof SkillsScope.Skills[prop] === 'object') {
            SkillsScope.Skills[prop].id = i++;
            SkillsScope.Skills[prop].create = skillCreator(SkillsScope.Skills[prop]);
        }
    }
    //console.log(Skills);
    //return Skills;
})(SkillsScope || (SkillsScope = {}));
var Skills = SkillsScope.Skills;
try { //export for NodeJS
    module.exports = Skills;
}
catch (e) { }
