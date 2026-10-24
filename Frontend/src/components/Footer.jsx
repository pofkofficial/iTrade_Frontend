import { Link } from 'react-router-dom';
import {
  FaTwitter,
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaPhoneAlt,
  FaEnvelope,
} from 'react-icons/fa';

import { FaLocationDot } from 'react-icons/fa6';

import logo from "/src/assets/logo_svg/onWhite+blacktext/long_2.svg";

const Footer = () => {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="max-w-none mx-auto px-6 lg:px-10 py-6">

        {/* Top */}
        <div className="grid lg:grid-cols-2 gap-16">

          {/* Brand */}
          <div className="max-w-md">
            <img
              src={logo}
              alt="iTrade4Phones"
              className="h-10 mb-8"
            />

            <h3 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Premium Samsung & Pixel phones.
            </h3>

            <p className="mt-4 text-zinc-600 leading-relaxed">
              Carefully selected devices. Fully tested.
              Warranty protected. Delivered across Ghana.
            </p>

            <div className="flex gap-5 mt-8 text-zinc-500">
              <a
                href="https://www.facebook.com/itrade4phones"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition-colors"
              >
                <FaFacebook size={18} />
              </a>

              <a
                href="https://www.x.com/itrade4phones_"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition-colors"
              >
                <FaTwitter size={18} />
              </a>

              <a
                href="https://www.instagram.com/itrade4phones"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition-colors"
              >
                <FaInstagram size={18} />
              </a>

              <a
                href="https://www.tiktok.com/@it4phones"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-950 transition-colors"
              >
                <FaTiktok size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="grid sm:grid-cols-2 gap-12">

            <div>
              <h4 className="text-sm font-medium text-zinc-950 mb-6">
                Navigation
              </h4>

              <div className="space-y-4">
                <Link
                  to="/"
                  className="block text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  Home
                </Link>

                <Link
                  to="/shop"
                  className="block text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  Shop
                </Link>

                <Link
                  to="/about"
                  className="block text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  About
                </Link>

                <Link
                  to="/contact-us"
                  className="block text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-zinc-950 mb-6">
                Contact
              </h4>

              <div className="space-y-4 text-zinc-600">

                <a
                  href="tel:+233502921324"
                  className="flex items-center gap-3 hover:text-zinc-950 transition-colors"
                >
                  <FaPhoneAlt size={14} />
                  +233 50 292 1324
                </a>

                <a
                  href="mailto:contact@itrade4phones.com"
                  className="flex items-center gap-3 hover:text-zinc-950 transition-colors"
                >
                  <FaEnvelope size={14} />
                  contact@itrade4phones.com
                </a>

                <p className="flex items-center gap-3 hover:text-zinc-950 transition-colors">
                  <FaLocationDot size={14} />
                  Accra, Ghana
                </p>

              </div>
            </div>

          </div>

        </div>

        {/* Large Divider */}
        <div className="my-16 h-px bg-zinc-200" />

        {/* Bottom */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">

          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} iTrade4Phones. All rights reserved.
          </p>

          <div className="flex gap-8 text-sm text-zinc-500">
            <Link
              to="/privacy"
              className="hover:text-zinc-950 transition-colors"
            >
              Privacy
            </Link>

            <Link
              to="/terms"
              className="hover:text-zinc-950 transition-colors"
            >
              Terms
            </Link>

            <Link
              to="/returns"
              className="hover:text-zinc-950 transition-colors"
            >
              Returns
            </Link>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;