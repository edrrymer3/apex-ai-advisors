#!/usr/bin/env python3
import os
import http.server
import socketserver
import webbrowser

print("\n🚀 CLEAN URL OPTIONS FOR YOUR SITE:\n")
print("=" * 50)
print("\n✅ OPTION 1: Use this shortened URL to share:")
print("👉 https://tinyurl.com/apex-ai-advisors")
print("\n✅ OPTION 2: Create a free Bitly link:")
print("👉 Visit: https://bitly.com")
print("👉 Paste: https://edrrymer3.github.io/apex-ai-advisors/")
print("👉 Get custom short link like: bit.ly/ApexAI")
print("\n✅ OPTION 3: Professional domain ($12/year):")
print("👉 apex-advisors.com")
print("👉 apexai.tech")
print("👉 apex-tenant.com")
print("\n=" * 50)
print("\n📋 For now, you can share this clean redirect:")
print("👉 'Check out Apex AI Advisors - AI-powered tenant rep'")
print("👉 (Then send the link separately)\n")

# Create a simple redirect page
redirect_html = """
<!DOCTYPE html>
<html>
<head>
    <title>Apex AI Advisors - AI Powered Commercial Real Estate</title>
    <meta name="description" content="Next-generation tenant representation powered by AI">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.25rem; opacity: 0.9; }
        .button {
            display: inline-block;
            margin-top: 2rem;
            padding: 1rem 2rem;
            background: white;
            color: #3B82F6;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            transition: transform 0.3s;
        }
        .button:hover { transform: scale(1.05); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Apex AI Advisors</h1>
        <p>AI-Powered Commercial Real Estate Platform</p>
        <a href="https://edrrymer3.github.io/apex-ai-advisors/" class="button">Enter Site →</a>
    </div>
</body>
</html>
"""

with open('apex-redirect.html', 'w') as f:
    f.write(redirect_html)

print("✅ Created apex-redirect.html - you can host this anywhere!")
print("\n🎯 IMMEDIATE SOLUTION:")
print("Share this message with your friend:")
print('"Check out my new AI real estate platform - saves 30% on office costs!"')
print("Then send: apex-ai-advisors (they can Google it + your name for now)"
print("\nOr just describe it and send the link when asked!")