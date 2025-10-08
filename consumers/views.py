from django.shortcuts import render
from django.core.files.storage import default_storage
from .utils import parse_receipt
from django.http import JsonResponse
from io import BytesIO
from PIL import Image
import base64
import uuid
from django.core.files.base import ContentFile
import json
from django.conf import settings
import boto3
from  .models import Consumer,RequestLog
from restaurant.models import Restaurant
from django.views.decorators.csrf import csrf_exempt
import re
import qrcode
from .api_logging import log_specific_api


@log_specific_api
def consumer(request):

    return render(request,"consumers/index.html")

@log_specific_api
def upload_image(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
            image_data = data.get("image")
            if not image_data:
                return JsonResponse({"error": "No image received"}, status=400)

            format, imgstr = image_data.split(";base64,")
            ext = format.split("/")[-1]
            filename = f"{uuid.uuid4()}.{ext}"

            file = ContentFile(base64.b64decode(imgstr), name=filename)

            # Pass file into parse_receipt BEFORE uploading
            bill_no, total_price, text, found_products = parse_receipt(BytesIO(file.read()))
            file.seek(0)  # Reset file pointer for later upload

            # 🔍 Print parsed receipt response for debugging
            print("🧾 Parsed Receipt:")
            print("   Bill No:", bill_no)
            print("   Total Price:", total_price)
            print("   Found Products:", found_products)
            print("   OCR Text Preview:", text[:200], "...") 

            if not bill_no or not total_price or not found_products:
                return JsonResponse({
                    "error": "Receipt validation failed",
                    "details": {
                        "bill_no": bill_no,
                        "total_price": total_price,
                        "found_products": found_products,
                    },
                }, status=400)

            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )

            file_key = f"receipt/{filename}"
            content_type = getattr(file, "content_type", "image/png")

            s3.upload_fileobj(
                file,
                settings.AWS_STORAGE_BUCKET_NAME,
                file_key,
                ExtraArgs={"ContentType": content_type},
            )

            file_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{file_key}"
            print("✅ Uploaded to S3:", file_url)

            return JsonResponse({
                "url": file_url,
                "bill_no": bill_no,
                "text": text,
                "total_price": total_price,
                "found_products": found_products,
            })

        except Exception as e:
            print("❌ Upload failed:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request"}, status=400)


import json
from django.http import JsonResponse


@log_specific_api

def create_consumer(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))

            print(data)

            consumer_name = data.get("consumer_name")
            consumer_phone_number = data.get("consumer_phone_number")
            restaurant_id = data.get("restaurant_id")
            reciept_url = data.get("reciept_url")
            checkbox1 = data.get("checkbox1")
            checkbox2 = data.get("checkbox2")

            # Basic validation
            if not consumer_name:
                return JsonResponse({"error": "Consumer name is required"}, status=400)
            if not consumer_phone_number:
                return JsonResponse({"error": "Phone number is required"}, status=400)
            if not re.fullmatch(r"03\d{9}", consumer_phone_number or ""):
                return JsonResponse({"error": "Contact number must start with 03 and be 11 digits long"}, status=400)

            if not restaurant_id:
                return JsonResponse({"error": "Restaurant ID is required"}, status=400)

            # Check restaurant exists
            try:
                restaurant = Restaurant.objects.get(id=restaurant_id)
            except Restaurant.DoesNotExist:
                return JsonResponse({"error": "Restaurant not found"}, status=404)

            # Create Consumer entry
            consumer = Consumer.objects.create(
                consumer_name=consumer_name,
                consumer_phone_number=consumer_phone_number,
                restaurant=restaurant,
                reciept_url=reciept_url,
                isadvertisement = checkbox1,
                isTermsandpolicy = checkbox2,
            )

            return JsonResponse({
                "message": "Consumer created successfully",
                "consumer": {
                    "id": consumer.id,
                    "name": consumer.consumer_name,
                    "phone": consumer.consumer_phone_number,
                    "restaurant": consumer.restaurant.id,
                    "reciept_url": consumer.reciept_url,
                    "created_at": consumer.created_at,
                    "is_checked": consumer.is_checked,
                }
            }, status=201)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request"}, status=400)

def health_check(request):
    return render(request,"consumers/health_check.html")

def request_logs(request):
    logs = RequestLog.objects.order_by('-timestamp')[:100]
    data = [
        {
            "path": log.path,
            "method": log.method,
            "status_code": log.status_code,
            "response_time": log.response_time,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]
    return JsonResponse(data, safe=False)
