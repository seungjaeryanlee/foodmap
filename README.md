# FoodMap
## Overview
Our project enables Princeton students to take advantage of all the free food in their area. The web app gives them a map of nearby food locations generated from the Free Food Listserv and helps them find food they would like to eat.

The app is built using two main components: the Free Food Listserv email scraper (written in NodeJS) and the Django web app. These are documented for developer purposes in the two sections **Email Scraper** and **Web App**, respectively.

If you are a developer who would like to use and/or build on this project, see the following **Set-up for developers and contributers** section to get yourself set up. **Also read the Git Rules section for the rules and conventions of writing code for this project.**

## Set-up for developers and contributers
We have automated the set-up required for anyone who wishes to work on the project in a script `setup`. This automates installing dependencies, defaulting your environment to "development" mode (for both Django and Node), and configuring the database.

### Quick Start
If you just need to get the environment set up from scratch for the first time, run `setup` for your OS. For Mac:
```
./setup mac all
```
or for Ubuntu:
```
./setup ubuntu all
```
Even if you're only working on one end of the project (Node or Python), because they are so closely intertwined, you should have the Python virtual environment enabled whenever you're working on either end. Activate it with:
```
source venv/bin/activate
```
That's it! You should be all set to work on the project. You can verify that everything is set up properly by running the Django and Node JS tests:
```
python manage.py test
npm test
```
**Note** that you will need to activate the virtual environment again each time you work on the project.

### More Detailed/Refined Set Up
We recommend you do this quick start if you're getting the project set up for the first time. However, you can also choose to set up only the components you know you'll be working on.

`setup` takes two arguments: OS and mode. You can use the mode to specify what part of the set-up you want to do, as documented below (we use `mac` as the OS in all of these, for the sake of example):
- `./setup mac all`: Does the full set up (as in **Quick Start**)
- `./setup mac python`: Installs only Python packages
- `./setup mac node`: Installs only Node JS packages
- `./setup mac db`: Only initializes/configures/updates the database


## Email scraper (NodeJS)
See the README file in the `scraper` directory for details.


## Web app (Django)
This section describes the Django project backing the FoodMap app. This is the part containing all the views, models, and other components of the app, except the free food listserv scraper (that is kept separate from this project directory).

### Details of the project configuration
This project uses Python 2.7, with the following dependencies:
- Django 1.10.6 (the as-of-now latest version): web framework
- Pillow 4.0.0 (the as-of-now latest version): required for the database to be able to store images
- Selenium 3.3.1 (the as-of-now latest version): required for browser automation to obtain latitude/longitude coordinates of locations

We have slightly different configurations for the project for development and production versions. In development, the above dependencies are the only required ones, whereas in production, we require some additional ones:
- Whitenoise 3.3.0
- Gunicorn 19.7.1
- dj-database-url 0.4.2
- psycopg2 2.5.3

To determine whether to use the "development" or "production" configuration, we set two environment variables: one to indicate to Django which configuration to use, and one to indicate to Node. Django uses the `DJANGO_SETTINGS_MODULE` variable, which is set to `foodmap_proj.settings.development` in development mode or `foodmap_proj.settings.production` in production mode. This is built into Django, so it knows how to interpret this variable to use the correct configuration.

Node (to our knowledge) does not have a corresponding built-in variable, so we created one called `PROJECT_MODE` to serve the same purpose. It is set to `development` in development mode or `production` in production mode. We have programmed the scraper to interpret this variable to use the correct configuration in each mode.

In development mode, we do not commit the database with the rest of the code. As a result, just downloading/cloning the repository does not set you up with a functional database to work with, so there is some extra configuration required yourself to set it up. This is handled by a Python script we wrote called `setup_database.py`. Running this with: 
```
python setup_database.py
```
should do this configuration for you. (**Note** that the `setup` script runs this to do database configuration, so you never really need to run this directly. It is documented here for completeness.)

We also give credit to the following resources that we used in this project:
- Bootstrap 3.3.7: CSS framework for web pages
- jQuery 2.2.3: standard JS library for dynamic content (AJAX, animations, etc.)
- Leaflet 1.0.3: map framework/library for CSS/JS
- Leaflet Locate Control https://github.com/domoritz/leaflet-locatecontrol: Leaflet CSS/JSplugin for finding a user's geolocation
- Maps Icons Collection https://mapicons.mapsmarker.com: provides icons for map markers
- PhantomJS: virtual browser for web scraping (used to scrape data in `locations.json`)
- jQuery UI and jQuery Timepicker Addon 1.6.3: Provides a widget for selecting date and time in a form.

### Basic usage
Here are some common commands for reference. All of them use the `manage.py` module located in the root of this project. See the official django tutorial and/or documentation (https://docs.djangoproject.com/en/1.10/) for more details:

- `python manage.py runserver`: Starts a web server for the project at IP address 127.0.0.1 (localhost) on port 8000.
- `python manage.py shell`: Loads up an interactive Python shell (as if you just typed `python` into your terminal), but auto-configures Django so you can import and run any modules/code in this project.
- `python manage.py test app`: Runs all the automated tests in this project if no arguments are given, or runs the tests only for the specified app if you provide one. For instance, provide `foodmap_app` to run the tests in `foodmap_app/tests.py`. Alternatively, you can provide the name of a specific class or method within `foodmap_app/tests.py` to run by passing the argument `foodmap_app.tests.classname` or `foodmap_app.tests.classname.methodname`, respectively.


## Git Rules
### Branches and Commits
There should be no direct commits in the `master` branch, only merges from the `development` branch. There should also be no direct commits in the `development` branch except to update this document. All other branches should stem from the `development` branch and should be merged to it.

### Branch Naming Conventions
The name of each branch should be a 1 to 3 word summary of the feature seperated by hyphen `-`. For example, the branch for the scraper should be named `scraper`.

### Code conventions
#### General
- Indentation: Indent with *spaces*, indent size of 4.
- Line endings: Unix-style `\n`.

#### Python-specific
- Strings: Use single quotes.
- Header comments: Standard Python style. Immediately inside the function/class, enclosed in triple quotes, with newlines between triple quotes.

## Contributors
 - Rachana Balasubramanian
 - Michael J. Friedman
 - Seung Jae (Ryan) Lee - Project Leader
 - Nathan Mytelka
