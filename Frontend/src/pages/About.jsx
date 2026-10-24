import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const About = () => {
  const navigate = useNavigate();

  // Track page view
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'About Us',
        page_location: window.location.href,
        page_path: '/about',
      });
    }
  }, []);

  // Track button clicks
  const handleButtonClick = (action) => {
    if (window.gtag) {
      window.gtag('event', 'click', {
        event_category: 'Button',
        event_label: action,
        page_title: 'About Us',
      });
    }
    navigate(action === 'shop' ? '/shop' : '/contact-us');
  };

  // Policies data
  const policies = [
    {
      id: 1,
      title: 'Payment on Delivery',
      description: 'Pay when you receive your order. No upfront payments required.',
      icon: '💰',
      color: 'border-green-400'
    },
    {
      id: 2,
      title: 'Free Delivery',
      description: 'Enjoy free delivery on all orders nationwide. No hidden charges.',
      icon: '🚚',
      color: 'border-blue-400'
    },
    {
      id: 3,
      title: 'Free Protector/Cover',
      description: 'Get free screen protector and phone cover with every purchase.',
      icon: '📱',
      color: 'border-purple-400'
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-4 md:mb-12 pt-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">About iTrade4Phones</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted partner for budget-friendly, certified original smartphones in Ghana
          </p>
        </div>

        <div className="flex flex-col items-center md:grid md:grid-cols-3 md:gap-6 mb-8">
          {/* Column 1 */}
          <div className="w-full max-w-md md:max-w-none">
            <div className="border-2 border-[#2962FF] bg-white rounded-lg p-4 md:p-5 shadow-lg my-3 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-bold text-[#2962FF] mb-3 border-b-2 border-[#2962FF] pb-2">
                Our Mission
              </h2>
              <p className="text-gray-700 leading-relaxed">
                At iTrade4Phones, we believe everyone deserves access to premium technology without breaking the bank.
                We specialize in certified original smartphones that are thoroughly tested, verified, and fully functional —
                offering you a like-new experience at a budget-friendly price.
              </p>
            </div>

            <div className="border-2 border-[#FF6F61] bg-white rounded-lg p-4 md:p-5 shadow-lg my-3 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-bold text-[#FF6F61] mb-3 border-b-2 border-[#FF6F61] pb-2">
                Quality Assurance
              </h2>
              <div className="text-gray-700">          {/* ← was <p> */}
                Every phone undergoes rigorous testing:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Complete hardware diagnostics</li>
                  <li>Software and performance testing</li>
                  <li>Original parts verification</li>
                  <li>Professional cleaning & restoration</li>
                  <li>Battery health check</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="w-full max-w-md md:max-w-none">
            <div className="border-2 border-[#FF6F61] bg-white rounded-lg p-4 md:p-5 shadow-lg my-3 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-bold text-[#FF6F61] mb-3 border-b-2 border-[#FF6F61] pb-2">
                Our Story
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Founded in 2020, iTrade4Phones began with a simple vision — to make quality smartphones accessible to everyone in Ghana.
                As tech enthusiasts, we recognized the need for affordable yet reliable devices, leading us to create a platform
                where customers can trust every purchase.
              </p>
            </div>

            <div className="border-2 border-[#2962FF] bg-white rounded-lg p-4 md:p-5 shadow-lg my-3 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-bold text-[#2962FF] mb-3 border-b-2 border-[#2962FF] pb-2">
                Customer Commitment
              </h2>
              <div className="text-gray-700">
                Your satisfaction is our priority:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>2-Week Comprehensive Warranty</li>
                  <li>Dedicated Customer Support</li>
                  <li>100% Original Devices Guaranteed</li>
                  <li>Transparent Pricing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="w-full max-w-md md:max-w-none">
            <div className="border-2 border-[#2962FF] bg-white rounded-lg p-4 md:p-5 shadow-lg my-3 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-bold text-[#2962FF] mb-3 border-b-2 border-[#2962FF] pb-2">
                Smart Choice Benefits
              </h2>
              <div className="text-gray-700">
                Choosing iTrade4Phones means:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Save 30-60% vs. new devices</li>
                  <li>Premium models at affordable prices</li>
                  <li>Eco-friendly - reducing e-waste</li>
                  <li>Fully tested & warranty protected</li>
                  <li>Ready-to-use devices</li>
                </ul>
              </div>
            </div>

            <div className="border-2 border-[#FF6F61] bg-white rounded-lg p-4 md:p-5 shadow-lg my-3 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-bold text-[#FF6F61] mb-3 border-b-2 border-[#FF6F61] pb-2">
                Join Our Community
              </h2>
              <p className="text-gray-700 leading-relaxed">
                When you choose iTrade4Phones, you're not just buying a phone — you're joining a movement that makes
                quality technology accessible while promoting sustainable consumption in Ghana.
              </p>
            </div>
          </div>
        </div>

        
          {/* Policies Section */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 mb-8">
            <div className="max-w-2xl mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2962FF] mb-3">
                Shopping with confidence
              </p>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">
                Our Customer Commitments
              </h2>

              <p className="text-gray-600 leading-relaxed">
                A better way to shop for premium Samsung and Google Pixel phones,
                with clear policies and service you can rely on.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {policies.map((policy, index) => (
                <article
                  key={policy.id}
                  className="group p-6 md:p-7 rounded-xl border border-gray-200
                            hover:border-[#2962FF]/40 hover:shadow-md
                            transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-7">
                    <span className="text-sm font-medium text-gray-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="w-8 h-[2px] bg-[#2962FF] transition-all
                                    duration-200 group-hover:w-12" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {policy.title}
                  </h3>

                  <p className="text-sm text-gray-600 leading-7">
                    {policy.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Values Section */}
          <section className="bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-10 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
              <div className="lg:col-span-1">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2962FF] mb-3">
                  What guides us
                </p>

                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-4">
                  Built on the right principles.
                </h2>

                <p className="text-gray-600 leading-relaxed">
                  Every decision we make is guided by a simple goal:
                  delivering a dependable smartphone shopping experience.
                </p>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {[
                  {
                    number: '01',
                    title: 'Trust',
                    description: 'Clear policies, transparent processes and honest communication.'
                  },
                  {
                    number: '02',
                    title: 'Quality',
                    description: 'Carefully sourced devices with quality and authenticity in mind.'
                  },
                  {
                    number: '03',
                    title: 'Value',
                    description: 'Premium Samsung and Google Pixel phones at competitive prices.'
                  },
                  {
                    number: '04',
                    title: 'Service',
                    description: 'Responsive support and a shopping experience designed around you.'
                  }
                ].map((value) => (
                  <div
                    key={value.number}
                    className="py-6 border-b border-gray-200"
                  >
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-xs font-semibold tracking-wider text-[#2962FF]">
                        {value.number}
                      </span>

                      <h3 className="text-lg font-semibold text-gray-900">
                        {value.title}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-600 leading-7">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>


        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Ready to Find Your Perfect Phone?</h2>
          <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have upgraded their devices with confidence at iTrade4Phones.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <button
              onClick={() => handleButtonClick('shop')}
              className="bg-[#FF6F61] hover:bg-[#e55a50] text-white font-bold py-3 px-8 rounded-full transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              aria-label="Browse our collection"
            >
              Browse Collection
            </button>
            <button
              onClick={() => handleButtonClick('contact')}
              className="bg-[#2962FF] hover:bg-[#1a53e5] text-white font-bold py-3 px-8 rounded-full transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              aria-label="Get in touch with us"
            >
              Contact Us
            </button>
          </div>
          <p className="text-gray-500 text-sm">
            All devices come with warranty and our quality guarantee
          </p>
        </div>
      </div>
    </main>
  );
};

About.propTypes = {};

export default About;