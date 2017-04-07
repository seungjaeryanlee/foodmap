from django.conf.urls import url
from . import views

app_name = 'foodmap_app'
urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^locations/$', views.locations, name='locations'),
    url(r'^offerings/(?P<location>[0-9a-z\-]+)/$', views.offerings, name='offerings'),
    url(r'^test/$', views.test, name='test')
]
