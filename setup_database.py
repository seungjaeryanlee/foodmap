#-------------------------------------------------------------------------------
# setup_database.py
# Author: Michael Friedman
#
# Runs the necessary Django commands to intialize the database, or to update
# it after a change to the schema. Then autopopulates the locations from
# locations.json into the database (locations.json must be in the same
# directory).
#-------------------------------------------------------------------------------

# Some setup before we can interact with Django
import os
import django
django.setup()

#-------------------------------------------------------------------------------

def populate_locations_table():
    from django.db import IntegrityError
    from foodmap_app.models import Location
    import json
    import sys

    # Read in entries from locations.json, load into Location table
    file = open('locations.json', 'r')
    locations = json.loads(file.read())
    file.close()
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

### Main script

from django.utils import timezone
from foodmap_app.models import Location

# Initialize database
print 'Initializing database...'
os.system('python manage.py makemigrations foodmap_app')
os.system('python manage.py migrate')
print 'Done!'

print 'Populating locations into database...'
populate_locations_table()
