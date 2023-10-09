#!/bin/bash
##php /var/www/root/_manage/set_host.php
mkdir -p /var/log/$PROJECT
cd /var/www
rm index.lighttpd.html
cd $PROJECT
mkdir -p /var/www/$PROJECT/stash
cd /var/www/$PROJECT/bin
./perms
./loadshortcuts
copyphpini
lighttpdconf