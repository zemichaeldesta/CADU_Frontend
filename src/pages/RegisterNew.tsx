import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { memberApplicationsAPI } from '../api/memberApplications';
import './RegisterNew.css';

interface ExtendedFormData {
  // Existing backend fields
  fullname: string;
  birthdate: string;
  gender: string;
  country: string;
  region: string;
  town: string;
  phone: string;
  email: string;
  emergencyContact: string;
  registration_fee_amount: number | string;
  monthly_fee_amount: number | string;
  voluntaryBirr: string;
  voluntaryUSD: string;
  profilePicture: File | null;
  receiptPhoto: File | null;

  // New "paper-form-style" fields (stored into notes for now)
  organizationName: string;
  nationality: string;
  residentIn: 'ethiopia' | 'abroad' | '';
  declarationAccepted: boolean;
  
  // Payment fields - now required input fields
  oneTimePaymentAmount: string;
  monthlyPaymentAmount: string;
  membershipFeeType: 'monthly' | 'annual' | '';  // Payment frequency: monthly or annual
  paymentType: 'dashen' | 'cbe' | '';
  
  // Photo consent
  photoConsent: boolean;
}

const RegisterNew: React.FC = () => {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();

  const [form, setForm] = useState<ExtendedFormData>({
    fullname: '',
    birthdate: '',
    gender: '',
    country: '',
    region: '',
    town: '',
    phone: '',
    email: '',
    emergencyContact: '',
    registration_fee_amount: '',
    monthly_fee_amount: '',
    voluntaryBirr: '',
    voluntaryUSD: '',
    profilePicture: null,
    receiptPhoto: null,
    organizationName: '',
    nationality: '',
    residentIn: '',
    declarationAccepted: false,
    oneTimePaymentAmount: '',
    monthlyPaymentAmount: '',
    membershipFeeType: 'monthly',  // Default to monthly
    paymentType: '',
    photoConsent: false,
  });

  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  const update = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    if (target.type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      setForm({ ...form, [target.name]: checkbox.checked });
    } else {
      setForm({ ...form, [target.name]: target.value });
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setForm({ ...form, profilePicture: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReceiptPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setForm({ ...form, receiptPhoto: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      // Validate required fields in step 1
      if (!form.fullname || !form.country || !form.region || !form.town || !form.phone || !form.email || !form.emergencyContact) {
        showError(
          language === 'am'
            ? 'እባክዎን ሁሉንም የግዴታ መስኮች ይሙሉ።'
            : 'Please fill in all required fields.'
        );
        return false;
      }
      return true;
    } else if (step === 2) {
      // Validate payment type is selected
      if (!form.paymentType) {
        showError(
          language === 'am'
            ? 'እባክዎን የክፍያ ዘዴ ይምረጡ።'
            : 'Please select a payment method.'
        );
        return false;
      }
      // Validate payment amounts
      const oneTimeAmount = parseFloat(form.oneTimePaymentAmount) || 0;
      if (!form.oneTimePaymentAmount || oneTimeAmount < 200) {
        showError(
          language === 'am'
            ? 'የአንድ ጊዜ የመመዝገቢያ ክፍያ ቢያንስ 200 ብር መሆን አለበት።'
            : 'One-time registration payment must be at least 200 ETB.'
        );
        return false;
      }
      const membershipFeeAmount = parseFloat(form.monthlyPaymentAmount) || 0;
      const isAnnual = form.membershipFeeType === 'annual';
      const minAmount = isAnnual ? 600 : 50;  // Annual: 12 months * 50 = 600 minimum
      
      if (!form.monthlyPaymentAmount || membershipFeeAmount < minAmount) {
        showError(
          language === 'am'
            ? isAnnual
              ? 'ዓመታዊ ክፍያ ቢያንስ 600 ብር መሆን አለበት (12 ወራት × 50 ብር)።'
              : 'ወርሃዊ ክፍያ ቢያንስ 50 ብር መሆን አለበት።'
            : isAnnual
              ? `Annual payment must be at least ${minAmount} ETB (12 months × 50 ETB).`
              : 'Monthly payment must be at least 50 ETB.'
        );
        return false;
      }
      // Validate receipt photo is required
      if (!form.receiptPhoto) {
        showError(
          language === 'am'
            ? 'እባክዎን የደረሰኝ ፎቶ ይጭኑ።'
            : 'Please upload a receipt photo.'
        );
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.declarationAccepted) {
      showError(
        language === 'am'
          ? 'እባክዎን መግለጫውን በመረጣት ያረጋግጡ።'
          : 'Please confirm the declaration before submitting.'
      );
      return;
    }

    // Validate one-time payment amount (minimum 200)
    const oneTimeAmount = parseFloat(form.oneTimePaymentAmount) || 0;
    if (!form.oneTimePaymentAmount || oneTimeAmount < 200) {
      showError(
        language === 'am'
          ? 'የአንድ ጊዜ የመመዝገቢያ ክፍያ ቢያንስ 200 ብር መሆን አለበት።'
          : 'One-time registration payment must be at least 200 ETB.'
      );
      return;
    }

    // Validate membership fee payment amount
    const membershipFeeAmount = parseFloat(form.monthlyPaymentAmount) || 0;
    const isAnnual = form.membershipFeeType === 'annual';
    const minAmount = isAnnual ? 600 : 50;  // Annual: 12 months * 50 = 600 minimum
    
    if (!form.monthlyPaymentAmount || membershipFeeAmount < minAmount) {
      showError(
        language === 'am'
          ? isAnnual
            ? 'ዓመታዊ ክፍያ ቢያንስ 600 ብር መሆን አለበት (12 ወራት × 50 ብር)።'
            : 'ወርሃዊ ክፍያ ቢያንስ 50 ብር መሆን አለበት።'
          : isAnnual
            ? `Annual payment must be at least ${minAmount} ETB (12 months × 50 ETB).`
            : 'Monthly payment must be at least 50 ETB.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      // Map main fields to backend
      formData.append('fullname', form.fullname);
      if (form.organizationName) formData.append('organization_name', form.organizationName);
      if (form.nationality) formData.append('nationality', form.nationality);
      if (form.residentIn) formData.append('resident_in', form.residentIn);
      if (form.birthdate) formData.append('birthdate', form.birthdate);
      if (form.gender) formData.append('gender', form.gender);
      if (form.country) formData.append('country', form.country);
      if (form.region) formData.append('region', form.region);
      if (form.town) formData.append('town', form.town);
      if (form.phone) formData.append('phone', form.phone);
      if (form.email) formData.append('email', form.email);
      if (form.emergencyContact) formData.append('emergency_contact', form.emergencyContact);
      
      // Get payment amounts
      const oneTimeAmount = parseFloat(form.oneTimePaymentAmount) || 0;
      const membershipFeeAmount = parseFloat(form.monthlyPaymentAmount) || 0;
      const isAnnual = form.membershipFeeType === 'annual';
      
      // Add registration fee amount
      if (oneTimeAmount > 0) {
        formData.append('registration_fee_amount', oneTimeAmount.toString());
        formData.append('initial_payment_amount', oneTimeAmount.toString());
      }
      
      // Add membership fee amount (monthly or annual)
      if (membershipFeeAmount > 0) {
        formData.append('monthly_fee_amount', membershipFeeAmount.toString());
        
        // Store payment type in notes so backend can create annual payment record when accepting application
        const existingNotes = formData.get('notes') || '';
        const feeNote = isAnnual 
          ? `Annual Payment Amount: ${membershipFeeAmount} ETB`
          : `Monthly Payment Amount: ${membershipFeeAmount} ETB`;
        formData.set('notes', existingNotes ? `${existingNotes} | ${feeNote}` : feeNote);
        // Also add a field to indicate payment type (for backend processing)
        formData.append('membership_fee_type', isAnnual ? 'annual' : 'monthly');
      }
      
      if (form.voluntaryBirr) formData.append('voluntaryBirr', form.voluntaryBirr);
      if (form.voluntaryUSD) formData.append('voluntaryUSD', form.voluntaryUSD);
      
      if (form.paymentType) formData.append('payment_type', form.paymentType);
      
      formData.append('declaration_accepted', form.declarationAccepted ? 'true' : 'false');
      formData.append('photo_consent', form.photoConsent ? 'true' : 'false');
      
      // Optional: Still keep notes for any extra info or legacy reasons, but main fields are now structured
      const notesParts: string[] = [];
      if (form.emergencyContact) {
        // Optional: keep for redundancy or remove if backend handles it now
      }

      if (notesParts.length > 0) {
        formData.append('notes', notesParts.join(' | '));
      }

      // Files
      if (form.profilePicture) {
        formData.append('profile_picture', form.profilePicture);
      }
      if (form.receiptPhoto) {
        formData.append('receipt_photo', form.receiptPhoto);
      }

      await memberApplicationsAPI.submitApplication(formData);

      // Store email and show success message instead of resetting
      setSubmittedEmail(form.email);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Failed to submit new-style registration:', error);
      showError(
        error?.response?.data?.detail ||
          (language === 'am'
            ? 'ቅጹን ለመላክ ስህተት ተፈጥሯል።'
            : 'Failed to submit form. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const t = (en: string, am: string) => (language === 'am' ? am : en);

  // Show success message if submitted
  if (submitted) {
    return (
      <div className="register-new-page">
        <div className="register-new-card">
          <div className="register-new-header">
            <div className="register-new-logo">
              <img src={`${process.env.PUBLIC_URL || ''}/cadu.png`} alt="CADU-ARDU Logo" />
            </div>
            <div className="register-new-title-block">
              <h1>CADU-ARDU Association</h1>
              <h2>{t('Membership Registration Form', 'የአባላት መመዝገቢያ ቅጽ')}</h2>
            </div>
          </div>
          <div className="success-message-container">
            <div className="success-message-icon">✓</div>
            <h3 className="success-message-title">
              {t('Application Submitted Successfully', 'ቅጹ በተሳካ ሁኔታ ተላልፏል')}
            </h3>
            <p className="success-message-text">
              {language === 'am'
                ? `የእርስዎ ማመልከቻ በተሳካ ሁኔታ ተላልፏል እና የማረጋገጫ ኢሜይል ወደ ${submittedEmail} ተልኳል።`
                : `Your application has been submitted successfully and a confirmation email has been sent to ${submittedEmail}.`}
            </p>
            <p className="success-message-note">
              {language === 'am'
                ? 'እባክዎን ኢሜይልዎን ይፈትሹ። ኢሜይሉ በስፓም ወይም ጃንክ ፎልደር ውስጥ ሊሆን ይችላል።'
                : 'Please check your email. If you don\'t see it, please check your spam or junk folder.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-new-page">
      <div className="register-new-card">
        <div className="register-new-header">
          <div className="register-new-logo">
            <img src="/cadu.png" alt="CADU-ARDU Logo" />
          </div>
          <div className="register-new-title-block">
            <h1>CADU-ARDU Association</h1>
            <h2>{t('Membership Registration Form', 'የአባላት መመዝገቢያ ቅጽ')}</h2>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            ></div>
          </div>
          <div className="progress-bar-labels">
            <span className={currentStep >= 1 ? 'active' : ''}>{t('Info', 'መረጃ')}</span>
            <span className={currentStep >= 2 ? 'active' : ''}>{t('Payment', 'ክፍያ')}</span>
            <span className={currentStep >= 3 ? 'active' : ''}>{t('Consent', 'ፍቃድ')}</span>
          </div>
        </div>

        <form className="register-new-form" onSubmit={handleSubmit}>
          {/* Step 1: Info */}
          {currentStep === 1 && (
            <>
          {/* 1. Personal / Organization Information */}
          <section className="register-new-section">
            <h3>1. {t('Personal / Organization Information', 'የግል /የድርጅት መረጃ')}</h3>

            <div className="register-new-grid two-columns">
              <div className="field">
                <label>{t('Full Name / Organization Name', 'ሙሉ ስም /የድርጅት ስም')} *</label>
                <input
                  type="text"
                  name="fullname"
                  value={form.fullname}
                  onChange={update}
                  required
                />
              </div>
              <div className="field">
                <label>{t('Alternative / Organization Name (optional)', 'የተለየ ስም (አማራጭ)')}</label>
                <input
                  type="text"
                  name="organizationName"
                  value={form.organizationName}
                  onChange={update}
                />
              </div>
            </div>

            <div className="field">
              <label>{t('Nationality (optional)', 'ዜግነት (አማራጭ)')}</label>
              <input
                type="text"
                name="nationality"
                value={form.nationality}
                onChange={update}
                placeholder={t('Ethiopian', 'ኢትዮጵያዊ')}
              />
            </div>

            <div className="field">
              <label>{t('Resident In', 'መኖሪያ አገር')}</label>
              <div className="register-new-radio-row">
                <label>
                  <input
                    type="radio"
                    name="residentIn"
                    value="ethiopia"
                    checked={form.residentIn === 'ethiopia'}
                    onChange={update}
                  />
                  {t('Ethiopia', 'ኢትዮጵያ')}
                </label>
                <label>
                  <input
                    type="radio"
                    name="residentIn"
                    value="abroad"
                    checked={form.residentIn === 'abroad'}
                    onChange={update}
                  />
                  {t('Abroad', 'ውጭ አገር')}
                </label>
              </div>
            </div>

            <div className="register-new-grid two-columns">
              <div className="field">
                <label>{t('Country', 'አገር')} *</label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={update}
                  required
                />
              </div>
              <div className="field">
                <label>{t('Region / State', 'ክልል')} *</label>
                <input
                  type="text"
                  name="region"
                  value={form.region}
                  onChange={update}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>{t('Town / City', 'ከተማ')} *</label>
              <input
                type="text"
                name="town"
                value={form.town}
                onChange={update}
                required
              />
            </div>

            <div className="register-new-grid two-columns">
              <div className="field">
                <label>{t('Phone', 'ስልክ')} *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={update}
                  required
                />
              </div>
              <div className="field">
                <label>{t('Email', 'ኢሜል')} *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={update}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>{t('Emergency Contact', 'የአደጋ ጊዜ ተጠሪ')} *</label>
              <input
                type="text"
                name="emergencyContact"
                value={form.emergencyContact}
                onChange={update}
                required
              />
            </div>
          </section>

              {/* 3. Attachments */}
              <section className="register-new-section">
                <h3>2. {t('Attachments', 'የተያያዙ ሰነዶች')}</h3>

                <div className="field">
                  <label>{t('Photo / Profile Picture', 'ፎቶ / የግል ምስል')}</label>
                  <div className="file-upload-row">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                    />
                    {profilePreview && (
                      <div className="image-preview">
                        <img src={profilePreview} alt="Profile preview" />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="step-navigation">
                <button
                  type="button"
                  className="step-btn step-btn-next"
                  onClick={handleNext}
                >
                  {t('Next', 'ቀጣይ')} →
                </button>
              </div>
            </>
          )}

          {/* Step 2: Payment */}
          {currentStep === 2 && (
            <>
          {/* 2. Membership Contribution */}
          <section className="register-new-section">
            <h3>2. {t('Membership Contribution', 'የአባልነት መዋጮ')}</h3>
            <p className="helper-text">
              {t('Regular Members Only for fixed fees – others optional.', 'ለመደበኛ አባላት ዋጋው የተወሰነ ነው።')}
            </p>

            {/* Payment Type Selection */}
            <div className="field">
              <label>{t('Payment Method', 'የክፍያ ዘዴ')} *</label>
              <select
                name="paymentType"
                value={form.paymentType}
                onChange={update}
                required
              >
                <option value="">{t('-- Select Payment Method --', '-- የክፍያ ዘዴ ይምረጡ --')}</option>
                <option value="dashen">
                  {t('Dashen Bank - Acc. No. 5146940937011 (Moenco Branch)', 'ዳሸን ባንክ - አካውንት ቁጥር 5146940937011 (ሞንኮ ቅርንጫፍ)')}
                </option>
                <option value="cbe">
                  {t('Commercial Bank of Ethiopia (CBE) - Acc. No. 1000735516993 (Bole Brass Branch)', 'ንግድ ባንክ ኢትዮጵያ (CBE) - አካውንት ቁጥር 1000735516993 (ብራስ ቅርንጫፍ)')}
                </option>
              </select>
            </div>

            {/* Payment Instructions */}
            {form.paymentType && (
              <div className="payment-instructions">
                <div className="payment-instructions-box">
                  <h4>{t('Payment Instructions', 'የክፍያ መመሪያዎች')}</h4>
                  {form.paymentType === 'dashen' ? (
                    <>
                      <p><strong>{t('Bank:', 'ባንክ:')}</strong> {t('Dashen Bank - Moenco Branch', 'ዳሸን ባንክ - ሞንኮ ቅርንጫፍ')}</p>
                      <p><strong>{t('Account Number:', 'አካውንት ቁጥር:')}</strong> 5146940937011</p>
                    </>
                  ) : (
                    <>
                      <p><strong>{t('Bank:', 'ባንክ:')}</strong> {t('Commercial Bank of Ethiopia (CBE) - Biras Branch', 'ንግድ ባንክ ኢትዮጵያ (CBE) - ብራስ ቅርንጫፍ')}</p>
                      <p><strong>{t('Account Number:', 'አካውንት ቁጥር:')}</strong> 1000735516993</p>
                    </>
                  )}
                  <div className="instruction-steps">
                    <p><strong>{t('Steps:', 'ደረጃዎች:')}</strong></p>
                    <ol>
                      <li>{t('Deposit the payment amount to the account number above.', 'ከላይ የተጠቀሰውን አካውንት ቁጥር የክፍያውን መጠን ይከፍሉ።')}</li>
                      <li>{t('Take a screenshot or picture of the payment receipt.', 'የክፍያ ደረሰኝ ስክሪንሾት ወይም ፎቶ ይውሰዱ።')}</li>
                      <li>{t('Upload the receipt photo in the section below.', 'ከታች ባለው ክፍል የደረሰኝ ፎቶውን ይጭኑ።')}</li>
                      <li>{t('Wait for verification and approval of your payment.', 'የክፍያዎን ማረጋገጥ እና ማጽደቅ ይጠብቁ።')}</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            <div className="field">
              <label>A. {t('One-time Registration Fee', 'አንድ ጊዜ የመመዝገቢያ ክፍያ')} *</label>
              <input
                type="number"
                name="oneTimePaymentAmount"
                value={form.oneTimePaymentAmount}
                onChange={update}
                min="200"
                step="0.01"
                required
                placeholder="200"
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {t('Minimum: 200 ETB', 'ዝቅተኛ: 200 ብር')}
              </span>
            </div>

            <div className="field">
              <label>B. {t('Membership Fee', 'የአባልነት መዋጮ')} *</label>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 'normal', marginRight: '1rem' }}>
                  <input
                    type="radio"
                    name="membershipFeeType"
                    value="monthly"
                    checked={form.membershipFeeType === 'monthly'}
                    onChange={update}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {t('Monthly', 'ወርሃዊ')}
                </label>
                <label style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                  <input
                    type="radio"
                    name="membershipFeeType"
                    value="annual"
                    checked={form.membershipFeeType === 'annual'}
                    onChange={update}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {t('Annual', 'ዓመታዊ')}
                </label>
              </div>
              <input
                type="number"
                name="monthlyPaymentAmount"
                value={form.monthlyPaymentAmount}
                onChange={update}
                min={form.membershipFeeType === 'annual' ? '600' : '50'}
                step="0.01"
                required
                placeholder={form.membershipFeeType === 'annual' ? '600 birr (12 months)' : '50 birr'}
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {form.membershipFeeType === 'annual'
                  ? t('Minimum: 600 ETB (12 months × 50 ETB)', 'ዝቅተኛ: 600 ብር (12 ወራት × 50 ብር)')
                  : t('Minimum: 50 ETB', 'ዝቅተኛ: 50 ብር')}
              </span>
            </div>

            <div className="field">
              <label>C. {t('Voluntary Support Contribution', 'ፈቃደኛ ድጋፍ')}</label>
              <div className="register-new-grid two-columns">
                <input
                  type="number"
                  min="0"
                  name="voluntaryBirr"
                  value={form.voluntaryBirr}
                  onChange={update}
                  placeholder={t('Amount in ETB', 'በብር መጠን')}
                />
                <input
                  type="number"
                  min="0"
                  name="voluntaryUSD"
                  value={form.voluntaryUSD}
                  onChange={update}
                  placeholder={t('Amount in USD (optional)', 'በዶላር መጠን (አማራጭ)')}
                />
              </div>
            </div>
          </section>

              {/* Receipt Photo - Required */}
          <section className="register-new-section">
                <h3>3. {t('Receipt Photo', 'የደረሰኝ ፎቶ')}</h3>
              <div className="field">
                  <label>{t('Receipt Photo', 'የደረሰኝ ፎቶ')} *</label>
                <div className="file-upload-row">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptPhotoChange}
                      required
                  />
                  {receiptPreview && (
                    <div className="image-preview">
                      <img src={receiptPreview} alt="Receipt preview" />
                    </div>
                  )}
                </div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                    {t('Please upload a photo of your payment receipt.', 'እባክዎን የክፍያ ደረሰኝ ፎቶ ይጭኑ።')}
                  </span>
            </div>
          </section>

              <div className="step-navigation">
                <button
                  type="button"
                  className="step-btn step-btn-previous"
                  onClick={handlePrevious}
                >
                  ← {t('Previous', 'ቀዳሚ')}
                </button>
                <button
                  type="button"
                  className="step-btn step-btn-next"
                  onClick={handleNext}
                >
                  {t('Next', 'ቀጣይ')} →
                </button>
              </div>
            </>
          )}

          {/* Step 3: Consent & Submit */}
          {currentStep === 3 && (
            <>
          {/* 4. Photo Consent */}
          <section className="register-new-section">
            <h3>4. {t('Photo Consent', 'የፎቶ ፈቃድ')}</h3>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="photoConsent"
                checked={form.photoConsent}
                onChange={update}
              />
              <span>{t('I consent to having my photos displayed on the website.', 'ፎቶዎቼ በድር ጣቢያው ላይ እንዲታዩ እፈቅዳለሁ።')}</span>
            </label>
          </section>

          {/* 5. Declaration */}
          <section className="register-new-section">
            <h3>5. {t('Declaration', 'መግለጫ')}</h3>
            <p className="declaration-text">
              {t(
                "I hereby confirm that the information provided is true and I agree to follow the Association's Articles of Association and ethical regulations.",
                'እዚህ ላይ የሰጠሁት መረጃ እውነተኛ መሆኑን እረጋግጣለሁ እና የማህበሩን ሕግ እና ሥነ ምግባር መመሪያዎች መከተል እቀበላለሁ።'
              )}
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="declarationAccepted"
                checked={form.declarationAccepted}
                onChange={update}
              />
              <span>{t('I agree and confirm the above declaration.', 'ከላይኛውን መግለጫ ተቀብዬ እረጋግጣለሁ።')}</span>
            </label>
          </section>

              <div className="step-navigation">
                <button
                  type="button"
                  className="step-btn step-btn-previous"
                  onClick={handlePrevious}
                >
                  ← {t('Previous', 'ቀዳሚ')}
                </button>
            <button
              type="submit"
                  className="step-btn step-btn-submit"
              disabled={submitting}
            >
              {submitting
                ? t('Submitting...', 'በመላክ ላይ...')
                : t('Submit Application', 'መመዝገቢያውን ላክ')}
            </button>
          </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterNew;


