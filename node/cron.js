var cron = require('node-cron');
var tools = require('./tools.js');
const { exec } = require('child_process');
tools.init();
console.log('STARTING CRON VERSION [1.0]')
tools.dblog('Initializing Cron Version [1.0]');
tools.service.start('cron.js');
// cron.schedule('0 6 1 * *',()=>{//run at 6am on the first of every month!
// //cron.schedule('* * * * *',()=>{//run every minute (for testing)
// 	tools.dblog('***Run Distribution***',function(){
// 		exec('admin distribute',function(err,stdout,stderr){
// 			 if (err) {
// 			    console.error(`exec error: ${err}`);
// 			    tools.dblog('***ERROR running Distribution ['+err+']***',function(){})
// 			    return;
// 			  }else{
// 				tools.dblog('***SUCCESSFULLY Ran Distribution***',function(){
// 					console.log('***SUCCESSFULLY Ran Distribution***')
// 				})
// 			}
// 		})
// 	})
// },{
// 	timezone: "America/Denver"
// })
cron.schedule('0 1 * * *', () => {
	tools.dblog('**** Restarting chat.io.js *****',function(){
		exec('forever restart /var/www/'+tools.conf.project+'/sites/chatter/chat.io.js',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR restarting chat.io.js ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran restarting chat.io.js***',function(){
					console.log('***SUCCESSFULLY Ran restarting chat.io.js***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
cron.schedule('0 2 * * *', () => {
	tools.dblog('**** Calculating Daily Stats *****',function(){
		exec('admin stats',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR calculating stats ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran calculating stats***',function(){
					console.log('***SUCCESSFULLY Ran calculating stats***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
/// user_stats_cache - daily
// cron.schedule('0 2 * * *', () => {
// 	tools.dblog('**** Calculating user_stats_cache *****',function(){
// 		exec('/usr/bin/node /var/www/one-core/node/exportdata.js',function(err,stdout,stderr){
// 			 if (err) {
// 			    console.error(`exec error: ${err}`);
// 			    tools.dblog('***ERROR user_stats_cache ['+err+']***',function(){})
// 			    return;
// 			  }else{
// 				tools.dblog('***SUCCESSFULLY Ran user_stats_cache***',function(){
// 					console.log('***SUCCESSFULLY Ran user_stats_cache***')
// 				})
// 			}
// 		})
// 	})
// },{
// 	timezone: "America/Denver"
// })
cron.schedule('0 14 1 * *', () => {//run at 2pm on the first day of the month
	tools.dblog('**** Running notifications for players *****',function(){
		exec('admin notifyplayers',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR nofityplayers ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran nofityplayers***',function(){
					console.log('***SUCCESSFULLY Ran nofityplayers***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
cron.schedule('0 1 * * *', () => {
	tools.dblog('**** Running Prepay Calc *****',function(){
		exec('admin ensureprepaytime',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR prepay calc ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran prepay calc***',function(){
					console.log('***SUCCESSFULLY Ran prepay calc***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
cron.schedule('0 2 * * *', () => {
	tools.dblog('**** Restarting api2.js *****',function(){
		exec('forever restart /var/www/'+tools.conf.project+'/node/api2.js',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR restarting api2.js ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran restarting api2.js***',function(){
					console.log('***SUCCESSFULLY Ran restarting api2.js***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
cron.schedule('0 3 * * *', () => {
	tools.dblog('**** Restarting notifier.js *****',function(){
		exec('forever restart /var/www/'+tools.conf.project+'/node/notifier.js',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR restarting notifier.js ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran restarting notifier.js***',function(){
					console.log('***SUCCESSFULLY Ran restarting notifier.js***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
cron.schedule('0 6 * * *', () => {
	tools.dblog('**** admin checkeventpayout *****',function(){
		exec('admin checkeventpayout',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR admin checkeventpayout ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran admin checkeventpayout***',function(){
					console.log('***SUCCESSFULLY Ran admin checkeventpayout***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
cron.schedule('0 4 * * *', () => {
	tools.dblog('**** Restarting jobs.js *****',function(){
		exec('forever restart /var/www/'+tools.conf.project+'/node/jobs.js',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR restarting jobs.js ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran restarting jobs.js***',function(){
					console.log('***SUCCESSFULLY Ran restarting jobs.js***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
cron.schedule('0 6 * * *', () => {
	tools.dblog('Building News',function(){
		exec('admin buildnews',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR build news ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran build news***',function(){
					console.log('***SUCCESSFULLY Ran build news***')
				})
			}
		})
	});
},{
	timezone: "America/Denver"
});
cron.schedule('0 5 1 * *',()=>{//run at 1st of month at 7am
	tools.dblog('***calc invoices first of month!***',function(){
		exec('admin calculateinvoices',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR calc invoices first of month ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran calc invoices first of month***',function(){
					console.log('***SUCCESSFULLY Ran calc invoices first of month***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
});
cron.schedule('0 5 15 * *',()=>{//run on 15th of month at 7am
	tools.dblog('***calc invoices midway of month!***',function(){
		exec('admin calculateinvoices',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR calc invoices midway of month ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran calc invoices midway of month***',function(){
					console.log('***SUCCESSFULLY Ran calc invoices midway of month***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
});
// cron.schedule('5 * * * *',()=>{//run at 5 minutes
// 	tools.dblog('***forever!***',function(){
// 		exec('admin forever',function(err,stdout,stderr){
// 			 if (err) {
// 			    console.error(`exec error: ${err}`);
// 			    tools.dblog('***ERROR forever ['+err+']***',function(){})
// 			    return;
// 			  }else{
// 				tools.dblog('***SUCCESSFULLY Ran forever***',function(){
// 					console.log('***SUCCESSFULLY Ran forever***')
// 				})
// 			}
// 		})
// 	})
// })
cron.schedule('0 4 * * *',()=>{//run at 4am every day
	tools.dblog('***calchotplayers!***',function(){
		exec('admin calchotplayers',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR calchotplayers ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Ran calchotplayers***',function(){
					console.log('***SUCCESSFULLY Ran calchotplayers***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
// cron.schedule('0 14 * * *',()=>{//run at 2pm every day
// 	tools.dblog('***broadcastevents!***',function(){
// 		exec('admin broadcastevents',function(err,stdout,stderr){
// 			 if (err) {
// 			    console.error(`exec error: ${err}`);
// 			    tools.dblog('***ERROR broadcastevents ['+err+']***',function(){})
// 			    return;
// 			  }else{
// 				tools.dblog('***SUCCESSFULLY Ran broadcastevents***',function(){
// 					console.log('***SUCCESSFULLY Ran broadcastevents***')
// 				})
// 			}
// 		})
// 	})
// },{
// 	timezone: "America/Denver"
// })
cron.schedule('0 3 * * *',()=>{//run at 3am every day
	tools.dblog('***Check User Account Status!***',function(){
		exec('admin checkstatus',function(err,stdout,stderr){
			 if (err) {
			    console.error(`exec error: ${err}`);
			    tools.dblog('***ERROR Check User Account Status ['+err+']***',function(){})
			    return;
			  }else{
				tools.dblog('***SUCCESSFULLY Check User Account Status***',function(){
					console.log('***SUCCESSFULLY Check User Account Status***')
				})
			}
		})
	})
},{
	timezone: "America/Denver"
})
cron.schedule('0 2 */3 * *',()=>{//run at 2am every 3rd day
	tools.dblog('***Backup!***',function(){
		if(tools.settings.prod){
			exec('admin backup',{maxBuffer: 1024 * 1024*10},function(err,stdout,stderr){//10mb
				 if (err) {
				    console.error(`exec error: ${err}`);
				    tools.dblog('***ERROR running backup ['+err+']***',function(){})
				    return;
				  }else{
					tools.dblog('***SUCCESSFULLY Ran backup***',function(){
						console.log('***SUCCESSFULLY Ran backup***')
					})
				}
			})
		}else{
			tools.dblog('***Backup disabled in dev***',function(){

			})
		}
	})
},{
	timezone: "America/Denver"
})
