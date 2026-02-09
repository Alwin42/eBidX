from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.forms import ValidationError
from django.contrib.auth import get_user_model


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def is_open_for_signup(self, request, sociallogin):
        if request:
            data = getattr(request, "data", {}) or getattr(request, "POST", {})
            if data.get("process") != "register":
                return False
        return True

    def pre_social_login(self, request, sociallogin):
        if request:
            data = getattr(request, "data", {}) or getattr(request, "POST", {})
            if data.get("process") == "register":
                if sociallogin.is_existing:
                    raise ValidationError(
                        "Account already exists. Please log in instead."
                    )
                User = get_user_model()
                email = sociallogin.user.email
                if email and User.objects.filter(email=email).exists():
                    raise ValidationError(
                        "Account with this email already exists. Please log in."
                    )
