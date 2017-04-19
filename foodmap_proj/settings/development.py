'''
Settings specific to the version of the app run locally for development.
Override settings imported from common.py, or add settings.

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

ALLOWED_HOSTS = ['localhost']

SECRET_KEY = 'vrg+496us^_trq72er&6tbm2md!-g0pggirq(qbc85n=*k4wcf' # this is just for development, so it does not really need to be secret

DEBUG = True

# Database settings
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

