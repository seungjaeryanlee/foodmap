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

Then, go into bash with the following command:
```
heroku run bash --app foodmap333
```

Now go into the Django shell with:
```
$ python manage.py shell
```

### Inserting Entry

### Deleting Entry
Here is the sample code for deleting an entry in Campus Club. Note that you need the official Location name for this to work.

```
>>> from foodmap_app.models import Offering, Location
>>> campusclub = Location.objects.get(name='Campus Club')
>>> old = Offering.objects.get(location=campusclub)
>>> old.delete()
```

## Heroku Scheduler
[Heroku Scheduler](https://elements.heroku.com/addons/scheduler) is a simple addon that automatically runs commands every 10 minutes, 1 hour, or 1 day. The following commands are running currently:
```
node scraper/app.js
python delete_old_offerings.py
```
They are run every 10 minutes and 1 day, respectively.
