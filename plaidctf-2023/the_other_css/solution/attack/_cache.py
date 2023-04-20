import pickle
from typing import Callable, Coroutine, TypeVar

from typing_extensions import ParamSpec

P = ParamSpec("P")
T = TypeVar("T")

def cache(path: str):
	def decorator(func: Callable[P, T]) -> Callable[P, T]:
		def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
			try:
				with open(path, "rb") as f:
					result = pickle.load(f)
					print("Using cached result for", func.__name__)
					return result
			except FileNotFoundError:
				pass

			result = func(*args, **kwargs)

			with open(path, "wb") as f:
				pickle.dump(result, f)

			return result

		return wrapper

	return decorator

def async_cache(path: str):
	def decorator(func: Callable[P, Coroutine[None, None, T]]) -> Callable[P, Coroutine[None, None, T]]:
		async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
			try:
				with open(path, "rb") as f:
					result = pickle.load(f)
					print("Using cached result for", func.__name__)
					return result
			except FileNotFoundError:
				pass

			result = await func(*args, **kwargs)

			with open(path, "wb") as f:
				pickle.dump(result, f)

			return result

		return wrapper

	return decorator
