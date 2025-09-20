"""
Redis caching utilities for RedStorm optimization
"""
import redis
import json
import hashlib
from typing import Any, Optional, Dict
from datetime import timedelta
import os

class RedisCache:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            db=int(os.getenv('REDIS_DB', 0)),
            decode_responses=True
        )
        self.default_ttl = 3600  # 1 hour

    def _generate_key(self, prefix: str, data: Dict[str, Any]) -> str:
        """Generate cache key from data"""
        data_str = json.dumps(data, sort_keys=True)
        hash_obj = hashlib.md5(data_str.encode())
        return f"{prefix}:{hash_obj.hexdigest()}"

    def get(self, key: str) -> Optional[Any]:
        """Get cached data"""
        try:
            cached_data = self.redis_client.get(key)
            if cached_data:
                return json.loads(cached_data)
            return None
        except Exception as e:
            print(f"[v0] Redis get error: {e}")
            return None

    def set(self, key: str, data: Any, ttl: Optional[int] = None) -> bool:
        """Set cached data with TTL"""
        try:
            ttl = ttl or self.default_ttl
            serialized_data = json.dumps(data, default=str)
            return self.redis_client.setex(key, ttl, serialized_data)
        except Exception as e:
            print(f"[v0] Redis set error: {e}")
            return False

    def cache_scan_result(self, target: str, scan_type: str, result: Dict[str, Any]) -> str:
        """Cache scan result with optimized key"""
        cache_key = self._generate_key(f"scan:{scan_type}", {"target": target})
        self.set(cache_key, result, ttl=1800)  # 30 minutes for scan results
        return cache_key

    def get_cached_scan(self, target: str, scan_type: str) -> Optional[Dict[str, Any]]:
        """Get cached scan result"""
        cache_key = self._generate_key(f"scan:{scan_type}", {"target": target})
        return self.get(cache_key)

    def cache_subdomain_enum(self, domain: str, result: Dict[str, Any]) -> str:
        """Cache subdomain enumeration results"""
        cache_key = self._generate_key("subdomain", {"domain": domain})
        self.set(cache_key, result, ttl=7200)  # 2 hours for subdomain results
        return cache_key

    def get_cached_subdomains(self, domain: str) -> Optional[Dict[str, Any]]:
        """Get cached subdomain results"""
        cache_key = self._generate_key("subdomain", {"domain": domain})
        return self.get(cache_key)

    def invalidate_target_cache(self, target: str):
        """Invalidate all cache entries for a target"""
        try:
            pattern = f"*{target}*"
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
        except Exception as e:
            print(f"[v0] Cache invalidation error: {e}")

# Global cache instance
cache = RedisCache()
