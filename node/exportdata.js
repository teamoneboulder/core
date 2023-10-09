var tools = require('./tools.js');
var async = require('async');
var mongodb = require('mongo-dbx');//https://github.com/chrisemunt/mongo-dbx
var _ = require('underscore');
const recLimitForTesting = 0; /// 0 for all

module.exports.init = function () {
	console.log('run!')
	var db = new mongodb.server();
	tools.init();

	var dbconn = db.open({address: 'localhost', port:27017});

	var result = db.find('one.user', {});
	// var result = db.find('one.user', {id:'UIAMPLAYER1'});//1 person for test
	//returns
	//{
		//ok:1,
		//data:[{item1},{item2}]
	//}

	/// to convert to a human readable format and from PHP time to milliseconds
	function dateFormat(x)
	{
		if(x && x.ts) x = x.ts; /// So we can pass the date object and use the "ts" property
		if(x) x = new Date(x * 1000);
		if(x)
			return x.toJSON();
		else
			return '';
	}

	/// money is in cents format
	function moneyFormat(x)
	{
		if(x) x = x / 100;
		return x;
	}

	function getUserData(user){
		//console.log(user);

		
		var data=_.pick(user, 'id', 'name', 'email', 'level', 'skills');


		// "status": {
		//         "active": true,
		//         "amount": 2200,
		//         "overdue": false,
		//         "stopped": false,
		//         "validUntil": 1671140569
		if(user.status) 
		{
			data.status_active = user.status.active ? 1 : 0;
			data.status_monthly_amount = user.status.amount ? moneyFormat(user.status.amount) : 0;
			data.status_validUntil = dateFormat(user.status.validUntil);
		}

		/// Convert Dates:
		/// 

		/// "refered_type": "user" vs "page" = refered_by
		if(user.refered_by_info && user.refered_by_info.name) data.refered_by = user.refered_by_info.name;

		//last time seen on platform (user.la)
		data.last_access = dateFormat(user.la);
		// console.log('user.la: ' + user.la + ' - data.last_access: ' + data.last_access)

		//Explorer Start Date (creation of account, in user profile)
		data.explorer_start_date=(user.created)?dateFormat(user.created):'';
		
		//player start time [membership.one_boulder => start time])
		data.player_start_time='';
		//ONE|Pass Subscriber Start Date (current_subscription_info [membership.one_pass => start time])
		data.one_pass_start_time='';
		//Services Directory Provider Start Date (current_subscription_info [membership.services => start time])
		data.service_start_time='';
		//Producer Start Date (current_subscription_info [membership.producer => start time])
		data.producer_start_time='';
		//Subscription end date for all of the above //may or may not exist.  current_subscription_info will have a [canceled] set
		data.subscription_end_time='';

		var result = db.find('one.current_subscription_info', {"page.id":user.id});
		if(result.data[0]){
			//Player Start Date (current_subscription_info [membership.one_boulder => start time])
			//player start time [membership.one_boulder => start time])		
			if(result.data[0].membership.one_boulder) data.player_start_time=dateFormat(result.data[0].membership.one_boulder);
			
			//ONE|Pass Subscriber Start Date (current_subscription_info [membership.one_pass => start time])
			if(result.data[0].membership.one_pass) data.one_pass_start_time=dateFormat(result.data[0].membership.one_pass);
			
			//Services Directory Provider Start Date (current_subscription_info [membership.services => start time])
			if(result.data[0].membership.services) data.service_start_time=dateFormat(result.data[0].membership.services);
			
			//Producer Start Date (current_subscription_info [membership.producer => start time])
			if(result.data[0].membership.events) data.producer_start_time=dateFormat(result.data[0].membership.events);
			
			//Subscription end date for all of the above //may or may not exist.  current_subscription_info will have a [canceled] set
			if(result.data[0].canceled) data.subscription_end_time=dateFormat(result.data[0].canceled);
		}
		//console.log(result)

		/// user_settings
		result = db.find('one.user_settings', {"id":user.id});

		// 	email": {
	    //     "gift": "0",
	    //     "updates": "0",
	    //     "requests": "0",
	    //     "music_stream": "0",
	    //     "comment": "0",
	    //     "comment_mention": "0",
	    //     "comment_reply": "0",
	    //     "event_invite": "0"
	    // },

		if(result.data[0]){
			var user_settings = result.data[0];

			if(user_settings.email)
			{
				//Email Opt-Out /user_settings [email.event_invite] (1 or 0)
				data.email_opt_updates = user_settings.email.updates;
				data.email_opt_event_invite = user_settings.email.event_invite;
			}
		}

		
		//# of events hosted (search event table for {"$or":[{"page.id":user.id},{"cohost":{"$in":[user.id]}}])
		result = db.find('one.event', {"$or":[{"page.id":user.id},{"cohost":{"$in":[user.id]}}]});
		data.events_hosted_num = (result.data ? result.data.length : 0);

		//# of tickets purchased (ticket_receipt lookup {"page.id":user.id})
		result = db.find('one.ticket_receipt', {"purchaser.id":user.id});
		data.tickets_purchased_num = (result.data ? result.data.length : 0);

		/// ? ticket "total" for the sum of the "tickets_purchased_sum_amount"


		//Total # of logins (does not exist)

		//Get metrics for how many people use the app.oneboulder.one web view vs mobile site. Who uses both? - Juicy tracking page loads in the app vs web (look up token collection, iterate, if ua_info.device=='iOS' || ua_info.deviec=="android" : mobile, or web if not)

		//Get metrics for how many people see each post on the app in the homepage - heavy data analytics side, (seen by x people; in the post) (does not exist right now)

		//What percentage of web viewers download the app? - 

		//how many people click the link to view the app download page (not right now)

		//how many times are people logging in and viewing things in the last 30 days? (dashboard..dont have log in count, otherwise will be count of token in that time period)

		//Total referrals of other people to the platform (one_admin.api file line 3197 in php)

		return data;
	}

	var out=[];
	for (var i = 0; i < result.data.length; i++) {
		if(recLimitForTesting && recLimitForTesting > 0 && i>recLimitForTesting) break;
		var user=result.data[i];
		var data=getUserData(user);
		out.push(data);
		/// 
	}

	//console.log(out);

	var dbTblNm = "one.user_stat_cache"

	/// remove the old stats
 	var result = db.remove(dbTblNm, {});

	//cashe stats in DB
	var result = db.insert_batch(dbTblNm, out);
	//console.log(result);
	process.exit(0);

}
module.exports.init()