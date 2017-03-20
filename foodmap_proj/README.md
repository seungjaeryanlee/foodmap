# foodmap_proj
## Description
This is the Django project backing the FoodMap app. It contains all the views, models, and other components of the app, except the free food listserv scraper (as of now, that is kept separate from this project directory).

## Installation and dependencies
This project uses Python 2.7, and the as-of-now latest version of Django, 1.10.6. You can install this version of Django using Python's package manager `pip`:
```
pip install Django==1.10.6
```
Also, since the database itself is not committed with the code, there is some extra configuration required to set up the database. This is handled in the Python script `setup_database.py`. Just run that to initialize the database:
```
python setup_database.py
```
(See the script itself for a full description of what it does.)

That's it! You should be all set to work on the project.

## Basic usage
Here are some common commands for reference. All of them use the `manage.py` module located in the root of this project. See the official django tutorial and/or documentation (`https://docs.djangoproject.com/en/1.10/`) for more details:

- `python manage.py runserver`: Starts a web server for the project at IP address 127.0.0.1 (localhost) on port 8000.
- `python manage.py shell`: Loads up an interactive Python shell (as if you just typed `python` into your terminal), but auto-configures Django so you can import and run any modules/code in this project.
- `python manage.py test [app1 app2 ...]`: Runs all the automated tests in this project if no arguments are given, or runs the tests only for the specified apps if you provide any. For instance, specify `foodmap_app` to run the tests in `foodmap_app/tests.py`.
