from django.shortcuts import render,redirect
from django.http import JsonResponse
from django.contrib.auth.models import User
from restaurant.models import Manager
from .models import Restaurant,Restaurant_Target,Restaurant_Crate_Sales,Restaurant_Cooler,Restaurant_POSM
from consumers.models import Consumer
import json
import requests
from django.contrib.auth import authenticate , login
from pepsiBackend.settings import api_key , from_number
from .decorators import manager_login_required
from django.utils.timezone import now
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.tokens import AccessToken
from django.db.models import Sum,Avg
from django.core.files.storage import default_storage
from django.http import JsonResponse
from io import BytesIO
from PIL import Image
import base64
import uuid
from django.core.files.base import ContentFile
from django.conf import settings
from .run_detector import get_bottle_counts
import boto3
from django.core.files.base import ContentFile
from .utils import get_posm_count
from django.utils import timezone
from datetime import timedelta
import datetime
from django.views.decorators.http import require_POST


def login_view(request):
    if request.session.get("manager_id"):
        return redirect("/restaurants/index/")
    
    return render(request, "restaurant/index.html")



@manager_login_required    
def restaurant(request):
    manager_id = request.session.get("manager_id")
    manager = Manager.objects.get(id=manager_id)
    try:
        restaurant = Restaurant.objects.get(manager=manager)
    except Restaurant.DoesNotExist:
        restaurant = None  

    import datetime

    today = datetime.date.today()
    current_month = today.month
    current_year = today.year


    bottle_crates_total = 0  
    bottle_crate_target = 0
    bottle_crate_target_for_popup = 0
    consumer_total = 0
    consumer_target_achieved = 0
    consumer_target_achieved_popup = 0
    coolers = []
    restaurant_coolers = 0
    restaurant_coolers_for_popup = 0
    restaurant_posms = 0
    restaurant_posms_for_popup = 0
    cooler_compliance = 0
    posms = []
    posm_compliance = 0
    compliance_target_total = 0
    total_compliance_achieved = 0
    overall_target_achieved = 0
    show_weekly_popup = False 
    current_weekday = today.weekday() 


    start_of_week = today - datetime.timedelta(days=current_weekday)
    end_of_week = start_of_week + datetime.timedelta(days=6)


    if restaurant:
        bottle_crates_total = Restaurant_Target.objects.filter(
            restaurant=restaurant,
            target_type="Cases Purchased",
                created_at__month=current_month,
        created_at__year=current_year
        ).aggregate(total=Sum("target_value"))["total"] or 0

        bottle_crate_target = Restaurant_Crate_Sales.objects.filter(
            restaurant=restaurant,
            is_approved = True,
                created_at__month=current_month,
    created_at__year=current_year
        ).aggregate(total=Sum("crate_quantity"))["total"] or 0    


        consumer_total = Restaurant_Target.objects.filter(
            restaurant=restaurant,
            target_type="Consumer",
            created_at__month=current_month,
            created_at__year=current_year
        ).aggregate(total=Sum("target_value"))["total"] or 0

        consumer_target_achieved = Consumer.objects.filter(
            restaurant=restaurant,
            is_checked=True,
                created_at__month=current_month,
    created_at__year=current_year
        ).count()

        compliance_target_total = (
            Restaurant_Target.objects
            .filter(restaurant=restaurant,target_type="Compliance",    created_at__month=current_month,
    created_at__year=current_year)
            .aggregate(total=Avg("target_value"))["total"] or 0
        )

        restaurant_coolers = Restaurant_Cooler.objects.filter(restaurant=restaurant,is_checked=True,created_at__month=current_month,
    created_at__year=current_year)
        

        restaurant_coolers_for_popup = Restaurant_Cooler.objects.filter(
    restaurant=restaurant,
    created_at__date__gte=start_of_week,
    created_at__date__lte=end_of_week
)

        cooler_numerator_sum = 0
        cooler_denominator_sum = 0

        for cooler in restaurant_coolers:
            if cooler.raw_data and "/" in cooler.raw_data:
                num, denom = cooler.raw_data.split("/")
                try:
                    cooler_numerator_sum += int(num)
                    cooler_denominator_sum += int(denom)
                except ValueError:
                    continue

        cooler_compliance = round((cooler_numerator_sum / cooler_denominator_sum) * 100, 2) if cooler_denominator_sum else 0


        restaurant_posms = Restaurant_POSM.objects.filter(restaurant=restaurant,is_checked=True,created_at__month=current_month,
    created_at__year=current_year)


        restaurant_posms_for_popup = Restaurant_POSM.objects.filter(
                    restaurant=restaurant,
                    created_at__date__gte=start_of_week,
                    created_at__date__lte=end_of_week
                )

        posm_numerator_sum = 0
        posm_denominator_sum = 0

        for posm in restaurant_posms:
            if posm.raw_data and "/" in posm.raw_data:
                num, denom = posm.raw_data.split("/")
                try:
                    posm_numerator_sum += int(num)
                    posm_denominator_sum += int(denom)
                except ValueError:
                    continue

        posm_compliance = round((posm_numerator_sum / posm_denominator_sum) * 100, 2) if posm_denominator_sum else 0

        sales_achievement = 0
        consumer_achievement = 0

        total_compliance_achieved = round((cooler_compliance*(2/3))+(posm_compliance*(1/3)),2)
        if bottle_crate_target != 0:
            sales_achievement = round((bottle_crate_target / bottle_crates_total)*100,2)
        if consumer_total != 0:    
            consumer_achievement = round((consumer_target_achieved/consumer_total)*100,2)
        overall_target_achieved = round((cooler_compliance*0.2)+(posm_compliance*0.1)+(sales_achievement*0.5)+(consumer_achievement*0.2),2)


       


        if restaurant.posm_type:
            for item in restaurant.posm_type:
                qty = int(item.get("qty", 0))
                ptype = item.get("type", "Unknown")

                if qty > 1:
                    for i in range(1, qty + 1):
                        posms.append(f"{ptype} - {i}")
                elif qty == 1:
                    posms.append(ptype)


        if restaurant.cooler_type:
            for item in restaurant.cooler_type:
                qty = int(item.get("qty", 0))
                ctype = item.get("type", "Unknown")

                if qty > 1:
                    for i in range(1, qty + 1):
                        coolers.append(f"{ctype} - {i}")
                elif qty == 1:
                    coolers.append(ctype)
        print(coolers)
        print(posms)            


    missing_messages_en = []
    missing_messages_ur = []

    print("Current Weekday:", current_weekday)

    if current_weekday in [3, 4, 5, 6]: 
        if not restaurant_coolers_for_popup:
            missing_messages_en.append("You have not submitted <b>Cooler</b> photos of this week yet.</br>")
            missing_messages_ur.append("آپ نے اس ہفتے <b>Cooler</b> کی تصاویر ابھی تک جمع نہیں کیں۔</br>")
            
        if not restaurant_posms_for_popup:
            missing_messages_en.append("You have not submitted <b>POSM</b> photos of this week yet.</br>")
            missing_messages_ur.append("آپ نے اس ہفتے <b>POSM</b> کی تصاویر ابھی تک جمع نہیں کیں۔</br>")

        if missing_messages_en:
            show_weekly_popup = True


    context = {
        "restaurant": restaurant,
        "bottle_crates_total": bottle_crates_total,
        "bottle_crate_target":bottle_crate_target,
        "consumer_total": consumer_total,
        "compliance_target_total":compliance_target_total,
        "consumer_target_achieved": consumer_target_achieved,
        "coolers":coolers,
        "posms":posms,
        "total_compliance_achieved":total_compliance_achieved,
        "overall_target_achieved":overall_target_achieved,
            "show_weekly_popup": show_weekly_popup,
    "missing_messages_en": missing_messages_en,
    "missing_messages_ur": missing_messages_ur,
    }

    return render(request, "restaurant/restaurant.html", context)

