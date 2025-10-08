from django.db import models
from restaurant.models import Restaurant


class Consumer(models.Model):
    consumer_name = models.CharField(max_length=255)
    consumer_phone_number = models.CharField(max_length=20, blank=True, null=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="consumers")
    reciept_url = models.TextField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_checked = models.BooleanField(default=True)
    isTermsandpolicy = models.BooleanField(default=False)
    isadvertisement = models.BooleanField(default=False)

    def __str__(self):
        return self.consumer_name
    

class RequestLog(models.Model):
    path = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.PositiveIntegerField()
    response_time = models.FloatField(help_text="Response time in seconds")
    error_message = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.method} {self.path} ({self.status_code})"    