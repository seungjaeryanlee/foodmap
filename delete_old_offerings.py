#-------------------------------------------------------------------------------
# delete_old_offerings.py
# Author: Michael Friedman
# Usage: python delete_old_offerings.py
#
# Deletes entries from the Offerings table older than 2 hours. Also implements
# recurring offerings: before deleting a recurringo offering, it is duplicated
# for the next occurrence.
#-------------------------------------------------------------------------------

# Some setup before we can interact with Django
import os
import django
django.setup()

#-------------------------------------------------------------------------------

# Returns a datetime object exactly one month after 'timestamp'
def plus_one_month(timestamp):
    # TODO: Need to have a better way of incrementing months. This won't work for, say, Jaunary 30th, since February doesn't have a 30th day.
    return datetime.datetime(
        year=offering.timestamp.year,
        month=offering.timestamp.month + 1,
        day=offering.timestamp.day,
        hour=offering.timestamp.hour,
        minute=offering.timestamp.minute,
        second=offering.timestamp.second,
        microsecond=offering.timestamp.microsecond,
        tzinfo=offering.timestamp.tzinfo
    )

# Main script
import datetime
import sys
from foodmap_app.models import Offering
from django.utils import timezone

min_timestamp = timezone.now() - datetime.timedelta(hours=2)
old_offerings = Offering.objects.filter(timestamp__lte=min_timestamp)
for offering in old_offerings:
    if offering.recur != None:
        try:
            # Put new entry in database for next occurrence of this offering,
            # if it's before the end date
            daily = Offering.RECUR_CHOICES[0][0]
            weekly = Offering.RECUR_CHOICES[1][0]
            monthly = Offering.RECUR_CHOICES[2][0]
            new_timestamp = None
            if offering.recur == daily:
                new_timestamp = offering.timestamp + datetime.timedelta(days=1)
            elif offering.recur == weekly:
                new_timestamp = offering.timestamp + datetime.timedelta(weeks=1)
            else:
                new_timestamp = plus_one_month(offering.timestamp)

            if new_timestamp < offering.recur_end_datetime:
                new_offering = Offering(
                    timestamp=new_timestamp,
                    location=offering.location,
                    title=offering.title,
                    description=offering.description,
                    image=offering.image,
                    thread_id=offering.thread_id,
                    recur=offering.recur,
                    recur_end_datetime=offering.recur_end_datetime
                )
                new_offering.save()
        except Exception as e:
            print >> sys.stderr, 'Error: ' + str(e)
    offering.delete()
