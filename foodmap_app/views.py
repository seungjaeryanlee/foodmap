import datetime
import json
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.utils import timezone
from django.urls import reverse
from foodmap_app import scraper
from foodmap_app.forms import OfferingForm
from foodmap_app.models import Location, Offering, OfferingTag

# Create your views here.

# Name of HTTP header that indicates whether a user has submitted a form
HEADER_SUBMITTED = 'submitted'

def index(request):
    '''
    Displays the map view.
    '''
    return render(request, 'index.html', {})


def submit_offering(request):
    '''
    Displays the form for submitting food offerings, or processes a submitted
    form.
    '''
    form = None
    if request.method == 'POST':
        # If it's a POST request, a form has been submitted. Process the form
        form = OfferingForm(request.POST)
        if form.is_valid():
            # Save to database
            try:
                print str(form.cleaned_data)
                new_offering = Offering(
                    timestamp=form.cleaned_data['timestamp'],
                    location=form.cleaned_data['location'],
                    title=form.cleaned_data['title'],
                    description=form.cleaned_data['description']
                )
                new_offering.save()
                request.session[HEADER_SUBMITTED] = True
                return HttpResponseRedirect(reverse('foodmap_app:submitted'))
            except Exception as e:
                print str(e) # this should not happen, since form is custom-validated beforehand
    else:
        # If it's a GET request (or other), create a blank form
        form = OfferingForm()

    return render(request, 'submit-offering.html', {'form': form})


def submitted(request):
    '''
    Displays a confirmation page after a form has been submitted, only if a
    form has been submitted.
    '''
    if HEADER_SUBMITTED in request.session and request.session[HEADER_SUBMITTED]:
        return render(request, 'submitted.html')
    else:
        raise Http404('Error: cannot find the page requested') # TODO: Make an HTML page for this?


def offerings(request):
    '''
    Responds with all of the most recent offerings (under 2 hours old) at every
    location with an offering, formatted in JSON:
    [
        {
            "location": {"name": "Frist Campus Center", "lat": "12.3456789", "lng": "12.3456789"},
            "title": "Pizza!",
            "description": "Come eat!",
            "minutes": 15,
            "tags": "kosher,gluten-free,peanut-free"
        },
        ...
    ]
    '''
    # Pull all offerings under 2 hours old
    now = timezone.now()
    min_timestamp = now - datetime.timedelta(hours=2)
    offerings = Offering.objects.filter(timestamp__gte=min_timestamp, timestamp__lte=now).order_by('-timestamp')
    if len(offerings) == 0:
        return HttpResponse(json.dumps([]))

    # If any location has more than one offering, filter out the older ones
    most_recent_offerings = []
    locations_with_offerings = []
    for offering in offerings:
        if offering.location in locations_with_offerings:
           continue  # newest offering is already in most_recent_offerings

        # Get this offering's tags, format into comma-separated list
        tags = OfferingTag.objects.filter(offering=offering)
        tags_str = ','.join([str(tag) for tag in tags])

        most_recent_offerings.append({
            'location': {
                'name': offering.location.name,
                'lat': str(offering.location.lat),
                'lng': str(offering.location.lng)
            },
            'title': offering.title,
            'description': offering.description,
            'minutes': int((now - offering.timestamp).seconds / 60),
            'tags': tags_str
        })
        locations_with_offerings.append(offering.location)

    # Json-ify and return
    return HttpResponse(json.dumps(most_recent_offerings))


def test(request):
    '''
    Sample view to demonstrate end-to-end flow of data. Displays the
    Locations and Offerings tables' raw contents.
    '''
    locations = Location.objects.all()
    offerings = Offering.objects.all()
    return render(request, 'test.html', {'locations': locations, 'offerings': offerings})
