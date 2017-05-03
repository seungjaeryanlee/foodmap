from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone
from foodmap_app import scraper
from foodmap_app.models import Offering, Location

class OfferingForm(forms.Form):
    '''
    Form for entering Offerings
    '''

    location = forms.ModelChoiceField(queryset=Location.objects.all().order_by('name'),
        widget=forms.Select())
    title = forms.CharField(max_length=Offering.TITLE_MAX_LENGTH, required=False,
        widget=forms.HiddenInput())
    description = forms.CharField(max_length=Offering.DESCRIPTION_MAX_LENGTH,
        widget=forms.Textarea(attrs={'cols': 60, 'rows': 10}))
    timestamp = forms.DateTimeField(label='Date/Time (if in the future)', required=False,
        widget=forms.DateTimeInput(format='%m/%d/%Y %H:%M'))

    def clean_description(self):
        '''
        Cleans 'description' field. Scrapes it for foods, validates that there
        is at least one food, and populates 'title' with the resulting foods.
        '''
        foods = scraper.get_food(self.cleaned_data['description'])
        if foods == '':
            raise ValidationError(
                _('We did not find any foods in your description.'),
                code='invalid'
            )
        self.cleaned_data['title'] = foods
        return self.cleaned_data['description']

    def clean_timestamp(self):
        '''
        Cleans 'timestamp' field. Uses the current time if it's empty, otherwise
        uses the time provided.
        '''
        if self.cleaned_data['timestamp'] == None:
            return timezone.now()
        else:
            return self.cleaned_data['timestamp']