def get_restaurant_cooler(request):
    import datetime
    today = datetime.date.today()
    current_month = today.month
    current_year = today.year

    manager_id = request.session.get("manager_id")
    if not manager_id:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        manager = Manager.objects.get(id=manager_id)
    except Manager.DoesNotExist:
        return JsonResponse({"error": "Manager not found"}, status=404)

    try:
        restaurant = Restaurant.objects.get(manager=manager)
    except Restaurant.DoesNotExist:
        return JsonResponse({"error": "Restaurant not found"}, status=404)

    restaurant_coolers = Restaurant_Cooler.objects.filter(
        restaurant=restaurant,
        is_checked=True,
        created_at__month=current_month,
        created_at__year=current_year
    )

    cooler_list = []

    for cooler in restaurant_coolers:
        compliance = 0
        if cooler.raw_data and "/" in cooler.raw_data:
            try:
                num, denom = cooler.raw_data.split("/")
                num = int(num)
                denom = int(denom)
                compliance = round((num / denom) * 100, 2) if denom else 0
            except ValueError:
                compliance = 0

        cooler_list.append({
            "id": cooler.id,
            "cooler_type": cooler.cooler_type,
            "compliance": compliance,
            "image": cooler.image,
        })

    return JsonResponse({"coolers": cooler_list}, status=200)


