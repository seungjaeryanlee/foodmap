'''
Settings specific to the production-version of the app. Override settings
imported from common.py, or add settings.

See common.py for the list of settings that *must* be specified here, since
they are not specified in common.py at all.
'''

# Import settings from common.py
try:
    from common import *
except ImportError:
    pass

#---------------------------------
# Override or add settings
#---------------------------------

ALLOWED_HOSTS = ['foodmap333.herokuapp.com']

# TODO: Change to a *real* SECRET_KEY, and somehow keep it really secret
SECRET_KEY = 'vrg+496us^_trq72er&6tbm2md!-g0pggirq(qbc85n=*k4wcf'

DEBUG = False

# Database settings
import dj_database_url
DATABASES = { 'default': dj_database_url.config(conn_max_age=500)}

# For forcing HTTPS
SECURE_SSL_REDIRECT = True
