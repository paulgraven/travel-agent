import './globals.css';
export const metadata={
 title:'Personal Travel Agent | A smarter way to the airport',
 description:'Plan better airport journeys. Discover flights, compare options, and build an easy departure plan. Interactive public demo available.',
 robots:{index:false,follow:false}
};
export default function RootLayout({children}){return <html lang="en"><body>{children}</body></html>}
