import * as path from 'path';
import * as fs from 'fs';
import Config from '../common/config';
import {UPLOADS_FOLDER} from './upload_receiver';
import {executeCommand, makeSureFolderExists} from "./utils";
import {getCredentials} from "./database";

const BACKUPS_FOLDER = path.join(__dirname, '..', '..', 'backups');

function copyFolderSync(from: string, to: string) {//this function assumes that 'to' folder does not exists
    fs.mkdirSync(to);
    fs.readdirSync(from).forEach((element: string) => {
        if (fs.lstatSync(path.join(from, element)).isFile())
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        else
            copyFolderSync(path.join(from, element), path.join(to, element));
    });
}

function removeDirectory(dir: string) {
    if(fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((entry: string) => {
            let entry_path = path.join(dir, entry);
            if (fs.lstatSync(entry_path).isDirectory())
                removeDirectory(entry_path);
            else
                fs.unlinkSync(entry_path);
        });
        fs.rmdirSync(dir);
    }
}

function zeroPad(num: number) {
	return num < 10 ? `0${num}` : num.toString();
}

// noinspection SpellCheckingInspection
function getCurrentDatetimeCode() {//converts current date time to string of format: YYYYMMDDhhmmss
	let dt = new Date();
	return `${ zeroPad(dt.getFullYear()) }${ zeroPad(dt.getMonth()+1) }${ zeroPad(dt.getDate()) }${
		zeroPad(dt.getHours()) }${ zeroPad(dt.getMinutes()) }${ zeroPad(dt.getSeconds()) }`;
}

function clean() {//removes old backups if there are too many of them
	let backups = fs.readdirSync(BACKUPS_FOLDER).sort((a: string, b: string) => a.localeCompare(b));
	
	while(backups.length > Config.MAXIMUM_BACKUPS) {
		let to_remove = backups.shift();
		if(to_remove)
			removeDirectory( path.join(BACKUPS_FOLDER, to_remove) );
	}
}

function doBackup(repeat_after: number) {
	try {
		clean();
	}
	catch(e) {
		console.error('Cannot clean backups: ' + e)
	}
	
	const current_datetime = getCurrentDatetimeCode();
	
	console.log(`Generating backup (${current_datetime})`);
	
	makeSureFolderExists(BACKUPS_FOLDER);
	makeSureFolderExists(UPLOADS_FOLDER);
	
	//generate folder according to current datetime
	let current_backup_path = path.join( BACKUPS_FOLDER, current_datetime );
	
	//backup uploads folder
	copyFolderSync(UPLOADS_FOLDER, current_backup_path);
	
	//backup mongodb
	let credentials = getCredentials();
	executeCommand(`mongodump -u ${credentials.USERNAME} -p ${credentials.PASSWORD} --authenticationDatabase=${
		credentials.USERNAME} -d ${credentials.DB_NAME} -o ${current_backup_path}`).catch(console.error);
	
	console.log('Backup complete');
	if(repeat_after > 0) {
		console.log('Next backup scheduled on', new Date(Date.now() + repeat_after).toLocaleString());
		setTimeout(() => doBackup(repeat_after), repeat_after);
	}
}

export default {
	doRegularly(interval: number) {
		try {
			doBackup(interval);
		}
		catch(e) {
			console.error(e);
		}
	}
}