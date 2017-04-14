import datetime
import json
from django.http import HttpResponse
from django.shortcuts import render
from django.utils import timezone
from .models import Location, Offering

# Create your views here.

def index(request):
    '''
    Displays the map view.
    '''
    return render(request, 'index.html', {})


def offerings(request):
    '''
    Responds with all of the most recent offerings (under 2 hours old) at every
    location with an offering, formatted in JSON:
    [
        {
            "location": {"name": "Frist Campus Center", "lat": "12.3456789", "lng": "12.3456789"},
            "title": "Pizza!",
            "description": "Come eat!",
            "minutes": 15
        },
        ...
    ]
    '''
    # Pull all offerings under 2 hours old
    now = timezone.now()
    min_timestamp = now - datetime.timedelta(hours=2)
    offerings = Offering.objects.filter(timestamp__gte=min_timestamp).order_by('-timestamp')
    if len(offerings) == 0:
        return HttpResponse(json.dumps({}))

    # If any location has more than one offering, filter out the older ones
    most_recent_offerings = []
    locations_with_offerings = []
    for offering in offerings:
        if offering.location in locations_with_offerings:
           continue  # newest offering is already in most_recent_offerings

        most_recent_offerings.append({
            'location': {
                'name': offering.location.name,
                'lat': str(offering.location.lat),
                'lng': str(offering.location.lng)
            },
            'title': offering.title,
            'description': offering.description,
            'minutes': int((now - offering.timestamp).seconds / 60)
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
