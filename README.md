# Urban Heat Insights - Malaysia

An AI-driven platform for mapping and analyzing Urban Heat Islands (UHI) in Malaysia using Google Earth Engine and machine learning.

## Project Overview

This application provides interactive visualization and analysis of urban heat patterns across Malaysian cities, helping researchers, urban planners, and policymakers understand and mitigate heat island effects.

## Features

- 🗺️ Interactive heat maps powered by Google Earth Engine
- 📊 Real-time temperature data analysis
- 🏙️ City-specific UHI metrics and trends
- 📈 Historical data visualization
- 🎯 Risk assessment and hotspot identification
- 📱 Responsive design for all devices

## Technology Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase
- **Maps**: Google Earth Engine

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to project directory
cd urban-heat-insights-main

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deployment Options

- **Vercel**: `vercel`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: `npx gh-pages -d dist`
- Any static hosting service (upload `dist/` folder)

## Project Structure

```
urban-heat-insights-main/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── lib/           # Utilities and helpers
│   └── App.tsx        # Main app component
├── public/            # Static assets
├── supabase/          # Supabase configuration
└── package.json       # Dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
