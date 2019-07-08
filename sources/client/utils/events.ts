export default class Events {
	private events_map: Map<number, ((data: any) => void)[]> = new Map();
	
	public on<T>(code: number, func: (data: T) => void) {
		let current = this.events_map.get(code);
		if(current)
			current.push(func);
		else
			this.events_map.set(code, [func]);
	}
	
	public off<T>(code: number, func: (data: T) => void) {
		let current = this.events_map.get(code);
		if(!current) {
			console.error('There is no event of given name', code);
			return false;
		}
		for(let i=0; i<current.length; i++) {
			if( current[i] === func ) {
				current.splice(i, 1);
				if(current.length === 0)//that was last event of this name
					this.events_map.delete(code);
				return true;
			}
		}
		console.warn('Event has not been deactivated properly,', code);
		return false;
	}
	
	public emit(code: number, data: any) {
		let current = this.events_map.get(code);
		if(!current)
			return;
		for(let func of current)
			func(data);
	}
}