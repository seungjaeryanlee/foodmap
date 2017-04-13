# FoodMap
## Overview
Our project enables Princeton students to take advantage of all the free food in their area. The web app gives them a map of nearby food locations generated from the Free Food Listserv and helps them find food they would like to eat.

The app is built using two main components: the Free Food Listserv email scraper (written in NodeJS) and the Django web app. These are documented for developer purposes in the following sections.

If you are a developer who would like to use and/or build on this project, see the **Installation and dependencies** subsections within the following two sections to get yourself set up. **Also read the Git Rules section for the rules and conventions of writing code for this project.**



## Email scraper (NodeJS)
See the README file in the `scraper` directory for details.


## Web app (Django)
This section describes the Django project backing the FoodMap app. It contains all the views, models, and other components of the app, except the free food listserv scraper (as of now, that is kept separate from this project directory).

### Installation and dependencies
#### Quick start
If you just need to get the environment set up from scratch for the first time, run `setup`:
```
./setup
```
That's it! You should be all set to work on the project. Read on if you want more in depth information about dependencies and what the setup script does.

#### Details
This project uses Python 2.7, with the following dependencies:

- Django 1.10.6 (the as-of-now latest version): web framework
- Pillow 4.0.0 (the as-of-now latest version): required for the database to be able to store images
- Selenium 3.3.1 (the as-of-now latest version): required for browser automation to obtain latitude/longitude coordinates of locations
- Whitenoise 3.3.0
- Gunicorn 19.7.1

Also, since the database itself is not committed with the code, there is some extra configuration required to set up the database. This is handled by the Python script `setup_database.py`. It also has other uses aside from the initial environment setup -- see the script itself for a full description of what it does.

The `setup` script automates both the dependency installations and the database setup for you. It installs the dependencies using Python's package manager `pip`, and then runs `setup_database.py`.

### Basic usage
Here are some common commands for reference. All of them use the `manage.py` module located in the root of this project. See the official django tutorial and/or documentation (`https://docs.djangoproject.com/en/1.10/`) for more details:

- `python manage.py runserver`: Starts a web server for the project at IP address 127.0.0.1 (localhost) on port 8000.
- `python manage.py shell`: Loads up an interactive Python shell (as if you just typed `python` into your terminal), but auto-configures Django so you can import and run any modules/code in this project.
- `python manage.py test [app1 app2 ...]`: Runs all the automated tests in this project if no arguments are given, or runs the tests only for the specified apps if you provide any. For instance, specify `foodmap_app` to run the tests in `foodmap_app/tests.py`.



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
