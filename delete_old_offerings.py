#-------------------------------------------------------------------------------
# delete_old_offerings.py
# Author: Michael Friedman
# Usage: python delete_old_offerings.py
#
# Deletes entries from the Offerings table older than 2 hours.
#-------------------------------------------------------------------------------

# Some setup before we can interact with Django
import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'foodmap_proj.settings.development'
django.setup()

#-------------------------------------------------------------------------------

# Main script
import datetime
from foodmap_app.models import Offering
from django.utils import timezone

min_timestamp = timezone.now() - datetime.timedelta(hours=2)
old_offerings = Offering.objects.filter(timestamp__lte=min_timestamp)
for offering in old_offerings:
    offering.delete()
