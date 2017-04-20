"""
WSGI config for foodmap_proj project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/howto/deployment/wsgi/
"""

import os

from django.core.exceptions import ImproperlyConfigured
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "foodmap_proj.settings")
application = get_wsgi_application()

# Configure differently based on whether we're in development or production mode
if os.environ['DJANGO_SETTINGS_MODULE'] == 'foodmap_proj.settings.development':
    pass
elif os.environ['DJANGO_SETTINGS_MODULE'] == 'foodmap_proj.settings.production':
    from whitenoise.django import DjangoWhiteNoise
    application = DjangoWhiteNoise(application)
else:
    raise ImproperlyConfigured('DJANGO_SETTINGS_MODULE not set. Did you activate the virtual environment?')
