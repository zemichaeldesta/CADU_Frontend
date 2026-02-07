import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { cmsAPI, Page, ContactInfo } from '../api/cms';
import { messagesAPI } from '../api/messages';
import { useToast } from '../context/ToastContext';
import {
  buildFallbackContactInfo,
  buildFallbackPage,
  cacheContactInfo,
  cachePage,
  getCachedContactInfo,
  getCachedPage,
} from '../utils/pageCache';
import './Contact.css';

const Contact: React.FC = () => {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState<Page | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fallbackPage = buildFallbackPage({
    pageType: 'contact',
    title_en: 'Contact Us',
    title_am: 'አግኙን',
    content_en:
      '<p>We are updating our contact portal. Showing the most recent saved information while we finish the update.</p>',
    content_am:
      '<p>የግንኙነት ገጻችንን እያዘመን ነው። የተጠበቀውን መረጃ እዚህ እያሳየን ነው።</p>',
  });
  const fallbackContactInfo = buildFallbackContactInfo();

  useEffect(() => {
    const loadData = async () => {
      try {
        const pageData = await cmsAPI.getPage('contact');
        setPage(pageData);
        cachePage('contact', pageData);
      } catch (error: any) {
        console.error('Failed to load contact page:', error);
        const cached = getCachedPage('contact');
        setPage(cached || fallbackPage);
      }

      try {
        const contactData = await cmsAPI.getContactInfo();
        setContactInfo(contactData);
        cacheContactInfo(contactData);
      } catch (error: any) {
        console.error('Failed to load contact info:', error);
        const cachedInfo = getCachedContactInfo();
        setContactInfo(cachedInfo || fallbackContactInfo);
      }

      setLoading(false);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await messagesAPI.submitContact(formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      showSuccess(language === 'am' ? 'መልዕክትዎ ተልኳል!' : 'Message sent successfully!');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error: any) {
      console.error('Failed to submit contact form:', error);
      const networkIssue = !error.response;
      const maintenanceMessage =
        language === 'am'
          ? 'ገጽታውን እያዘመን ነው። ወይም በኢሜይል በቀጥታ ያግኙን።'
          : 'We are updating our systems right now. Please try again shortly or reach us directly by email.';
      showError(
        error.response?.data?.detail || 
        (networkIssue
          ? maintenanceMessage
          : language === 'am'
            ? 'መልዕክት ለመላክ ስህተት ተፈጥሯል።'
            : 'Failed to send message. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const title = language === 'am' && page?.title_am ? page.title_am : page?.title_en || 'Contact Us';
  const content = language === 'am' && page?.content_am ? page.content_am : page?.content_en || '';

  return (
    <div className="contact-page">
      <div className="container">
        <h1>{title}</h1>
        <div className={`contact-content ${!content ? 'no-cms-content' : ''}`}>
          {content && (
            <div 
              className="contact-cms-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
          <div className="contact-right-column">
          <div className="contact-info">
            <h2>{language === 'am' ? 'የግንኙነት መረጃ' : 'Contact Information'}</h2>
            <p>
                {contactInfo 
                  ? (language === 'am' ? contactInfo.description_am : contactInfo.description_en) || 
                    (language === 'am'
                      ? 'እባክዎን ለማንኛውም ጥያቄ ወይም መረጃ ያግኙን።'
                      : 'Please feel free to contact us for any inquiries or information.')
                  : (language === 'am'
                ? 'እባክዎን ለማንኛውም ጥያቄ ወይም መረጃ ያግኙን።'
                      : 'Please feel free to contact us for any inquiries or information.')
                }
            </p>
            <div className="info-item">
                <strong>Email:</strong> {contactInfo?.email || 'caduarduet@gmail.com'}
              </div>
              {contactInfo?.phone && (
                <div className="info-item">
                  <strong>Phone:</strong> {contactInfo.phone}
            </div>
              )}
            <div className="info-item">
                <strong>Address:</strong> {contactInfo 
                  ? (language === 'am' && contactInfo.address_am ? contactInfo.address_am : contactInfo.address_en)
                  : 'Addis Ababa, Ethiopia'}
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">
                {language === 'am' ? 'ስም' : 'Name'}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">
                {language === 'am' ? 'ኢሜይል' : 'Email'}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="subject">
                {language === 'am' ? 'ርዕስ' : 'Subject'}
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">
                {language === 'am' ? 'መልዕክት' : 'Message'}
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting 
                ? (language === 'am' ? 'ይላካል...' : 'Sending...') 
                : (language === 'am' ? 'ላክ' : 'Send')
              }
            </button>
            {submitted && (
              <div className="success-message">
                {language === 'am' ? 'መልዕክትዎ ተልኳል!' : 'Message sent!'}
              </div>
            )}
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