def get_restaurant_posm(request):
    import datetime
    today = datetime.date.today()
    current_month = today.month
    current_year = today.year

    manager_id = request.session.get("manager_id")
    if not manager_id:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        manager = Manager.objects.get(id=manager_id)
    except Manager.DoesNotExist:
        return JsonResponse({"error": "Manager not found"}, status=404)

    try:
        restaurant = Restaurant.objects.get(manager=manager)
    except Restaurant.DoesNotExist:
        return JsonResponse({"error": "Restaurant not found"}, status=404)

    restaurant_posms = Restaurant_POSM.objects.filter(
        restaurant=restaurant,
        is_checked=True,
        created_at__month=current_month,
        created_at__year=current_year
    )

    posm_list = []

    for posm in restaurant_posms:
        compliance = 0
        if posm.raw_data and "/" in posm.raw_data:
            try:
                num, denom = posm.raw_data.split("/")
                num = int(num)
                denom = int(denom)
                compliance = round((num / denom) * 100, 2) if denom else 0
            except ValueError:
                compliance = 0

        posm_list.append({
            "id": posm.id,
            "posm_type": posm.posm_type,
            "compliance": compliance,
            "image": posm.image,
        })

    return JsonResponse({"coolers": posm_list}, status=200)



@require_POST
def request_manual_review(request):
    try:
        data = json.loads(request.body)
        cooler_id = data.get("cooler_id")

        if not cooler_id:
            return JsonResponse({"error": "cooler_id is required"}, status=400)

        try:
            cooler = Restaurant_Cooler.objects.get(id=cooler_id)
        except Restaurant_Cooler.DoesNotExist:
            return JsonResponse({"error": "Cooler not found"}, status=404)

        cooler.is_manually = True
        cooler.save()

        return JsonResponse({
            "success": True,
            "message": f"Manual review requested for cooler {cooler.cooler_type}",
            "cooler_id": cooler_id,
            "is_manually": cooler.is_manually
        }, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_POST
def request_posm_manual_review(request):
    try:
        data = json.loads(request.body)
        posm_id = data.get("posm_id")

        if not posm_id:
            return JsonResponse({"error": "posm_id is required"}, status=400)

        try:
            posm = Restaurant_POSM.objects.get(id=posm_id)
        except Restaurant_POSM.DoesNotExist:
            return JsonResponse({"error": "Posm not found"}, status=404)

        posm.is_manually = True
        posm.save()

        return JsonResponse({
            "success": True,
            "message": f"Manual review requested for posm {posm.posm_type}",
            "posm_id": posm_id,
            "is_manually": posm.is_manually
        }, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



def signin_send_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            phone_number = data.get('contactNo')
            if not phone_number:
                return JsonResponse({'success': False, 'message': 'Contact number is required.'}, status=400)

            if not Manager.objects.filter(phone_number=phone_number).exists():
                return JsonResponse({'success': False, 'message': 'Manager with this contact number does not exist.'}, status=400)

            # Construct the OTP URL
            url = f'https://api.itelservices.net/sendotp.php?type=php&api_key={api_key}&number={phone_number}&from={from_number}&template=Welcome to Pepsi Premium Club. \n Your verification code is: [otp]. Please enter this code to complete your verification.'
            
            # Send OTP request
            response = requests.get(url)
            if response.status_code == 200:
                return JsonResponse({'success': True, 'message': 'OTP sent successfully.'}, status=200)
            else:
                return JsonResponse({'success': False, 'message': f'Failed to send OTP: Error: Please Check your connection '}, status=response.status_code)

        except Exception as e:
            return JsonResponse({'success': False, 'message': 'Please Try again Later.Check your connection'}, status=500)
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=405)
    
def signin_verify_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            phone_number = data.get('contactNo')
            otp = data.get('otpInput')
                                    
        
            if not phone_number or not otp:
                return JsonResponse({'success': False, 'message': 'Contact number and OTP are required.'}, status=400)

            # Verify OTP with ITel API
            url = f'https://api.itelservices.net/sendotp.php?type=php&api_key={api_key}&number={phone_number}&from={from_number}&otp={otp}'
            response = requests.post(url)

            if response.status_code == 200 and "Status" in response.text:
                status = response.text.split(',')[0].split(' ')[1]
                if status == "301":
                    return JsonResponse({'success': True, 'message': 'OTP verified successfully.'}, status=200)
                elif status == "302":
                    return JsonResponse({'success': False, 'message': 'OTP expired.'}, status=400)
                else:
                    return JsonResponse({'success': False, 'message': 'Invalid OTP.'}, status=400)
            else:
                return JsonResponse({'success': False, 'message': 'Error: Please Check your connection '}, status=500)
        except Exception as e:
            return JsonResponse({'success': False, 'message': 'Please Try again Later.Check your connection'}, status=500)
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=405)



