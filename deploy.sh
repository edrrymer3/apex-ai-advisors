#!/bin/bash

# Deploy to Vercel or Railway script
echo "🚀 Deploying Apex Tenant Advisors AI-Powered Site"
echo ""
echo "Choose deployment option:"
echo "1) Vercel (Static + Serverless Functions)"
echo "2) Railway (Full Node.js App)"
echo "3) Netlify (Static with Functions)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "Deploying to Vercel..."
        # Create vercel.json for configuration
        cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" },
    { "src": "*.html", "use": "@vercel/static" },
    { "src": "css/**", "use": "@vercel/static" },
    { "src": "js/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server.js" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
EOF
        vercel --prod
        ;;
    2)
        echo "Deploying to Railway..."
        railway up
        ;;
    3)
        echo "Deploying to Netlify..."
        # Create netlify.toml
        cat > netlify.toml << EOF
[build]
  command = "npm install"
  publish = "."

[functions]
  directory = "netlify/functions"
EOF
        netlify deploy --prod
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Add your OpenAI API key in the hosting platform's environment variables"
echo "2. Configure custom domain if desired"
echo "3. Test all AI features on live site"