# Heroku
This is a short summary to how [Heroku](https://www.heroku.com) was used in this project.

## Deployment
There are three ways of deploying the app to Heroku: Heroku CLI, GitHub and Dropbox. This project uses the __GitHub__ method.

## Buildpacks
Heroku needs to know what language you are trying to deploy to Heroku. It can sometimes detect it automatically, but it is a good idea to explicitly declare them.

We have specified `heroku/python` and `heroku/nodejs` buildpack for this project.

## Packages
### Python
Heroku needs to know which Python and NodeJS packages to install. For Python, the `requirements.txt` file specifies the packages that needs to be installed. If you are using `virtualenv`, this command should create the correct requirements.txt.
```
pip freeze > requirements.txt
```
The following command is run in Heroku to install Python packages
```
pip install -r requirements.txt
```
### NodeJS
For NodeJS, the `package.json` file specifies the dependencies. 


## Heroku Addons
__NOTE: Addons require adding a credit card to your account.__  
Addons offer more functionality. The project uses two addons with free tier.

### Heroku Postgres
[Heroku Postgres](https://www.heroku.com/postgres) is an addon that is a PostgreSQL database service. 

### Heroku Scheduler
[Heroku Scheduler](https://elements.heroku.com/addons/scheduler) is a simple addon that automatically runs commands every 10 minutes, 1 hour, or 1 day. The following commands are running:
```
node scraper/app.js
python delete_old_offerings.py
```
They are run every 10 minutes and 1 day, respectively.

## Procfile
## Gunicorn
## Whitenoise
