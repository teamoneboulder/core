<?php
	class shop{
		public static function getProduct($store,$obj){//will eventually include things like discounts
			$p=db2::findOne($store,'products',array('id'=>$obj['id']));
			if($p) return $p;
			else return array('error'=>'invalid_product ['.$obj['id'].']');
		}
		public static function getProducts($store){//will eventually include things like discounts
			$p=db2::find($store,'products',array());
			foreach ($p as $k => $tp) {
				$products[$tp['_id']]=$tp;
			}
			return $products;
		}
		public static function getOrderedProducts($store,$sort=false,$active=true){//will eventually include things like discounts
			if($sort){
				$tosort=array('sort'=>$sort);
			}else $tosort=array();
			if($active=='active') $q=array('available'=>true);
			else if($active==false) $q=array('available'=>false);
			else if($active='all') $q=array();
			else $q=array();
			return db2::toOrderedList(db2::find($store,'products',$q,$tosort));
		}
		public static function loadCartInfo($store,$cart){
			$cart['total']=0;
			foreach ($cart['items'] as $k => $v) {
				$cart['items'][$k]['info']=self::getProduct($store,$v);
				$cart['total']+=(float) $cart['items'][$k]['info']['price'];
			}
			return $cart;
		}
		public static function rebuildStats($store,$type){
			$orders=db2::toList(db2::find($store,$type,array()));
			$stats=array(
				'sales'=>array(),
				'total'=>0,
				'fees'=>0,
				'net'=>0
			);
			foreach ($orders as $k => $o) {
				foreach ($o['items'] as $k => $v) {
					if(!isset($stats['sales'][$v['id']])) $stats['sales'][$v['id']]=0;
					$stats['sales'][$v['id']]=$stats['sales'][$v['id']]+$v['quantity'];
					$t=(float) $o['amount'];
					$f=(float) $o['fees'];
					$stats['total']+=$t;
					$stats['fees']+=$f;
					$stats['net']+=($t-$f);
				}
			}
			//fix prod data!
			if(phi::$conf['prod']){
				//2500
				// $stats['total']+=2500;
				// $stats['fees']+=(2500*.027+.3);
				// $stats['net']+=(2500-(2500*.027+.3));
				//additional cost here i guess...
				$stats['net']+=-5.85;
				//50
				$stats['total']+=50;
				$stats['fees']+=(50*.027+.3);
				$stats['net']+=(50-(50*.027+.3));
				//refund of 85
				$stats['total']+=85;
				$stats['fees']+=2.77;
				$stats['net']+=-2.77;
			}
			//save it!
			$stats['id']=$type;
			$stats['tsu']=time();
			$ud=db2::update($store,'shop_stats',array('id'=>$type),array('$set'=>$stats),array('upsert'=>true));
			return $stats;
			//die(json_encode($stats));
		}
	}
?>