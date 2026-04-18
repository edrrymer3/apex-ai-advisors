#!/usr/bin/env python3
import os
import subprocess

print("\n🚀 Quick Deploy Options:\n")
print("Since npm has permission issues, here are alternatives:\n")
print("1. VIEW LOCALLY (when you're home on WiFi):")
print("   http://192.168.86.42:8000")
print("\n2. MANUAL DEPLOY STEPS:")
print("   a) Go to netlify.com")
print("   b) Drag the tenant-rep-site folder to browser")
print("   c) Get instant public URL")
print("\n3. GITHUB PAGES (if you have GitHub):")
print("   - Push to GitHub")
print("   - Enable Pages in settings")
print("\n4. The site files are at:")
print(f"   {os.getcwd()}")
print("\nAll files are ready - just need to upload them somewhere!")