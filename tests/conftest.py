import starlette.testclient
import httpx
from functools import wraps

# Patch TestClient __init__ for compatibility with httpx>=0.28
if httpx.__version__ >= "0.28":
    import inspect

    sig = inspect.signature(starlette.testclient._TestClientTransport.__init__)
    if "client" not in sig.parameters:
        original_init = starlette.testclient.TestClient.__init__

        @wraps(original_init)
        def patched_init(
            self,
            app,
            base_url="http://testserver",
            raise_server_exceptions=True,
            root_path="",
            backend="asyncio",
            backend_options=None,
            cookies=None,
            headers=None,
        ):
            self.async_backend = starlette.testclient._AsyncBackend(
                backend=backend, backend_options=backend_options or {}
            )
            if starlette.testclient._is_asgi3(app):
                asgi_app = app
            else:
                asgi_app = starlette.testclient._WrapASGI2(app)
            self.app = asgi_app
            self.app_state = {}
            transport = starlette.testclient._TestClientTransport(
                self.app,
                portal_factory=self._portal_factory,
                raise_server_exceptions=raise_server_exceptions,
                root_path=root_path,
                app_state=self.app_state,
            )
            if headers is None:
                headers = {}
            headers.setdefault("user-agent", "testclient")
            httpx.Client.__init__(
                self,
                transport=transport,
                base_url=base_url,
                headers=headers,
                follow_redirects=True,
                cookies=cookies,
            )

        starlette.testclient.TestClient.__init__ = patched_init