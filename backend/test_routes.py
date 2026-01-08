#!/usr/bin/env python
"""Test script to check what routes are registered"""
import sys
sys.path.insert(0, '.')

print("=" * 60)
print("IMPORTING MAIN MODULE")
print("=" * 60)

from main import app

print("\n" + "=" * 60)
print("ALL REGISTERED ROUTES IN APP")
print("=" * 60)

for route in app.routes:
    if hasattr(route, 'path'):
        print(f"  {route.path}")
        if hasattr(route, 'methods'):
            print(f"    Methods: {route.methods}")

print("\n" + "=" * 60)
print("SPATIAL ROUTES ONLY")
print("=" * 60)

spatial_routes = [r for r in app.routes if hasattr(r, 'path') and 'spatial' in r.path]
if spatial_routes:
    for route in spatial_routes:
        print(f"  {route.path} - {route.methods if hasattr(route, 'methods') else 'N/A'}")
else:
    print("  NO SPATIAL ROUTES FOUND!")

print("\n" + "=" * 60)
print("TOTAL ROUTES:", len([r for r in app.routes if hasattr(r, 'path')]))
print("=" * 60)
