# Apex Tenant Advisors - Commercial Real Estate Website

A professional website for a tenant representation firm specializing in commercial real estate occupier solutions.

## Features

- **Responsive Design**: Fully responsive layout that works on all devices
- **Modern UI**: Clean, professional design with smooth animations
- **Service Showcase**: Comprehensive display of tenant representation services
- **Process Timeline**: Visual representation of the client engagement process
- **Contact Form**: Interactive contact form for lead generation
- **Industry Expertise**: Highlights specialized knowledge across sectors
- **Performance Optimized**: Fast-loading with optimized CSS and JavaScript

## Structure

```
tenant-rep-site/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # All styling
├── js/
│   └── script.js      # Interactive features
├── images/            # Images directory (ready for assets)
└── README.md          # This file
```

## Key Sections

1. **Hero Section**: Strong value proposition with key statistics
2. **Services**: Six core service offerings for tenant representation
3. **Approach**: Why exclusive tenant representation matters
4. **Process**: 5-step engagement process
5. **Industry Expertise**: Sectors served
6. **Contact**: Lead generation form and contact information

## Customization

### Brand Colors
Edit these CSS variables in `style.css`:
```css
--primary-color: #1e3a5f;    /* Navy blue */
--secondary-color: #2563eb;   /* Bright blue */
--accent-color: #10b981;      /* Green for CTAs */
```

### Company Information
- Update company name throughout `index.html`
- Modify contact details in the Contact section
- Update statistics in the Hero section
- Customize service offerings as needed

## Local Development

To run locally:
1. Open `index.html` in a web browser
2. Or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (if http-server is installed)
   http-server
   ```

## Deployment Options

This static site can be deployed to:
- **GitHub Pages**: Push to a GitHub repository and enable Pages
- **Netlify**: Drag and drop the folder or connect to Git
- **Vercel**: Deploy with `vercel` CLI or through dashboard
- **Traditional Hosting**: Upload via FTP to any web server

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Performance Features

- Minimal JavaScript for fast load times
- CSS animations using transforms for smooth performance
- Lazy loading ready (add `loading="lazy"` to images)
- Google Fonts with preconnect for faster font loading

## Next Steps

1. Add real images to the `images/` directory
2. Integrate with a backend for form submissions
3. Add Google Analytics or other tracking
4. Implement SEO meta tags
5. Create additional pages (About, Case Studies, Resources)
6. Add a blog or news section
7. Integrate with CRM for lead management