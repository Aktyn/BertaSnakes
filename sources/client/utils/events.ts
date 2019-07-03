export default class Events {
	private events_map: Map<string, ((data: any) => void)[]> = new Map();
	
	public on<T>(name: string, func: (data: T) => void) {
		let current = this.events_map.get(name);
		if(current)
			current.push(func);
		else
			this.events_map.set(name, [func]);
	}
	
	public off<T>(name: string, func: (data: T) => void) {
		let current = this.events_map.get(name);
		if(!current) {
			console.error('There is no event of given name', name);
			return false;
		}
		for(let i=0; i<current.length; i++) {
			if( current[i] === func ) {
				current.splice(i, 1);
				if(current.length === 0)//that was last event of this name
					this.events_map.delete(name);
				return true;
			}
		}
		console.warn('Event has not been deactivated properly,', name);
		return false;
	}
	
	public emit(name: string, data: any) {
		let current = this.events_map.get(name);
		if(!current)
			return;
		for(let func of current)
			func(data);
	}
}