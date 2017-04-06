#-------------------------------------------------------------------------------
# setup_database.py
# Author: Michael Friedman
# Usage: python setup_database.py [-p sample|real]
#
# Runs the necessary Django commands to intialize/update the project's database.
# You can also rerun it each time the models for the database are updated as a
# shortcut for makemigrations + migrate. Optionally takes the -p argument to
# auto-populate with either sample data or real data. If you choose to import
# real data, you must also have the locations.json file in the same directory.
#-------------------------------------------------------------------------------

# Check usage
import sys
usage = 'usage: python setup_database.py [-p sample|real]'
if len(sys.argv) != 1 and len(sys.argv) != 3:
    print usage
    exit(1)
elif len(sys.argv) == 3 and sys.argv[1] != '-p':
    print usage
    exit(1)
elif len(sys.argv) == 3 and not sys.argv[2] in ['sample', 'real']:
    print usage
    exit(1)

populate = None if len(sys.argv) != 3 else sys.argv[2]

#-------------------------------------------------------------------------------

# Some setup before we can interact with Django
import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'foodmap_proj.settings'
django.setup()

#-------------------------------------------------------------------------------

def populate_locations_table():
    from django.db import IntegrityError
    from foodmap_app.models import Location
    import json

    # Read in entries from locations.json, load into Location table
    locations = json.loads(open('locations.json', 'r').read())
    for location in locations:
        try:
            Location(
                name=location['name'],
                lat=float(location['lat']),
                lng=float(location['lng'])
            ).save()
        except IntegrityError as e:
            print >> sys.stderr, 'Duplicate location %s: not entered' % location

#-------------------------------------------------------------------------------

def populate_sample_data():
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

#-------------------------------------------------------------------------------

### Main script

from django.utils import timezone
from foodmap_app.models import Location, Offering

# Initialize database
print 'Initializing/updating database...'
os.system('python manage.py makemigrations foodmap_app')
os.system('python manage.py migrate')
print 'Done!'

# Handle -p arg
if populate:
    print '\nPopulating database...'
    if populate == 'sample':
        populate_sample_data()
    else:
        populate_locations_table()
    print 'Done!'
