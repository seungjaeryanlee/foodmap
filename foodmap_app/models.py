from __future__ import unicode_literals

import datetime
import os
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.utils import timezone
from foodmap_app.apps import FoodmapAppConfig

# Create your models here.

class Location(models.Model):
    '''
    Represents the Locations table.
    '''
    NAME_MAX_LENGTH = 50
    LAT_LNG_DECIMAL_PLACES = 12

    name = models.CharField(max_length=NAME_MAX_LENGTH, unique=True)
    lat = models.DecimalField(decimal_places=LAT_LNG_DECIMAL_PLACES,
        max_digits=LAT_LNG_DECIMAL_PLACES+3) # 2 for 0-90, 1 for "-" sign
    lng = models.DecimalField(decimal_places=LAT_LNG_DECIMAL_PLACES,
        max_digits=LAT_LNG_DECIMAL_PLACES+4) # 3 for 0-180, 1 for "-" sign

    def __unicode__(self):
        return self.name

class Offering(models.Model):
    '''
    Represents the Offerings table.
    '''
    TITLE_MAX_LENGTH = 100
    DESCRIPTION_MAX_LENGTH = 10000
    THREAD_ID_MAX_LENGTH = 16

    timestamp = models.DateTimeField()
    location = models.ForeignKey(Location, on_delete=models.CASCADE) # TODO: What does CASCADE mean? This is advised in the django tutorial
    title = models.CharField(max_length=TITLE_MAX_LENGTH)
    description = models.CharField(max_length=DESCRIPTION_MAX_LENGTH, blank=True, default='')
    image = models.ImageField(upload_to='offerings', null=True, blank=True)
    thread_id = models.CharField(max_length=THREAD_ID_MAX_LENGTH, blank=True, null=True, unique=True)

    def save(self, *args, **kwargs):
        '''
        Overrides default save method to validate attributes in greater depth
        than Django does by default.
        '''
        if isinstance(self.timestamp, datetime.datetime) and self.timestamp > timezone.now():
            raise ValueError('\'timestamp\' attribute of the Offering is in the future')
        if self.thread_id and len(self.thread_id) < Offering.THREAD_ID_MAX_LENGTH:
            raise ValueError('\'thread_id\' attribute of the Offering is too short (not %d chars)'
                % (Offering.THREAD_ID_MAX_LENGTH))
        try:
            super(Offering, self).save(*args, **kwargs)
        except Exception as e:
            # Make sure image was not saved if something went wrong while
            # saving
            self.image.delete(save=False)
            raise e


    def __unicode__(self):
        tags = OfferingTag.objects.filter(offering=self)
        tag_str = ''
        if len(tags) > 0:
            for tag in tags:
                tag_str += str(tag) + ', '
            tag_str = tag_str[:-2] # remove lingering comma
        else:
            tag_str = 'None'
        return '%s %s at %s. Tags: %s' % (str(self.timestamp), self.title, str(self.location), tag_str)


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


class OfferingTag(models.Model):
    '''
    Represents the Offering Tags table
    '''
    TAG_MAX_LENGTH = 50
    TAG_CHOICES = [
        # (actual value, human-readable name)
        # The name is what appears in a form, and the actual value is stored in
        # the db. Convention is for the actual value to be an all lowercase
        # version of the human-readable name.
        ('vegetarian', 'Vegetarian'),
        ('vegan', 'Vegan'),
        ('kosher', 'Kosher'),
        ('gluten-free', 'Gluten-Free'),
        ('peanut-free', 'Peanut-Free')
    ]

    offering = models.ForeignKey(Offering, on_delete=models.CASCADE)
    tag = models.CharField(max_length=TAG_MAX_LENGTH, choices=TAG_CHOICES)

    def save(self, *args, **kwargs):
        '''
        Overrides default save method to validate attributes in greater depth
        than Django does by default.
        '''
        accepted_tags = [tag_choice[0] for tag_choice in OfferingTag.TAG_CHOICES]
        if isinstance(self.tag, str) and not self.tag in accepted_tags:
            raise ValueError('\'tag\' attribute of the OfferingTag is not one of the accepted values')
        super(OfferingTag, self).save(*args, **kwargs)

    def __unicode__(self):
        return self.tag

