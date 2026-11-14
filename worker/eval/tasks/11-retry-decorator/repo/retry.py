import time

def retry(times, exceptions=(Exception,), delay=0.0, backoff=1.0, sleep=time.sleep):
    raise NotImplementedError
