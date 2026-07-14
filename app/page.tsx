import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { VerticalNavbar } from '@/components/VerticalNavbar';
import { Templates } from '@/components/Templates';
import { Journey } from '@/components/Journey';

const features = [
  {
    title: 'Cinematic storytelling',
    text: 'We craft branded experiences with motion, narrative, and precision.',
  },
  {
    title: 'Premium interfaces',
    text: 'Every interaction is tuned for clarity, elegance, and modernity.',
  },
  {
    title: 'Launch-ready systems',
    text: 'From concept to deployment, we build with speed and craft.',
  },
];

const metrics = [
  { value: '12+', label: 'Global launches' },
  { value: '4.9/5', label: 'Client delight' },
  { value: '24/7', label: 'Creative support' },
];

export default function HomePage() {
  const navLinks = [
    { id: 'top', label: 'HTTPMAKER' },
    { id: 'about', label: 'ABOUT' },
    { id: 'templates', label: 'TEMPLATES' },
    { id: 'start', label: 'START' },
  ];

  return (
    <main className="min-h-screen bg-black">
      <VerticalNavbar links={navLinks} />
      <Hero />
      <About />
      <Templates />
      <Journey />



    
    </main>
  );
}
