# Welcome to ONE|Core

ONE|Core is the foundational layer with all backend, build tools, widgets, API integrations, oAuth tools, and commonly used code for most all application needs in the ONE|Ecosystem.

There is are separate codebases to support the automated [building and distribution of Hybrid mobile apps](https://gitlab.com/onelocal/dapp) and for building front end interfaces rapidly. 

Current Front End projects using the ONE|Ecosystem:
[ONE|Boulder App Code](https://gitlab.com/onelocal/one-boulder-app) [Mobile App Download](https://app.oneboulder.one/welcome)
[ONE|Boulder Web Code](https://gitlab.com/onelocal/one-boulder-web) [Web-Portal Access](https://app.oneboulder.one)

Folder / File Structure
* _img (Tools involving image manipulation)
	* resizer.php (Used for changing sizes of images, cropping, manipulation, QR, ETC)
	* renderer.php (Used to render a favicon with a number circle - useful for browser tab notification count)
	* appimage.php (Used for the app building process to render different sizes / types of image resources for app uploading)
* _manage (Different tools to support configurations needed for the system)
	* conf (Different ubuntu based tool configurations / templates)
	* db2 (tools to load and different databases that pre-populate information)
	* schemas (for custom apps, this is where alternative schemas are stored)
	* file_conf.json (Where the linking between different codes bases for different projects happen)
	* schema.json - holds the core configuration of different data types, linkings, hooks, for form configurations [IMPORTANT FILE]
	* ETC
* api (API based tools, based on functionality / type)
	* class (Custom tools for in-house modules)
	* 1.0.php - Entry point for all API Calls
	* app.php - api endpoint for talking to App Builder script (app_builder.php)
	* bank.php - integration point for multiple financial transactions to be generalized and used
	* callfeed.php - Used to create .ics calendar links and feeds for subscriptions to be used in calendars
	* call.php - API for connecting VOIP based calls
	* coinbase.php - Coinbase API implimentation
	* email.php - Tools useful for interaction with emails - eg read api calls, throughpoint for link clicks
	* flower.php - Tools to create basic code flower views
	* oauth2.php - tools for integrating with different oAuth based systems
	* push.php - tools for push notifications
	* rawemail.php - tools to create rich / raw emails
	* stripe.php - stripe api integration
	* uploader.php - tools to process image / file / video uploading
	* voip.php - tools to create voip notifications / interactions
	* webhook.php - listeners for other oAuth based systems

* bin (command line shortcuts used for systems administration)
classes (internal tools)
	* admin.php (admin command line API bridge - used to run custom commands easily, generally for fixes, db migrations, etc)
	* dp2.php (Bridge and basic tool to integrate mongoDB - potentially other databases in future [blockchain tech could also fit in this tool])
	* ics.php - generate .ics files for email attachemnts / downloads
	* settings.php - primary configuration of settings that happen on every PHP instance start
	* validator.php - tool for validating data based on schema.json
* node (basic node tools)
	* api2 (nodejs API - useful when node's async funcationality helps)
	* render (used to render webpages as images)
	* scrape (different scripts used to scrape data from webpages)
	* api2.js - entry point to api2 folder's api definintions
	* tools.js - basic common tools used across Node scripts
	* ETC
* sites (anything else that defines a "site" in the system, including custom API and front end interface.  Most new front end interfaces will be built using the basic flower implimentation)
	* code - common code modules, libraries, components are stored here
	* one_core - code for the base loader used in the app ecosystem
	* one_admin - basic admin pannel for system
	* render - any custom render functions needed, like tickets, QR codes, etc
	* webrtc - tools for webrtc p2p connections

Feel free to ask questions and get inquisitive : )

With Love,

Tom

🙏❤️