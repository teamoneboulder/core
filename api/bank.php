<?php
	class bank{
		public static $bank_id='one_boulder';
		public static function handleRequest($r){
			switch ($r['path'][4]) {
				case 'transaction':
					switch ($r['path'][5]) {
						case 'send':
							$out=self::sendTransaction($r);
						break;
					}
				break;
				default:
					$out=array('error'=>'invalid_method');
				break;
			}
			if(!isset($out)) $out=array('error'=>'invalid_method');
			return $out;
		}
		public static function getBalance($uid){
			$b=db2::findOne(DB,'bank_balance',array('id'=>$uid));
			if(!$b) return 0;
			return $b['balance'];
		}
		public static function setBalance($uid){
			$balance=self::calcBalance($uid);
			db2::update(DB,'bank_balance',array('id'=>$uid),array('$set'=>array('balance'=>$balance)));
			return true;
		}
		public static function refund($authority,$tx_id,$refund_id=false){
			$transaction=db2::findOne(DB,'transaction',array('id'=>$tx_id));
			if(!$transaction){
				phi::log('invalid transaction to refund ['.$tx_id.']');
				return false;
			}
			if(!isset($transaction['refund'])){
				$refund=array('by'=>$authority,'ts'=>time());
				if($refund_id) $refund['refund_id']=$refund_id;
				//phi::log('refund '.json_encode($refund));
				db2::update(DB,'transaction',array('id'=>$tx_id),array('$set'=>array('refund'=>$refund)));
				self::setBalance($transaction['to']['id']);
				self::setBalance($transaction['from']['id']);
			}
		}
		public static function reverseTransaction($tx_id,$by,$delete=false){
			$transaction=db2::findOne(DB,'transaction',array('id'=>$tx_id));
			if(!$transaction) return array('error'=>'invalid_transaction');
			//die(json_encode($transaction));
			db2::update(DB,'bank_balance',array('id'=>$transaction['to']['id']),array('$inc'=>array('balance'=>-$transaction['amount'])),array('upsert'=>true));
			db2::update(DB,'bank_balance',array('id'=>$transaction['from']['id']),array('$inc'=>array('balance'=>$transaction['amount'])),array('upsert'=>true));
			if(false&&isset($transaction['fees'])){//keep fees?
				db2::update(DB,'bank_balance',array('id'=>self::$bank_id),array('$inc'=>array('balance'=>-$transaction['fees'])),array('upsert'=>true));
			}
			if($delete){
				db2::remove(DB,'transaction',array('id'=>$tx_id));
			}else{
				db2::update(DB,'transaction',array('id'=>$tx_id),array('$set'=>array('reversed'=>array(
					'ts'=>time(),
					'by'=>$by
				))));
			}
			return array('success'=>true);
		}
		public static function charge($charge){
			switch($charge['type']){
				case 'usd':
					include_once(ROOT.'/api/stripe.php');
					$resp=stripe::chargeCard($charge['data']);
					$resp['payment_id']=$resp['payment_info_id'];
				break;
				default:
					return false;
				break;
			}
			return $resp;
		}
		public static function getMethods($uid){
			include_once(ROOT.'/api/stripe.php');
			//usd
			$data['usd']=stripe::getMethods($uid);
			return $data;
		}
		public static function sendTransaction($r){
			$d=phi::ensure($r,array('to','from','amount'),1,array('self::write::bank'));
			$amount=(int) $d['amount'];
			if($d['to'][0]=='G') $type1='page';
			else $type1='user';
			if($d['from'][0]=='G') $type2='page';
			else $type2='user';
			return self::addTransaction(array(
				'to'=>array('id'=>$d['to'],'type'=>$type1),
				'from'=>array('id'=>$d['from'],'type'=>$type2),
				'amount'=>$amount,
				'description'=>'Money from chat'
			));
		}
		public static function addTransaction($transaction,$silent=false){
			if(self::hasFunds($transaction['from']['id'],$transaction['amount'])){
				if(isset($transaction['absorb'])&&$transaction['absorb']){
					$transaction['amount']-=$transaction['fees'];
				}
				$transaction=ONE_CORE::save('transaction',$transaction);
				if(isset($transaction['id'])){
					$transfer=$transaction['amount'];
					if(isset($transaction['fees'])){
						$data=$transaction['amount']+$transaction['fees'];
					}else{
						$data=$transaction['amount'];
					}
					//phi::log('transfer: '.$transfer. ' charge: '.$data);
					db2::update(DB,'bank_balance',array('id'=>$transaction['to']['id']),array('$inc'=>array('balance'=>$transfer)),array('upsert'=>true));
					db2::update(DB,'bank_balance',array('id'=>$transaction['from']['id']),array('$inc'=>array('balance'=>-$data)),array('upsert'=>true));
					if(isset($transaction['fees'])){
						db2::update(DB,'bank_balance',array('id'=>self::$bank_id),array('$inc'=>array('balance'=>$transaction['fees'])),array('upsert'=>true));
					}
					phi::log('Successfull Transaction ['.json_encode($transaction).']');
					//notify!
					// if(!$silent&&$transaction['from']['id']!=$transaction['to']['id']) ONE_CORE::notify($transaction['from']['id'],$transaction['to']['id'],'bank_transaction',array(
					// 	'id'=>$transaction['id']
					// ));
					return array('success'=>true,'transaction'=>$transaction);
				}else{
					return array('error'=>'failed to create transaction');
				}
			}else{
				return array('error'=>'insufficient_funds');
			}
		}
		public static function calcBalance($uid){
			$transactions=db2::toList(db2::find(DB,'transaction',array('$or'=>array(array('from.id'=>$uid),array('to.id'=>$uid)))));
			$balance=0;
			foreach ($transactions as $k => $v) {
				if(!isset($v['refund'])){
					if($v['to']['id']==$uid){
						$balance+=$v['amount'];
					}
					if($v['from']['id']==$uid){
						$balance-=$v['amount'];
						if(isset($v['fees'])){
							$balance-=$v['fees'];
						}
					}
				}
			}
			return $balance;
		}
		public static function hasFunds($identity,$amount){
			if($identity==self::$bank_id) return true;//assume bank always has money..for now
			return true;//anybody for now until we get credit system
			$balance=db2::findOne(DB,'bank_balance',array('id'=>$identity));
			if(!$balance) return false;
			//$settings=db2::findOne(DB,'bank_settings',array('id'=>$identity));
			//settings here could be a setting for how much credit we may want to give
			if($balance['balance']>$amount) return true;
			return false;
		}
	}
?>