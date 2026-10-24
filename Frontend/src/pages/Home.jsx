import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Truck, ShieldCheck, Gift,
  CalendarDays, ArrowRight, Lock, RotateCcw, Banknote,
} from 'lucide-react';
import ListProducts from '../components/ListProducts';
import FeedbackViewer from '../components/FeedbackViewer';
import api from '@utils/api';
import { isChristmasPromo, daysLeftInPromo } from '@utils/promo';
import santa from '../assets/christmas/santa.webp';
import tree from '../assets/christmas/baubles.webp';
import ribbon from '../assets/christmas/ribbon.webp';

// === DYNAMIC HERO IMAGES ===
const imageLists = import.meta.glob('../assets/images/homeMainImgs/*.{png,jpg,jpeg,svg,avif,webp}', { eager: true });
const images = Object.values(imageLists).map(module => module.default);

const policies = [
  { icon: Truck, title: 'Free delivery', desc: 'Nationwide. No hidden fees.' },
  { icon: ShieldCheck, title: 'Warranty protected', desc: '14-day returns on every order.' },
  { icon: Gift, title: 'Free case + protector', desc: 'Included with every purchase.' },
];

const SLIDE_MS = 5000;
const SWIPE_THRESHOLD = 50;

const Home = () => {
  // Christmas layer: on from 1 Nov to 31 Dec, off automatically otherwise (see utils/promo.js)
  const promo = isChristmasPromo();
  const daysLeft = daysLeftInPromo();
  const reduceMotion = useReducedMotion();
  // Keeps the hero arrows clear of Santa's body on large screens
  const arrowTop = promo ? 'top-[28%]' : 'top-1/2';

  const [currentSlide, setCurrentSlide] = useState(0);
  const [phoneData, setPhones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const heroRef = useRef(null);
  const touchStartX = useRef(null);
  const navigate = useNavigate();

  // === FETCH PHONES ===
  const getPhones = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/featured/');
      setPhones(response.data);
    } catch (err) {
      console.error('Error loading phones:', err);
      setError('Failed to load featured phones.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getPhones();
  }, [getPhones]);

  // === CAROUSEL LOGIC ===
  // setTimeout keyed on currentSlide: every slide change (auto OR manual) restarts the
  // 5s window, so the progress bar and the actual slide change always stay in sync.
  useEffect(() => {
    if (isPaused || images.length < 2) return;
    const t = setTimeout(() => {
      setCurrentSlide(prev => (prev + 1) % images.length);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [isPaused, currentSlide]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % images.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + images.length) % images.length);
  const goToSlide = (i) => setCurrentSlide(i);

  // Mouse-only hover pause. Touch taps fire emulated mouseenter events that never
  // get a matching mouseleave, which would leave the carousel stuck paused on phones.
  const onPointerEnter = (e) => { if (e.pointerType === 'mouse') setIsPaused(true); };
  const onPointerLeave = (e) => { if (e.pointerType === 'mouse') setIsPaused(false); };

  // === TOUCH SWIPE (mobile) ===
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    setIsPaused(false);
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) nextSlide();
    else prevSlide();
  };

  // === PRELOAD FIRST IMAGE ===
  useEffect(() => {
    if (images[0]) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = images[0];
      document.head.appendChild(link);
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>
          {promo
            ? 'Christmas Came Early: Up to 40% Off Phones | iTrade4Phones'
            : 'iTrade4Phones — Original Phones, Without the Guesswork'}
        </title>
        <meta
          name="description"
          content={
            promo
              ? 'Christmas came early at iTrade4Phones. Up to 40% off Samsung and Google Pixel phones, free delivery and a free case + protector, 1 Nov to 31 Dec.'
              : 'Shop original, tested phones with warranty. Free delivery and a free case on every order.'
          }
        />
      </Helmet>

      {/* === HERO === */}
      {/* svh = height of the *visible* mobile viewport (vh ignores the browser toolbar) */}
      <section
        ref={heroRef}
        className="relative h-[84svh] min-h-[600px] overflow-hidden bg-[#0A0A0A] sm:h-[82vh] lg:h-[88vh]"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides with a slow "ken burns" zoom on the active one */}
        <div className="absolute inset-0">
          {images.map((src, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                currentSlide === i ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <motion.img
                src={src}
                alt={`Phone promotion ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                initial={false}
                animate={{ scale: currentSlide === i && !reduceMotion ? 1.06 : 1 }}
                transition={{ duration: 7, ease: 'linear' }}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Legibility gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        {/* Santa (Christmas only, xl+ so he never collides with the headline) */}
        {promo && (
          <motion.img
            src={santa}
            alt=""
            aria-hidden="true"
            initial={{ x: reduceMotion ? 0 : 80, opacity: reduceMotion ? 1 : 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.9, ease: 'easeOut' }}
            className="pointer-events-none absolute bottom-0 right-0 hidden h-[60%] w-auto select-none drop-shadow-2xl xl:block"
          />
        )}

        {/* Copy — pt-28 keeps it clear of the fixed navbar on short phones */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative mx-auto flex h-full max-w-7xl flex-col items-start justify-end px-5 pb-16 pt-28 text-white sm:px-6 sm:pb-24"
        >
          {promo && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F2C14E]/40 bg-[#F2C14E]/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#F2C14E] backdrop-blur-sm sm:mb-5 sm:px-4 sm:text-xs">
              <CalendarDays className="h-3.5 w-3.5" />
              Christmas sale · {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
            </span>
          )}

          <h1 className="mb-4 max-w-5xl text-[2.5rem] font-extrabold leading-[1.08] tracking-tight drop-shadow-lg sm:mb-5 sm:text-6xl lg:text-7xl xl:text-[5rem]">
            {promo ? (
              <>
                <span className="block">Christmas came early.</span>
                <span className="block text-[#F2C14E]">Up to 40% off phones.</span>
              </>
            ) : (
              <>
                <span className="block">Original phones.</span>
                <span className="block text-[#5B8CFF]">Without the guesswork.</span>
              </>
            )}
          </h1>

          <p className="mb-7 max-w-md text-sm leading-relaxed text-white/75 sm:mb-9 sm:text-lg">
            {promo
              ? 'Samsung and Google Pixel, fully tested and warranty protected. Free delivery and a free case + protector on every order until 31 December.'
              : 'Fully tested. Warranty protected. Free delivery and a free case on every order.'}
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <button
              onClick={() => navigate('/shop', { state: { featured: phoneData }, replace: false })}
              className={`group inline-flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-3.5 font-semibold shadow-xl transition-all hover:-translate-y-0.5 sm:w-auto ${
                promo
                  ? 'bg-[#F2C14E] text-[#3A0610] shadow-[#F2C14E]/25 hover:bg-[#f7cf6c]'
                  : 'bg-[#2962FF] text-white shadow-[#2962FF]/30 hover:bg-[#1f4fd9]'
              }`}
            >
              {promo ? 'Shop the sale' : 'Shop now'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              to="/about"
              className="py-1 text-center text-sm font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline sm:py-0 sm:text-left"
            >
              Why buy from us?
            </Link>
          </div>
        </motion.div>

        {/* Progress indicators — large tap targets for touch */}
        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 pb-1 sm:bottom-7">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="group p-1.5"
              >
                <span
                  className={`block h-1 overflow-hidden rounded-full transition-all duration-500 ${
                    currentSlide === i ? 'w-10 bg-white/25' : 'w-4 bg-white/25 group-hover:bg-white/40'
                  }`}
                >
                  {currentSlide === i && (
                    <motion.span
                      key={`${i}-${isPaused}`}
                      initial={{ width: '0%' }}
                      animate={{ width: isPaused ? undefined : '100%' }}
                      transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
                      className={`block h-full ${promo ? 'bg-[#F2C14E]' : 'bg-[#5B8CFF]'}`}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

         {/* Arrows (lg+) */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="Previous slide"
              className="absolute left-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition hover:scale-105 hover:bg-white/25 lg:flex"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next slide"
              className="absolute right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition hover:scale-105 hover:bg-white/25 lg:flex"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </>
        )}
      </section>

      {/* === CHRISTMAS PROMO BAND (1 Nov – 31 Dec) === */}
      {/* No overflow-hidden on the section itself, or the ribbon hanging off the bottom gets clipped.
          The glow + snow layers sit in their own clipped wrapper instead. */}
      {promo && (
        <section
          aria-label="Christmas promotion"
          className="relative bg-gradient-to-br from-[#57081A] via-[#8E0F26] to-[#C41430] text-white"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(600px 300px at 20% 0%, rgba(242,193,78,0.18), transparent 70%), radial-gradient(500px 260px at 90% 100%, rgba(255,255,255,0.08), transparent 70%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1.5px)',
                backgroundSize: '34px 34px',
              }}
            />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-end gap-4 px-5 sm:px-6 md:grid-cols-[1.15fr_1fr] md:gap-6">
            <div className="pb-8 pt-12 sm:pb-12 sm:pt-16 md:pb-24">
              <p className="mb-1 text-base font-medium text-[#F7D98B] sm:text-lg">
                Christmas came early. Up to
              </p>

              <div className="flex flex-wrap items-end gap-3 leading-none sm:gap-4">
                <span className="text-[5.5rem] font-extrabold tracking-tighter text-[#F2C14E] drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)] sm:text-[8rem] lg:text-[15rem]">
                  40%
                </span>
                <span className="pb-2 text-2xl font-bold text-white sm:pb-4 sm:text-4xl lg:pb-6">
                  off
                </span>
                <span className="mb-2 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 sm:mb-4 sm:px-3.5 sm:py-1.5 sm:text-xs lg:mb-6">
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </span>
              </div>

              {/* flex-wrap (not a 3-col grid) so the labels never get squeezed in the narrow md column */}
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 sm:mt-8">
                {[
                  { icon: Truck, text: 'Free delivery' },
                  { icon: Gift, text: 'Free case + protector' },
                  { icon: CalendarDays, text: '1 Nov – 31 Dec' },
                ].map(({ icon: Icon, text }) => (
                  <li
                    key={text}
                    className="flex items-center gap-2.5 text-sm font-medium text-white/90 sm:text-base"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#F2C14E]/30 bg-[#F2C14E]/15 sm:h-9 sm:w-9">
                      <Icon className="h-4 w-4 text-[#F2C14E]" strokeWidth={1.75} />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>

              <Link
                to="/shop"
                className="group mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#F2C14E] px-8 py-3.5 font-semibold text-[#3A0610] shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#f7cf6c] sm:mt-10 sm:w-auto"
              >
                Shop the sale
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <motion.img
              src={tree}
              alt=""
              aria-hidden="true"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="pointer-events-none w-52 max-w-sm select-none justify-self-center self-end drop-shadow-2xl sm:w-64 md:w-[80%]"
            />
          </div>

          <img
            src={ribbon}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 left-1/2 hidden w-44 -translate-x-1/2 select-none drop-shadow-lg md:block"
          />
        </section>
      )}

      {/* === FEATURED PHONES === */}
      <section
        className={`${promo ? 'pt-16 sm:pt-24' : 'pt-12 sm:pt-20'} bg-[#FAFAFA] px-4 pb-14 sm:px-6 sm:pb-20`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between sm:mb-10">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#2962FF] sm:mb-2 sm:text-xs">
                {promo ? 'Christmas deals' : 'Featured'}
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] sm:text-3xl lg:text-4xl">
                This week's picks
              </h2>
            </div>
            <Link
              to="/shop"
              className="group hidden items-center gap-1.5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:text-[#2962FF] sm:inline-flex"
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile "view all" link */}
          <Link
            to="/shop"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2962FF] sm:hidden"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>

          {isLoading ? (
            <FeaturedSkeleton />
          ) : error ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-[#737373]">{error}</p>
              <button
                onClick={getPhones}
                className="rounded-full bg-[#2962FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1f4fd9]"
              >
                Retry
              </button>
            </div>
          ) : (
            <ListProducts phone={phoneData} />
          )}
        </div>
      </section>

      {/* === POLICIES === */}
      <section className="border-t border-neutral-200 bg-white px-4 py-14 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center sm:mb-12">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#2962FF] sm:mb-2 sm:text-xs">
              Buy with confidence
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] sm:text-3xl lg:text-4xl">
              Why shop with us
            </h2>
            <p className="mt-2 text-sm text-[#737373] sm:text-base">
              Trusted by thousands across the country
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {policies.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { delay: 0, duration: 0.2 } }}
                className="flex items-center gap-4 rounded-3xl border border-neutral-200 bg-[#FAFAFA] p-5 text-left transition-shadow hover:shadow-lg hover:shadow-neutral-200/60 sm:block sm:p-8 sm:text-center"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#2962FF]/10 sm:mx-auto sm:mb-5 sm:h-14 sm:w-14">
                  <p.icon className="h-5 w-5 text-[#2962FF] sm:h-6 sm:w-6" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="mb-0.5 text-sm font-bold text-[#0A0A0A] sm:mb-1.5 sm:text-base">
                    {p.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#737373] sm:text-sm">
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === TESTIMONIALS === */}
      <section className="bg-[#FAFAFA] px-4 py-14 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center sm:mb-10">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#2962FF] sm:mb-2 sm:text-xs">
              Reviews
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] sm:text-3xl lg:text-4xl">
              Happy customers
            </h2>
          </div>
          <div className="hide-scrollbar overflow-x-auto">
            <div className="flex gap-4 pb-2 sm:gap-6">
              <FeedbackViewer />
            </div>
          </div>
        </div>
      </section>

      {/* === TRUST STRIP === */}
      <section className="border-t border-neutral-200 bg-white py-5 sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-6 gap-y-2.5 px-4 text-xs text-[#737373] sm:gap-x-8 sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-[#2962FF]" /> SSL secured
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5 text-[#2962FF]" /> 14-day returns
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5 text-[#2962FF]" /> Pay on delivery
          </span>
        </div>
      </section>
    </>
  );
};

// === SKELETON (shimmer) — needs the `shimmer` keyframe in tailwind.config.js (see notes) ===
const FeaturedSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-3 sm:p-4">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-neutral-100/70 to-transparent" />
        <div className="mb-3 h-32 w-full rounded-2xl bg-neutral-100 sm:h-40" />
        <div className="mb-2 h-3 w-1/2 rounded bg-neutral-100" />
        <div className="mb-2 h-4 w-3/4 rounded bg-neutral-100" />
        <div className="h-5 w-1/3 rounded bg-neutral-100" />
      </div>
    ))}
  </div>
);

export default Home;