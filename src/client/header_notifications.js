const HeaderNotifications = (function() {

	var awaiting_notificatinons = [];

	return class {
		constructor() {
			this.widget = $$.create('DIV').setClass('header_notifications');

			this.quene = [];
			this.notification_active = false;
			
			while(awaiting_notificatinons.length > 0)
				this.addNotification(awaiting_notificatinons.shift(), false);
		}

		addNotification(text, from_quene) {
			if(this.notification_active === false || from_quene === true) {
				this.notification_active = true;

				let notif_node = $$.create('SPAN').setText(text);
				this.widget.append( notif_node );

				setTimeout(() => {
					notif_node.remove();

					if(this.quene.length === 0)
						this.notification_active = false;
					else
						this.addNotification( this.quene.shift(), true );
				}, 5900);//little less than animation duration
			}
			else
				this.quene.push(text);
		}

		static addNotification(text) {
			awaiting_notificatinons.push(text);
		}
	};
})();