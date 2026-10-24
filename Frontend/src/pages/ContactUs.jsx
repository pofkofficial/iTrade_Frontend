import React, { useState, useEffect } from 'react';
import { FaTiktok, FaInstagram, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import PropTypes from 'prop-types';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [emailError, setEmailError] = useState('');

  // Track page view
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Contact Us',
        page_location: window.location.href,
        page_path: '/contact-us',
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailError(emailRegex.test(value) ? '' : 'Please enter a valid email address');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('https://itrade-backend.onrender.com/api/contact-messages/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: 'Contact Form Submission',
          message: formData.message
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialClick = (platform) => {
    if (window.gtag) {
      window.gtag('event', 'click', {
        event_category: 'Social Media',
        event_label: `Follow ${platform}`,
        page_title: 'Contact Us',
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-t from-[#FF6F61] to-[#2962FF] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-white font-bold text-2xl md:text-3xl mb-3">Contact Us</h1>
          <p className="text-white font-medium text-lg md:text-xl max-w-2xl mx-auto">
            Need help? Or just trying to stay in touch? We got you covered. Feel free to follow us on any of our social
            pages or send us a message. We're more than happy to hear from you.
          </p>
        </div>

        {/* Contact Container */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 md:gap-12">
            {/* Social Media Section */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              <div className="p-6 rounded-lg bg-white bg-opacity-20">
                <h2 className="text-white font-bold text-xl md:text-2xl mb-4">Follow Us</h2>
                <p className="text-white text-lg mb-6">You're welcome to follow us on all our social platforms.</p>
                <div className="flex justify-center lg:justify-start space-x-6">
                  {[
                    { platform: 'x', icon: <FaXTwitter size={20} />, prolink: 'https://www.x.com/itrade4phones' },
                    { platform: 'instagram', icon: <FaInstagram size={20} />, prolink: 'https://www.instagram.com/itrade4phones' },
                    { platform: 'tiktok', icon: <FaTiktok size={20} />, prolink: 'https://www.tiktok.com/it4phones' },
                    { platform: 'whatsapp', icon: <FaWhatsapp size={20} />, prolink: 'https://whatsapp.com/channel/0029VbB0gta89iniPCvX8z3h' },
                    // Uncomment if Facebook is active
                    // { platform: 'facebook', icon: <FaFacebook size={20} />, prolink: '#' },
                  ].map((social) => (
                    <a
                      key={social.platform}
                      href={social.prolink}
                      onClick={() => handleSocialClick(social.platform)}
                      className="w-10 h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center hover:bg-opacity-50 transition-all duration-300"
                      aria-label={`Follow us on ${social.platform}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block h-64 w-px bg-white bg-opacity-30"></div>

            {/* Contact Form Section */}
            <div className="w-full lg:w-1/2">
              <div className="p-6 rounded-lg bg-white bg-opacity-20">
                <h2 className="text-white font-bold text-xl md:text-2xl mb-4">Send Us a Message</h2>
                {submitStatus === 'success' && (
                  <div className="mb-4 p-3 bg-green-500 bg-opacity-20 text-white rounded-lg">
                    Message sent successfully!
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-500 bg-opacity-20 text-white rounded-lg">
                    Error sending message. Please try again.
                  </div>
                )}
                {submitStatus === 'timeout' && (
                  <div className="mb-4 p-3 bg-red-500 bg-opacity-20 text-white rounded-lg">
                    Request timed out. Please check your connection and try again.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-describedby="contact-form-desc">
                  <p id="contact-form-desc" className="sr-only">
                    Fill out the form below to send us a message.
                  </p>
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      aria-label="Full Name"
                      placeholder="Full name"
                      className="w-full px-4 py-3 rounded-lg border border-white border-opacity-30 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      aria-label="Email"
                      placeholder="Email"
                      className={`w-full px-4 py-3 rounded-lg border border-white border-opacity-30 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300 ${emailError ? 'border-red-500' : ''}`}
                      required
                      disabled={isSubmitting}
                    />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </div>
                  <div>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      aria-label="Enter your message"
                      placeholder="Hello!"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-white border-opacity-30 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300 resize-none"
                      required
                      disabled={isSubmitting}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || emailError}
                    className={`w-full ${isSubmitting || emailError ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF6F61] hover:bg-[#e55a4e]'} text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md transform hover:scale-105`}
                    aria-label={isSubmitting ? 'Sending message' : 'Send message'}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

ContactUs.propTypes = {};

export default ContactUs;