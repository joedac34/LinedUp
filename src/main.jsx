import { StrictMode, Component } from 'react'
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

// ── Error reporting ─────────────────────────────────────────────────────────
// Goes to PostHog, which is already initialised above — no new vendor, no new
// account, works the moment this deploys. If VITE_SENTRY_DSN is ever wired up,
// Sentry gets it too.
//
// Deliberately NO session replay: the privacy policy still doesn't disclose
// session recording, and that has to land before anything records a user.
export function report(err, context) {
  try { console.error('[picklock]', err, context || '') } catch (e) {}
  try {
    if (posthog.captureException) posthog.captureException(err, context)
    else posthog.capture('$exception', {
      $exception_message: String((err && err.message) || err),
      $exception_type: (err && err.name) || 'Error',
      $exception_stack_trace_raw: (err && err.stack) || null,
      ...context,
    })
  } catch (e) {}
  try { if (window.Sentry) window.Sentry.captureException(err, { extra: context }) } catch (e) {}
}

// Anything React never sees: async throws, event handlers, the service worker.
window.addEventListener('error', (e) => report(e.error || new Error(e.message), { kind: 'window.onerror' }))
window.addEventListener('unhandledrejection', (e) => report(e.reason || new Error('unhandled rejection'), { kind: 'unhandledrejection' }))

// ── Root boundary ───────────────────────────────────────────────────────────
// Nothing wrapped <App/>. A render error anywhere took the whole tree down to a
// blank page: no message, nothing reported, and the user just leaves. The
// ErrorBoundary inside App.jsx only ever wrapped Plok bubbles.
class RootBoundary extends Component {
  constructor(props){ super(props); this.state = { err: null } }
  static getDerivedStateFromError(err){ return { err } }
  componentDidCatch(err, info){ report(err, { kind: 'react-root', componentStack: info && info.componentStack }) }
  render(){
    if (!this.state.err) return this.props.children
    return (
      <div style={{minHeight:'100dvh',background:'#07070C',color:'#fff',display:'flex',alignItems:'center',
                   justifyContent:'center',padding:'24px',fontFamily:"'Barlow',system-ui,sans-serif"}}>
        <div style={{maxWidth:340,textAlign:'center'}}>
          <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>Something broke</div>
          <div style={{fontSize:14,lineHeight:1.55,color:'rgba(255,255,255,0.6)',marginBottom:18}}>
            Your picks are safe — they're saved on the server, not here. This screen failed to load, and we've been told about it.
          </div>
          <button onClick={()=>window.location.reload()}
            style={{background:'#0A84FF',border:'none',borderRadius:11,padding:'12px 20px',fontSize:14,
                    fontWeight:800,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>
            Reload
          </button>
        </div>
      </div>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootBoundary>
      <PostHogProvider client={posthog}>
        <App />
      </PostHogProvider>
    </RootBoundary>
  </StrictMode>,
)