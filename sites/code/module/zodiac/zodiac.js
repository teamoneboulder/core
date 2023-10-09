if(!window.modules) window.modules={};
modules.zodiac={
	order:['aquarius','pisces','aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn'],
	map:{
		aries:{
			id:'aries',
			name:'Aries',
			start:{
				month:3,
				day:21
			},
			end:{
				month:4,
				day:19
			}
		},
		taurus:{
			id:'taurus',
			name:'Taurus',
			start:{
				month:4,
				day:20
			},
			end:{
				month:5,
				day:20
			}
		},
		gemini:{
			id:'gemini',
			name:'Gemini',
			start:{
				month:5,
				day:21
			},
			end:{
				month:6,
				day:20
			}
		},
		cancer:{
			id:'cancer',
			name:'Cancer',
			start:{
				month:6,
				day:21
			},
			end:{
				month:7,
				day:22
			}
		},
		leo:{
			id:'leo',
			name:'Leo',
			start:{
				month:7,
				day:23
			},
			end:{
				month:8,
				day:22
			}
		},
		virgo:{
			id:'virgo',
			name:'Virgo',
			start:{
				month:8,
				day:23
			},
			end:{
				month:9,
				day:22
			}
		},
		libra:{
			id:'libra',
			name:'Libra',
			start:{
				month:9,
				day:23
			},
			end:{
				month:10,
				day:22
			}
		},
		scorpio:{
			id:'scorpio',
			name:'Scorpio',
			start:{
				month:10,
				day:23
			},
			end:{
				month:11,
				day:21
			}
		},
		sagittarius:{
			id:'sagittarius',
			name:'Sagittarius',
			start:{
				month:11,
				day:22
			},
			end:{
				month:12,
				day:21
			}
		},
		capricorn:{
			id:'capricorn',
			name:'Capricorn',
			start:{
				month:12,
				day:22
			},
			end:{
				month:1,
				day:19
			}
		},
		aquarius:{
			id:'aquarius',
			name:'Aquarius',
			start:{
				month:1,
				day:20
			},
			end:{
				month:2,
				day:18
			}
		},
		pisces:{
			id:'pisces',
			name:'Pisces',
			start:{
				month:2,
				day:19
			},
			end:{
				month:3,
				day:20
			}
		}
	},
	getDateRange:function(sign_id){
		var self=this;
		var sign=self.map[sign_id];
		var smonth=moment().month(sign.start.month-1).format("MMM");
		var start=smonth+ ' '+sign.start.day;
		var dmonth=moment().month(sign.end.month-1).format("MMM");
		return start+' to '+dmonth+ ' '+sign.end.day
	},
	getSign:function(date_ts){
		var self=this;
		var date=new Date(date_ts);
		var month=date.getMonth()+1;//0-11
		var day=date.getDate();
		var sign='';
		$.each(self.map,function(i,v){
			if(self.isAfter(month,day,v)&&self.isBefore(month,day,v)){
				sign=i;
			}
		})
		return sign;
	},
	isAfter:function(m,d,sign){
		if(m>sign.start.month) return true;
		if(m==sign.start.month&&d>=sign.start.day) return true;
		if(sign.start.month==12&&m==1) return true;
		return false;
	},
	isBefore:function(m,d,sign){
		if(m<sign.end.month) return true;
		if(m==sign.end.month&&d<=sign.end.day) return true;
		if(sign.end.month==1&&m==12) return true;
		return false;
	}
}