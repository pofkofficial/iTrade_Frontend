import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import logo from "/src/assets/logo_svg/onWhite+blacktext/long_2.svg";
import baubles from "../assets/christmas/baubles.webp";
import { isChristmasPromo } from "@utils/promo";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  // Christmas layer: on from 1 Nov to 31 Dec, off automatically otherwise
  const promo = isChristmasPromo();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/', name: 'Home' },
    { path: '/shop', name: 'Shop' },
    { path: '/about', name: 'About' },
    { path: '/contact-us', name: 'Contact' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
      >
        <div className="max-w-none mx-auto">
          <nav
            className={`
              h-16
              rounded-full
              border
              transition-all
              duration-300
              px-6
              flex
              items-center
              justify-between
              ${
                scrolled
                  ? 'bg-white/85 backdrop-blur-xl border-neutral-200 shadow-lg'
                  : 'bg-white/70 backdrop-blur-lg border-neutral-200/70'
              }
            `}
          >
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center shrink-0"
            >
              <img
                src={logo}
                alt="iTrade4Phones"
                className="h-8 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      relative
                      px-4
                      py-2
                      text-sm
                      font-medium
                      rounded-full
                      transition-all
                      duration-200
                      ${
                        isActive
                          ? 'text-[#2962FF]'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }
                    `}
                  >
                    {link.name}

                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 rounded-full bg-[#2962FF]/10"
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Right Side (extra right padding leaves room for the hanging baubles) */}
            <div className={`hidden md:flex items-center ${promo ? 'pr-16' : ''}`}>
              {promo ? (
                <Link
                  to="/shop"
                  className="rounded-full bg-[#B3122A] hover:bg-[#8E0F22] text-white text-sm font-semibold px-4 py-1.5 transition-colors"
                >
                  Up to 40% off
                </Link>
              ) : (
                <span className="text-sm text-neutral-500">
                  Verified Samsung & Pixel Devices
                </span>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="
                md:hidden
                w-10
                h-10
                flex
                items-center
                justify-center
                rounded-full
                hover:bg-neutral-100
                transition
              "
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <FaTimes className="text-neutral-800" />
              ) : (
                <FaBars className="text-neutral-800" />
              )}
            </button>
          </nav>
        </div>

        {/* Baubles hang from the top of the screen (Christmas only) */}
        {promo && (
          <img
            src={baubles}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute top-0 right-[88px] md:right-8 w-9 md:w-14 h-auto drop-shadow-md"
          />
        )}
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="fixed top-24 left-4 right-4 z-50 md:hidden"
          >
            <div
              className="
                bg-white/95
                backdrop-blur-xl
                border
                border-neutral-200
                rounded-3xl
                shadow-xl
                overflow-hidden
              "
            >
              <div className="p-3">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`
                        flex
                        items-center
                        px-4
                        py-4
                        rounded-2xl
                        text-base
                        font-medium
                        transition
                        ${
                          isActive
                            ? 'bg-[#2962FF]/10 text-[#2962FF]'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }
                      `}
                    >
                      {link.name}
                    </Link>
                  );
                })}

                {promo && (
                  <Link
                    to="/shop"
                    className="mx-1 mt-2 block rounded-2xl bg-[#B3122A] px-4 py-3 text-white"
                  >
                    <p className="text-sm font-semibold">Christmas came early</p>
                    <p className="text-xs text-white/85">
                      Up to 40% off, free delivery and a free case + protector until 31 Dec.
                    </p>
                  </Link>
                )}

                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs uppercase tracking-wider text-neutral-400">
                    Trusted Devices
                  </p>

                  <p className="mt-2 text-sm text-neutral-600">
                    Verified Samsung and Google Pixel smartphones with warranty protection.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
