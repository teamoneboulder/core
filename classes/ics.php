<?php
class ics{
		public static function downloadEvent($opts){
			$summary=$opts['title'];
			$datestart=(int) $opts['start']/1000;//convert to php timestamp
			if(isset($opts['end'])&&$opts['end']){
				$dateend=(int) $opts['end']/1000;//convert to php timestamp
			}else $dateend=$datestart+(60*60);//1 hour
			$address=$opts['location'];
			$uri=$opts['link'];
			$description=$opts['description'];
			$filename=$opts['filename'];
			// Variables used in this script:
			//   $summary     - text title of the event
			//   $datestart   - the starting date (in seconds since unix epoch)
			//   $dateend     - the ending date (in seconds since unix epoch)
			//   $address     - the event's address
			//   $uri         - the URL of the event (add http://)
			//   $description - text description of the event
			//   $filename    - the name of this file for saving (e.g. my-event-name.ics)
			//
			// Notes:
			//  - the UID should be unique to the event, so in this case I'm just using
			//    uniqid to create a uid, but you could do whatever you'd like.
			//
			//  - iCal requires a date format of "yyyymmddThhiissZ". The "T" and "Z"
			//    characters are not placeholders, just plain ol' characters. The "T"
			//    character acts as a delimeter between the date (yyyymmdd) and the time
			//    (hhiiss), and the "Z" states that the date is in UTC time. Note that if
			//    you don't want to use UTC time, you must prepend your date-time values
			//    with a TZID property. See RFC 5545 section 3.3.5
			//
			//  - The Content-Disposition: attachment; header tells the browser to save/open
			//    the file. The filename param sets the name of the file, so you could set
			//    it as "my-event-name.ics" or something similar.
			//
			//  - Read up on RFC 5545, the iCalendar specification. There is a lot of helpful
			//    info in there, such as formatting rules. There are also many more options
			//    to set, including alarms, invitees, busy status, etc.
			//
			//      https://www.ietf.org/rfc/rfc5545.txt

			// 1. Set the correct headers for this file
			header('Content-type: text/calendar; charset=utf-8');
			header('Content-Disposition: attachment; filename=' . $filename);

			// 3. Echo out the ics file's contents
echo 'BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTEND:'.self::dateToCal($dateend).'
UID:'.$opts['_id'].'
DTSTAMP:'.self::dateToCal(time()).'
LOCATION:'.self::escapeString($address).'
DESCRIPTION:'.self::escapeString($description).'
URL;VALUE=URI:'.self::escapeString($uri).'
SUMMARY:'.self::escapeString($summary).'
DTSTART:'.self::dateToCal($datestart).'
END:VEVENT
END:VCALENDAR';
die();
		}
		public static function saveEvent($opts){
			$summary=$opts['title'];
			$datestart=(int) $opts['start'];//convert to php timestamp
			if(isset($opts['end'])&&$opts['end']){
				$dateend=(int) $opts['end'];//convert to php timestamp
			}else $dateend=$datestart+(60*60);//1 hour
			$address=$opts['location'];
			$uri=$opts['link'];
			$description=$opts['description'];
			$filename=$opts['filename'];

			// 3. Echo out the ics file's contents
$contents='BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTEND:'.self::dateToCal($dateend).'
UID:'.$opts['id'].'
DTSTAMP:'.self::dateToCal(time()).'
LOCATION:'.self::escapeString($address).'
DESCRIPTION:'.self::escapeString($description).'
URL;VALUE=URI:'.self::escapeString($uri).'
SUMMARY:'.self::escapeString($summary).'
DTSTART:'.self::dateToCal($datestart).'
END:VEVENT
END:VCALENDAR';
file_put_contents($filename, $contents);
return $filename;
		}
	public static function returnEvent($opts){
			$summary=$opts['title'];
			$datestart=(int) $opts['start'];//convert to php timestamp
			if(isset($opts['end'])&&$opts['end']){
				$dateend=(int) $opts['end'];//convert to php timestamp
			}else $dateend=$datestart+(60*60);//1 hour
			$address=$opts['location'];
			$uri=$opts['link'];
			$description=$opts['description'];

			// 3. Echo out the ics file's contents
			$lines[]='BEGIN:VEVENT';
			$lines[]='DTEND:'.self::dateToCal($dateend);
			$lines[]='UID:'.$opts['_id'];
			$lines[]='DTSTAMP:'.self::dateToCal(time());
			$lines[]='LOCATION:'.self::escapeString($address);
			$lines[]='DESCRIPTION:'.self::escapeString($description);
			$lines[]='URL;VALUE=URI:'.self::escapeString($uri);
			$lines[]='SUMMARY:'.self::escapeString($summary);
			$lines[]='DTSTART:'.self::dateToCal($datestart);
			$lines[]='END:VEVENT';
			return implode("\r\n",$lines);
		}
	public static function dateToCal($timestamp){
		return date('Ymd\THis\Z', $timestamp);
	}
	public static function escapeString($string) {
	  return preg_replace( "/\r|\n/", "",preg_replace('/([\,;])/','\\\$1', $string));
	}
	}
?>