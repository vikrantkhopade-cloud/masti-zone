import { ArrowRight, Ticket } from 'lucide-react';
import Button from '../../ui/Button.jsx';
import { Reveal } from '../../ui/Misc.jsx';
import { IMAGES } from '../../../config/images.js';

export default function CtaBanner() {
  return (
    <section className="bg-white pb-20 sm:pb-28">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-navy-900 px-6 py-14 sm:px-14 sm:py-16">
          <img src={IMAGES.nightPool} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/80 to-aqua-700/40" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Your perfect splash day is one click away.</h2>
              <p className="mt-3 text-navy-200">Skip the ticket queue — book online, walk straight to the fun.</p>
            </div>
            <Button to="/book" size="lg" variant="white"><Ticket className="h-5 w-5" />Book Tickets<ArrowRight className="h-4 w-4" /></Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
