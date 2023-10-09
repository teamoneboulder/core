<?php
	class APP{
		public static $ver=1;
        public static function getConf($id){
            return db2::findOne(phi::$conf['dbname'],'mobile_apps',array('id'=>$id));
        }
        public static function getData($id){
            $conf=self::getConf($id);
            return db2::findOne(phi::$conf['dbname'],'app_data',array('id'=>$id));
        }
        public static function setData($id,$set){
            $conf=self::getConf($id);
            db2::update(phi::$conf['dbname'],'app_data',array('id'=>$id),array('$set'=>$set),array('upsert'=>true));
        }
        public static function getAppByAppID($appid){
            $app=db2::findOne(phi::$conf['dbname'],'mobile_apps',array('appids'=>array('$in'=>array($appid))));
            if($app) return $app['id'];
            return false;
        }
        public static function getIdentifier($id,$android=false){
            $d=phi::$conf['domain'];
            $dp=explode('.', $d);
            $dp=array_reverse($dp);
            $rid=implode('.', $dp);
            if($id=='actualize') $rid='earth';
            $rid=$rid.'.'.$id;
            if(!phi::$conf['prod']){
                $rid=$rid.'.'.str_replace('_','',phi::$conf['env']);
                $rid=$rid.'.sandbox';
            }
            //android hack
           if($android) $rid.='4';
            //to prevent issues switching ios accounts for now add unique identifier here
            //$rid=$rid.'.prototype';
            return str_replace('_','',$rid);//dont allow any underscores!
        }
        public static function getScheme($id){
            #die(json_encode(array('appids'=>array('$in'=>array($id)))));
            $out['appinfo']= db2::findOne(phi::$conf['dbname'],'mobile_apps',array('appids'=>array('$in'=>array($id))));
            #die(json_encode($out));
            if(!$out['appinfo']) return false;
            if(!phi::$conf['prod']) $out['appinfo']['app_scheme'].=str_replace(array('\\','[',']','{','}','(',')','.','+','*','"',' ','&','%','*','_','@','#','^','~',"'"), array(""), phi::$conf['env']);
            return $out['appinfo']['app_scheme'];
        }
		public static function handleRequest($r){
			switch ($r['path'][3]) {
                case 'addPilot':
                    $tapp=$r['path'][2];
                    $cdata=self::getData($tapp);
                    if($cdata&&isset($cdata['ios_store_id'])){
                        $project=$cdata['ios_store_id'];
                    }else{
                        return array('error'=>'invalid_project_id');
                    }
                   // $cmd="python /var/www/root/_manage/testflight.py 'tbassett44' '".$project."' '".$r['qs']['email']."' 'Tb@06241989'";
                    //exec($cmd,$result);//assume successful for the moment ; )
                    //$out['result']=implode('', $result);
                    if(!isset($r['qs']['email'])){
                        $out['error']='no_email';
                    }else{
                        $app_identifier=self::getIdentifier($r['path'][2]);
                        phi::sendMail(array(
                            'to'=>array('team@oneboulder.one'),
                            'subject'=>'Beta Testing',
                            'message'=>'please add ['.$r['qs']['email'].'] to ['.$app_identifier.'] the command is: [fastlane pilot add '.$r['qs']['email'].' -a '.$app_identifier.' -u team@oneboulder.one -g "Alpha Testers"] command line came back with result',
                            'from'=>'team@oneboulder.one'
                        ));//send via php emailer
                        //set up api here
                        $out['success']=true;
                    }
                break;
				case 'conf':
                //hardcoded for the moment, move to db
                ///REQUIREMENT for all IDS to be "file safe" names
                $out['appinfo']=self::getConf($r['path'][2]);
                if(isset($r['qs']['appid'])){
                    $out['app_id']=$r['qs']['appid'];
                }
                if(!$out['appinfo']) die(json_encode(array('error'=>'invalid conf ['.$r['path'][2].']')));
                // $out['appinfo']['fb']=array(
                //     'id'=>phi::$conf['facebook']['id'],
                //     'name'=>(phi::$conf['prod'])?$out['appinfo']['display_name']:$out['appinfo']['display_name'].' ('.phi::$conf['env'].')'
                // );
                $bg=$out['appinfo']['icon_bg'];
                $sbg=$out['appinfo']['splash_bg'];
                $bg2=$out['appinfo']['android_bg'];
                if(!phi::$conf['prod']) $out['appinfo']['app_scheme'].=str_replace(array('\\','[',']','{','}','(',')','.','+','*','"',' ','&','%','*','_','@','#','^','~',"'"), array(""), phi::$conf['env']);
                if(isset($out['appinfo'])){
                    $tapp=$r['path'][2];
                    $cdata=self::getData($tapp);
                    if(!$cdata) $cdata['buildversion']=0;
                    //$out['appinfo']['version']='4.4.5';//major.minor.build
                    $app_identifier=self::getIdentifier($out['appinfo']['id']);
                    $app_identifier_android=self::getIdentifier($out['appinfo']['id'],1);
                    if(phi::$conf['env']!='prod') $out['appinfo']['display_name']=$out['appinfo']['display_name'].' ~ '.phi::$conf['env'];
                    if(phi::$conf['env']!='prod') $out['appinfo']['homescreen_name']='🚀 '. $out['appinfo']['homescreen_name'].' ('.phi::$conf['env'].')';
                    $out['appinfo']['display_name']=str_replace('&', 'and', $out['appinfo']['display_name']);
                    //temparary hack
                    //$out['appinfo']['display_name'].=' X';
                    $app_identifier=str_replace(array('_'),array(''),$app_identifier);
                    $out['appinfo']['app_name']=substr(strtolower(str_replace(array('\\','[',']','{','}','(',')','.','+','*','"',' ','&','%','*','@','#','^','~',"'"),array(''),$out['appinfo']['display_name'])),0,16);
                    $out['appinfo']['app_identifier']=$app_identifier;
                    $out['appinfo']['app_identifier_android']=$app_identifier_android;
                    $out['appinfo']['static_id']=$tapp;//this will be unique//'app_'.substr(md5($tapp), 0,10);//must be file safe name...
                    $out['appinfo']['youtube_api_key']=(isset(phi::$conf['youtube_api']['key']))?phi::$conf['youtube_api']['key']:'';
                    $out['appinfo']['api']=phi::$conf['api'];
                    $out['appinfo']['protocol']='https://';
                    $out['appinfo']['buildversion']=$cdata['buildversion'];
                    $out['appinfo']['isdev']=(phi::$conf['env']!='prod')?1:0;
                    $out['appinfo']['sender_id']=phi::$conf['gcm']['sender_id'];
                    //publish library to ensure its up-to-date
                    if(isset($out['appinfo']['cache_libraries_id'])){
                        //do a publish to ensure its up-to-date;
                        phi::publish($out['appinfo']['cache_libraries_id'],1);
                        $vconf=db2::findOne(phi::$conf['dbname'],'versions',array("_id"=>$out['appinfo']['cache_libraries_id']));
                        $out['appinfo']['library_conf']='https://one-light.s3.amazonaws.com/source/'.phi::$conf['env'].'/'.$out['appinfo']['cache_libraries_id'].'/pub/'.$vconf['version'];
                        phi::log('build app with ['.$out['appinfo']['cache_libraries_id'].'] '.$out['appinfo']['library_conf']);
                    }
                    if(isset($out['appinfo']['cache_core_id'])){
                        //do a publish to ensure its up-to-date;
                        phi::publish($out['appinfo']['cache_core_id'],1);
                        $vconf=db2::findOne(phi::$conf['dbname'],'versions',array("_id"=>$out['appinfo']['cache_core_id']));
                        $out['appinfo']['core_conf']='https://one-light.s3.amazonaws.com/source/'.phi::$conf['env'].'/'.$out['appinfo']['cache_core_id'].'/pub/'.$vconf['version'];
                        phi::log('build app with ['.$out['appinfo']['cache_core_id'].'] '.$out['appinfo']['core_conf']);
                    }
                    $out['appinfo']['boot_url']='https://code.'.phi::$conf['domain'].'/js/boot.js';
                    $out['appinfo']['app_contact_email']='actualizeearthllc@gmail.com';
                    $out['appinfo']['locs']=json_decode(file_get_contents(ROOT.'/_manage/locs.json'),1);
                    $out['appinfo']['res']=array(
                        'ios_app_icon'=>array('type'=>'icon','width'=>1024,'height'=>1024,'bg'=>$bg),
                        'android_icon'=>array('type'=>'icon','width'=>512,'height'=>512,'bg'=>$bg),
                        'android_feature'=>array('type'=>'icon','width'=>1024,'height'=>500,'bg'=>$bg2),
                        'android_promo'=>array('type'=>'icon','width'=>180,'height'=>120,'bg'=>$bg2),
                        'android_tv'=>array('type'=>'icon','width'=>1280,'height'=>720,'bg'=>$bg2),
                        'version'=>md5($out['appinfo']['push_image'].$out['appinfo']['splash_ver'].$out['appinfo']['splash_background'].$out['appinfo']['promo_bg'].$out['appinfo']['splash_image'].$out['appinfo']['icon_image'].'forceupdate_8'),
                        'icon'=>array(
                            'default'=>array('type'=>'icon','width'=>250,'height'=>250,'rounded'=>1,'bg'=>$bg),
                            'android'=>array(
                                'mdpi.png'=>array('type'=>'icon','width'=>48,'height'=>48,'rounded'=>1,'bg'=>$bg),
                                'hdpi.png'=>array('type'=>'icon','width'=>72,'height'=>72,'rounded'=>1,'bg'=>$bg),
                                'xhdpi.png'=>array('type'=>'icon','width'=>96,'height'=>96,'rounded'=>1,'bg'=>$bg),
                                'xxhdpi.png'=>array('type'=>'icon','width'=>144,'height'=>144,'rounded'=>1,'bg'=>$bg),
                                'xxxhdpi.png'=>array('type'=>'icon','width'=>192,'height'=>192,'rounded'=>1,'bg'=>$bg)
                            ),
                            'push'=>array(
                                'mdpi.png'=>array('type'=>'icon','width'=>24,'height'=>24,'bg'=>'transparent'),
                                'hdpi.png'=>array('type'=>'icon','width'=>36,'height'=>36,'bg'=>'transparent'),
                                'xhdpi.png'=>array('type'=>'icon','width'=>48,'height'=>48,'bg'=>'transparent'),
                                'xxhdpi.png'=>array('type'=>'icon','width'=>72,'height'=>72,'bg'=>'transparent'),
                                'xxxhdpi.png'=>array('type'=>'icon','width'=>96,'height'=>96,'bg'=>'transparent')
                            ),
                            'ios'=>array(
                                'icon-40.png'=>array('type'=>'icon','width'=>40,'height'=>40,'bg'=>$bg),
                                'icon-40@2x.png'=>array('type'=>'icon','width'=>80,'height'=>80,'bg'=>$bg),
                                'icon-50.png'=>array('type'=>'icon','width'=>50,'height'=>50,'bg'=>$bg),
                                'icon-50@2x.png'=>array('type'=>'icon','width'=>100,'height'=>100,'bg'=>$bg),
                                'icon-60.png'=>array('type'=>'icon','width'=>60,'height'=>60,'bg'=>$bg),
                                'icon-60@2x.png'=>array('type'=>'icon','width'=>120,'height'=>120,'bg'=>$bg),
                                'icon-60@3x.png'=>array('type'=>'icon','width'=>180,'height'=>180,'bg'=>$bg),
                                'icon-72.png'=>array('type'=>'icon','width'=>72,'height'=>72,'bg'=>$bg),
                                'icon-72@2x.png'=>array('type'=>'icon','width'=>144,'height'=>144,'bg'=>$bg),
                                'icon-76.png'=>array('type'=>'icon','width'=>76,'height'=>76,'bg'=>$bg),
                                'icon-76@2x.png'=>array('type'=>'icon','width'=>152,'height'=>152,'bg'=>$bg),
                                'icon-small.png'=>array('type'=>'icon','width'=>29,'height'=>29,'bg'=>$bg),
                                'icon-small@2x.png'=>array('type'=>'icon','width'=>58,'height'=>58,'bg'=>$bg),
                                'icon.png'=>array('type'=>'icon','width'=>57,'height'=>57,'bg'=>$bg),
                                'icon@2x.png'=>array('type'=>'icon','width'=>114,'height'=>114,'bg'=>$bg),
                                'icon-1024.png'=>array('type'=>'icon','width'=>1024,'height'=>1024,'bg'=>$bg),
                                'icon-83.5@2x.png'=>array('type'=>'icon','width'=>167,'height'=>167,'bg'=>$bg)
                            )
                        ),
                        'screens'=>array(
                            'ios'=>array(
                                //'default@2x~universal~anyany.png'=>array('type'=>'screen','width'=>2732,'height'=>2732,'bg'=>$sbg),
                                'Default@2x~iphone~anyany.png'=>array('type'=>'screen','width'=>1334,'height'=>1334,'bg'=>$sbg),
                                'Default@3x~iphone~anyany.png'=>array('type'=>'screen','width'=>2208,'height'=>2208,'bg'=>$sbg),
                                'Default@2x~ipad~anyany.png'=>array('type'=>'screen','width'=>2732,'height'=>2732,'bg'=>$sbg)
                            ),
                            'android'=>array(
                                'screen-hdpi-landscape.png'=>array('type'=>'screen','width'=>800,'height'=>480,'bg'=>$sbg),
                                'screen-hdpi-portrait.png'=>array('type'=>'screen','width'=>480,'height'=>800,'bg'=>$sbg),
                                'screen-ldpi-landscape.png'=>array('type'=>'screen','width'=>320,'height'=>200,'bg'=>$sbg),
                                'screen-ldpi-portrait.png'=>array('type'=>'screen','width'=>200,'height'=>320,'bg'=>$sbg),
                                'screen-mdpi-landscape.png'=>array('type'=>'screen','width'=>480,'height'=>320,'bg'=>$sbg),
                                'screen-mdpi-portrait.png'=>array('type'=>'screen','width'=>320,'height'=>480,'bg'=>$sbg),
                                'screen-xhdpi-landscape.png'=>array('type'=>'screen','width'=>1280,'height'=>720,'bg'=>$sbg),
                                'screen-xhdpi-portrait.png'=>array('type'=>'screen','width'=>720,'height'=>1280,'bg'=>$sbg)
                            )
                        )
                    );
                }
            break;
            case 'save':
                $tapp=$r['path'][2];
                $opts=json_decode($r['qs']['data'],1);
                $opts['id']=$tapp;
                self::setData($tapp,$opts);
                $out=array('success'=>true);
            break;
            case 'screenshots':
                //make all screen shots
                $st=time();
                $tapp='groupup';//hardcoded for now
                $lang='en-US';//hardcoded for now
                $preview=PROTOCOL.DOMAIN.'/screenshot_preview.php?app='.$tapp.'&lang='.$lang.'&domain='.API.'&token=app_builder';
                $db=phi::getDB(false,'prod');
                $data=self::getData($tapp);
                //die(json_encode($data));
                if($data&&!isset($r['qs']['force'])){
                    $out=$data['data'];
                    $out['preview']=$preview;
                    $out['cached']=1;
                    die(json_encode($out));
                }else{
                    $types=array(
                        'iphone35'=>array('width'=>640,'height'=>920,'scale'=>2,'layout'=>'phone','platform'=>'ios'),
                        'iphone4'=>array('width'=>640,'height'=>1096,'scale'=>2,'layout'=>'phone','platform'=>'ios'),
                        'iphone6'=>array('width'=>750,'height'=>1334,'scale'=>2,'layout'=>'phone','platform'=>'ios'),
                        'ipad'=>array('width'=>2048,'height'=>1496,'scale'=>2,'layout'=>'tablet','platform'=>'ios'),
                        'iphone6plus'=>array('width'=>1242,'height'=>2208,'scale'=>3,'layout'=>'phone','platform'=>'ios'),
                        'ipadpro'=>array('width'=>2732,'height'=>2048,'scale'=>2,'layout'=>'tablet','platform'=>'ios'),
                        'androidphone'=>array('width'=>750,'height'=>1334,'scale'=>2,'layout'=>'phone','platform'=>'android'),
                        'android7tablet'=>array('width'=>2048,'height'=>1496,'scale'=>2,'layout'=>'tablet','platform'=>'android'),
                        'android10tablet'=>array('width'=>2732,'height'=>2048,'scale'=>2,'layout'=>'tablet','platform'=>'android')
                    );
                    $p=phi::$conf['root'].'/imagecache/screenshot_'.$tapp;
                    if(is_dir($p)) exec('rm -rf '.$p);
                    exec('mkdir -p '.$p);
                    foreach ($types as $k => $v) {
                        $settings=array(
                            'width'=>$v['width'],
                            'height'=>$v['height'],
                            'app'=>$tapp,
                            'scale'=>$v['scale'],
                            'lang'=>$lang,
                            'layout'=>$v['layout']
                        );
                        $url=PROTOCOL.'app.'.DOMAIN.'?screenshot='.urlencode(json_encode($settings));//wont work in iframe
                        $opts=array(
                            'url'=>$url,
                            'savepath'=>$p,
                            'scale'=>$v['scale'],
                            'type'=>$k,
                            'platform'=>$v['platform'],
                            'lang'=>$lang,
                            'size'=>array('width'=>$v['width'],'height'=>$v['height'])
                        );
                        $exec="/usr/local/bin/phantomjs --ssl-protocol=any --ignore-ssl-errors=true /var/www/root/node/render/app_screenshot.js '".json_encode($opts)."'";
                        if($data) unset($data);
                        #die($exec);
                        exec($exec,$data);
                        $out['screenshots'][$v['platform']][$k]=json_decode(str_replace($p, PROTOCOL.API.'/app/'.$tapp.'/screenshot_image', $data[0]),1);
                    }
                    //save it
                    $total=time()-$st;
                    $wdb=phi::getDB(true,'prod');
                    $cdata=$wdb->app_data->findOne(array('_id'=>$tapp));
                    if($cdata){
                        $save['data']=$out;
                        $save['tsu']=time();
                    }else{
                        $save=array(
                            '_id'=>$tapp,
                            'data'=>$out,
                            'tsu'=>time()
                        );
                    }
                    $wdb->app_data->save($save,array('upsert'=>1));
                    $out['preview']=$preview;
                    $out['info']='Finished in ['.$total.'] seconds';
                    die(json_encode($out));
                }
            break;
            case 'image':
                $settings=json_decode(urldecode($r['qs']['opts']),1);
                // die(json_encode($settings));
                $url='https://img.'.phi::$conf['domain'].'/appimage.php?opts='.urlencode(json_encode($settings));
                #phi::log($url);
                $opts=array(
                    'url'=>$url,
                    'save'=>'/tmp/'.md5($url).'.png',
                    'size'=>array('width'=>$settings['width'],'height'=>$settings['height'])
                );
                $exec="/usr/local/bin/phantomjs --ssl-protocol=any --ignore-ssl-errors=true ".phi::$conf['root']."/node/render/image.js '".json_encode($opts)."'";
                //phi::log($exec);
                #die($exec);
                exec($exec);
                //exec('/usr/local/bin/phantomjs -v',$out,$e);
                //return image!
                $o['src']=$opts['save'];
                $o['mime']='image/png';
                //$o['nocache']=1;//will delete as soon as outputted to header
                header("Content-Type: image/png");
                header('Content-Length: ' . filesize($opts['save']));
                echo file_get_contents($opts['save']);
                if(is_file($opts['save'])) unlink($opts['save']);
                exit;
            break;
            case 'screenshot_image':
                $name=$r['path'][4];
                header("Content-type: image/png");
                $f=phi::$conf['root']+'/imagecache/screenshot_'.$r['path'][2].'/'.$name;
                if(is_file($f)){
                    echo file_get_contents($f);
                    //unlink($f);
                    die();
                }
            break;
			}
            if(!isset($out)) $out=array('error'=>'invalid_method');
			return $out;
		}
	}
?>