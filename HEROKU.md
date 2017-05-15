# Heroku
This is a short summary to how [Heroku](https://www.heroku.com) was used in this project.

## Environment Variables
The following environment variables are required for Heroku to run properly:
 * client_secret  
 * CREDENTIALS  
 * DATABASE_URL  
 * DJANGO_SETTINGS_MODULE  
 * PROJECT_MODE  

## Dependencies
All dependencies should be specified to make Heroku work. For Python, `requirements.txt` is used. For NodeJS, `package.json` file specifies the dependencies.

## Deployment
The project is deployed manually from this repository with the `development` branch.

## Manually Adding/Deleting Entries
__NOTE: This requires [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).__

First log in using the Heroku account.
```
heroku login
```

### Entering Bash

Go into bash with the following command:
```
heroku run bash --app foodmap333
```

### Inserting Entry
Enter the Django shell with:
```
$ python manage.py shell
```

Here is the sample code for adding an entry in Frist Campus Center. Note that you need the official location name for this to work.

```
>>> from foodmap_app.models import Offering, Location
>>> from django.utils import timezone

>>> frist = Location.objects.get(name='Frist Campus Center')
>>> Offering(
...     timestamp=timezone.now(),
...     location=frist,
...     title='Food 1, Food 2, Food 3',
...     description='Sample description'
... ).save()
```

### Deleting Entry
Enter Heroku bash and the Django shell. Here is the sample code for deleting an entry in Campus Club. Note that you need the official location name for this to work.

```
>>> from foodmap_app.models import Offering, Location
>>> campusclub = Location.objects.get(name='Campus Club')
>>> old = Offering.objects.get(location=campusclub)
>>> old.delete()
```
### Resetting Database
Run the command below to drop all tables of the database.
```
heroku pg:reset --app foodmap333
```
We need to set up the database again to make the app work.
```
heroku run bash --app foodmap333
$ python setup_database.py
```

### Viewing the Contents of the Database
Run the command below to enter the PostgreSQL.
```
heroku pg:psql DATABASE_URL --app foodmap333
```
Now we can view the content using standard SQL. For example, to view the `foodmap_app_offering` table, write:
```
foodmap333::DATABASE=> SELECT * FROM foodmap_app_offering;
```

## Heroku Scheduler
[Heroku Scheduler](https://elements.heroku.com/addons/scheduler) is a simple addon that automatically runs commands every 10 minutes, 1 hour, or 1 day. The following commands are running currently:
```
node scraper/app.js
python delete_old_offerings.py
```
They are run every 10 minutes and 1 day, respectively.
