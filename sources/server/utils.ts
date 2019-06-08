var prompt = require('prompt-sync')();

export default {
	getArgument: function(name: string) {
		for(var arg of process.argv) {
			if(arg.startsWith(name))
				return arg.replace(name, '').substring(1);
		}

		try {//ask user to type password in console
			return prompt(name + ': ') || '';
		}
		catch(e) {
			console.error(`Argument ${name} not found. Closing program.`);
			process.exit();
			return '';
		}
	},
}