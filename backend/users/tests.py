from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile


class AuthOnboardingTests(APITestCase):
	def setUp(self):
		self.register_url = "/api/auth/register/"
		self.login_url = "/api/auth/login/"
		self.profile_url = "/api/auth/profile/"

	def _create_user(self, username="newuser", email="new@example.com", password="Password123"):
		return User.objects.create_user(username=username, email=email, password=password)

	def _auth_headers(self, user):
		access = str(RefreshToken.for_user(user).access_token)
		return {"HTTP_AUTHORIZATION": f"Bearer {access}"}

	def test_register_marks_onboarding_incomplete(self):
		response = self.client.post(
			self.register_url,
			{
				"username": "freshsignup",
				"email": "fresh@example.com",
				"password": "Password123",
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertFalse(response.data["onboarding_complete"])
		self.assertIn("access", response.data)
		self.assertIn("refresh", response.data)

	def test_login_marks_new_user_incomplete(self):
		user = self._create_user()

		response = self.client.post(
			self.login_url,
			{"username": user.username, "password": "Password123"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertFalse(response.data["onboarding_complete"])

	def test_login_marks_completed_profile_complete(self):
		user = self._create_user(username="profiled")
		UserProfile.objects.create(
			user=user,
			age=28,
			weight_kg=72.5,
			height_cm=176,
			goal="fat_loss",
			diet_preference="veg",
		)

		response = self.client.post(
			self.login_url,
			{"username": user.username, "password": "Password123"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data["onboarding_complete"])

	def test_profile_missing_returns_404_with_private_no_store_headers(self):
		user = self._create_user(username="missingprofile")
		response = self.client.get(self.profile_url, **self._auth_headers(user))

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
		self.assertIn("no-store", response.headers.get("Cache-Control", ""))
		self.assertIn("Authorization", response.headers.get("Vary", ""))

	def test_profile_present_marks_complete(self):
		user = self._create_user(username="completeprofile")
		UserProfile.objects.create(
			user=user,
			age=31,
			weight_kg=80,
			height_cm=182,
			goal="maintenance",
			diet_preference="non_veg",
		)

		response = self.client.get(self.profile_url, **self._auth_headers(user))

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data["onboarding_complete"])
		self.assertIn("private", response.headers.get("Cache-Control", ""))
		self.assertIn("no-store", response.headers.get("Cache-Control", ""))
