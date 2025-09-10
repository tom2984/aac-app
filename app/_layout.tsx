// app/_layout.tsx
import { Slot, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect } from 'react';
import '../global.css'; // this path is correct because global.css is one level above
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't navigate while loading

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      // User not authenticated, redirect to login
      if (!inAuthGroup) {
        router.replace('/');
      }
    } else {
      // User is authenticated, redirect to dashboard if on auth pages
      if (inAuthGroup) {
        router.replace('/dashboard');
      }
    }
  }, [session, loading, segments]);

  return (
    <>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.markerConfig = {
                project: '687963305d957cb25651d0ca', 
                source: 'snippet'
              };

              !function(e,r,a){if(!e.__Marker){e.__Marker={};var t=[],n={__cs:t};["show","hide","isVisible","capture","cancelCapture","unload","reload","isExtensionInstalled","setReporter","clearReporter","setCustomData","on","off"].forEach(function(e){n[e]=function(){var r=Array.prototype.slice.call(arguments);r.unshift(e),t.push(r)}}),e.Marker=n;var s=r.createElement("script");s.async=1,s.src="https://edge.marker.io/latest/shim.js";var i=r.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i)}}(window,document);
            `,
          }}
        />
      </Head>
      <Slot />
    </>
  );
}
