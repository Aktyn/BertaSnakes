<h2>Berta Snakes</h2>
Multi-player browser game.

<h2>How to setup project</h2>
<ul>
	<li>Make sure to have nodejs, npm and git installed on your system</li>
	<li>
		Clone repository:
		<pre>git clone https://github.com/Aktyn/BertaSnakes<br />cd BertaSnakes</pre>
	</li>
	<li>
		Install necessary dependencies
		<pre>npm install</pre>
	</li>
	<li>
		<h3>DEVELOPMENT MODE</h3>
		<ul>
			<li>Run client with: <pre>npm run client:dev</pre> (make sure port 3000 is not in use)</li>
			<li>Run server with: <pre>npm run server:dev</pre></li>
		</ul>
	</li>
	<li>
		<h3>PRODUCTION MODE</h3>
		<ul>
			<li>Compile client source: <pre>npm run client:publish</pre></li>
			<li>Compile server source: <pre>npm run server:publish</pre></li>
			<li>Run server with: <pre>npm run server:run</pre> (client files shall be published under port: SERVER_PORT specified in src/common/config.ts, default value is 5348)</li>
		</ul>
	</li>
	<li>
		<h3>SERVER CONFIGURATION</h3>
		<ul>
			<li>All necessary ports as well as host address are specified inside src/common/config.ts</li>
			<li>Server uses MongoDB to store accounts data, sessions, etc. MongoDB credentials should be given in parameters while running server</li>
			<li>Server send emails via nodemailer from gmail account. Gmail address and password must also be specified while running server. You should allow access of unsecured applications in google account settings to be able to send mails remotely from server.</li>
			<li>Summarizing, the complete command to run server with all functionality is: <pre>npm run server:run MONGO_USER="value" MONGO_PASS="value" EMAIL_ADDRESS="example_value@gmail.com" EMAIL_PASSWORD="value"</pre></li>
			<li>Same goes for running server in dev mode (npm run server:dev)</li>
		</ul>
	</li>
</ul>