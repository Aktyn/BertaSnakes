// var awaiting_notificatinons = [];

class HeaderNotifications {
	private static awaiting_notificatinons: string[] = [];

	public widget: $_face;
	private quene: string[];
	private notification_active = false;

	constructor() {
		this.widget = $$.create('DIV').setClass('header_notifications');

		this.quene = [];
		// this.notification_active = false;
		
		while(HeaderNotifications.awaiting_notificatinons.length > 0)
			this.addNotification(<string>HeaderNotifications.awaiting_notificatinons.shift(), false);
	}

	addNotification(text: string, from_quene = false) {
		if(this.notification_active === false || from_quene === true) {
			this.notification_active = true;

			let notif_node = $$.create('SPAN').setText(text);
			this.widget.append( notif_node );

			setTimeout(() => {
				notif_node.remove();

				if(this.quene.length === 0)
					this.notification_active = false;
				else
					this.addNotification( <string>this.quene.shift(), true );
			}, 5900);//little less than animation duration
		}
		else
			this.quene.push(text);
	}

	static addNotification(text: string) {
		HeaderNotifications.awaiting_notificatinons.push(text);
	}
}