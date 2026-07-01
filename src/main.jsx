import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import './index.css'
import App from './App.jsx'

posthog.init('phc_ttRQobQ8V6qoENHvehxX64SuQFCctjXfyHhnDRqak2h6',{
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only', // cost-saver: only bills for logged-in users
  capture_pageview: false,            // PWA has no page loads; you'll fire events manually
  autocapture: false,                 // avoid noise/garbage from SW + slip builder clicks
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
)