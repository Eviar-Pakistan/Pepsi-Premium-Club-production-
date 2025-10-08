from django.urls import path
from restaurant.views import login_view,restaurant,signin_send_otp,signin_verify_otp,signin,get_restaurant_cooler,get_restaurant_posm,request_posm_manual_review,request_manual_review,add_crate_sale,upload_cooler_image,upload_posm_image,create_cooler,create_posm,api_logout
app_name = "restaurant"

urlpatterns = [
    path('login/',login_view,name="login"),
    path('index/',restaurant,name="restaurant"),
     path('api/signin_send_otp/',signin_send_otp,name="signin_send_otp"),
    path('api/signin_verify_otp/',signin_verify_otp,name="signin_verify_otp"),
    path("api/signin/",signin,name="signin"),
    path("api/get-restaurant-coolers/",get_restaurant_cooler,name="get_restaurant_coolers"),
    path("api/get-restaurant-posm/",get_restaurant_posm,name="get_restaurant_posm"),
    path("api/request-manual-review/", request_manual_review, name="request_manual_review"),
    path("api/request-posm-manual-review/", request_posm_manual_review, name="request_posm_manual_review"),
    path("api/add-crate-sale/",add_crate_sale,name="add_crate_sale"),
    path("api/upload-image/",upload_cooler_image,name="upload_image"),
    path("api/cooler-create/",create_cooler,name="create_cooler"),
    path("api/upload-posm-image/",upload_posm_image,name="upload_posm_image"),
    path("api/posm-create/",create_posm,name="create_posm"),
    path("api/logout/",api_logout,name="api_logout")


]
