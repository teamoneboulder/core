<?php
	class VOICE{
		public static $id='';
		public static function handleRequest($r){
			$d=phi::ensure($r,['message']);
			$d['message']=strtolower($d['message']);
			$action=self::getAction($d['message']);
			switch ($action['intent']['id']) {
				case 'human_design_generators':
					$out['message']='Here is what I found';
					$out['results']=db2::toOrderedList(db2::find(DB,'user_profiles',['humandesign.data'=>['$regex'=>'> Generator']]));
					$out['results']=db2::graph(DB,$out['results'],[
						'id'=>[
							'to'=>'user',
							'coll'=>'user',
							'match'=>'id',
							'fields'=>['id'=>1,'name'=>1,'pic'=>1]
						]
					]);
					foreach($out['results']['list'] as $k=>$v){
						$out['results']['list'][$k]['_template']='audio_human_design';
					}
				break;
				case 'human_design_manifesting_generators':
					$out['message']='Here is what I found';
					$out['results']=db2::toOrderedList(db2::find(DB,'user_profiles',['humandesign.data'=>['$regex'=>'> Manifesting Generator']]));
					$out['results']=db2::graph(DB,$out['results'],[
						'id'=>[
							'to'=>'user',
							'coll'=>'user',
							'match'=>'id',
							'fields'=>['id'=>1,'name'=>1,'pic'=>1]
						]
					]);
					foreach($out['results']['list'] as $k=>$v){
						$out['results']['list'][$k]['_template']='audio_human_design';
					}
				break;
				case 'human_design_projectors':
					$out['message']='Here is what I found';
					$out['results']=db2::toOrderedList(db2::find(DB,'user_profiles',['humandesign.data'=>['$regex'=>'Projector']]));
					$out['results']=db2::graph(DB,$out['results'],[
						'id'=>[
							'to'=>'user',
							'coll'=>'user',
							'match'=>'id',
							'fields'=>['id'=>1,'name'=>1,'pic'=>1]
						]
					]);
					foreach($out['results']['list'] as $k=>$v){
						$out['results']['list'][$k]['_template']='audio_human_design';
					}
				break;
				case 'human_design_manifestors':
					$out['message']='Here is what I found';
					$out['results']=db2::toOrderedList(db2::find(DB,'user_profiles',['humandesign.data'=>['$regex'=>'Manifestor']]));
					$out['results']=db2::graph(DB,$out['results'],[
						'id'=>[
							'to'=>'user',
							'coll'=>'user',
							'match'=>'id',
							'fields'=>['id'=>1,'name'=>1,'pic'=>1]
						]
					]);
					foreach($out['results']['list'] as $k=>$v){
						$out['results']['list'][$k]['_template']='audio_human_design';
					}
				break;
				case 'human_design_reflectors':
					$out['message']='Here is what I found';
					$out['results']=db2::toOrderedList(db2::find(DB,'user_profiles',['humandesign.data'=>['$regex'=>'Reflector']]));
					$out['results']=db2::graph(DB,$out['results'],[
						'id'=>[
							'to'=>'user',
							'coll'=>'user',
							'match'=>'id',
							'fields'=>['id'=>1,'name'=>1,'pic'=>1]
						]
					]);
					foreach($out['results']['list'] as $k=>$v){
						$out['results']['list'][$k]['_template']='audio_human_design';
					}
				break;
				case 'sun_sign':
					//die(json_encode($action['intent']));
					if(isset($action['intent']['variables']['sign'])&&$action['intent']['variables']['sign']){
						$out['message']='Here is what I found';
						$out['results']=db2::toOrderedList(db2::find(DB,'user',['birthday.sign'=>$action['intent']['variables']['sign']],['projection'=>['name'=>1,'pic'=>1,'id'=>1]]));
						foreach($out['results']['list'] as $k=>$v){
							$out['results']['list'][$k]['_template']='audio_sunsign';
						}
					}
				break;
				case 'hd_gate':
					//die(json_encode($action['intent']));
					if(isset($action['intent']['variables']['gate'])&&$action['intent']['variables']['gate']){
						$out['message']='Here is what I found';
						$res=db2::toOrderedList(db2::find(DB,'user_profiles',['humandesign.profile.gates'=>['$in'=>[$action['intent']['variables']['gate']]]]));
						if($res){
							foreach($res['list'] as $k=>$v){
								$uids[]=$v['id'];
							}
							$out['results']=db2::toOrderedList(db2::find(DB,'user',['id'=>['$in'=>$uids]],['projection'=>['name'=>1,'pic'=>1,'id'=>1]]));
						}
						foreach($out['results']['list'] as $k=>$v){
							$out['results']['list'][$k]['_template']='audio_user';
						}
					}
				break;
			}
			if(!isset($out)) $out['message']='I Dont Know';
			return ['success'=>true,'data'=>$out];
		}
		public static function getAction($message){
			$match=[
				'human_design_manifestors'=>[
					'match'=>[
						['who','are','is','list'],
						['human design'],
						['manifestors','manufacturers','manufacturer']
					],
					'prompt'=>'Who are human design Manifestors?'
				],
				'human_design_reflectors'=>[
					'match'=>[
						['who','are','is','list'],
						['human design'],
						['reflectors']
					],
					'prompt'=>'Who are human design Reflectors?'
				],
				'human_design_projectors'=>[
					'match'=>[
						['who','are','is','list'],
						['human design'],
						['projectors']
					],
					'prompt'=>'Who are human design Proejcts?'
				],
				'human_design_manifesting_generators'=>[
					'match'=>[
						['who','are','is','list'],
						['human design'],
						['manfesting generator','manifesting generators']
					],
					'prompt'=>'Who are human design Manifesting Generators?'
				],
				'human_design_generators'=>[
					'match'=>[
						['who','are','is','list'],
						['human design'],
						['generator']
					],
					'prompt'=>'Who are human design Generators?'
				],
				'sun_sign'=>[
					'match'=>[
						['who'],
						['is','has'],
						['aquarius','pisces','aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn'],
						['sun sign']
					],
					'action'=>'getSunSign',
					'prompt'=>'Who as a [sign] sun sign?'
				],
				'hd_gate'=>[
					'match'=>[
						['who'],
						['has'],
						['human design'],
						['gate','gates']
					],
					'action'=>'getGateNumber',
					'prompt'=>'Who as a human design gate of fifteen'
				],
				// 'skills'=>[
				// 	'match'=>[
				// 		['who','are','is','list'],
				// 		['skills']
				// 	],
				// 	'getVariables'=>static function($message){//how does this work?!?!
				// 		return ['ok'];
				// 	}
				// ]
			];
			foreach($match as $k => $v){
				$mc=0;
				foreach($v['match'] as $tk =>$tv){
					$c=0;
					$cc=0;
					foreach($tv as $mk => $mv){
						if(strpos($message, $mv)!==false){
							$c++;
							$cc+=strlen($mv);
						}
					}
					if($c){
						$mc+=1;
					}
				}
				$results[$k]=[
					'id'=>$k,
					'score'=>($mc/sizeof($v['match']))*100+($cc/strlen($message)),
					'data'=>$v
				];
			}
			//sort!!!!
			$order=phi::sort($results,[
				'keyOn'=>'id',
				'reverse'=>1,
				'key'=>'score',
				'type'=>'number'
			]);
			$sorted=[
				'order'=>$order,
				'list'=>$results
			];
			$first=$sorted['list'][$sorted['order'][0]];
			if($first['score']>80){
				if(isset($first['data']['action'])) $first['variables']=self::{$first['data']['action']}($message,$tv);
				$sorted['intent']=$first;
			}else{
				$sorted['intent']=[
					'id'=>'unknown'
				];
			}
			#die(json_encode($sorted));
			return $sorted;
		}
		public static function getGateNumber($message,$opts){
			$numbers=['one'=>1,'two'=>2,'too'=>2,'to'=>2,'three'=>3,'four'=>4,'five'=>5,'six'=>6,'seven'=>7,'eight'=>8,'nine'=>9,'ten'=>10,'eleven'=>11,'twelve'=>12,'thirteen'=>13,'fourteen'=>14,'fifteen'=>15,'sixteen'=>16,'seventeen'=>17,'eighteen'=>18,'nineteen'=>19,'twenty'=>20,'twenty one'=>21,'twenty two'=>22,'twenty three'=>23,'twenty four'=>24,'twenty five'=>25,'twenty six'=>26,'twenty seven'=>27,'twenty eight'=>28,'twenty nine'=>29,'thirty'=>30,'thirty one'=>31,'thirty two'=>32,'thirty three'=>33,'thirty four'=>34,'thirty five'=>35,'thirty six'=>36,'thirty seven'=>37,'thirty eight'=>38,'thirty nine'=>39,'fourty'=>40,'fourty one'=>41,'fourty two'=>42,'fourty three'=>43,'fourty four'=>44,'fourty five'=>45,'fourty six'=>46,'fourty seven'=>47,'fourty eight'=>48,'fourty nine'=>49,'fifty'=>50,'fifty one'=>51,'fifty two'=>52,'fifty three'=>53,'fifty four'=>54,'fifty five'=>55,'fifty six'=>56,'fifty seven'=>57,'fifty eight'=>58,'fifty nine'=>59,'sixty'=>60,'sixty one'=>61,'sixty two'=>62,'sixty three'=>63,'sixty four'=>64,1=>1,2=>2,3=>3,4=>4,5=>5,6=>6,7=>7,8=>8,9=>9,10=>10,11=>11,12=>12,13=>13,14=>14,15=>15,16=>16,17=>17,18=>18,19=>19,20=>20,21=>21,22=>22,23=>23,24=>24,25=>25,26=>26,27=>27,28=>28,29=>29,30=>30,31=>31,32=>32,33=>33,34=>34,35=>35,36=>36,37=>37,38=>38,39=>39,40=>40,41=>41,42=>42,43=>43,44=>44,45=>45,46=>46,47=>47,48=>48,49=>49,50=>50,51=>51,52=>52,53=>53,54=>54,55=>55,56=>56,57=>57,58=>58,59=>59,60=>60,61=>61,62=>62,63=>63,64=>64];
			$keys=array_reverse(array_keys($numbers));
			#die(json_encode($keys));
			$number='';
			foreach($keys as $k => $v){
				if(strpos($message, $v.'')!==false&&!$number){
					$number=$numbers[$v];
				}
			}
			return [
				'gate'=>$number
			];
		}
		public static function getSunSign($message,$opts){
			$signs=['aquarius','pisces','aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn'];
			$sign='';
			foreach($signs as $k=>$v){
				if(strpos($message, $v)!==false) $sign=$v;
			}
			return [
				'sign'=>$sign
			];
		}
		public static function search($r){
			
		}
	}
?>