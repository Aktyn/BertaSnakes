/*jshint multistr: true */

const { JSDOM } = require("jsdom");
const topbarHTML = require('./topbar.js').getHTML();
const fs = require('fs');

//common head shared between pages 
const header = 	
	"<base href='/' target='_self'>\
	<meta charset='utf-8'>\
	<meta name='author' content='Aktyn'>\
	<meta name='viewport' content='width=device-width, initial-scale=1'>\
	<meta name='Description' content='Web version of Berta Snakes.'>\
	<link rel='icon' href='/img/icons/icon.ico' type='image/x-icon'>";

function createScriptNode(doc, src, async) {
	let node = doc.createElement('SCRIPT');
	node.setAttribute('type', 'text/javascript');
	node.setAttribute('src', src);
	if(async === true)
		node.setAttribute('async', true);
	return node;
}

function createAndSerialize(options) {
	options = options || {};

	const dom = new JSDOM(`<!DOCTYPE html><html lang="en-US"></html>`);
	const document = dom.window.document;

	document.head.innerHTML += header + "<title>" + (options.title || "Berta Snakes") + "</title>";

	if(options.isPlayPage === true) {
		document.head.innerHTML += 
			"<link rel='stylesheet' type='text/css' href='css/main.css'>\
			<link rel='stylesheet' type='text/css' href='css/game.css'>";
		document.head.appendChild(
			createScriptNode(document, 'js/' + /*DATE_VERSION*/APP_VERSION + '.js', true) );

		
		document.body.innerHTML += 
			"<div class='spinner'>\
				<div class='double-bounce1' style='background-color: rgb(244, 244, 244);'></div>\
				<div class='double-bounce2' style='background-color: rgb(244, 244, 244);'></div>\
			</div>";
	}
	else {
		document.head.innerHTML += "<link rel='stylesheet' href='css/main.css'>";
		document.head.appendChild( createScriptNode(document, 'webjs/utils.js') );
		document.head.appendChild( createScriptNode(document, 'webjs/main.js') );
		document.head.appendChild( createScriptNode(document, 'webjs/bg.js', true) );

		document.body.innerHTML += topbarHTML;
	}

	if(typeof options.modify === 'function')
		options.modify(document);

	return dom.serialize();
}


module.exports = {//PAGES
	not_found: createAndSerialize({modify: document => {
		document.body.innerHTML += 'Not found :(';
	}}),
	admin: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/chart.js', true) );
		document.head.appendChild( createScriptNode(document, 'webjs/admin.js', true) );
		document.body.innerHTML += fs.readFileSync('website/html/admin.html', 'utf8');
	}}),
	homepage: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/home.js', true) );
		document.body.innerHTML += fs.readFileSync('website/html/home.html', 'utf8');
	}}),
	forum: createAndSerialize({title: 'Berta Snakes Forum', modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/forum.js', true) );
		document.head.innerHTML += 
			"<link rel='stylesheet' type='text/css' href='css/forum.css'>";
		document.body.innerHTML += fs.readFileSync('website/html/forum.html', 'utf8');
	}}),
	info: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/info.js', true) );
		document.body.innerHTML += fs.readFileSync('website/html/info.html', 'utf8');
	}}),
	gallery: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/gallery.js', true) );
		document.body.innerHTML += 'gallery page under construction';
	}}),
	ranking: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/ranking.js', true) );
	}}),
	user: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/user.js', true) );
		document.body.innerHTML += fs.readFileSync('website/html/user_info.html', 'utf8');
	}}),
	game: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/game.js', true) );
		document.body.innerHTML += fs.readFileSync('website/html/game_info.html', 'utf8');
	}}),
	account: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/account.js') );
		document.body.innerHTML += fs.readFileSync('website/html/account_info.html', 'utf8');
	}}),
	login: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/login.js') );
		document.body.innerHTML += fs.readFileSync('website/html/login_form.html', 'utf8');
	}}),
	register: createAndSerialize({modify: document => {
		document.head.appendChild( createScriptNode(document, 'webjs/register.js') );
		document.body.innerHTML += fs.readFileSync('website/html/register_form.html', 'utf8');
	}}),
	play: createAndSerialize({title: 'Berta Snakes v'+APP_VERSION, isPlayPage: true})
};