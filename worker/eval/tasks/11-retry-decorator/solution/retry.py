import functools
import time

def retry(times, exceptions=(Exception,), delay=0.0, backoff=1.0, sleep=time.sleep):
    if times < 1:
        raise ValueError("times must be >= 1")

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            wait = delay
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except exceptions:
                    if attempt == times - 1:
                        raise
                    if wait:
                        sleep(wait)
                    wait *= backoff
        return wrapper
    return decorator
