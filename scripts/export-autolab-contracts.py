"""Export request schemas and Pydantic nullability without reading business rows."""
import contextlib
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "sduoj-autolab"))
with contextlib.redirect_stdout(io.StringIO()):
    from main import app
    from pydantic import BaseModel

spec = app.openapi()
models = {}


def visit(field):
    if field is None:
        return
    model = field.type_
    if isinstance(model, type) and issubclass(model, BaseModel) and model.__name__ not in models:
        models[model.__name__] = model
        for child in model.__fields__.values():
            visit(child)
    for child in field.sub_fields or []:
        visit(child)


for route in app.routes:
    visit(getattr(route, "body_field", None))

for name, model in models.items():
    definition = spec.get("components", {}).get("schemas", {}).get(name)
    if not definition:
        continue
    for field in model.__fields__.values():
        properties = definition.get("properties", {})
        if field.allow_none and field.alias in properties:
            properties[field.alias] = {"anyOf": [properties[field.alias], {"type": "null"}]}

routes = {}
for path, methods in spec["paths"].items():
    for method, operation in methods.items():
        body = operation.get("requestBody", {}).get("content", {}).get("application/json", {}).get("schema")
        if body:
            routes[f"{method.upper()} /ps{path}"] = body
        elif method == "get":
            parameters = [item for item in operation.get("parameters", []) if item.get("in") == "query"]
            if parameters:
                routes[f"GET /ps{path}"] = {
                    "type": "object",
                    "properties": {item["name"]: item.get("schema", {}) for item in parameters},
                    "required": [item["name"] for item in parameters if item.get("required")],
                }

print(json.dumps({"routes": routes, "components": spec.get("components", {})}, ensure_ascii=True))
