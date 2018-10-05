"use strict";(function(){var body_loader=null;function onUserNotFound(){$$("#user_info_error").setText("User not found")}function loadUserInfo(id,games_page){$$("#user_nickname").addChild(body_loader=COMMON.createLoader());$$.postRequest("/user_info",{id:id,fetch_games:true,page:games_page},function(raw_res){if(body_loader)body_loader.remove();if(raw_res===undefined){$$("#user_info_error").setText("Incorrect server response");return}var res=JSON.parse(raw_res);if(res.result!=="SUCCESS"){$$("#user_info_error").setText("User not found");
return}var extract=function(key){return res[key]};var entries={user_nickname:"NICK",user_register_date:"REGISTER_DATE",user_last_seen_date:"LAST_SEEN"};for(var entry_name in entries)$$("#"+entry_name).setText(extract(entries[entry_name]));try{$$("#user_level").setText(JSON.parse(res.CUSTOM_DATA).level);$$("#user_rank").setText((JSON.parse(res.CUSTOM_DATA).rank||1E3)|0)}catch(e){$$("#user_info_error").setText("Incorrect CUSTOM_DATA format");console.error(e)}if(res.GAMES===undefined||res.GAMES.length===
0)$$("#last_games_preview").setText("No games in history").setStyle({"display":"inline-block"});else{var games_table=COMMON.createGamesList(res.GAMES,id|0);if(res.total_games>res.rows_per_page){var pages_container=COMMON.createPagesRow(res.total_games,res.rows_per_page,res.page,"/user/"+id+"?page\x3d");games_table.addChild($$.create("TR").addChild(pages_container))}$$("#last_games_preview").setStyle({"display":"inline-grid"}).addChild(games_table)}})}$$.load(function(){var current_page=0;try{current_page=
parseInt(location.href.match(/\?page=([0-9]+)/i)[1])}catch(e){}try{var id=document.location.href.match(/user\/([0-9]+)[^0-9]*/i)[1];loadUserInfo(Number(id),current_page)}catch(e){console.log("?");onUserNotFound()}})})();