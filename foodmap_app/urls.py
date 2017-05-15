from django.conf.urls import url
from . import views

app_name = 'foodmap_app'
urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^submit-offering/$', views.submit_offering, name='submit_offering'),
    url(r'^submitted/$', views.submitted, name='submitted'),
    url(r'^offerings/$', views.offerings, name='offerings'),
    url(r'^test/$', views.test, name='test')
]
