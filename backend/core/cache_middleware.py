"""
HTTP caching middleware for API responses.
Adds ETag, Cache-Control, and Last-Modified headers for optimal caching.
"""
import hashlib
import json
from django.utils.cache import patch_cache_control, patch_vary_headers
from django.utils.http import http_date
from django.http import HttpResponseNotModified
from datetime import datetime


class APICacheMiddleware:
    """
    Middleware to add HTTP caching headers to API responses.
    
    - Adds ETag based on response content
    - Adds Cache-Control headers for client-side caching
    - Handles If-None-Match (304 Not Modified) responses
    - Adds Last-Modified headers
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Only cache GET requests to /api/ endpoints
        if request.method != 'GET' or not request.path.startswith('/api/'):
            return response
        
        # Don't cache error responses
        if response.status_code >= 400:
            return response
        
        # Generate ETag from response content
        if hasattr(response, 'content'):
            content = response.content
            etag = f'"{hashlib.md5(content).hexdigest()}"'
            response['ETag'] = etag
            
            # Check If-None-Match header for conditional requests
            if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
            if if_none_match == etag:
                return HttpResponseNotModified()
        
        # Add Cache-Control headers based on endpoint.
        # These responses are user-specific, so they must never be shared across users.
        path = request.path

        patch_vary_headers(response, ["Authorization"])
        
        if '/auth/profile/' in path:
            patch_cache_control(response, private=True, no_cache=True, no_store=True, must_revalidate=True)
        elif '/meals/day/' in path or '/training/day/' in path:
            # Individual day data: cache for 1 minute
            patch_cache_control(response, max_age=60, private=True, must_revalidate=True)
        elif '/meals/batch/' in path:
            # Batch requests: cache for 1 minute
            patch_cache_control(response, max_age=60, private=True, must_revalidate=True)
        elif '/meals/weekly/' in path or '/training/weekly/' in path:
            # Weekly plans: cache for 2 minutes
            patch_cache_control(response, max_age=120, private=True, must_revalidate=True)
        elif '/meals/all-days/' in path or '/training/all-days/' in path:
            # All days view: cache for 2 minutes
            patch_cache_control(response, max_age=120, private=True, must_revalidate=True)
        else:
            # Default: cache for 30 seconds
            patch_cache_control(response, max_age=30, private=True, must_revalidate=True)
        
        # Add Last-Modified header (current time as fallback)
        if not response.has_header('Last-Modified'):
            response['Last-Modified'] = http_date(datetime.now().timestamp())
        
        return response
