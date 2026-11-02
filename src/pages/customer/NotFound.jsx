import { Home, Ticket } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <section className="grid min-h-[80vh] place-items-center bg-gradient-to-b from-aqua-50 to-white px-4 pt-24 text-center">
      <div>
        <p className="font-display text-8xl font-extrabold text-aqua-400">404</p>
        <h1 className="mt-4 text-3xl font-bold">This page went down the slide</h1>
        <p className="mt-2 text-navy-500">We couldn't find what you were looking for.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button to="/"><Home className="h-4 w-4" />Go home</Button>
          <Button to="/book" variant="outline"><Ticket className="h-4 w-4" />Book tickets</Button>
        </div>
      </div>
    </section>
  );
}