def signin(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            phone_number = data.get("contactNo")
            otp_input = data.get("otpInput")

            if not (phone_number and otp_input):
                return JsonResponse(
                    {"success": False, "message": "Contact number and OTP are required."},
                    status=400,
                )

            try:
                manager = Manager.objects.get(phone_number=phone_number)
            except Manager.DoesNotExist:
                return JsonResponse(
                    {"success": False, "message": "Manager with this contact number does not exist."},
                    status=400,
                )

            refresh = RefreshToken.for_user(manager)
            request.session["manager_id"] = manager.id
               
            return JsonResponse({"success": True, "message": "Login successful","access": str(refresh.access_token),"refresh": str(refresh), "redirect": "/restaurants/index/"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"success": False, "message": "Invalid JSON format."}, status=400)

    return JsonResponse({"success": False, "message": "Invalid request method."}, status=405)


@manager_login_required
def add_crate_sale(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Only POST allowed"}, status=405)

    # --- JWT AUTH START ---
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JsonResponse({"success": False, "message": "Missing or invalid token"}, status=401)

    token_str = auth_header.split(" ")[1]
    try:
        access_token = AccessToken(token_str)
        user_id = access_token["user_id"]

        manager = Manager.objects.get(id=user_id)

    except Manager.DoesNotExist:
        return JsonResponse({"success": False, "message": "Manager not found"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "message": f"Invalid token: {e}"}, status=401)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "message": "Invalid JSON"}, status=400)

    crate_quantity = data.get("crate_quantity")
    try:
        crate_quantity = int(crate_quantity)
        if crate_quantity <= 0:
            return JsonResponse({"success": False, "message": "Quantity must be greater than 0"}, status=400)
    except (TypeError, ValueError):
        return JsonResponse({"success": False, "message": "Quantity must be a number"}, status=400)

    try:
        restaurant = Restaurant.objects.get(manager=manager)
    except Restaurant.DoesNotExist:
        return JsonResponse({"success": False, "message": "Restaurant not found"}, status=404)

    bottle_crates_total = Restaurant_Target.objects.filter(
            restaurant=restaurant,
            target_type="Cases Purchased"
        ).aggregate(total=Sum("target_value"))["total"] or 0

    if crate_quantity > bottle_crates_total:
        return JsonResponse({"success": False, "message": "You have exceed your target"}, status=404)



    sale_month = now().strftime("%B %Y")
    sale = Restaurant_Crate_Sales.objects.create(
        sale_month=sale_month,
        crate_quantity=crate_quantity,
        restaurant=restaurant
    )

    return JsonResponse({
        "success": True,
        "message": "Crate sale recorded successfully",
        "data": {
            "id": sale.id,
            "sale_month": sale.sale_month,
            "crate_quantity": sale.crate_quantity,
            "created_at": sale.created_at
        }
    }, status=200)

import tempfile
import os

@manager_login_required
def upload_cooler_image(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)
    
    manager_id = request.session.get("manager_id")
    try:
        restaurant = Restaurant.objects.get(manager=manager_id)
    except Restaurant.DoesNotExist:
        return JsonResponse({"error": "Restaurant not found"}, status=404)

    try:
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())   
        end_of_week = start_of_week + timedelta(days=6)           

        already_submitted = Restaurant_Cooler.objects.filter(
            restaurant=restaurant,
            created_at__date__gte=start_of_week,
            created_at__date__lte=end_of_week
        ).exists()

        if already_submitted:
            return JsonResponse(
                {"error": "Cooler image has already been submitted for this week."},
                status=400
            )

        data = json.loads(request.body.decode("utf-8"))
        image_data = data.get("image")
        if not image_data:
            return JsonResponse({"error": "No image received"}, status=400)

        format, imgstr = image_data.split(";base64,")
        ext = format.split("/")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(os.getcwd(), filename)

        with open(file_path, "wb") as f:
            f.write(base64.b64decode(imgstr))

        bottles = get_bottle_counts(file_path)
        if not bottles:
            os.remove(file_path)
            return JsonResponse({"error": "Bottle detection failed"}, status=400)

        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        file_key = f"coolers/{filename}"
        content_type = f"image/{ext}"

        with open(file_path, "rb") as f:
            s3.upload_fileobj(
                f,
                settings.AWS_STORAGE_BUCKET_NAME,
                file_key,
                ExtraArgs={"ContentType": content_type},
            )

        file_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"

        os.remove(file_path)

        return JsonResponse({
            "success": True,
            "file_url": file_url,
            "bottles": bottles
        }, status=200)

    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        return JsonResponse({"error": str(e)}, status=500)


