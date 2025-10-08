from django.http import HttpResponseForbidden
from functools import wraps
from django.shortcuts import redirect


def superuser_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            # Redirect to login if not logged in
            from django.contrib.auth.views import redirect_to_login
            return redirect_to_login(request.get_full_path())
        if not request.user.is_superuser:
            return HttpResponseForbidden("You are not allowed to access this page.")
        return view_func(request, *args, **kwargs)
    return wrapper

def developer_login_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not hasattr(request.user, "profile") or request.user.profile.role != "Developer":
            return redirect("dashboard:login")  # use named URL instead of hardcoding
        return view_func(request, *args, **kwargs)
    return _wrapped_view
