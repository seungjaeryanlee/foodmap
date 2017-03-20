#-------------------------------------------------------------------------------
# setup_database.py
# Author: Michael Friedman
#
# Runs the necessary Django commands to intialize/update the project's database.
# You can also rerun it each time the models for the database are updated as a
# shortcut for makemigrations + migrate. Optionally takes the -p argument to
# auto-populate with some dummy data.
#-------------------------------------------------------------------------------

# Check usage
import sys
usage = 'usage: python setup_database.py [-p]'
if len(sys.argv) != 1 and len(sys.argv) != 2:
    print usage
    exit(1)
elif len(sys.argv) == 2 and sys.argv[1] != '-p':
    print usage
    exit(1)

#-------------------------------------------------------------------------------

# Some setup before we can interact with Django
import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'foodmap_proj.settings'
django.setup()

#-------------------------------------------------------------------------------

# Ok now we can get started...
from django.utils import timezone
from foodmap_app.models import Location, Offering

# Initialize database
os.system('python manage.py makemigrations foodmap_app')
os.system('python manage.py migrate')

# Populate with some dummy data, if -p arg was given
if len(sys.argv) > 1:
    princeton = Location(name='Princeton University', lat=40.343, lng=-74.653)
    harvard = Location(name='Harvard University', lat=42.377, lng=-71.118)
    yale = Location(name='Yale University', lat=41.316, lng=-72.924)
    for l in [princeton, harvard, yale]:
        l.save()

    offerings = [
        Offering(timestamp=timezone.now(), location=princeton, title='The BEST food',
            description='I mean really, the BEST.'),
        Offering(timestamp=timezone.now(), location=harvard, title='Cold breakfast',
            description='And I mean ONLY cold. No hot food at all. Not even eggs.'),
        Offering(timestamp=timezone.now(), location=yale, title='Decent food',
            description='')
    ]
    for o in offerings:
        o.save()
