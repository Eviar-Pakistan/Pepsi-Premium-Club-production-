from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Manager(models.Model):
    name = models.CharField(max_length=255)
    phone_number =  models.CharField(max_length=20, blank=True, null=True)
    
class Restaurant(models.Model):
    restaurant_code = models.CharField(max_length=50, unique=True)
    restaurant_name = models.CharField(max_length=255)
    restaurant_owner_name = models.CharField(max_length=255, blank=True, null=True)
    restaurant_owner_phone_number = models.CharField(max_length=20, blank=True, null=True)
    restaurant_category = models.CharField(max_length=100, blank=True, null=True)
    sdp_desc = models.CharField(max_length=255, blank=True, null=True)
    segment_desc = models.CharField(max_length=255, blank=True, null=True)
    channel_desc = models.CharField(max_length=255, blank=True, null=True)
    route_code = models.CharField(max_length=50, blank=True, null=True)
    route_desc = models.CharField(max_length=255, blank=True, null=True)
    manager = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True, blank=True, related_name="restaurants")
    bottler = models.ForeignKey('dashboard.Bottler', on_delete=models.SET_NULL, null=True, blank=True, related_name="restaurants")
    bottler_admin_email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    cooler_type = models.JSONField(blank=True, null=True)
    posm_type = models.JSONField(blank=True, null=True)
    Branding_POSM = models.CharField(max_length=255, blank=True, null=True)
    restaurant_qr = models.TextField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.restaurant_code
    
# models.py
class CoolerSettings(models.Model):
    default_is_checked = models.BooleanField(default=False)

class PosmSettings(models.Model):
    default_is_checked = models.BooleanField(default=False)

class Restaurant_Cooler(models.Model):
    cooler_type = models.CharField(max_length=100)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="coolers")
    created_at = models.DateTimeField(auto_now_add=True)
    image = models.TextField(max_length=500, blank=True, null=True)
    raw_data = models.CharField(max_length=100 , null=True , blank=True)
    is_checked = models.BooleanField(default=False)
    is_manually = models.BooleanField(default=False)
    is_changed = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self._state.adding and self.is_checked is False:
            settings = CoolerSettings.objects.first()
            if settings:
                self.is_checked = settings.default_is_checked
        super().save(*args, **kwargs)

class Restaurant_POSM(models.Model):
    posm_type = models.CharField(max_length=100)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="posms")
    created_at = models.DateTimeField(auto_now_add=True)
    image = models.TextField(max_length=500, blank=True, null=True)
    raw_data = models.CharField(max_length=100 , null=True , blank=True)
    is_checked = models.BooleanField(default=False)
    is_manually = models.BooleanField(default=False)
    is_changed = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self._state.adding and self.is_checked is False:
            settings = PosmSettings.objects.first()
            if settings:
                self.is_checked = settings.default_is_checked
        super().save(*args, **kwargs)


class Restaurant_Crate_Sales(models.Model):
    sale_month = models.CharField(max_length=20)
    saleweek = models.CharField(max_length=20, blank=True, null=True)
    crate_quantity = models.IntegerField()
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="crate_sales")
    created_at = models.DateTimeField(auto_now_add=True)    
    is_approved = models.BooleanField(default=False)
    is_declined = models.BooleanField(default=False)

class Restaurant_Target(models.Model):
    target_type = models.CharField(max_length=100)
    target_month = models.CharField(max_length=20)
    target_value = models.IntegerField()
    target_status = models.BooleanField(default=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="targets")
    created_at = models.DateTimeField(auto_now_add=True)        