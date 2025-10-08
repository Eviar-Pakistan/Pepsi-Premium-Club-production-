from django.urls import path , include
from consumers.views import consumer,upload_image,create_consumer,health_check,request_logs
app_name = "consumers"

urlpatterns = [
    path('',consumer,name=""),
    path("upload-image/", upload_image, name="upload_receipt"),
    path('api/consumer/create/',create_consumer,name="create_consumer"),
    path('api/health-check',health_check,name="health_check"),
    path('health/', include('health_check.urls')),
    path('api/v1/request-logs/', request_logs, name='request_logs')
    


]
