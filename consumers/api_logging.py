# utils/log_request.py
import time
from functools import wraps
from django.db import DatabaseError
from .models import RequestLog

def log_specific_api(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        start_time = time.time()
        error_message = None
        status_code = 200

        try:
            response = func(request, *args, **kwargs)
            status_code = getattr(response, "status_code", 200)
        except Exception as e:
            error_message = str(e)
            status_code = 500
            raise
        finally:
            duration = (time.time() - start_time) * 1000  # ms
            try:
                RequestLog.objects.create(
                    method=request.method,
                    path=request.path,
                    status_code=status_code,
                    response_time=duration,
                    error_message=error_message,
                )
            except DatabaseError:
                pass

        return response
    return wrapper
