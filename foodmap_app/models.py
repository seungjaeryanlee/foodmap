from __future__ import unicode_literals

import datetime
import os
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils import timezone
from foodmap_app.apps import FoodmapAppConfig

# Create your models here.

location_name_max_length = 50
location_lat_lng_decimal_places = 12

offering_title_max_length = 50
offering_description_max_length = 200
offering_thread_id_max_length = 16

class Location(models.Model):
    '''
    Represents the Locations table.
    '''
    name = models.CharField(max_length=location_name_max_length, unique=True)
    lat = models.DecimalField(decimal_places=location_lat_lng_decimal_places,
        max_digits=location_lat_lng_decimal_places+3) # 2 for 0-90, 1 for "-" sign
    lng = models.DecimalField(decimal_places=location_lat_lng_decimal_places,
        max_digits=location_lat_lng_decimal_places+4) # 3 for 0-180, 1 for "-" sign

    def __unicode__(self):
        return self.name

class Offering(models.Model):
    '''
    Represents the Offerings table.
    '''
    timestamp = models.DateTimeField()
    location = models.ForeignKey(Location, on_delete=models.CASCADE) # TODO: What does CASCADE mean? This is advised in the django tutorial
    title = models.CharField(max_length=offering_title_max_length)
    description = models.CharField(max_length=offering_description_max_length, blank=True, default='')
    image = models.ImageField(upload_to='offerings', null=True, blank=True)
    thread_id = models.CharField(max_length=offering_thread_id_max_length, blank=True, null=True, unique=True)

    def save(self, *args, **kwargs):
        '''
        Overrides default save method to validate attributes in greater depth
        than Django does by default.
        '''
        if isinstance(self.timestamp, datetime.datetime) and self.timestamp > timezone.now():
            raise ValueError('\'timestamp\' attribute of the Offering is in the future')
        if self.thread_id and len(self.thread_id) < offering_thread_id_max_length:
            raise ValueError('\'thread_id\' attribute of the Offering is too short (not %d chars)'
                % (offering_thread_id_max_length))
        try:
            super(Offering, self).save(*args, **kwargs)
        except Exception as e:
            # Make sure image was not saved if something went wrong while
            # saving
            self.image.delete(save=False)
            raise e


    def __unicode__(self):
        return '%s %s, %s' % (str(self.timestamp), self.title, str(self.location))

# Need to use a signal handler to override Offering.delete(). See documentation
# for details: https://docs.djangoproject.com/en/1.10/topics/db/models/#overriding-predefined-model-methods
@receiver(post_delete, sender=Offering)
def delete_signal_handler(sender, instance, **kwargs):
    '''
    Overrides behavior when Offerings are deleted to delete the image file
    itself in addition to the Offering record. (Default behavior is to delete
    only the record from the database, but keep the actual file.)

    Relevant arguments: sender (model class), instance (instance of the model
    that is being deleted).
    '''
    instance.image.delete(save=False)

