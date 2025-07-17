// app/_layout.tsx
import { Slot } from 'expo-router';
import '../global.css'; // this path is correct because global.css is one level above

export default function RootLayout() {
  return <Slot />;
}
