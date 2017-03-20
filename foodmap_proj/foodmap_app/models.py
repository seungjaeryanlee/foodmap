from __future__ import unicode_literals

import datetime
from django.db import models
from django.utils import timezone

# Create your models here.
class Location(models.Model):
    '''
    Represents the Locations table.
    '''
    name = models.CharField(max_length=50, unique=True)
    lat = models.DecimalField(max_digits=5, decimal_places=3)
    lng = models.DecimalField(max_digits=6, decimal_places=3)

    def __unicode__(self):
        return self.name

class Offering(models.Model):
    '''
    Represents the Offerings table.
    '''
    timestamp = models.DateTimeField()
    location = models.ForeignKey(Location, on_delete=models.CASCADE) # TODO: What does CASCADE mean? This is advised in the django tutorial
    title = models.CharField(max_length=50)
    description = models.CharField(max_length=200, blank=True, default='')

    def save(self, *args, **kwargs):
        '''
        Overrides default save method to validate attributes in greater depth
        than Django does by default.
        '''
        if isinstance(self.timestamp, datetime.datetime) and self.timestamp > timezone.now():
            raise ValueError('\'timestamp\' attribute of the Offering is in the future')
        super(Offering, self).save(*args, **kwargs)

    def __unicode__(self):
        return '%s %s, %s' % (str(self.timestamp), self.title, str(self.location))

