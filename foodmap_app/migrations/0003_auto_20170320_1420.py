# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-03-20 18:20
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('foodmap_app', '0002_offering_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='offering',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='offerings'),
        ),
    ]
