#!/bin/bash
#Configure an Ubuntu instance with all the server tools / configs.
if [[ "$1" = "" ]] ; then
echo "...what is the path to the project folder??";
exit;
fi
service apache2 stop
apt-get -y remove apache2
add-apt-repository ppa:ondrej/php -y
add-apt-repository ppa:certbot/certbot -y
#sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
#echo "deb [ arch=amd64 ] http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-3.4.list
# php 5.6 => 7.3
apt-get -y update
apt-get -y install curl
apt-get -y install build-essential 
apt-get -y install php7.3
apt-get -y install php7.3-cgi
apt-get -y install php7.3-cli
apt-get -y install php7.3-dev 
apt-get -y install php7.3-gd
apt-get -y install php7.3-pear 
apt-get -y install php7.3-curl 
apt-get -y install php7.3-mcrypt
apt-get -y install php7.3-mbstring
apt-get -y install php7.3-tidy
apt-get -y install php7.3-xml
apt-get -y install php7.3-getid3
apt-get -y install php7.3-mbstring
apt-get -y install php7.3-mongodb
apt-get -y install libmcrypt-dev
apt-get -y install make
apt-get -y install tesseract-ocr
apt-get -y install graphicsmagick 
apt-get -y install libgraphicsmagick1-dev
apt-get -y install npm
apt-get -y install fontconfig
apt-get -y install zip
apt-get -y install unzip
apt-get -y install pkg-config
apt-get -y build-essential
apt-get -y curl
apt-get -y cloc
apt-get -y m4
apt-get -y ruby
apt-get -y texinfo
apt-get -y libbz2-dev
apt-get -y libcurl4-openssl-dev
apt-get -y libexpat-dev
apt-get -y libncurses-dev
apt-get -y zlib1g-dev
apt-get -y install awscli
apt-get -y install jq
apt-get -y install python3-pip
pip install awscli --upgrade --user
#apt-get -y install miredo
apt-get -y install -y nodejs
apt-get -y install software-properties-common
apt-get -y install libpcre3-dev
apt-get -y install software-properties-common
apt-get -y install certbot
apt-get -y install lighttpd
#because of ssl1.1, requires newer lighttpd than avail, must install from unique ppa
apt-get -y install gnupg
#purge
apt-get -y purge mongodb mongodb-server mongodb-server-core mongodb-clients mongo-tools
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get -y update
sudo apt-get -y install -y mongodb-org
sudo phpenmod mcrypt
sudo apt-get -y update
pecl install -f gmagick-beta
pecl install mcrypt-1.0.1
cd /usr/local/share
sudo wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
sudo tar xjf phantomjs-2.1.1-linux-x86_64.tar.bz2
sudo ln -s /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/share/phantomjs
sudo ln -s /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs
sudo ln -s /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/bin/phantomjs
sudo chmod 0777 /usr/local/bin/phantomjs

sudo gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
curl -L https://get.rvm.io | bash -s stable --ruby
source /usr/share/rvm/scripts/rvm
source /usr/local/rvm/scripts/rvm
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
pecl install -f mongodb
pecl install -f mongo
cd $1/bin
./loadshortcuts
source ~/.bashrc
perms
acmeconfig
copyphpini
ensureffmpeg
lighttpdconf
mkdir -p /var/log/$1
cd $1
apt install composer
composer update