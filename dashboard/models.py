from django.db import models
from django.contrib.auth.models import User
from restaurant.models import Restaurant


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=255, blank=True, null=True)
    def __str__(self):
        return self.user.username

class Bottler(models.Model):
    bottler_name = models.CharField(max_length=255)

class GM(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="gm_profile", null=True, blank=True)
    gm_name = models.CharField(max_length=255)
    gm_phone_number = models.CharField(max_length=20, blank=True, null=True)
    bottler = models.ForeignKey(Bottler, on_delete=models.CASCADE, related_name="gms")
    restaurants = models.ManyToManyField(Restaurant, related_name="gms", blank=True)

class RSM(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="rsm_profile", null=True, blank=True)
    rsm_name = models.CharField(max_length=255)
    rsm_phone_number = models.CharField(max_length=20, blank=True, null=True)
    bottler = models.ForeignKey(Bottler, on_delete=models.CASCADE, related_name="rsm")
    restaurants = models.ManyToManyField(Restaurant, related_name="rsms", blank=True)
    tagged_gms = models.ManyToManyField(GM, related_name="rsms", blank=True)



    