@manager_login_required
def upload_posm_image(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        # ✅ Restaurant lookup (same as cooler)
        manager_id = request.session.get("manager_id")
        try:
            restaurant = Restaurant.objects.get(manager=manager_id)
        except Restaurant.DoesNotExist:
            return JsonResponse({"error": "Restaurant not found"}, status=404)

        # ✅ Weekly submission check
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        already_submitted = Restaurant_POSM.objects.filter(
            restaurant=restaurant,
            created_at__date__gte=start_of_week,
            created_at__date__lte=end_of_week
        ).exists()

        if already_submitted:
            return JsonResponse(
                {"error": "POSM image has already been submitted for this week."},
                status=400
            )

        # ✅ Parse image
        data = json.loads(request.body.decode("utf-8"))
        image_data = data.get("image")
        if not image_data:
            return JsonResponse({"error": "No image received"}, status=400)

        format, imgstr = image_data.split(";base64,")
        ext = format.split("/")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(os.getcwd(), filename)

        with open(file_path, "wb") as f:
            f.write(base64.b64decode(imgstr))

        # ✅ Detect brands
        detected_brands, total_no_of_brand = get_posm_count()
        if not detected_brands:
            os.remove(file_path)
            return JsonResponse(
                {"error": "POSM detection failed"},
                status=400
            )

        # ✅ Upload to S3
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )

        file_key = f"posm/{filename}"
        content_type = f"image/{ext}"

        with open(file_path, "rb") as f:
            s3.upload_fileobj(
                f,
                settings.AWS_STORAGE_BUCKET_NAME,
                file_key,
                ExtraArgs={"ContentType": content_type},
            )

        file_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"

        os.remove(file_path)

        return JsonResponse({
            "success": True,
            "file_url": file_url,
            "detected_brands": detected_brands,
            "total_no_of_brand": total_no_of_brand
        }, status=200)

    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        return JsonResponse({"error": str(e)}, status=500)


@manager_login_required
def create_cooler(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    try:
        manager_id = request.session.get("manager_id")
        restaurant = Restaurant.objects.get(manager=manager_id)
        print(manager_id)
        print(restaurant)
        data = json.loads(request.body.decode("utf-8"))

        cooler_type = data.get("cooler_type")
        restaurant_id = restaurant.id
        raw_data = data.get("raw_data")
        image_data = data.get("image")

        if not cooler_type or not restaurant_id:
            return JsonResponse({"error": "Missing required fields"}, status=400)

        # Validate restaurant
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return JsonResponse({"error": "Restaurant not found"}, status=404)

        cooler = Restaurant_Cooler(
            cooler_type=cooler_type,
            restaurant=restaurant,
            raw_data=raw_data,
            image = image_data
        )

        cooler.save()

        return JsonResponse({
            "id": cooler.id,
            "cooler_type": cooler.cooler_type,
            "restaurant_id": restaurant.id,
            "raw_data": cooler.raw_data,
            "image_url": cooler.image,
            "is_checked": cooler.is_checked,
            "created_at": cooler.created_at
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@manager_login_required
def create_posm(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    try:
        manager_id = request.session.get("manager_id")
        restaurant = Restaurant.objects.get(manager=manager_id)
        print(manager_id)
        print(restaurant)
        data = json.loads(request.body.decode("utf-8"))

        posm_type = data.get("posm_type")
        restaurant_id = restaurant.id
        raw_data = data.get("raw_data")
        image_data = data.get("image")

        if not posm_type or not restaurant_id:
            return JsonResponse({"error": "Missing required fields"}, status=400)

        # Validate restaurant
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return JsonResponse({"error": "Restaurant not found"}, status=404)

        posm = Restaurant_POSM(
            posm_type=posm_type,
            restaurant=restaurant,
            raw_data=raw_data,
            image = image_data
        )

        posm.save()

        return JsonResponse({
            "id": posm.id,
            "cooler_type": posm.posm_type,
            "restaurant_id": restaurant.id,
            "raw_data": posm.raw_data,
            "image_url": posm.image,
            "is_checked": posm.is_checked,
            "created_at": posm.created_at
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    


@manager_login_required
def api_logout(request):
    if request.method == "POST":
        request.session.flush()
        
        return JsonResponse({"success": True, "message": "Logged out successfully"}, status=200)

    return JsonResponse({"success": False, "message": "Invalid request method."}, status=405)