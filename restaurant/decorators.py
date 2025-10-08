from functools import wraps
from django.shortcuts import redirect

def manager_login_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.session.get("manager_id"):
            return redirect("/restaurants/login/")  
        return view_func(request, *args, **kwargs)
    return _wrapped_view
